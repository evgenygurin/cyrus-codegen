/**
 * Tests for type guards and type utilities
 */
import { describe, expect, it } from "vitest";
import {
	type AgentCompletedData,
	type AgentStartedData,
	isAgentCompletedData,
	isAgentFailedData,
	isAgentProgressData,
	isAgentStartedData,
	isFileModifiedData,
	isToolUsedData,
	type WebhookEventData,
} from "../src/types/codegen.js";

describe("Type Guards", () => {
	describe("isAgentStartedData", () => {
		it("should return true for agent.started data", () => {
			const data: AgentStartedData = {
				type: "agent.started",
				prompt: "test prompt",
				sessionId: "test-session-id",
			};

			expect(isAgentStartedData(data)).toBe(true);
		});

		it("should return false for other event types", () => {
			const data: AgentCompletedData = {
				type: "agent.completed",
				sessionId: "test-session-id",
				result: "test result",
				metadata: {
					startTime: new Date(),
				},
			};

			expect(isAgentStartedData(data as unknown as WebhookEventData)).toBe(
				false,
			);
		});
	});

	describe("isAgentCompletedData", () => {
		it("should return true for agent.completed data", () => {
			const data: AgentCompletedData = {
				type: "agent.completed",
				sessionId: "test-session-id",
				result: "test result",
				metadata: {
					startTime: new Date(),
				},
			};

			expect(isAgentCompletedData(data)).toBe(true);
		});
	});

	describe("isAgentFailedData", () => {
		it("should return true for agent.failed data", () => {
			const data = {
				type: "agent.failed" as const,
				sessionId: "test-session-id",
				error: {
					code: "TEST_ERROR",
					message: "Test error message",
					timestamp: new Date(),
				},
			};

			expect(isAgentFailedData(data)).toBe(true);
		});
	});

	describe("isAgentProgressData", () => {
		it("should return true for agent.progress data", () => {
			const data = {
				type: "agent.progress" as const,
				sessionId: "test-session-id",
				message: "test message",
				progress: 50,
			};

			expect(isAgentProgressData(data)).toBe(true);
		});
	});

	describe("isToolUsedData", () => {
		it("should return true for tool.used data", () => {
			const data = {
				type: "tool.used" as const,
				sessionId: "test-session-id",
				toolName: "Read",
				parameters: { file: "test.ts" },
			};

			expect(isToolUsedData(data)).toBe(true);
		});
	});

	describe("isFileModifiedData", () => {
		it("should return true for file.created data", () => {
			const data = {
				type: "file.created" as const,
				sessionId: "test-session-id",
				filePath: "/path/to/file.ts",
				content: "test content",
			};

			expect(isFileModifiedData(data)).toBe(true);
		});

		it("should return true for file.updated data", () => {
			const data = {
				type: "file.updated" as const,
				sessionId: "test-session-id",
				filePath: "/path/to/file.ts",
				content: "updated content",
			};

			expect(isFileModifiedData(data)).toBe(true);
		});

		it("should return true for file.deleted data", () => {
			const data = {
				type: "file.deleted" as const,
				sessionId: "test-session-id",
				filePath: "/path/to/file.ts",
			};

			expect(isFileModifiedData(data)).toBe(true);
		});
	});
});
