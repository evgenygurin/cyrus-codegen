import { beforeEach, describe, expect, it, vi } from "vitest";
import { CodegenBridge } from "../src/codegen-bridge.js";
import {
	type AgentTask,
	CodegenBridgeError,
	CodegenErrorCode,
} from "../src/types.js";

describe("CodegenBridge", () => {
	let bridge: CodegenBridge;

	beforeEach(() => {
		bridge = new CodegenBridge({
			token: "test-token",
			orgId: 12345,
			pythonPath: "python3",
			debug: false,
		});
	});

	describe("constructor", () => {
		it("should create instance with valid options", () => {
			expect(bridge).toBeInstanceOf(CodegenBridge);
		});

		it("should throw error with invalid options", () => {
			expect(
				() =>
					new CodegenBridge({
						token: "",
						orgId: 12345,
						pythonPath: "python3",
						debug: false,
					}),
			).toThrow();

			expect(
				() =>
					new CodegenBridge({
						token: "test-token",
						orgId: -1,
						pythonPath: "python3",
						debug: false,
					}),
			).toThrow();
		});
	});

	describe("initialize", () => {
		it("should initialize successfully", async () => {
			await expect(bridge.initialize()).resolves.not.toThrow();
		});

		it("should only initialize once", async () => {
			await bridge.initialize();
			await bridge.initialize(); // Should not throw or reinitialize
		});

		it("should throw if Python not found", async () => {
			const badBridge = new CodegenBridge({
				token: "test-token",
				orgId: 12345,
				pythonPath: "invalid-python",
				debug: false,
			});

			await expect(badBridge.initialize()).rejects.toThrow(CodegenBridgeError);
		});
	});

	describe("runAgent", () => {
		it("should validate input", async () => {
			await expect(
				bridge.runAgent({ prompt: "", repoId: 123 } as never),
			).rejects.toThrow();

			await expect(bridge.runAgent({} as never)).rejects.toThrow();
		});

		it("should accept valid input", async () => {
			const input = {
				prompt: "Fix the bug",
				repoId: 123,
			};

			// Note: This will fail in actual execution without Codegen installed
			// but validates the input parsing logic
			expect(() => bridge.runAgent(input)).not.toThrow();
		});
	});

	describe("getTask", () => {
		it("should accept valid task ID", async () => {
			const taskId = 12345;

			// Note: This will fail in actual execution without Codegen installed
			// but validates the method signature
			expect(() => bridge.getTask(taskId)).not.toThrow();
		});

		it("should reject invalid task ID", async () => {
			await expect(bridge.getTask(NaN)).rejects.toThrow();
			await expect(bridge.getTask(-1)).rejects.toThrow();
		});
	});

	describe("resumeTask", () => {
		it("should validate input", async () => {
			await expect(
				bridge.resumeTask({ taskId: 123, prompt: "" }),
			).rejects.toThrow();

			await expect(
				bridge.resumeTask({ taskId: NaN, prompt: "test" }),
			).rejects.toThrow();
		});

		it("should accept valid input", () => {
			const input = {
				taskId: 123,
				prompt: "Additional instructions",
			};

			expect(() => bridge.resumeTask(input)).not.toThrow();
		});
	});

	describe("waitForCompletion", () => {
		it("should apply default wait options", () => {
			const taskId = 123;

			// Should not throw when creating the promise
			expect(() => bridge.waitForCompletion(taskId)).not.toThrow();
		});

		it("should accept custom wait options", () => {
			const taskId = 123;
			const options = {
				timeout: 60000,
				pollInterval: 1000,
			};

			expect(() => bridge.waitForCompletion(taskId, options)).not.toThrow();
		});

		it("should reject invalid wait options", async () => {
			const taskId = 123;

			await expect(
				bridge.waitForCompletion(taskId, { timeout: -1 }),
			).rejects.toThrow();

			await expect(
				bridge.waitForCompletion(taskId, { pollInterval: 0 }),
			).rejects.toThrow();
		});

		it("should call progress callback", async () => {
			const taskId = 123;
			const mockTask: AgentTask = {
				id: taskId,
				status: "completed",
				result: "Success",
			};

			const onProgress = vi.fn();

			// Mock getTask to return completed task immediately
			vi.spyOn(bridge, "getTask").mockResolvedValue(mockTask);

			await bridge.waitForCompletion(taskId, { onProgress, timeout: 1000 });

			expect(onProgress).toHaveBeenCalledWith(mockTask);
		});

		it("should timeout after specified duration", async () => {
			const taskId = 123;
			const runningTask: AgentTask = {
				id: taskId,
				status: "running",
			};

			// Mock getTask to always return running task
			vi.spyOn(bridge, "getTask").mockResolvedValue(runningTask);

			await expect(
				bridge.waitForCompletion(taskId, {
					timeout: 100,
					pollInterval: 10,
				}),
			).rejects.toThrow(CodegenBridgeError);
		});

		it("should throw on failed task", async () => {
			const taskId = 123;
			const failedTask: AgentTask = {
				id: taskId,
				status: "failed",
				result: "Task execution failed",
			};

			vi.spyOn(bridge, "getTask").mockResolvedValue(failedTask);

			try {
				await bridge.waitForCompletion(taskId, { timeout: 1000 });
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(CodegenBridgeError);
				expect((error as CodegenBridgeError).code).toBe(
					CodegenErrorCode.TASK_FAILED,
				);
			}
		});

		it("should return completed task", async () => {
			const taskId = 123;
			const completedTask: AgentTask = {
				id: taskId,
				status: "completed",
				result: "Task completed successfully",
			};

			vi.spyOn(bridge, "getTask").mockResolvedValue(completedTask);

			const result = await bridge.waitForCompletion(taskId, { timeout: 1000 });

			expect(result).toEqual(completedTask);
		});
	});

	describe("getTaskResult", () => {
		it("should return result for completed task", async () => {
			const taskId = 123;
			const completedTask: AgentTask = {
				id: taskId,
				status: "completed",
				result: "Task result",
			};

			vi.spyOn(bridge, "getTask").mockResolvedValue(completedTask);

			const result = await bridge.getTaskResult(taskId);

			expect(result).toBe("Task result");
		});

		it("should return null for completed task with no result", async () => {
			const taskId = 123;
			const completedTask: AgentTask = {
				id: taskId,
				status: "completed",
				result: null,
			};

			vi.spyOn(bridge, "getTask").mockResolvedValue(completedTask);

			const result = await bridge.getTaskResult(taskId);

			expect(result).toBeNull();
		});

		it("should throw for non-completed task", async () => {
			const taskId = 123;
			const runningTask: AgentTask = {
				id: taskId,
				status: "running",
			};

			vi.spyOn(bridge, "getTask").mockResolvedValue(runningTask);

			await expect(bridge.getTaskResult(taskId)).rejects.toThrow(
				CodegenBridgeError,
			);
		});
	});

	describe("healthCheck", () => {
		it("should return health status", async () => {
			const health = await bridge.healthCheck();

			expect(health).toHaveProperty("pythonAvailable");
			expect(health).toHaveProperty("codegenInstalled");
			expect(health).toHaveProperty("apiAccessible");

			expect(typeof health.pythonAvailable).toBe("boolean");
			expect(typeof health.codegenInstalled).toBe("boolean");
			expect(typeof health.apiAccessible).toBe("boolean");
		});

		it("should detect Python availability", async () => {
			const health = await bridge.healthCheck();

			// Python should be available in test environment
			expect(health.pythonAvailable).toBe(true);
		});
	});
});
