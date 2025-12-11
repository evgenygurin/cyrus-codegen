/**
 * Configuration constants for Codegen integration
 */

/**
 * Default API configuration
 */
export const DEFAULT_API_URL = "https://api.codegen.sh/v1";
export const DEFAULT_TIMEOUT = 30000; // 30 seconds
export const DEFAULT_RETRY_ATTEMPTS = 3;
export const DEFAULT_RETRY_DELAY = 1000; // 1 second

/**
 * Webhook configuration
 */
export const DEFAULT_WEBHOOK_MAX_AGE = 300; // 5 minutes
export const DEFAULT_WEBHOOK_VALIDATE_TIMESTAMP = true;

/**
 * Polling configuration
 */
export const DEFAULT_POLLING_INTERVAL = 5000; // 5 seconds
export const MIN_POLLING_INTERVAL = 1000; // 1 second
export const MAX_POLLING_INTERVAL = 60000; // 1 minute

/**
 * Pagination configuration
 */
export const DEFAULT_PAGE_SIZE = 20;
export const MIN_PAGE_SIZE = 1;
export const MAX_PAGE_SIZE = 100;

/**
 * Agent configuration
 */
export const DEFAULT_MAX_TOKENS = 4096;
export const DEFAULT_TEMPERATURE = 0.7;

/**
 * Supported Codegen tools
 */
export const CODEGEN_TOOLS = [
	"Read",
	"Edit",
	"Write",
	"Bash",
	"Task",
	"WebFetch",
	"WebSearch",
	"TodoRead",
	"TodoWrite",
	"Grep",
	"Glob",
] as const;

export type CodegenTool = (typeof CODEGEN_TOOLS)[number];

/**
 * HTTP headers
 */
export const WEBHOOK_SIGNATURE_HEADER = "x-codegen-signature";
export const API_VERSION_HEADER = "x-api-version";

/**
 * Error codes
 */
export const ERROR_CODES = {
	INVALID_CONFIG: "INVALID_CONFIG",
	INVALID_REQUEST: "INVALID_REQUEST",
	INVALID_SESSION_ID: "INVALID_SESSION_ID",
	INVALID_PAGE: "INVALID_PAGE",
	INVALID_PAGE_SIZE: "INVALID_PAGE_SIZE",
	INVALID_SIGNATURE: "INVALID_SIGNATURE",
	WEBHOOK_VERIFICATION_FAILED: "WEBHOOK_VERIFICATION_FAILED",
	API_ERROR: "API_ERROR",
	NETWORK_ERROR: "NETWORK_ERROR",
	TIMEOUT_ERROR: "TIMEOUT_ERROR",
	NO_RESPONSE: "NO_RESPONSE",
	REQUEST_SETUP_ERROR: "REQUEST_SETUP_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
