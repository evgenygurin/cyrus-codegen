/**
 * Zod schemas for runtime validation of Codegen API types
 */
import { z } from "zod";

/**
 * Agent Status Schema
 */
export const AgentStatusSchema = z.enum([
	"idle",
	"running",
	"completed",
	"failed",
	"cancelled",
]);

/**
 * Codegen Event Type Schema
 */
export const CodegenEventTypeSchema = z.enum([
	"agent.started",
	"agent.completed",
	"agent.failed",
	"agent.cancelled",
	"agent.progress",
	"tool.used",
	"file.created",
	"file.updated",
	"file.deleted",
]);

/**
 * Codegen Config Schema
 */
export const CodegenConfigSchema = z.object({
	apiKey: z.string().min(1),
	apiUrl: z.string().url(),
	timeout: z.number().positive().optional(),
	retryAttempts: z.number().int().nonnegative().optional(),
	retryDelay: z.number().positive().optional(),
});

/**
 * Agent Invocation Request Schema
 */
export const AgentInvocationRequestSchema = z.object({
	prompt: z.string().min(1),
	context: z.record(z.unknown()).optional(),
	sessionId: z.string().optional(),
	continueSession: z.boolean().optional(),
	tools: z.array(z.string()).readonly().optional(),
	maxTokens: z.number().int().positive().optional(),
	temperature: z.number().min(0).max(2).optional(),
});

/**
 * Codegen Error Schema
 */
export const CodegenErrorSchema = z.object({
	code: z.string(),
	message: z.string(),
	details: z.record(z.unknown()).optional(),
	timestamp: z
		.string()
		.datetime()
		.or(z.date())
		.transform((val) => (typeof val === "string" ? new Date(val) : val)),
});

/**
 * Agent Metadata Schema
 */
export const AgentMetadataSchema = z.object({
	startTime: z
		.string()
		.datetime()
		.or(z.date())
		.transform((val) => (typeof val === "string" ? new Date(val) : val)),
	endTime: z
		.string()
		.datetime()
		.or(z.date())
		.transform((val) => (typeof val === "string" ? new Date(val) : val))
		.optional(),
	duration: z.number().optional(),
	tokensUsed: z.number().optional(),
	filesModified: z.array(z.string()).readonly().optional(),
	toolsUsed: z.array(z.string()).readonly().optional(),
});

/**
 * Agent Invocation Response Schema
 */
export const AgentInvocationResponseSchema = z.object({
	sessionId: z.string(),
	status: AgentStatusSchema,
	result: z.string().optional(),
	error: CodegenErrorSchema.optional(),
	metadata: AgentMetadataSchema,
});

/**
 * Agent Started Data Schema
 */
export const AgentStartedDataSchema = z.object({
	type: z.literal("agent.started"),
	prompt: z.string(),
	sessionId: z.string(),
});

/**
 * Agent Completed Data Schema
 */
export const AgentCompletedDataSchema = z.object({
	type: z.literal("agent.completed"),
	sessionId: z.string(),
	result: z.string(),
	metadata: AgentMetadataSchema,
});

/**
 * Agent Failed Data Schema
 */
export const AgentFailedDataSchema = z.object({
	type: z.literal("agent.failed"),
	sessionId: z.string(),
	error: CodegenErrorSchema,
});

/**
 * Agent Progress Data Schema
 */
export const AgentProgressDataSchema = z.object({
	type: z.literal("agent.progress"),
	sessionId: z.string(),
	message: z.string(),
	progress: z.number().min(0).max(100),
});

/**
 * Tool Used Data Schema
 */
export const ToolUsedDataSchema = z.object({
	type: z.literal("tool.used"),
	sessionId: z.string(),
	toolName: z.string(),
	parameters: z.record(z.unknown()),
	result: z.unknown().optional(),
});

/**
 * File Modified Data Schema
 */
export const FileModifiedDataSchema = z.object({
	type: z.enum(["file.created", "file.updated", "file.deleted"]),
	sessionId: z.string(),
	filePath: z.string(),
	content: z.string().optional(),
});

/**
 * Webhook Event Data Schema (Union)
 */
export const WebhookEventDataSchema = z.union([
	AgentStartedDataSchema,
	AgentCompletedDataSchema,
	AgentFailedDataSchema,
	AgentProgressDataSchema,
	ToolUsedDataSchema,
	FileModifiedDataSchema,
]);

/**
 * Webhook Event Payload Schema
 */
export const WebhookEventPayloadSchema = z.object({
	event: CodegenEventTypeSchema,
	sessionId: z.string(),
	timestamp: z
		.string()
		.datetime()
		.or(z.date())
		.transform((val) => (typeof val === "string" ? new Date(val) : val)),
	data: WebhookEventDataSchema,
});

/**
 * Webhook Config Schema
 */
export const WebhookConfigSchema = z.object({
	url: z.string().url(),
	secret: z.string().min(1),
	events: z.array(CodegenEventTypeSchema).readonly(),
	retryAttempts: z.number().int().nonnegative().optional(),
});

/**
 * Session Info Schema
 */
export const SessionInfoSchema = z.object({
	sessionId: z.string(),
	status: AgentStatusSchema,
	createdAt: z
		.string()
		.datetime()
		.or(z.date())
		.transform((val) => (typeof val === "string" ? new Date(val) : val)),
	updatedAt: z
		.string()
		.datetime()
		.or(z.date())
		.transform((val) => (typeof val === "string" ? new Date(val) : val)),
	metadata: AgentMetadataSchema,
});

/**
 * Paginated Response Schema
 */
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
	itemSchema: T,
) =>
	z.object({
		data: z.array(itemSchema).readonly(),
		total: z.number().int().nonnegative(),
		page: z.number().int().positive(),
		pageSize: z.number().int().positive(),
		hasMore: z.boolean(),
	});

/**
 * API Response Schema
 */
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
	z.object({
		success: z.boolean(),
		data: dataSchema.optional(),
		error: CodegenErrorSchema.optional(),
		timestamp: z.date(),
	});
