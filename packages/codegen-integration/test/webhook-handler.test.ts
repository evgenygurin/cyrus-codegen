/**
 * Tests for WebhookHandler
 */

import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createWebhookHandler,
	WebhookHandler,
	WebhookVerificationError,
} from "../src/services/webhook-handler.js";

describe("WebhookHandler", () => {
	const secret = "test-secret-key";
	let handler: WebhookHandler;

	beforeEach(() => {
		handler = createWebhookHandler({ secret });
	});

	describe("constructor", () => {
		it("should throw error if secret is empty", () => {
			expect(() => createWebhookHandler({ secret: "" })).toThrow(
				"Webhook secret is required",
			);
		});

		it("should create handler with valid config", () => {
			const handler = createWebhookHandler({
				secret: "test-secret",
				maxAge: 600,
				validateTimestamp: false,
			});

			expect(handler).toBeInstanceOf(WebhookHandler);
		});
	});

	describe("on", () => {
		it("should register event handler", () => {
			const mockHandler = vi.fn();
			handler.on("agent.started", mockHandler);

			expect(handler.getRegisteredEvents()).toContain("agent.started");
		});

		it("should allow multiple handlers for same event", () => {
			const mockHandler1 = vi.fn();
			const mockHandler2 = vi.fn();

			handler.on("agent.started", mockHandler1);
			handler.on("agent.started", mockHandler2);

			expect(handler.getRegisteredEvents()).toContain("agent.started");
		});
	});

	describe("onAll", () => {
		it("should register handler for all events", () => {
			const mockHandler = vi.fn();
			handler.onAll(mockHandler);

			const events = handler.getRegisteredEvents();
			expect(events.length).toBeGreaterThan(0);
		});
	});

	describe("verifySignature", () => {
		it("should return true for valid signature", () => {
			const payload = JSON.stringify({ test: "data" });
			const hmac = createHmac("sha256", secret);
			hmac.update(payload);
			const signature = `sha256=${hmac.digest("hex")}`;

			expect(handler.verifySignature(payload, signature)).toBe(true);
		});

		it("should return false for invalid signature", () => {
			const payload = JSON.stringify({ test: "data" });
			const signature = "sha256=invalid";

			expect(handler.verifySignature(payload, signature)).toBe(false);
		});

		it("should return false for empty signature", () => {
			const payload = JSON.stringify({ test: "data" });

			expect(handler.verifySignature(payload, "")).toBe(false);
		});
	});

	describe("processWebhook", () => {
		it("should process valid webhook payload", async () => {
			const mockHandler = vi.fn();
			handler.on("agent.started", mockHandler);

			const payload = {
				event: "agent.started",
				sessionId: "test-session",
				timestamp: new Date().toISOString(),
				data: {
					type: "agent.started",
					prompt: "test prompt",
					sessionId: "test-session",
				},
			};

			const rawPayload = JSON.stringify(payload);
			const hmac = createHmac("sha256", secret);
			hmac.update(rawPayload);
			const signature = `sha256=${hmac.digest("hex")}`;

			await handler.processWebhook(rawPayload, signature);

			expect(mockHandler).toHaveBeenCalledTimes(1);
			expect(mockHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					event: "agent.started",
					sessionId: "test-session",
				}),
			);
		});

		it("should throw error for invalid signature", async () => {
			const payload = {
				event: "agent.started",
				sessionId: "test-session",
				timestamp: new Date(),
				data: {
					type: "agent.started",
					prompt: "test prompt",
					sessionId: "test-session",
				},
			};

			const rawPayload = JSON.stringify(payload);
			const signature = "sha256=invalid";

			await expect(
				handler.processWebhook(rawPayload, signature),
			).rejects.toThrow(WebhookVerificationError);
		});

		it("should throw error for invalid JSON", async () => {
			const rawPayload = "not valid json";
			const hmac = createHmac("sha256", secret);
			hmac.update(rawPayload);
			const signature = `sha256=${hmac.digest("hex")}`;

			await expect(
				handler.processWebhook(rawPayload, signature),
			).rejects.toThrow(WebhookVerificationError);
		});

		it("should throw error for old timestamp", async () => {
			const oldDate = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
			const payload = {
				event: "agent.started",
				sessionId: "test-session",
				timestamp: oldDate.toISOString(),
				data: {
					type: "agent.started",
					prompt: "test prompt",
					sessionId: "test-session",
				},
			};

			const rawPayload = JSON.stringify(payload);
			const hmac = createHmac("sha256", secret);
			hmac.update(rawPayload);
			const signature = `sha256=${hmac.digest("hex")}`;

			await expect(
				handler.processWebhook(rawPayload, signature),
			).rejects.toThrow(WebhookVerificationError);
		});
	});

	describe("off", () => {
		it("should remove specific handler", () => {
			const mockHandler = vi.fn();
			handler.on("agent.started", mockHandler);
			handler.off("agent.started", mockHandler);

			expect(handler.getRegisteredEvents()).not.toContain("agent.started");
		});
	});

	describe("removeAllListeners", () => {
		it("should remove all handlers for specific event", () => {
			const mockHandler1 = vi.fn();
			const mockHandler2 = vi.fn();

			handler.on("agent.started", mockHandler1);
			handler.on("agent.started", mockHandler2);
			handler.removeAllListeners("agent.started");

			expect(handler.getRegisteredEvents()).not.toContain("agent.started");
		});

		it("should remove all handlers for all events", () => {
			const mockHandler = vi.fn();

			handler.on("agent.started", mockHandler);
			handler.on("agent.completed", mockHandler);
			handler.removeAllListeners();

			expect(handler.getRegisteredEvents()).toHaveLength(0);
		});
	});
});
