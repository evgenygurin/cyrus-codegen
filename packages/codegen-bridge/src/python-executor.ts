import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execa } from "execa";
import {
	CodegenBridgeError,
	CodegenErrorCode,
	type PythonResult,
	PythonResultSchema,
} from "./types.js";

/**
 * Executes Python scripts with the Codegen SDK
 */
export class PythonExecutor {
	constructor(
		private pythonPath: string,
		private debug = false,
	) {}

	/**
	 * Check if Python is available
	 */
	async checkPython(): Promise<void> {
		try {
			const { stdout } = await execa(this.pythonPath, ["--version"]);
			if (this.debug) {
				console.log(`[PythonExecutor] Python found: ${stdout}`);
			}
		} catch (error) {
			throw new CodegenBridgeError(
				`Python not found at ${this.pythonPath}`,
				CodegenErrorCode.PYTHON_NOT_FOUND,
				error as Error,
			);
		}
	}

	/**
	 * Check if Codegen package is installed
	 */
	async checkCodegenInstalled(): Promise<void> {
		try {
			const { stdout } = await execa(this.pythonPath, [
				"-c",
				"import codegen; print(codegen.__version__)",
			]);
			if (this.debug) {
				console.log(`[PythonExecutor] Codegen version: ${stdout}`);
			}
		} catch (error) {
			throw new CodegenBridgeError(
				"Codegen package not installed. Run: pip install codegen",
				CodegenErrorCode.CODEGEN_NOT_INSTALLED,
				error as Error,
			);
		}
	}

	/**
	 * Execute a Python script with arguments
	 */
	async execute(
		scriptContent: string,
		args: Record<string, unknown> = {},
	): Promise<PythonResult> {
		// Create temporary script file
		const tempDir = await mkdir(join(tmpdir(), "codegen-bridge"), {
			recursive: true,
		});
		const scriptPath = join(
			tempDir as unknown as string,
			`script_${Date.now()}.py`,
		);

		try {
			await writeFile(scriptPath, scriptContent);

			if (this.debug) {
				console.log("[PythonExecutor] Executing script:", scriptPath);
				console.log("[PythonExecutor] Args:", JSON.stringify(args, null, 2));
			}

			const { stdout, stderr } = await execa(this.pythonPath, [
				scriptPath,
				JSON.stringify(args),
			]);

			if (this.debug && stderr) {
				console.error("[PythonExecutor] stderr:", stderr);
			}

			// Parse JSON output from Python script
			const result = JSON.parse(stdout);
			return PythonResultSchema.parse(result);
		} catch (error) {
			if (this.debug) {
				console.error("[PythonExecutor] Error:", error);
			}

			throw new CodegenBridgeError(
				`Failed to execute Python script: ${(error as Error).message}`,
				CodegenErrorCode.API_ERROR,
				error as Error,
			);
		}
	}

	/**
	 * Generate Python script for running an agent
	 */
	generateRunAgentScript(
		token: string,
		orgId: number,
		baseUrl?: string,
	): string {
		return `
import sys
import json
from codegen.agents.agent import Agent

def main():
    try:
        # Parse arguments
        args = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
        
        # Initialize agent
        agent = Agent(
            token="${token}",
            org_id=${orgId},
            ${baseUrl ? `base_url="${baseUrl}",` : ""}
        )
        
        # Run agent
        task = agent.run(prompt=args["prompt"])
        
        # Return result
        result = {
            "success": True,
            "data": {
                "id": task.id,
                "status": task.status,
                "result": task.result,
                "webUrl": task.web_url
            }
        }
        print(json.dumps(result))
        
    except Exception as e:
        result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(result))
        sys.exit(1)

if __name__ == "__main__":
    main()
`;
	}

	/**
	 * Generate Python script for getting task status
	 */
	generateGetTaskScript(
		token: string,
		orgId: number,
		baseUrl?: string,
	): string {
		return `
import sys
import json
from codegen.agents.agent import Agent, AgentTask
from codegen_api_client.api_client import ApiClient
from codegen_api_client.configuration import Configuration

def main():
    try:
        # Parse arguments
        args = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
        task_id = args["taskId"]
        
        # Initialize API client
        config = Configuration(
            host="${baseUrl || "https://api.codegen.com"}",
            access_token="${token}"
        )
        api_client = ApiClient(configuration=config)
        
        # Create a mock task and refresh it
        from codegen_api_client.models.agent_run_response import AgentRunResponse
        task_data = AgentRunResponse(
            id=task_id,
            status="queued",
            result=None,
            web_url=None
        )
        
        task = AgentTask(task_data, api_client, ${orgId})
        task.refresh()
        
        # Return result
        result = {
            "success": True,
            "data": {
                "id": task.id,
                "status": task.status,
                "result": task.result,
                "webUrl": task.web_url
            }
        }
        print(json.dumps(result))
        
    except Exception as e:
        result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(result))
        sys.exit(1)

if __name__ == "__main__":
    main()
`;
	}

	/**
	 * Generate Python script for resuming a task
	 */
	generateResumeTaskScript(
		token: string,
		orgId: number,
		baseUrl?: string,
	): string {
		return `
import sys
import json
from codegen_api_client.api.agents_api import AgentsApi
from codegen_api_client.api_client import ApiClient
from codegen_api_client.configuration import Configuration
from codegen_api_client.models.resume_agent_run_input import ResumeAgentRunInput

def main():
    try:
        # Parse arguments
        args = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
        task_id = args["taskId"]
        prompt = args["prompt"]
        
        # Initialize API client
        config = Configuration(
            host="${baseUrl || "https://api.codegen.com"}",
            access_token="${token}"
        )
        api_client = ApiClient(configuration=config)
        agents_api = AgentsApi(api_client)
        
        # Resume task
        resume_input = ResumeAgentRunInput(
            agent_run_id=task_id,
            prompt=prompt
        )
        
        response = agents_api.resume_agent_run_v1_organizations_org_id_agent_run_resume_post(
            org_id=${orgId},
            resume_agent_run_input=resume_input,
            authorization=f"Bearer ${token}"
        )
        
        # Return result
        result = {
            "success": True,
            "data": {
                "id": response.id,
                "status": response.status,
                "result": response.result,
                "webUrl": response.web_url
            }
        }
        print(json.dumps(result))
        
    except Exception as e:
        result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(result))
        sys.exit(1)

if __name__ == "__main__":
    main()
`;
	}
}
