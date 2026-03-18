/**
 * Integration tests — Analytics flow
 *
 * Tests: signup → project → seed llm_requests directly → query analytics endpoints
 *
 * NOTE: Ingestion is async (BullMQ worker), so these tests insert llm_requests
 * directly via the DB rather than waiting for queue processing.
 *
 * Requires: Docker postgres + redis running
 * Run: pnpm --filter @mintlens/api test:integration
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../../../../app.js'
import { db } from '../../../../shared/infrastructure/db.js'
import { llmRequests, tenants } from '#schema'
import { extractAccessToken, getCsrf, authHeaders, authGetHeaders } from '../../../../test/helpers.js'

let app: FastifyInstance

beforeAll(async () => {
    app = await buildApp()
})

afterAll(async () => {
    await app.close()
})

// ─── Helpers ────────────────────────────────────────────────────────────────

const SIGNUP_PAYLOAD = {
    email: 'analytics-test@mintlens-test.io',
    password: 'Secret1234!',
    firstName: 'Analytics',
    lastName: 'User',
    organisationName: 'Analytics Test Corp',
}

async function setupProject(app: FastifyInstance): Promise<{ accessToken: string; projectId: string }> {
    const csrf = await getCsrf(app)
    const signupRes = await app.inject({
        method: 'POST',
        url: '/v1/auth/signup',
        headers: { cookie: csrf.cookie, 'x-csrf-token': csrf.token },
        payload: SIGNUP_PAYLOAD,
    })
    expect(signupRes.statusCode).toBe(201)
    const accessToken = extractAccessToken(signupRes.headers['set-cookie']!)

    const csrf2 = await getCsrf(app)
    const projectRes = await app.inject({
        method: 'POST',
        url: '/v1/projects',
        headers: authHeaders(accessToken, csrf2),
        payload: { name: 'Analytics Test App', environment: 'production' },
    })
    expect(projectRes.statusCode).toBe(201)
    const projectId = projectRes.json<{ data: { id: string } }>().data.id

    return { accessToken, projectId }
}

type LlmRequestSeed = {
    projectId: string
    costTotalMicro?: number
    tokensInput?: number
    tokensOutput?: number
    latencyMs?: number
}

/** Insert llm_requests rows directly to bypass the async BullMQ worker */
async function seedRequests(rows: LlmRequestSeed[]) {
    const values = rows.map((r) => ({
        projectId: r.projectId,
        provider: 'openai' as const,
        model: 'gpt-4o',
        tokensInput: r.tokensInput ?? 1000,
        tokensOutput: r.tokensOutput ?? 300,
        tokensTotal: (r.tokensInput ?? 1000) + (r.tokensOutput ?? 300),
        costProviderMicro: r.costTotalMicro ?? 21_000,
        costTotalMicro: r.costTotalMicro ?? 21_000,
        latencyMs: r.latencyMs ?? 1000,
        environment: 'production' as const,
    }))
    await db.insert(llmRequests).values(values)
}

const FROM = '2026-03-01T00:00:00.000Z'
const TO = '2026-04-01T00:00:00.000Z'

// ─── Summary tests ───────────────────────────────────────────────────────────

describe('GET /v1/analytics/summary', () => {
    it('returns aggregated KPIs for a project with data', async () => {
        const { accessToken, projectId } = await setupProject(app)
        const csrf = await getCsrf(app)

        await seedRequests([
            { projectId, costTotalMicro: 10_000, tokensInput: 500, tokensOutput: 100, latencyMs: 800 },
            { projectId, costTotalMicro: 20_000, tokensInput: 1000, tokensOutput: 300, latencyMs: 1200 },
        ])

        const res = await app.inject({
            method: 'GET',
            url: `/v1/analytics/summary?projectId=${projectId}&from=${FROM}&to=${TO}`,
            headers: authGetHeaders(accessToken, csrf),
        })

        expect(res.statusCode).toBe(200)
        const { data } = res.json<{
            data: {
                totalCostMicro: number
                totalCostUsd: number
                totalTokens: number
                totalRequests: number
                avgLatencyMs: number | null
            }
        }>()

        expect(data.totalRequests).toBe(2)
        expect(data.totalCostMicro).toBe(30_000)
        expect(data.totalCostUsd).toBeCloseTo(0.03, 5)
        expect(data.totalTokens).toBe(1900)
        expect(data.avgLatencyMs).toBe(1000)
    })

    it('returns zero totals for an empty project', async () => {
        const { accessToken, projectId } = await setupProject(app)
        const csrf = await getCsrf(app)

        const res = await app.inject({
            method: 'GET',
            url: `/v1/analytics/summary?projectId=${projectId}&from=${FROM}&to=${TO}`,
            headers: authGetHeaders(accessToken, csrf),
        })

        expect(res.statusCode).toBe(200)
        const { data } = res.json<{ data: { totalRequests: number; totalCostMicro: number } }>()
        expect(data.totalRequests).toBe(0)
        expect(data.totalCostMicro).toBe(0)
    })

    it('returns 401 without authentication', async () => {
        const { projectId } = await setupProject(app)

        const res = await app.inject({
            method: 'GET',
            url: `/v1/analytics/summary?projectId=${projectId}&from=${FROM}&to=${TO}`,
        })
        expect(res.statusCode).toBe(401)
    })
})

