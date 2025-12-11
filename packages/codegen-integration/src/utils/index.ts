/**
 * Utility functions for Codegen integration
 */
import type { AgentStatus, CodegenEventType } from "../types/codegen.js";

/**
 * Check if an agent status is terminal (won't change anymore)
 */
export function isTerminalStatus(status: AgentStatus): boolean {
	return (
		status === "completed" || status === "failed" || status === "cancelled"
	);
}

/**
 * Check if an agent status is active (still running or processing)
 */
export function isActiveStatus(status: AgentStatus): boolean {
	return status === "running" || status === "idle";
}

/**
 * Get a human-readable label for an agent status
 */
export function getStatusLabel(status: AgentStatus): string {
	const labels: Record<AgentStatus, string> = {
		idle: "Idle",
		running: "Running",
		completed: "Completed",
		failed: "Failed",
		cancelled: "Cancelled",
	};
	return labels[status];
}

/**
 * Get a human-readable label for a Codegen event type
 */
export function getEventLabel(event: CodegenEventType): string {
	const labels: Record<CodegenEventType, string> = {
		"agent.started": "Agent Started",
		"agent.completed": "Agent Completed",
		"agent.failed": "Agent Failed",
		"agent.cancelled": "Agent Cancelled",
		"agent.progress": "Agent Progress",
		"tool.used": "Tool Used",
		"file.created": "File Created",
		"file.updated": "File Updated",
		"file.deleted": "File Deleted",
	};
	return labels[event];
}

/**
 * Format a duration in milliseconds to a human-readable string
 */
export function formatDuration(ms: number): string {
	if (ms < 1000) {
		return `${ms}ms`;
	}

	const seconds = Math.floor(ms / 1000);
	if (seconds < 60) {
		return `${seconds}s`;
	}

	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;

	if (minutes < 60) {
		return remainingSeconds > 0
			? `${minutes}m ${remainingSeconds}s`
			: `${minutes}m`;
	}

	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;

	return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * Format a timestamp to a relative time string (e.g., "2 minutes ago")
 */
export function formatRelativeTime(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffSeconds = Math.floor(diffMs / 1000);

	if (diffSeconds < 60) {
		return "just now";
	}

	const diffMinutes = Math.floor(diffSeconds / 60);
	if (diffMinutes < 60) {
		return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
	}

	const diffHours = Math.floor(diffMinutes / 60);
	if (diffHours < 24) {
		return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
	}

	const diffDays = Math.floor(diffHours / 24);
	return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
}

/**
 * Create a retry delay with exponential backoff
 */
export function calculateRetryDelay(
	attempt: number,
	baseDelay = 1000,
	maxDelay = 30000,
): number {
	const delay = baseDelay * 2 ** (attempt - 1);
	return Math.min(delay, maxDelay);
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a debounced version of a function
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
	func: T,
	wait: number,
): (...args: Parameters<T>) => void {
	let timeoutId: NodeJS.Timeout | null = null;

	return function debounced(...args: Parameters<T>): void {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
		}

		timeoutId = setTimeout(() => {
			func(...args);
			timeoutId = null;
		}, wait);
	};
}

/**
 * Create a throttled version of a function
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
	func: T,
	wait: number,
): (...args: Parameters<T>) => void {
	let lastCall = 0;

	return function throttled(...args: Parameters<T>): void {
		const now = Date.now();

		if (now - lastCall >= wait) {
			lastCall = now;
			func(...args);
		}
	};
}
