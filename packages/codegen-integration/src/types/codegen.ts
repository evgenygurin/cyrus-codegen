/**
 * TypeScript Type Definitions for Codegen API
 * Based on Codegen API documentation and best practices
 */

/**
 * Codegen Agent Status
 */
export type AgentStatus =
	| "idle"
	| "running"
	| "completed"
	| "failed"
	| "cancelled";

/**
 * Codegen Event Types
 */
export type CodegenEventType =
	| "agent.started"
	| "agent.completed"
	| "agent.failed"
	| "agent.cancelled"
	| "agent.progress"
	| "tool.used"
	| "file.created"
	| "file.updated"
	| "file.deleted";

/**
 * Base Codegen Configuration
 */
export interface CodegenConfig {
	readonly apiKey: string;
	readonly apiUrl: string;
	readonly timeout?: number;
	readonly retryAttempts?: number;
	readonly retryDelay?: number;
}

/**
 * Agent Invocation Request
 */
export interface AgentInvocationRequest {
	readonly prompt: string;
	readonly context?: Record<string, unknown>;
	readonly sessionId?: string;
	readonly continueSession?: boolean;
	readonly tools?: readonly string[];
	readonly maxTokens?: number;
	readonly temperature?: number;
}

/**
 * Agent Invocation Response
 */
export interface AgentInvocationResponse {
	readonly sessionId: string;
	readonly status: AgentStatus;
	readonly result?: string;
	readonly error?: CodegenError;
	readonly metadata: AgentMetadata;
}

/**
 * Agent Metadata
 */
export interface AgentMetadata {
	readonly startTime: Date;
	readonly endTime?: Date;
	readonly duration?: number;
	readonly tokensUsed?: number;
	readonly filesModified?: readonly string[];
	readonly toolsUsed?: readonly string[];
}

/**
 * Codegen Error
 */
export interface CodegenError {
	readonly code: string;
	readonly message: string;
	readonly details?: Record<string, unknown>;
	readonly timestamp: Date;
}

/**
 * Webhook Event Payload
 */
export interface WebhookEventPayload {
	readonly event: CodegenEventType;
	readonly sessionId: string;
	readonly timestamp: Date;
	readonly data: WebhookEventData;
}

/**
 * Webhook Event Data (Union type for different event types)
 */
export type WebhookEventData =
	| AgentStartedData
	| AgentCompletedData
	| AgentFailedData
	| AgentProgressData
	| ToolUsedData
	| FileModifiedData;

/**
 * Agent Started Event Data
 */
export interface AgentStartedData {
	readonly type: "agent.started";
	readonly prompt: string;
	readonly sessionId: string;
}

/**
 * Agent Completed Event Data
 */
export interface AgentCompletedData {
	readonly type: "agent.completed";
	readonly sessionId: string;
	readonly result: string;
	readonly metadata: AgentMetadata;
}

/**
 * Agent Failed Event Data
 */
export interface AgentFailedData {
	readonly type: "agent.failed";
	readonly sessionId: string;
	readonly error: CodegenError;
}

/**
 * Agent Progress Event Data
 */
export interface AgentProgressData {
	readonly type: "agent.progress";
	readonly sessionId: string;
	readonly message: string;
	readonly progress: number;
}

/**
 * Tool Used Event Data
 */
export interface ToolUsedData {
	readonly type: "tool.used";
	readonly sessionId: string;
	readonly toolName: string;
	readonly parameters: Record<string, unknown>;
	readonly result?: unknown;
}

/**
 * File Modified Event Data
 */
export interface FileModifiedData {
	readonly type: "file.created" | "file.updated" | "file.deleted";
	readonly sessionId: string;
	readonly filePath: string;
	readonly content?: string;
}

/**
 * Webhook Configuration
 */
export interface WebhookConfig {
	readonly url: string;
	readonly secret: string;
	readonly events: readonly CodegenEventType[];
	readonly retryAttempts?: number;
}

/**
 * Session Information
 */
export interface SessionInfo {
	readonly sessionId: string;
	readonly status: AgentStatus;
	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly metadata: AgentMetadata;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
	readonly data: readonly T[];
	readonly total: number;
	readonly page: number;
	readonly pageSize: number;
	readonly hasMore: boolean;
}

/**
 * API Response Wrapper
 */
export interface ApiResponse<T> {
	readonly success: boolean;
	readonly data?: T;
	readonly error?: CodegenError;
	readonly timestamp: Date;
}

/**
 * Type guard to check if data is AgentStartedData
 */
export function isAgentStartedData(
	data: WebhookEventData,
): data is AgentStartedData {
	return data.type === "agent.started";
}

/**
 * Type guard to check if data is AgentCompletedData
 */
export function isAgentCompletedData(
	data: WebhookEventData,
): data is AgentCompletedData {
	return data.type === "agent.completed";
}

/**
 * Type guard to check if data is AgentFailedData
 */
export function isAgentFailedData(
	data: WebhookEventData,
): data is AgentFailedData {
	return data.type === "agent.failed";
}

/**
 * Type guard to check if data is AgentProgressData
 */
export function isAgentProgressData(
	data: WebhookEventData,
): data is AgentProgressData {
	return data.type === "agent.progress";
}

/**
 * Type guard to check if data is ToolUsedData
 */
export function isToolUsedData(data: WebhookEventData): data is ToolUsedData {
	return data.type === "tool.used";
}

/**
 * Type guard to check if data is FileModifiedData
 */
export function isFileModifiedData(
	data: WebhookEventData,
): data is FileModifiedData {
	return (
		data.type === "file.created" ||
		data.type === "file.updated" ||
		data.type === "file.deleted"
	);
}
