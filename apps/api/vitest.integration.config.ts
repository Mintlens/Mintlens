import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

/**
 * Integration test config — requires Docker (postgres + redis) to be running.
 *
 * Run with:
 *   docker compose -f docker/docker-compose.yml up -d
 *   pnpm --filter @mintlens/api test:integration
 */
export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        environment: 'node',
        include: ['src/**/__tests__/**/*.integration.test.ts'],
        globalSetup: './src/test/global-setup.ts',
        setupFiles: ['./src/test/setup.ts'],
        // Run integration tests sequentially — they share a real DB
        pool: 'forks',
        poolOptions: { forks: { singleFork: true } },
        testTimeout: 30_000,
    },
})
