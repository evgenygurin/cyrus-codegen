# Cyrus Codegen Integration

**Full TypeScript integration for Codegen API**

TypeScript client library for interacting with Codegen API with complete type safety, runtime validation, and React components.

## Features

- ✅ **Complete TypeScript types** - Fully typed API with strict mode
- ✅ **Runtime validation** - Zod schemas for all requests/responses
- ✅ **Type-safe API client** - Axios-based client with retry logic
- ✅ **Webhook handler** - HMAC signature verification and event handling
- ✅ **React components** - Pre-built UI components for agent sessions
- ✅ **Utility functions** - Helpers for common operations
- ✅ **80%+ test coverage** - Comprehensive test suite

## Installation

```bash
pnpm add cyrus-codegen-integration
```

## Quick Start

### API Client

```typescript
import { createCodegenClient } from "cyrus-codegen-integration";

const client = createCodegenClient({
	apiKey: "your-api-key",
	apiUrl: "https://api.codegen.sh/v1",
	timeout: 30000,
	retryAttempts: 3,
});

// Invoke an agent
const response = await client.invokeAgent({
	prompt: "Create a new React component",
	tools: ["Read", "Edit", "Write"],
	maxTokens: 4096,
});

console.log(response.data?.sessionId);

// Get session info
const session = await client.getSession(response.data?.sessionId!);
console.log(session.data?.status);
```

### Webhook Handler

```typescript
import { createWebhookHandler } from "cyrus-codegen-integration";

const webhookHandler = createWebhookHandler({
	secret: "your-webhook-secret",
	maxAge: 300,
	validateTimestamp: true,
});

// Register event handlers
webhookHandler.on("agent.completed", async (payload) => {
	console.log("Agent completed:", payload.data);
});

webhookHandler.on("tool.used", async (payload) => {
	console.log("Tool used:", payload.data);
});

// Process webhook request (e.g., in Express)
app.post("/webhook", async (req, res) => {
	try {
		const signature = req.headers["x-codegen-signature"] as string;
		await webhookHandler.processWebhook(
			JSON.stringify(req.body),
			signature
		);
		res.status(200).send("OK");
	} catch (error) {
		console.error("Webhook verification failed:", error);
		res.status(401).send("Unauthorized");
	}
});
```

### React Component

```typescript
import { AgentSession } from "cyrus-codegen-integration";
import { createCodegenClient } from "cyrus-codegen-integration";

const client = createCodegenClient({
	apiKey: "your-api-key",
	apiUrl: "https://api.codegen.sh/v1",
});

function MyComponent() {
	return (
		<AgentSession
			sessionId="session-id"
			client={client}
			refreshInterval={5000}
			onStatusChange={(status) => {
				console.log("Status changed:", status);
			}}
		/>
	);
}
```

## API Reference

### Types

All types are fully documented with JSDoc comments:

- `AgentStatus` - Agent execution status enum
- `CodegenEventType` - Webhook event types
- `CodegenConfig` - Client configuration
- `AgentInvocationRequest` - Request to invoke an agent
- `AgentInvocationResponse` - Response from agent invocation
- `WebhookEventPayload` - Webhook event payload
- `SessionInfo` - Session information

### API Client

```typescript
class CodegenClient {
	// Invoke an agent
	invokeAgent(request: AgentInvocationRequest): Promise<ApiResponse<AgentInvocationResponse>>;

	// Get session by ID
	getSession(sessionId: string): Promise<ApiResponse<SessionInfo>>;

	// List all sessions with pagination
	listSessions(page?: number, pageSize?: number): Promise<ApiResponse<PaginatedResponse<SessionInfo>>>;

	// Cancel a running session
	cancelSession(sessionId: string): Promise<ApiResponse<SessionInfo>>;

	// Delete a session
	deleteSession(sessionId: string): Promise<ApiResponse<void>>;
}
```

### Webhook Handler

```typescript
class WebhookHandler {
	// Register handler for specific event
	on(event: CodegenEventType, handler: WebhookEventHandler): this;

	// Register handler for all events
	onAll(handler: WebhookEventHandler): this;

	// Process webhook payload
	processWebhook(rawPayload: string, signature: string): Promise<void>;

	// Remove handler
	off(event: CodegenEventType, handler: WebhookEventHandler): this;

	// Remove all handlers
	removeAllListeners(event?: CodegenEventType): this;
}
```

### Utility Functions

```typescript
// Status checks
isTerminalStatus(status: AgentStatus): boolean;
isActiveStatus(status: AgentStatus): boolean;

// Formatting
getStatusLabel(status: AgentStatus): string;
getEventLabel(event: CodegenEventType): string;
formatDuration(ms: number): string;
formatRelativeTime(date: Date): string;

// Async utilities
sleep(ms: number): Promise<void>;
debounce<T>(func: T, wait: number): T;
throttle<T>(func: T, wait: number): T;
```

## Type Guards

Type guards are provided for narrowing webhook event data types:

```typescript
if (isAgentCompletedData(payload.data)) {
	// payload.data is now typed as AgentCompletedData
	console.log(payload.data.result);
}

if (isToolUsedData(payload.data)) {
	// payload.data is now typed as ToolUsedData
	console.log(payload.data.toolName);
}
```

## Error Handling

The library provides custom error classes:

```typescript
try {
	await client.invokeAgent(request);
} catch (error) {
	if (error instanceof CodegenApiError) {
		console.error("API Error:", error.code, error.message);
		console.error("Status Code:", error.statusCode);
		console.error("Details:", error.details);
	}
}
```

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## License

MIT

## Contributing

Contributions are welcome! Please read the [contributing guidelines](../../CONTRIBUTING.md) first.
