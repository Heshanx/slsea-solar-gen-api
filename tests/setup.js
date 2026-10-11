import { vi } from "vitest";
import { testAssignments, configureTestOidc } from "./helpers/auth-test-support.js";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  "postgresql://postgres:postgres@127.0.0.1:5432/test_db";
process.env.CORS_ORIGIN = "*";
process.env.API_VERSION = "v1";

await configureTestOidc();

vi.mock("../src/repositories/auth-principal.repository.js", () => ({
 findActiveAssignment: vi.fn(async (issuer, subject) => testAssignments.get(`${issuer}|${subject}`) || null)
}));
