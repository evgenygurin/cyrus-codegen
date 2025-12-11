/**
 * Cyrus Codegen Integration
 * TypeScript client library for Codegen API
 */

// Export API client
export {
	CodegenApiError,
	CodegenClient,
	createCodegenClient,
} from "./api/codegen-client.js";
// Export components
export type { AgentSessionProps } from "./components/AgentSession.js";
export { AgentSession } from "./components/AgentSession.js";
// Export constants
export {
	API_VERSION_HEADER,
	CODEGEN_TOOLS,
	type CodegenTool,
	DEFAULT_API_URL,
	DEFAULT_MAX_TOKENS,
	DEFAULT_PAGE_SIZE,
	DEFAULT_POLLING_INTERVAL,
	DEFAULT_RETRY_ATTEMPTS,
	DEFAULT_RETRY_DELAY,
	DEFAULT_TEMPERATURE,
	DEFAULT_TIMEOUT,
	DEFAULT_WEBHOOK_MAX_AGE,
	DEFAULT_WEBHOOK_VALIDATE_TIMESTAMP,
	ERROR_CODES,
	type ErrorCode,
	MAX_PAGE_SIZE,
	MAX_POLLING_INTERVAL,
	MIN_PAGE_SIZE,
	MIN_POLLING_INTERVAL,
	WEBHOOK_SIGNATURE_HEADER,
} from "./config/constants.js";

// Export webhook handler
export type {
	WebhookEventHandler,
	WebhookHandlerConfig,
} from "./services/webhook-handler.js";
export {
	createWebhookHandler,
	WebhookHandler,
	WebhookVerificationError,
} from "./services/webhook-handler.js";
// Export types
export type {
	AgentCompletedData,
	AgentFailedData,
	AgentInvocationRequest,
	AgentInvocationResponse,
	AgentMetadata,
	AgentProgressData,
	AgentStartedData,
	AgentStatus,
	ApiResponse,
	CodegenConfig,
	CodegenError,
	CodegenEventType,
	FileModifiedData,
	PaginatedResponse,
	SessionInfo,
	ToolUsedData,
	WebhookConfig,
	WebhookEventData,
	WebhookEventPayload,
} from "./types/codegen.js";
// Export type guards
export {
	isAgentCompletedData,
	isAgentFailedData,
	isAgentProgressData,
	isAgentStartedData,
	isFileModifiedData,
	isToolUsedData,
} from "./types/codegen.js";
// Export schemas
export {
	AgentCompletedDataSchema,
	AgentFailedDataSchema,
	AgentInvocationRequestSchema,
	AgentInvocationResponseSchema,
	AgentMetadataSchema,
	AgentProgressDataSchema,
	AgentStartedDataSchema,
	AgentStatusSchema,
	ApiResponseSchema,
	CodegenConfigSchema,
	CodegenErrorSchema,
	CodegenEventTypeSchema,
	FileModifiedDataSchema,
	PaginatedResponseSchema,
	SessionInfoSchema,
	ToolUsedDataSchema,
	WebhookConfigSchema,
	WebhookEventDataSchema,
	WebhookEventPayloadSchema,
} from "./types/schemas.js";
// Export utilities
export {
	calculateRetryDelay,
	debounce,
	formatDuration,
	formatRelativeTime,
	getEventLabel,
	getStatusLabel,
	isActiveStatus,
	isTerminalStatus,
	sleep,
	throttle,
} from "./utils/index.js";
