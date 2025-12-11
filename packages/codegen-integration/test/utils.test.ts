/**
 * Tests for utility functions
 */
import { describe, expect, it, vi } from "vitest";
import {
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
} from "../src/utils/index.js";

describe("Utility Functions", () => {
	describe("isTerminalStatus", () => {
		it("should return true for terminal statuses", () => {
			expect(isTerminalStatus("completed")).toBe(true);
			expect(isTerminalStatus("failed")).toBe(true);
			expect(isTerminalStatus("cancelled")).toBe(true);
		});

		it("should return false for non-terminal statuses", () => {
			expect(isTerminalStatus("idle")).toBe(false);
			expect(isTerminalStatus("running")).toBe(false);
		});
	});

	describe("isActiveStatus", () => {
		it("should return true for active statuses", () => {
			expect(isActiveStatus("running")).toBe(true);
			expect(isActiveStatus("idle")).toBe(true);
		});

		it("should return false for terminal statuses", () => {
			expect(isActiveStatus("completed")).toBe(false);
			expect(isActiveStatus("failed")).toBe(false);
			expect(isActiveStatus("cancelled")).toBe(false);
		});
	});

	describe("getStatusLabel", () => {
		it("should return correct labels for all statuses", () => {
			expect(getStatusLabel("idle")).toBe("Idle");
			expect(getStatusLabel("running")).toBe("Running");
			expect(getStatusLabel("completed")).toBe("Completed");
			expect(getStatusLabel("failed")).toBe("Failed");
			expect(getStatusLabel("cancelled")).toBe("Cancelled");
		});
	});

	describe("getEventLabel", () => {
		it("should return correct labels for all event types", () => {
			expect(getEventLabel("agent.started")).toBe("Agent Started");
			expect(getEventLabel("agent.completed")).toBe("Agent Completed");
			expect(getEventLabel("tool.used")).toBe("Tool Used");
			expect(getEventLabel("file.created")).toBe("File Created");
		});
	});

	describe("formatDuration", () => {
		it("should format milliseconds correctly", () => {
			expect(formatDuration(500)).toBe("500ms");
		});

		it("should format seconds correctly", () => {
			expect(formatDuration(5000)).toBe("5s");
			expect(formatDuration(45000)).toBe("45s");
		});

		it("should format minutes correctly", () => {
			expect(formatDuration(60000)).toBe("1m");
			expect(formatDuration(90000)).toBe("1m 30s");
			expect(formatDuration(120000)).toBe("2m");
		});

		it("should format hours correctly", () => {
			expect(formatDuration(3600000)).toBe("1h");
			expect(formatDuration(5400000)).toBe("1h 30m");
			expect(formatDuration(7200000)).toBe("2h");
		});
	});

	describe("formatRelativeTime", () => {
		it("should format recent times as 'just now'", () => {
			const now = new Date();
			expect(formatRelativeTime(now)).toBe("just now");
		});

		it("should format minutes correctly", () => {
			const date = new Date(Date.now() - 5 * 60 * 1000);
			expect(formatRelativeTime(date)).toBe("5 minutes ago");
		});

		it("should format hours correctly", () => {
			const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
			expect(formatRelativeTime(date)).toBe("3 hours ago");
		});

		it("should format days correctly", () => {
			const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
			expect(formatRelativeTime(date)).toBe("2 days ago");
		});
	});

	describe("calculateRetryDelay", () => {
		it("should calculate exponential backoff", () => {
			expect(calculateRetryDelay(1, 1000)).toBe(1000);
			expect(calculateRetryDelay(2, 1000)).toBe(2000);
			expect(calculateRetryDelay(3, 1000)).toBe(4000);
			expect(calculateRetryDelay(4, 1000)).toBe(8000);
		});

		it("should respect maximum delay", () => {
			expect(calculateRetryDelay(10, 1000, 10000)).toBe(10000);
		});
	});

	describe("sleep", () => {
		it("should resolve after specified delay", async () => {
			const start = Date.now();
			await sleep(100);
			const end = Date.now();
			expect(end - start).toBeGreaterThanOrEqual(90);
		});
	});

	describe("debounce", () => {
		it("should debounce function calls", async () => {
			const mockFn = vi.fn();
			const debounced = debounce(mockFn, 100);

			debounced();
			debounced();
			debounced();

			expect(mockFn).not.toHaveBeenCalled();

			await sleep(150);

			expect(mockFn).toHaveBeenCalledTimes(1);
		});
	});

	describe("throttle", () => {
		it("should throttle function calls", async () => {
			const mockFn = vi.fn();
			const throttled = throttle(mockFn, 100);

			throttled();
			throttled();
			throttled();

			expect(mockFn).toHaveBeenCalledTimes(1);

			await sleep(150);

			throttled();
			expect(mockFn).toHaveBeenCalledTimes(2);
		});
	});
});
