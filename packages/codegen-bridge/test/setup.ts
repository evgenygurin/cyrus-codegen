import { beforeAll } from "vitest";

// Test environment setup
beforeAll(() => {
	// Set test environment variables
	process.env.CODEGEN_API_TOKEN = process.env.CODEGEN_API_TOKEN || "test-token";
	process.env.CODEGEN_ORG_ID = process.env.CODEGEN_ORG_ID || "12345";
});
