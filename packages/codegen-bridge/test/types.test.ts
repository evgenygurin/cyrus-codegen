import { describe, expect, it } from "vitest";
import {
	AgentRunInputSchema,
	AgentStatusSchema,
	AgentTaskSchema,
	CodegenBridgeError,
	CodegenBridgeOptionsSchema,
	CodegenErrorCode,
	WaitOptionsSchema,
} from "../src/types.js";

describe("Types and Schemas", () => {
	describe("AgentStatusSchema", () => {
		it("should accept valid status values", () => {
			const validStatuses = [
				"queued",
				"running",
				"completed",
				"failed",
				"cancelled",
			];

			for (const status of validStatuses) {
				expect(() => AgentStatusSchema.parse(status)).not.toThrow();
			}
		});

		it("should reject invalid status values", () => {
			expect(() => AgentStatusSchema.parse("invalid")).toThrow();
			expect(() => AgentStatusSchema.parse("")).toThrow();
			expect(() => AgentStatusSchema.parse(null)).toThrow();
		});
	});

	describe("AgentTaskSchema", () => {
		it("should accept valid task object", () => {
			const task = {
				id: 123,
				status: "completed",
				result: "Task completed successfully",
				webUrl: "https://codegen.com/task/123",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:01:00Z",
			};

			const parsed = AgentTaskSchema.parse(task);
			expect(parsed).toEqual(task);
		});

		it("should accept minimal task object", () => {
			const task = {
				id: 123,
				status: "queued",
			};

			const parsed = AgentTaskSchema.parse(task);
			expect(parsed.id).toBe(123);
			expect(parsed.status).toBe("queued");
		});

		it("should reject invalid task object", () => {
			expect(() => AgentTaskSchema.parse({ status: "completed" })).toThrow(); // Missing id
			expect(() => AgentTaskSchema.parse({ id: 123 })).toThrow(); // Missing status
			expect(() =>
				AgentTaskSchema.parse({ id: "abc", status: "completed" }),
			).toThrow(); // Invalid id type
		});
	});

	describe("AgentRunInputSchema", () => {
		it("should accept valid run input", () => {
			const input = {
				prompt: "Fix the bug in PR #123",
				repoId: 456,
				metadata: { issueId: "ABC-123" },
			};

			const parsed = AgentRunInputSchema.parse(input);
			expect(parsed).toEqual(input);
		});

		it("should accept minimal run input", () => {
			const input = { prompt: "Do something" };

			const parsed = AgentRunInputSchema.parse(input);
			expect(parsed.prompt).toBe("Do something");
		});

		it("should reject empty prompt", () => {
			expect(() => AgentRunInputSchema.parse({ prompt: "" })).toThrow();
		});

		it("should reject missing prompt", () => {
			expect(() => AgentRunInputSchema.parse({})).toThrow();
		});
	});

	describe("CodegenBridgeOptionsSchema", () => {
		it("should accept valid options", () => {
			const options = {
				token: "test-token",
				orgId: 12345,
				baseUrl: "https://api.codegen.com",
				pythonPath: "/usr/bin/python3",
				debug: true,
			};

			const parsed = CodegenBridgeOptionsSchema.parse(options);
			expect(parsed).toEqual(options);
		});

		it("should apply defaults", () => {
			const options = {
				token: "test-token",
				orgId: 12345,
			};

			const parsed = CodegenBridgeOptionsSchema.parse(options);
			expect(parsed.pythonPath).toBe("python3");
			expect(parsed.debug).toBe(false);
		});

		it("should reject invalid options", () => {
			expect(() =>
				CodegenBridgeOptionsSchema.parse({ orgId: 12345 }),
			).toThrow(); // Missing token
			expect(() =>
				CodegenBridgeOptionsSchema.parse({ token: "test-token" }),
			).toThrow(); // Missing orgId
			expect(() =>
				CodegenBridgeOptionsSchema.parse({ token: "", orgId: 12345 }),
			).toThrow(); // Empty token
			expect(() =>
				CodegenBridgeOptionsSchema.parse({ token: "test-token", orgId: -1 }),
			).toThrow(); // Negative orgId
		});
	});

	describe("WaitOptionsSchema", () => {
		it("should accept valid wait options", () => {
			const options = {
				timeout: 60000,
				pollInterval: 1000,
			};

			const parsed = WaitOptionsSchema.parse(options);
			expect(parsed).toMatchObject(options);
		});

		it("should apply defaults", () => {
			const parsed = WaitOptionsSchema.parse({});
			expect(parsed.timeout).toBe(300000);
			expect(parsed.pollInterval).toBe(5000);
		});

		it("should reject invalid options", () => {
			expect(() => WaitOptionsSchema.parse({ timeout: -1 })).toThrow();
			expect(() => WaitOptionsSchema.parse({ pollInterval: 0 })).toThrow();
		});
	});

	describe("CodegenBridgeError", () => {
		it("should create error with code", () => {
			const error = new CodegenBridgeError(
				"Test error",
				CodegenErrorCode.API_ERROR,
			);

			expect(error.message).toBe("Test error");
			expect(error.code).toBe(CodegenErrorCode.API_ERROR);
			expect(error.name).toBe("CodegenBridgeError");
		});

		it("should preserve original error", () => {
			const original = new Error("Original error");
			const error = new CodegenBridgeError(
				"Test error",
				CodegenErrorCode.PYTHON_NOT_FOUND,
				original,
			);

			expect(error.originalError).toBe(original);
		});

		it("should be instanceof Error", () => {
			const error = new CodegenBridgeError(
				"Test error",
				CodegenErrorCode.TIMEOUT,
			);

			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(CodegenBridgeError);
		});
	});
});
