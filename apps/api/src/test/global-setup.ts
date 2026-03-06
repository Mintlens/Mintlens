/**
 * Global setup — runs ONCE before all integration tests (in a separate process).
 * Sets required environment variables for tests.
 */
export async function setup() {
    // Minimal env for tests — real values come from .env.local via dotenv in app
    process.env['NODE_ENV'] ??= 'test'
    process.env['JWT_SECRET'] ??= 'integration-test-secret-do-not-use-in-prod'
    process.env['DATABASE_URL'] ??= 'postgresql://mintlens:changeme@localhost:5432/mintlens_dev'
    process.env['REDIS_URL'] ??= 'redis://:changeme@localhost:6379'
}
