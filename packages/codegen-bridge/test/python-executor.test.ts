import { beforeEach, describe, expect, it } from "vitest";
import { PythonExecutor } from "../src/python-executor.js";
import { CodegenBridgeError, CodegenErrorCode } from "../src/types.js";

describe("PythonExecutor", () => {
	let executor: PythonExecutor;

	beforeEach(() => {
		executor = new PythonExecutor("python3", false);
	});

	describe("checkPython", () => {
		it("should succeed with valid python path", async () => {
			await expect(executor.checkPython()).resolves.not.toThrow();
		});

		it("should throw error with invalid python path", async () => {
			const badExecutor = new PythonExecutor("invalid-python-path", false);
			await expect(badExecutor.checkPython()).rejects.toThrow(
				CodegenBridgeError,
			);
		});

		it("should throw PYTHON_NOT_FOUND error code", async () => {
			const badExecutor = new PythonExecutor("invalid-python-path", false);
			try {
				await badExecutor.checkPython();
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(CodegenBridgeError);
				expect((error as CodegenBridgeError).code).toBe(
					CodegenErrorCode.PYTHON_NOT_FOUND,
				);
			}
		});
	});

	describe("generateRunAgentScript", () => {
		it("should generate valid Python script", () => {
			const script = executor.generateRunAgentScript("test-token", 12345);

			expect(script).toContain("from codegen.agents.agent import Agent");
			expect(script).toContain('token="test-token"');
			expect(script).toContain("org_id=12345");
			expect(script).toContain("agent.run(");
		});

		it("should include base_url when provided", () => {
			const script = executor.generateRunAgentScript(
				"test-token",
				12345,
				"https://custom.api.com",
			);

			expect(script).toContain('base_url="https://custom.api.com"');
		});

		it("should omit base_url when not provided", () => {
			const script = executor.generateRunAgentScript("test-token", 12345);

			expect(script).not.toContain("base_url=");
		});
	});

	describe("generateGetTaskScript", () => {
		it("should generate valid Python script", () => {
			const script = executor.generateGetTaskScript("test-token", 12345);

			expect(script).toContain("from codegen.agents.agent import AgentTask");
			expect(script).toContain('access_token="test-token"');
			expect(script).toContain("task.refresh()");
		});

		it("should include correct organization ID", () => {
			const script = executor.generateGetTaskScript("test-token", 99999);

			expect(script).toContain("99999");
		});
	});

	describe("generateResumeTaskScript", () => {
		it("should generate valid Python script", () => {
			const script = executor.generateResumeTaskScript("test-token", 12345);

			expect(script).toContain("from codegen_api_client.api.agents_api");
			expect(script).toContain("ResumeAgentRunInput");
			expect(script).toContain("resume_agent_run");
		});

		it("should use correct API endpoint", () => {
			const script = executor.generateResumeTaskScript(
				"test-token",
				12345,
				"https://api.test.com",
			);

			expect(script).toContain('"https://api.test.com"');
		});
	});

	describe("execute", () => {
		it("should execute simple Python script", async () => {
			const script = `
import sys
import json

result = {"success": True, "data": {"test": "value"}}
print(json.dumps(result))
`;

			const result = await executor.execute(script, {});

			expect(result.success).toBe(true);
			expect(result.data).toEqual({ test: "value" });
		});

		it("should pass arguments to script", async () => {
			const script = `
import sys
import json

args = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
result = {"success": True, "data": {"received": args}}
print(json.dumps(result))
`;

			const result = await executor.execute(script, {
				testArg: "testValue",
				number: 42,
			});

			expect(result.success).toBe(true);
			expect(result.data?.received).toEqual({
				testArg: "testValue",
				number: 42,
			});
		});

		it("should handle Python errors", async () => {
			const script = `
import sys
import json

raise Exception("Test error")
`;

			await expect(executor.execute(script, {})).rejects.toThrow(
				CodegenBridgeError,
			);
		});

		it("should handle invalid JSON output", async () => {
			const script = `
print("This is not valid JSON")
`;

			await expect(executor.execute(script, {})).rejects.toThrow();
		});
	});
});
