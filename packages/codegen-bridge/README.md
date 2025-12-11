# @cyrus/codegen-bridge

Codegen.com platform integration bridge for Cyrus. Provides a TypeScript/JavaScript interface to the Codegen Python SDK.

## Overview

This package bridges Cyrus's TypeScript/Node.js runtime with Codegen's Python SDK, enabling seamless integration of Codegen AI agents within the Cyrus workflow.

## Features

- **Agent Management**: Create, monitor, and manage Codegen AI agents
- **Task Execution**: Submit prompts and track execution status
- **Webhook Integration**: Handle Codegen events in the Cyrus system
- **Type-Safe API**: Full TypeScript support with Zod validation

## Installation

```bash
pnpm install @cyrus/codegen-bridge
```

## Requirements

- Python 3.12+ with `codegen` package installed
- Node.js 18+
- Codegen API token

## Usage

### Basic Agent Execution

```typescript
import { CodegenBridge } from '@cyrus/codegen-bridge';

const bridge = new CodegenBridge({
  token: process.env.CODEGEN_API_TOKEN,
  orgId: process.env.CODEGEN_ORG_ID,
});

// Run an agent task
const task = await bridge.runAgent({
  prompt: 'Fix the authentication bug in PR #123',
  repoId: 456,
});

// Check status
console.log(task.status); // 'queued' | 'running' | 'completed' | 'failed'

// Wait for completion
await bridge.waitForCompletion(task.id);

// Get result
const result = await bridge.getTaskResult(task.id);
console.log(result);
```

### Integration with Cyrus Edge Worker

```typescript
import { CodegenBridge } from '@cyrus/codegen-bridge';
import { EdgeWorker } from '@cyrus/edge-worker';

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
    // Determine if Codegen should handle this issue
    if (this.shouldUseCodegen(issue)) {
      const task = await this.codegen.runAgent({
        prompt: issue.description,
        repoId: this.config.repoId,
      });
      
      return this.trackCodegenTask(task);
    }
    
    // Fall back to Claude Code
    return super.processIssue(issue);
  }
}
```

## API Reference

### CodegenBridge

Main class for interacting with Codegen agents.

#### Constructor

```typescript
new CodegenBridge(options: CodegenBridgeOptions)
```

**Options:**
- `token` (string, required): Codegen API token
- `orgId` (number, required): Organization ID
- `baseUrl` (string, optional): API base URL (default: production)
- `pythonPath` (string, optional): Path to Python executable (default: 'python3')

#### Methods

##### `runAgent(input: AgentRunInput): Promise<AgentTask>`

Create and run a new agent task.

**Parameters:**
- `prompt` (string, required): The instruction for the agent
- `repoId` (number, optional): Repository ID to scope the task

**Returns:** `AgentTask` object with task details

##### `getTask(taskId: number): Promise<AgentTask>`

Get the current status of a task.

##### `waitForCompletion(taskId: number, options?: WaitOptions): Promise<AgentTask>`

Wait for a task to complete.

**Options:**
- `timeout` (number): Maximum wait time in milliseconds (default: 300000)
- `pollInterval` (number): Polling interval in milliseconds (default: 5000)

##### `resumeTask(taskId: number, prompt: string): Promise<AgentTask>`

Resume a task with additional instructions.

## Architecture

### Python Bridge

The package uses Node.js child processes to execute Python scripts that interact with the Codegen SDK. This approach:

1. Maintains compatibility with Codegen's Python-native SDK
2. Provides type-safe TypeScript interfaces
3. Handles JSON serialization between runtimes
4. Manages Python virtual environments automatically

### Type Safety

All API responses are validated using Zod schemas:

```typescript
import { AgentTaskSchema } from '@cyrus/codegen-bridge';

const task = AgentTaskSchema.parse(apiResponse);
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Watch mode
pnpm dev

# Run tests
pnpm test

# Type checking
pnpm typecheck
```

## License

MIT - See LICENSE file for details