// ─── Cost explorer tests ─────────────────────────────────────────────────────

describe('GET /v1/analytics/cost-explorer', () => {
    it('returns time series and breakdowns with day granularity', async () => {
        const { accessToken, projectId } = await setupProject(app)
        const csrf = await getCsrf(app)

        await seedRequests([
            { projectId, costTotalMicro: 5_000 },
            { projectId, costTotalMicro: 8_000 },
        ])

        const res = await app.inject({
            method: 'GET',
            url: `/v1/analytics/cost-explorer?projectId=${projectId}&from=${FROM}&to=${TO}&granularity=day`,
            headers: authGetHeaders(accessToken, csrf),
        })

        expect(res.statusCode).toBe(200)
        const { data } = res.json<{
            data: {
                timeSeries: unknown[]
                byModel: unknown[]
                byFeature: unknown[]
                byProvider: unknown[]
            }
        }>()
        expect(Array.isArray(data.timeSeries)).toBe(true)
        expect(Array.isArray(data.byModel)).toBe(true)
        expect(Array.isArray(data.byFeature)).toBe(true)
        expect(Array.isArray(data.byProvider)).toBe(true)
        expect(data.timeSeries.length).toBeGreaterThan(0)
    })

    it('returns 400 for an invalid granularity value', async () => {
        const { accessToken, projectId } = await setupProject(app)
        const csrf = await getCsrf(app)

        const res = await app.inject({
            method: 'GET',
            url: `/v1/analytics/cost-explorer?projectId=${projectId}&from=${FROM}&to=${TO}&granularity=invalid`,
            headers: authGetHeaders(accessToken, csrf),
        })
        expect(res.statusCode).toBe(400)
    })
})

// ─── Tenants overview tests ──────────────────────────────────────────────────

describe('GET /v1/analytics/tenants', () => {
    it('returns per-tenant cost breakdown', async () => {
        const { accessToken, projectId } = await setupProject(app)
        const csrf = await getCsrf(app)

        // Create two tenants (the `tenants` table uses UUID PK, externalRef is the opaque ID)
        const [tenantA, tenantB] = await db
            .insert(tenants)
            .values([
                { projectId, externalRef: 'tenant-A' },
                { projectId, externalRef: 'tenant-B' },
            ])
            .returning()

        // Seed llm_requests linked to those tenants via UUID FK
        await db.insert(llmRequests).values([
            {
                projectId, tenantId: tenantA!.id,
                provider: 'openai', model: 'gpt-4o',
                tokensInput: 500, tokensOutput: 100, tokensTotal: 600,
                costProviderMicro: 10_000, costTotalMicro: 10_000,
                environment: 'production',
            },
            {
                projectId, tenantId: tenantA!.id,
                provider: 'openai', model: 'gpt-4o',
                tokensInput: 300, tokensOutput: 80, tokensTotal: 380,
                costProviderMicro: 5_000, costTotalMicro: 5_000,
                environment: 'production',
            },
            {
                projectId, tenantId: tenantB!.id,
                provider: 'openai', model: 'gpt-4o',
                tokensInput: 200, tokensOutput: 60, tokensTotal: 260,
                costProviderMicro: 3_000, costTotalMicro: 3_000,
                environment: 'production',
            },
        ])

        const res = await app.inject({
            method: 'GET',
            url: `/v1/analytics/tenants?projectId=${projectId}&from=${FROM}&to=${TO}`,
            headers: authGetHeaders(accessToken, csrf),
        })

        expect(res.statusCode).toBe(200)
        const tenantList = res.json<{
            data: { tenantId: string; externalRef: string; costMicro: number }[]
        }>().data

        expect(tenantList).toHaveLength(2)
        const a = tenantList.find((t) => t.externalRef === 'tenant-A')
        expect(a?.costMicro).toBe(15_000)
    })

    it('returns empty array for a project with no tenants', async () => {
        const { accessToken, projectId } = await setupProject(app)
        const csrf = await getCsrf(app)

        const res = await app.inject({
            method: 'GET',
            url: `/v1/analytics/tenants?projectId=${projectId}&from=${FROM}&to=${TO}`,
            headers: authGetHeaders(accessToken, csrf),
        })

        expect(res.statusCode).toBe(200)
        expect(res.json<{ data: unknown[] }>().data).toHaveLength(0)
    })
})
