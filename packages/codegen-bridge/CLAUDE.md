# @cyrus/codegen-bridge Package

TypeScript/Node.js bridge to the Codegen.com Python SDK.

## Overview

This package provides a type-safe interface to Codegen AI agents from Node.js/TypeScript applications. It bridges the runtime gap between Node.js and Python by executing Python scripts that interact with the official Codegen SDK.

## Architecture

```
┌─────────────────────────────────────────┐
│  Cyrus (TypeScript/Node.js)             │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ CodegenBridge                     │  │
│  │ - TypeScript API                  │  │
│  │ - Zod validation                  │  │
│  │ - Error handling                  │  │
│  └────────────┬──────────────────────┘  │
│               │                          │
│  ┌────────────▼──────────────────────┐  │
│  │ PythonExecutor                    │  │
│  │ - Script generation               │  │
│  │ - Process management              │  │
│  │ - JSON serialization              │  │
│  └────────────┬──────────────────────┘  │
└───────────────┼──────────────────────────┘
                │
        ┌───────▼────────┐
        │  Python Child  │
        │  Process       │
        └───────┬────────┘
                │
┌───────────────▼──────────────────────────┐
│  Codegen SDK (Python)                    │
│                                           │
│  ┌────────────────────────────────────┐  │
│  │ Agent                              │  │
│  │ - run(prompt)                      │  │
│  │ - get_status()                     │  │
│  └────────────┬───────────────────────┘  │
│               │                           │
│  ┌────────────▼───────────────────────┐  │
│  │ codegen-api-client                 │  │
│  │ - REST API calls                   │  │
│  │ - Authentication                   │  │
│  └────────────┬───────────────────────┘  │
└───────────────┼───────────────────────────┘
                │
        ┌───────▼────────┐
        │  Codegen API   │
        │  (REST)        │
        └────────────────┘
```

## Key Components

### CodegenBridge

Main class that provides high-level agent operations:

- `runAgent(input)` - Start a new agent task
- `getTask(taskId)` - Get task status
- `resumeTask(input)` - Resume task with additional instructions
- `waitForCompletion(taskId, options)` - Wait for task completion
- `getTaskResult(taskId)` - Get result of completed task
- `healthCheck()` - Verify system health

### PythonExecutor

Low-level Python script executor:

- Generates Python scripts dynamically
- Executes scripts with JSON argument passing
- Handles process management and error handling
- Validates Python/Codegen availability

### Type System

Full Zod-based type validation:

- `AgentTask` - Task metadata and status
- `AgentRunInput` - Input for creating tasks
- `ResumeTaskInput` - Input for resuming tasks
- `CodegenBridgeOptions` - Bridge configuration
- `WaitOptions` - Polling configuration

## Requirements

### Python Setup

The package requires Python 3.12+ with the Codegen SDK installed:

```bash
# Install Codegen SDK
pip install codegen

# Or use the requirements file
pip install -r packages/codegen-bridge/python/requirements.txt
```

### Environment Variables

Required for Codegen API access:

```bash
CODEGEN_API_TOKEN=your_token_here
CODEGEN_ORG_ID=your_org_id
```

Get these from: https://codegen.com/token

## Testing

The package includes comprehensive tests:

```bash
# Run all tests
pnpm test

# Run tests once
pnpm test:run

# With coverage
pnpm test:run --coverage
```

### Test Structure

- `test/types.test.ts` - Zod schema validation tests
- `test/python-executor.test.ts` - Python script execution tests
- `test/codegen-bridge.test.ts` - Integration tests with mocking

### Mocking Strategy

Tests that require Codegen SDK use mocks:

```typescript
vi.spyOn(bridge, "getTask").mockResolvedValue(mockTask);
```

This allows testing logic without requiring Codegen installation.

## Integration with Cyrus

### Edge Worker Integration

The bridge integrates with Cyrus's edge worker system:

```typescript
import { CodegenBridge } from "@cyrus/codegen-bridge";
import { EdgeWorker } from "@cyrus/edge-worker";

class CodegenEnhancedWorker extends EdgeWorker {
	private codegen: CodegenBridge;

	constructor(config) {
		super(config);
		this.codegen = new CodegenBridge({
			token: config.codegenToken,
			orgId: config.codegenOrgId,
		});
	}

	async processIssue(issue) {
		// Route to Codegen or Claude based on issue type
		if (this.shouldUseCodegen(issue)) {
			return this.handleWithCodegen(issue);
		}
		return super.processIssue(issue);
	}

	private async handleWithCodegen(issue) {
		const task = await this.codegen.runAgent({
			prompt: issue.description,
			repoId: this.config.repoId,
		});

		// Track task progress
		await this.codegen.waitForCompletion(task.id, {
			onProgress: (t) => this.postLinearComment(issue, t.status),
		});

		// Get result and post to Linear
		const result = await this.codegen.getTaskResult(task.id);
		await this.postLinearComment(issue, result);
	}
}
```

### Configuration

Add Codegen configuration to Cyrus config:

```json
{
	"repositories": [
		{
			"id": "workspace-123",
			"name": "my-repo",
			"codegenEnabled": true,
			"codegenToken": "env:CODEGEN_API_TOKEN",
			"codegenOrgId": 12345
		}
	]
}
```

## Error Handling

All errors are typed with specific error codes:

```typescript
try {
	await bridge.runAgent({ prompt: "Fix bug" });
} catch (error) {
	if (error instanceof CodegenBridgeError) {
		switch (error.code) {
			case CodegenErrorCode.PYTHON_NOT_FOUND:
				// Python not installed
				break;
			case CodegenErrorCode.CODEGEN_NOT_INSTALLED:
				// Codegen SDK not installed
				break;
			case CodegenErrorCode.API_ERROR:
				// API request failed
				break;
			case CodegenErrorCode.TIMEOUT:
				// Task timeout
				break;
			case CodegenErrorCode.TASK_FAILED:
				// Task execution failed
				break;
		}
	}
}
```

## Development

### Building

```bash
pnpm build       # Build TypeScript
pnpm dev         # Watch mode
pnpm typecheck   # Type checking only
```

### Debugging

Enable debug mode for detailed logging:

```typescript
const bridge = new CodegenBridge({
	token: "...",
	orgId: 12345,
	debug: true, // Enable debug output
});
```

Debug output includes:

- Python version detection
- Codegen SDK version
- Script execution details
- API request/response logging

## Future Enhancements

Planned features:

1. **Webhook Support** - Receive real-time Codegen events
2. **Batch Operations** - Submit multiple tasks at once
3. **Retry Logic** - Automatic retry for transient failures
4. **Caching** - Cache task results for repeated queries
5. **Metrics** - Track task execution metrics
6. **Python Virtual Environment** - Automatic venv management

## Contributing

When contributing to this package:

1. Add types for new API features
2. Include comprehensive tests
3. Update documentation
4. Maintain >80% test coverage
5. Follow existing code patterns

## License

MIT - See LICENSE file for details
