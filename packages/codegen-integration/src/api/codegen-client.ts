/**
 * Codegen API Client
 * Type-safe client for interacting with Codegen API
 */
import axios, { type AxiosError, type AxiosInstance } from "axios";
import { z } from "zod";
import type {
	AgentInvocationRequest,
	AgentInvocationResponse,
	ApiResponse,
	CodegenConfig,
	CodegenError,
	PaginatedResponse,
	SessionInfo,
} from "../types/codegen.js";
import {
	AgentInvocationRequestSchema,
	AgentInvocationResponseSchema,
	ApiResponseSchema,
	CodegenConfigSchema,
	PaginatedResponseSchema,
	SessionInfoSchema,
} from "../types/schemas.js";

/**
 * Custom error class for Codegen API errors
 */
export class CodegenApiError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly details?: Record<string, unknown>,
		public readonly statusCode?: number,
	) {
		super(message);
		this.name = "CodegenApiError";
	}

	public toCodegenError(): CodegenError {
		return {
			code: this.code,
			message: this.message,
			details: this.details,
			timestamp: new Date(),
		};
	}
}

/**
 * Retry configuration
 */
interface RetryConfig {
	attempts: number;
	delay: number;
}

/**
 * Codegen API Client Class
 */
export class CodegenClient {
	private readonly client: AxiosInstance;
	private readonly retryConfig: RetryConfig;

	constructor(config: CodegenConfig) {
		// Validate configuration
		const validatedConfig = CodegenConfigSchema.parse(config);

		this.retryConfig = {
			attempts: validatedConfig.retryAttempts ?? 3,
			delay: validatedConfig.retryDelay ?? 1000,
		};

		// Create axios instance with configuration
		this.client = axios.create({
			baseURL: validatedConfig.apiUrl,
			timeout: validatedConfig.timeout ?? 30000,
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${validatedConfig.apiKey}`,
			},
		});

		// Add response interceptor for error handling
		this.client.interceptors.response.use(
			(response) => response,
			async (error: AxiosError) => {
				return Promise.reject(this.handleAxiosError(error));
			},
		);
	}

	/**
	 * Invoke an agent with a prompt
	 */
	public async invokeAgent(
		request: AgentInvocationRequest,
	): Promise<ApiResponse<AgentInvocationResponse>> {
		// Validate request
		const validatedRequest = AgentInvocationRequestSchema.parse(request);

		return this.retryRequest(async () => {
			const response = await this.client.post<
				ApiResponse<AgentInvocationResponse>
			>("/agents/invoke", validatedRequest);

			// Validate response
			const responseSchema = ApiResponseSchema(AgentInvocationResponseSchema);
			return responseSchema.parse(response.data);
		});
	}

	/**
	 * Get session information by session ID
	 */
	public async getSession(
		sessionId: string,
	): Promise<ApiResponse<SessionInfo>> {
		if (!sessionId || sessionId.trim().length === 0) {
			throw new CodegenApiError("Session ID is required", "INVALID_SESSION_ID");
		}

		return this.retryRequest(async () => {
			const response = await this.client.get<ApiResponse<SessionInfo>>(
				`/sessions/${sessionId}`,
			);

			// Validate response
			const responseSchema = ApiResponseSchema(SessionInfoSchema);
			return responseSchema.parse(response.data);
		});
	}

	/**
	 * List all sessions with pagination
	 */
	public async listSessions(
		page = 1,
		pageSize = 20,
	): Promise<ApiResponse<PaginatedResponse<SessionInfo>>> {
		if (page < 1) {
			throw new CodegenApiError("Page must be >= 1", "INVALID_PAGE");
		}
		if (pageSize < 1 || pageSize > 100) {
			throw new CodegenApiError(
				"Page size must be between 1 and 100",
				"INVALID_PAGE_SIZE",
			);
		}

		return this.retryRequest(async () => {
			const response = await this.client.get<
				ApiResponse<PaginatedResponse<SessionInfo>>
			>("/sessions", {
				params: { page, pageSize },
			});

			// Validate response
			const responseSchema = ApiResponseSchema(
				PaginatedResponseSchema(SessionInfoSchema),
			);
			return responseSchema.parse(response.data);
		});
	}

	/**
	 * Cancel a running agent session
	 */
	public async cancelSession(
		sessionId: string,
	): Promise<ApiResponse<SessionInfo>> {
		if (!sessionId || sessionId.trim().length === 0) {
			throw new CodegenApiError("Session ID is required", "INVALID_SESSION_ID");
		}

		return this.retryRequest(async () => {
			const response = await this.client.post<ApiResponse<SessionInfo>>(
				`/sessions/${sessionId}/cancel`,
			);

			// Validate response
			const responseSchema = ApiResponseSchema(SessionInfoSchema);
			return responseSchema.parse(response.data);
		});
	}

	/**
	 * Delete a session
	 */
	public async deleteSession(sessionId: string): Promise<ApiResponse<void>> {
		if (!sessionId || sessionId.trim().length === 0) {
			throw new CodegenApiError("Session ID is required", "INVALID_SESSION_ID");
		}

		return this.retryRequest(async () => {
			const response = await this.client.delete<ApiResponse<void>>(
				`/sessions/${sessionId}`,
			);

			// Validate response
			const responseSchema = ApiResponseSchema(z.void());
			return responseSchema.parse(response.data);
		});
	}

	/**
	 * Retry a request with exponential backoff
	 */
	private async retryRequest<T>(
		requestFn: () => Promise<T>,
		attempt = 1,
	): Promise<T> {
		try {
			return await requestFn();
		} catch (error) {
			if (attempt >= this.retryConfig.attempts) {
				throw error;
			}

			// Only retry on network errors or 5xx status codes
			if (
				error instanceof CodegenApiError &&
				error.statusCode &&
				error.statusCode < 500
			) {
				throw error;
			}

			// Exponential backoff
			const delay = this.retryConfig.delay * 2 ** (attempt - 1);
			await new Promise((resolve) => setTimeout(resolve, delay));

			return this.retryRequest(requestFn, attempt + 1);
		}
	}

	/**
	 * Handle Axios errors and convert to CodegenApiError
	 */
	private handleAxiosError(error: AxiosError): CodegenApiError {
		if (error.response) {
			// Server responded with error status
			const status = error.response.status;
			const data = error.response.data as Record<string, unknown> | undefined;

			return new CodegenApiError(
				data?.message?.toString() ?? error.message,
				data?.code?.toString() ?? `HTTP_${status}`,
				data?.details as Record<string, unknown> | undefined,
				status,
			);
		}

		if (error.request) {
			// Request was made but no response received
			return new CodegenApiError(
				"No response received from server",
				"NO_RESPONSE",
				{ originalError: error.message },
			);
		}

		// Error setting up the request
		return new CodegenApiError(error.message, "REQUEST_SETUP_ERROR", {
			originalError: error.message,
		});
	}

	/**
	 * Get the underlying axios instance (for advanced usage)
	 */
	public getAxiosInstance(): AxiosInstance {
		return this.client;
	}
}

/**
 * Factory function to create a Codegen client
 */
export function createCodegenClient(config: CodegenConfig): CodegenClient {
	return new CodegenClient(config);
}
