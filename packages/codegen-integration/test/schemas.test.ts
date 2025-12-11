/**
 * Tests for Zod schemas
 */
import { describe, expect, it } from "vitest";
import {
	AgentInvocationRequestSchema,
	AgentStatusSchema,
	CodegenConfigSchema,
	CodegenEventTypeSchema,
	WebhookEventPayloadSchema,
} from "../src/types/schemas.js";

describe("Zod Schemas", () => {
	describe("AgentStatusSchema", () => {
		it("should validate valid agent statuses", () => {
			expect(AgentStatusSchema.parse("idle")).toBe("idle");
			expect(AgentStatusSchema.parse("running")).toBe("running");
			expect(AgentStatusSchema.parse("completed")).toBe("completed");
			expect(AgentStatusSchema.parse("failed")).toBe("failed");
			expect(AgentStatusSchema.parse("cancelled")).toBe("cancelled");
		});

		it("should reject invalid agent statuses", () => {
			expect(() => AgentStatusSchema.parse("invalid")).toThrow();
		});
	});

	describe("CodegenEventTypeSchema", () => {
		it("should validate valid event types", () => {
			expect(CodegenEventTypeSchema.parse("agent.started")).toBe(
				"agent.started",
			);
			expect(CodegenEventTypeSchema.parse("agent.completed")).toBe(
				"agent.completed",
			);
			expect(CodegenEventTypeSchema.parse("tool.used")).toBe("tool.used");
			expect(CodegenEventTypeSchema.parse("file.created")).toBe("file.created");
		});

		it("should reject invalid event types", () => {
			expect(() => CodegenEventTypeSchema.parse("invalid.event")).toThrow();
		});
	});

	describe("CodegenConfigSchema", () => {
		it("should validate valid configuration", () => {
			const config = {
				apiKey: "test-api-key",
				apiUrl: "https://api.codegen.sh/v1",
				timeout: 30000,
				retryAttempts: 3,
				retryDelay: 1000,
			};

			const result = CodegenConfigSchema.parse(config);
			expect(result).toEqual(config);
		});

		it("should reject empty API key", () => {
			const config = {
				apiKey: "",
				apiUrl: "https://api.codegen.sh/v1",
			};

			expect(() => CodegenConfigSchema.parse(config)).toThrow();
		});

		it("should reject invalid URL", () => {
			const config = {
				apiKey: "test-api-key",
				apiUrl: "not-a-url",
			};

			expect(() => CodegenConfigSchema.parse(config)).toThrow();
		});

		it("should accept optional fields", () => {
			const config = {
				apiKey: "test-api-key",
				apiUrl: "https://api.codegen.sh/v1",
			};

			const result = CodegenConfigSchema.parse(config);
			expect(result).toEqual(config);
		});
	});

	describe("AgentInvocationRequestSchema", () => {
		it("should validate valid request", () => {
			const request = {
				prompt: "test prompt",
				context: { key: "value" },
				sessionId: "test-session",
				continueSession: true,
				tools: ["Read", "Edit"],
				maxTokens: 2048,
				temperature: 0.8,
			};

			const result = AgentInvocationRequestSchema.parse(request);
			expect(result).toEqual(request);
		});

		it("should reject empty prompt", () => {
			const request = {
				prompt: "",
			};

			expect(() => AgentInvocationRequestSchema.parse(request)).toThrow();
		});

		it("should reject invalid temperature", () => {
			const request = {
				prompt: "test prompt",
				temperature: 3.0, // Max is 2.0
			};

			expect(() => AgentInvocationRequestSchema.parse(request)).toThrow();
		});
	});

	describe("WebhookEventPayloadSchema", () => {
		it("should validate valid webhook payload", () => {
			const payload = {
				event: "agent.started" as const,
				sessionId: "test-session",
				timestamp: new Date(),
				data: {
					type: "agent.started" as const,
					prompt: "test prompt",
					sessionId: "test-session",
				},
			};

			const result = WebhookEventPayloadSchema.parse(payload);
			expect(result).toEqual(payload);
		});
	});
});
