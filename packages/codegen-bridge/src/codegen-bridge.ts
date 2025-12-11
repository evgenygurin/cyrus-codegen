import { PythonExecutor } from "./python-executor.js";
import {
	type AgentRunInput,
	AgentRunInputSchema,
	type AgentTask,
	AgentTaskSchema,
	CodegenBridgeError,
	type CodegenBridgeOptions,
	CodegenBridgeOptionsSchema,
	CodegenErrorCode,
	type ResumeTaskInput,
	ResumeTaskInputSchema,
	type WaitOptions,
	WaitOptionsSchema,
} from "./types.js";

/**
 * Bridge between TypeScript/Node.js and Codegen Python SDK
 */
export class CodegenBridge {
	private executor: PythonExecutor;
	private config: CodegenBridgeOptions;
	private initialized = false;

	constructor(options: CodegenBridgeOptions) {
		this.config = CodegenBridgeOptionsSchema.parse(options);
		this.executor = new PythonExecutor(
			this.config.pythonPath,
			this.config.debug,
		);
	}

	/**
	 * Initialize the bridge (check Python and Codegen availability)
	 */
	async initialize(): Promise<void> {
		if (this.initialized) return;

		await this.executor.checkPython();
		await this.executor.checkCodegenInstalled();
		this.initialized = true;

		if (this.config.debug) {
			console.log("[CodegenBridge] Initialized successfully");
		}
	}

	/**
	 * Ensure the bridge is initialized
	 */
	private async ensureInitialized(): Promise<void> {
		if (!this.initialized) {
			await this.initialize();
		}
	}

	/**
	 * Run an agent with a prompt
	 */
	async runAgent(input: AgentRunInput): Promise<AgentTask> {
		await this.ensureInitialized();

		const validatedInput = AgentRunInputSchema.parse(input);

		const script = this.executor.generateRunAgentScript(
			this.config.token,
			this.config.orgId,
			this.config.baseUrl,
		);

		const result = await this.executor.execute(script, {
			prompt: validatedInput.prompt,
			repoId: validatedInput.repoId,
		});

		if (!result.success) {
			throw new CodegenBridgeError(
				`Failed to run agent: ${result.error}`,
				CodegenErrorCode.API_ERROR,
			);
		}

		return AgentTaskSchema.parse(result.data);
	}

	/**
	 * Get the status of a task
	 */
	async getTask(taskId: number): Promise<AgentTask> {
		await this.ensureInitialized();

		const script = this.executor.generateGetTaskScript(
			this.config.token,
			this.config.orgId,
			this.config.baseUrl,
		);

		const result = await this.executor.execute(script, { taskId });

		if (!result.success) {
			throw new CodegenBridgeError(
				`Failed to get task: ${result.error}`,
				CodegenErrorCode.API_ERROR,
			);
		}

		return AgentTaskSchema.parse(result.data);
	}

	/**
	 * Resume a task with additional instructions
	 */
	async resumeTask(input: ResumeTaskInput): Promise<AgentTask> {
		await this.ensureInitialized();

		const validatedInput = ResumeTaskInputSchema.parse(input);

		const script = this.executor.generateResumeTaskScript(
			this.config.token,
			this.config.orgId,
			this.config.baseUrl,
		);

		const result = await this.executor.execute(script, {
			taskId: validatedInput.taskId,
			prompt: validatedInput.prompt,
		});

		if (!result.success) {
			throw new CodegenBridgeError(
				`Failed to resume task: ${result.error}`,
				CodegenErrorCode.API_ERROR,
			);
		}

		return AgentTaskSchema.parse(result.data);
	}

	/**
	 * Wait for a task to complete
	 */
	async waitForCompletion(
		taskId: number,
		options?: Partial<WaitOptions>,
	): Promise<AgentTask> {
		await this.ensureInitialized();

		const waitOptions = WaitOptionsSchema.parse(options || {});
		const startTime = Date.now();

		while (true) {
			const task = await this.getTask(taskId);

			// Call progress callback if provided
			if (waitOptions.onProgress) {
				waitOptions.onProgress(task);
			}

			// Check if task is in terminal state
			if (
				task.status === "completed" ||
				task.status === "failed" ||
				task.status === "cancelled"
			) {
				if (task.status === "failed") {
					throw new CodegenBridgeError(
						`Task ${taskId} failed: ${task.result || "Unknown error"}`,
						CodegenErrorCode.TASK_FAILED,
					);
				}
				return task;
			}

			// Check timeout
			if (Date.now() - startTime > waitOptions.timeout) {
				throw new CodegenBridgeError(
					`Timeout waiting for task ${taskId} to complete`,
					CodegenErrorCode.TIMEOUT,
				);
			}

			// Wait before next poll
			await new Promise((resolve) =>
				setTimeout(resolve, waitOptions.pollInterval),
			);
		}
	}

	/**
	 * Get the result of a completed task
	 */
	async getTaskResult(taskId: number): Promise<string | null> {
		const task = await this.getTask(taskId);

		if (task.status !== "completed") {
			throw new CodegenBridgeError(
				`Task ${taskId} is not completed (status: ${task.status})`,
				CodegenErrorCode.API_ERROR,
			);
		}

		return task.result || null;
	}

	/**
	 * Check if the bridge is properly configured
	 */
	async healthCheck(): Promise<{
		pythonAvailable: boolean;
		codegenInstalled: boolean;
		apiAccessible: boolean;
	}> {
		const result = {
			pythonAvailable: false,
			codegenInstalled: false,
			apiAccessible: false,
		};

		try {
			await this.executor.checkPython();
			result.pythonAvailable = true;
		} catch (_error) {
			// Python not available
		}

		try {
			await this.executor.checkCodegenInstalled();
			result.codegenInstalled = true;
		} catch (_error) {
			// Codegen not installed
		}

		try {
			// Try to get a non-existent task to test API access
			await this.getTask(999999999);
		} catch (error) {
			// If we get an API error (not a connection error), API is accessible
			if (
				error instanceof CodegenBridgeError &&
				error.code === CodegenErrorCode.API_ERROR
			) {
				result.apiAccessible = true;
			}
		}

		return result;
	}
}
