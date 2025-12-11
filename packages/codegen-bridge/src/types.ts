import { z } from "zod";

/**
 * Codegen agent task status
 */
export const AgentStatusSchema = z.enum([
	"queued",
	"running",
	"completed",
	"failed",
	"cancelled",
]);

export type AgentStatus = z.infer<typeof AgentStatusSchema>;

/**
 * Agent task response from Codegen API
 */
export const AgentTaskSchema = z.object({
	id: z.number(),
	status: AgentStatusSchema,
	result: z.string().nullable().optional(),
	webUrl: z.string().optional(),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional(),
});

export type AgentTask = z.infer<typeof AgentTaskSchema>;

/**
 * Input for creating an agent run
 */
export const AgentRunInputSchema = z.object({
	prompt: z.string().min(1, "Prompt cannot be empty"),
	repoId: z.number().optional(),
	metadata: z.record(z.string(), z.any()).optional(),
});

export type AgentRunInput = z.infer<typeof AgentRunInputSchema>;

/**
 * Options for resuming an agent task
 */
export const ResumeTaskInputSchema = z.object({
	taskId: z.number(),
	prompt: z.string().min(1, "Prompt cannot be empty"),
});

export type ResumeTaskInput = z.infer<typeof ResumeTaskInputSchema>;

/**
 * Configuration for CodegenBridge
 */
export const CodegenBridgeOptionsSchema = z.object({
	token: z.string().min(1, "API token is required"),
	orgId: z.number().positive("Organization ID must be positive"),
	baseUrl: z.string().url().optional(),
	pythonPath: z.string().default("python3"),
	debug: z.boolean().default(false),
});

export type CodegenBridgeOptions = z.infer<typeof CodegenBridgeOptionsSchema>;

/**
 * Wait options for task completion
 */
export const WaitOptionsSchema = z.object({
	timeout: z.number().positive().default(300000), // 5 minutes
	pollInterval: z.number().positive().default(5000), // 5 seconds
	onProgress: z.function().args(AgentTaskSchema).returns(z.void()).optional(),
});

export type WaitOptions = z.infer<typeof WaitOptionsSchema>;

/**
 * Python script execution result
 */
export const PythonResultSchema = z.object({
	success: z.boolean(),
	data: z.any().optional(),
	error: z.string().optional(),
});

export type PythonResult = z.infer<typeof PythonResultSchema>;

/**
 * Webhook event from Codegen
 */
export const CodegenWebhookEventSchema = z.object({
	type: z.enum([
		"agent.run.started",
		"agent.run.completed",
		"agent.run.failed",
		"agent.run.progress",
	]),
	taskId: z.number(),
	orgId: z.number(),
	status: AgentStatusSchema,
	result: z.string().nullable().optional(),
	metadata: z.record(z.string(), z.any()).optional(),
	timestamp: z.string(),
});

export type CodegenWebhookEvent = z.infer<typeof CodegenWebhookEventSchema>;

/**
 * Error codes for Codegen bridge operations
 */
export enum CodegenErrorCode {
	PYTHON_NOT_FOUND = "PYTHON_NOT_FOUND",
	CODEGEN_NOT_INSTALLED = "CODEGEN_NOT_INSTALLED",
	API_ERROR = "API_ERROR",
	TIMEOUT = "TIMEOUT",
	INVALID_RESPONSE = "INVALID_RESPONSE",
	TASK_FAILED = "TASK_FAILED",
}

/**
 * Codegen bridge error
 */
export class CodegenBridgeError extends Error {
	constructor(
		message: string,
		public code: CodegenErrorCode,
		public originalError?: Error,
	) {
		super(message);
		this.name = "CodegenBridgeError";
		Object.setPrototypeOf(this, CodegenBridgeError.prototype);
	}
}
