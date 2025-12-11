/**
 * Webhook Handler for Codegen Events
 * Type-safe webhook event processing with signature verification
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type {
	CodegenEventType,
	WebhookEventPayload,
} from "../types/codegen.js";
import { WebhookEventPayloadSchema } from "../types/schemas.js";

/**
 * Webhook Handler Configuration
 */
export interface WebhookHandlerConfig {
	readonly secret: string;
	readonly maxAge?: number; // Maximum age of webhook in seconds (default: 300 = 5 minutes)
	readonly validateTimestamp?: boolean;
}

/**
 * Webhook Event Handler Function
 */
export type WebhookEventHandler = (
	payload: WebhookEventPayload,
) => Promise<void> | void;

/**
 * Webhook Handler Class
 */
export class WebhookHandler {
	private readonly secret: string;
	private readonly maxAge: number;
	private readonly validateTimestamp: boolean;
	private readonly handlers: Map<CodegenEventType, WebhookEventHandler[]>;

	constructor(config: WebhookHandlerConfig) {
		if (!config.secret || config.secret.trim().length === 0) {
			throw new Error("Webhook secret is required");
		}

		this.secret = config.secret;
		this.maxAge = config.maxAge ?? 300;
		this.validateTimestamp = config.validateTimestamp ?? true;
		this.handlers = new Map();
	}

	/**
	 * Register a handler for a specific event type
	 */
	public on(event: CodegenEventType, handler: WebhookEventHandler): this {
		const existingHandlers = this.handlers.get(event) ?? [];
		this.handlers.set(event, [...existingHandlers, handler]);
		return this;
	}

	/**
	 * Register a handler for all events
	 */
	public onAll(handler: WebhookEventHandler): this {
		const events: CodegenEventType[] = [
			"agent.started",
			"agent.completed",
			"agent.failed",
			"agent.cancelled",
			"agent.progress",
			"tool.used",
			"file.created",
			"file.updated",
			"file.deleted",
		];

		for (const event of events) {
			this.on(event, handler);
		}

		return this;
	}

	/**
	 * Verify webhook signature
	 */
	public verifySignature(payload: string, signature: string): boolean {
		if (!signature || signature.trim().length === 0) {
			return false;
		}

		const expectedSignature = this.computeSignature(payload);

		try {
			// Use timing-safe comparison to prevent timing attacks
			const signatureBuffer = Buffer.from(signature, "utf8");
			const expectedBuffer = Buffer.from(expectedSignature, "utf8");

			if (signatureBuffer.length !== expectedBuffer.length) {
				return false;
			}

			return timingSafeEqual(signatureBuffer, expectedBuffer);
		} catch {
			return false;
		}
	}

	/**
	 * Compute HMAC signature for payload
	 */
	private computeSignature(payload: string): string {
		const hmac = createHmac("sha256", this.secret);
		hmac.update(payload);
		return `sha256=${hmac.digest("hex")}`;
	}

	/**
	 * Validate webhook timestamp
	 */
	private validatePayloadTimestamp(timestamp: Date): boolean {
		if (!this.validateTimestamp) {
			return true;
		}

		const now = new Date();
		const age = (now.getTime() - timestamp.getTime()) / 1000;

		return age <= this.maxAge && age >= 0;
	}

	/**
	 * Process webhook payload
	 */
	public async processWebhook(
		rawPayload: string,
		signature: string,
	): Promise<void> {
		// Verify signature
		if (!this.verifySignature(rawPayload, signature)) {
			throw new WebhookVerificationError("Invalid webhook signature");
		}

		// Parse and validate payload
		let parsedPayload: unknown;
		try {
			parsedPayload = JSON.parse(rawPayload);
		} catch (error) {
			throw new WebhookVerificationError(
				`Failed to parse webhook payload: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}

		const payload = WebhookEventPayloadSchema.parse(parsedPayload);

		// Validate timestamp
		if (!this.validatePayloadTimestamp(payload.timestamp)) {
			throw new WebhookVerificationError(
				`Webhook timestamp is too old or in the future: ${payload.timestamp.toISOString()}`,
			);
		}

		// Execute handlers
		await this.executeHandlers(payload);
	}

	/**
	 * Execute all handlers for an event
	 */
	private async executeHandlers(payload: WebhookEventPayload): Promise<void> {
		const handlers = this.handlers.get(payload.event) ?? [];

		if (handlers.length === 0) {
			return;
		}

		// Execute all handlers in parallel
		await Promise.all(handlers.map((handler) => handler(payload)));
	}

	/**
	 * Remove a specific handler
	 */
	public off(event: CodegenEventType, handler: WebhookEventHandler): this {
		const handlers = this.handlers.get(event);
		if (!handlers) {
			return this;
		}

		const filtered = handlers.filter((h) => h !== handler);
		if (filtered.length === 0) {
			this.handlers.delete(event);
		} else {
			this.handlers.set(event, filtered);
		}

		return this;
	}

	/**
	 * Remove all handlers for an event
	 */
	public removeAllListeners(event?: CodegenEventType): this {
		if (event) {
			this.handlers.delete(event);
		} else {
			this.handlers.clear();
		}
		return this;
	}

	/**
	 * Get all registered event types
	 */
	public getRegisteredEvents(): readonly CodegenEventType[] {
		return Array.from(this.handlers.keys());
	}
}

/**
 * Custom error class for webhook verification errors
 */
export class WebhookVerificationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "WebhookVerificationError";
	}
}

/**
 * Factory function to create a webhook handler
 */
export function createWebhookHandler(
	config: WebhookHandlerConfig,
): WebhookHandler {
	return new WebhookHandler(config);
}
