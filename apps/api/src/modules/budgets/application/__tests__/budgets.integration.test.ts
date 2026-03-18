/**
 * Integration tests — Budgets module
 *
 * Tests the complete HTTP flow using Fastify's inject() method.
 * Each test starts with a clean DB (truncated by setup.ts beforeEach).
 *
 * Requires: Docker postgres + redis running
 * Run: pnpm --filter @mintlens/api test:integration
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../../../../app.js'
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
    email: 'budget-test@mintlens.io',
    password: 'Secret1234!',
    firstName: 'Budget',
    lastName: 'Tester',
    organisationName: 'Budget Corp',
}

/** Signs up, creates a project, returns { accessToken, projectId } */
async function setupUserAndProject() {
    const csrf = await getCsrf(app)
    const signupRes = await app.inject({
        method: 'POST',
        url: '/v1/auth/signup',
        headers: { cookie: csrf.cookie, 'x-csrf-token': csrf.token },
        payload: SIGNUP_PAYLOAD,
    })
    const accessToken = extractAccessToken(signupRes.headers['set-cookie']!)

    const csrf2 = await getCsrf(app)
    const projectRes = await app.inject({
        method: 'POST',
        url: '/v1/projects',
        headers: authHeaders(accessToken, csrf2),
        payload: { name: 'Test Project', environment: 'production' },
    })
    const projectId = projectRes.json<{ data: { id: string } }>().data.id
    return { accessToken, projectId }
}

const BASE_BUDGET = {
    name:       'Monthly OpenAI budget',
    scope:      'project' as const,
    limitMicro: 50_000_000, // $50
    period:     'monthly'  as const,
}

// ─── POST /v1/budgets ────────────────────────────────────────────────────────

describe('POST /v1/budgets', () => {
    it('creates a budget and returns 201 with the new budget', async () => {
        const { accessToken, projectId } = await setupUserAndProject()

        const csrf = await getCsrf(app)
        const res = await app.inject({
            method:  'POST',
            url:     '/v1/budgets',
            headers: authHeaders(accessToken, csrf),
            payload: { ...BASE_BUDGET, projectId },
        })

        expect(res.statusCode).toBe(201)
        const body = res.json<{ data: Record<string, unknown> }>()
        expect(body.data.name).toBe(BASE_BUDGET.name)
        expect(body.data.limitMicro).toBe(BASE_BUDGET.limitMicro)
        expect(body.data.period).toBe(BASE_BUDGET.period)
        expect(body.data.isActive).toBe(true)
        expect(typeof body.data.id).toBe('string')
    })

    it('returns 404 when projectId does not belong to the organisation', async () => {
        const { accessToken } = await setupUserAndProject()

        const csrf = await getCsrf(app)
        const res = await app.inject({
            method:  'POST',
            url:     '/v1/budgets',
            headers: authHeaders(accessToken, csrf),
            payload: {
                ...BASE_BUDGET,
                projectId: '00000000-0000-0000-0000-000000000000', // unknown
            },
        })

        expect(res.statusCode).toBe(404)
    })

    it('returns 400 when required fields are missing', async () => {
        const { accessToken } = await setupUserAndProject()

        const csrf = await getCsrf(app)
        const res = await app.inject({
            method:  'POST',
            url:     '/v1/budgets',
            headers: authHeaders(accessToken, csrf),
            payload: { name: 'Incomplete budget' }, // missing projectId, scope, limitMicro, period
        })

        expect(res.statusCode).toBe(400)
    })

    it('returns 401 without authentication', async () => {
        const csrf = await getCsrf(app)
        const res = await app.inject({
            method:  'POST',
            url:     '/v1/budgets',
            headers: { cookie: csrf.cookie, 'x-csrf-token': csrf.token },
            payload: { ...BASE_BUDGET, projectId: '00000000-0000-0000-0000-000000000000' },
        })

        expect(res.statusCode).toBe(401)
    })
})

// ─── GET /v1/budgets ─────────────────────────────────────────────────────────

describe('GET /v1/budgets', () => {
    it('returns the list of active budgets for a project', async () => {
        const { accessToken, projectId } = await setupUserAndProject()

        // Create two budgets
        const csrf1 = await getCsrf(app)
        await app.inject({
            method:  'POST',
            url:     '/v1/budgets',
            headers: authHeaders(accessToken, csrf1),
            payload: { ...BASE_BUDGET, projectId, name: 'Budget A' },
        })
        const csrf2 = await getCsrf(app)
        await app.inject({
            method:  'POST',
            url:     '/v1/budgets',
            headers: authHeaders(accessToken, csrf2),
            payload: { ...BASE_BUDGET, projectId, name: 'Budget B', period: 'daily' },
        })

        const csrf3 = await getCsrf(app)
        const res = await app.inject({
            method:  'GET',
            url:     `/v1/budgets?projectId=${projectId}`,
            headers: authGetHeaders(accessToken, csrf3),
        })

        expect(res.statusCode).toBe(200)
        const body = res.json<{ data: Array<{ name: string; spentMicro: number }> }>()
        expect(body.data).toHaveLength(2)
        // All budgets start with zero spend (no events ingested)
        expect(body.data.every((b) => b.currentMicro === 0)).toBe(true)
        const names = body.data.map((b) => b.name)
        expect(names).toContain('Budget A')
        expect(names).toContain('Budget B')
    })

    it('returns an empty array when the project has no budgets', async () => {
        const { accessToken, projectId } = await setupUserAndProject()

        const csrf = await getCsrf(app)
        const res = await app.inject({
            method:  'GET',
            url:     `/v1/budgets?projectId=${projectId}`,
            headers: authGetHeaders(accessToken, csrf),
        })

        expect(res.statusCode).toBe(200)
        expect(res.json<{ data: unknown[] }>().data).toHaveLength(0)
    })

    it('returns 404 when projectId does not belong to the organisation', async () => {
        const { accessToken } = await setupUserAndProject()

        const csrf = await getCsrf(app)
        const res = await app.inject({
            method:  'GET',
            url:     '/v1/budgets?projectId=00000000-0000-0000-0000-000000000000',
            headers: authGetHeaders(accessToken, csrf),
        })

        expect(res.statusCode).toBe(404)
    })

    it('returns 401 without authentication', async () => {
        const res = await app.inject({
            method: 'GET',
            url:    '/v1/budgets?projectId=00000000-0000-0000-0000-000000000000',
        })

        expect(res.statusCode).toBe(401)
    })
})

// ─── DELETE /v1/budgets/:budgetId ────────────────────────────────────────────

describe('DELETE /v1/budgets/:budgetId', () => {
    it('soft-deletes a budget (isActive becomes false) and returns 204', async () => {
        const { accessToken, projectId } = await setupUserAndProject()

        // Create
        const csrf1 = await getCsrf(app)
        const createRes = await app.inject({
            method:  'POST',
            url:     '/v1/budgets',
            headers: authHeaders(accessToken, csrf1),
            payload: { ...BASE_BUDGET, projectId },
        })
        const budgetId = createRes.json<{ data: { id: string } }>().data.id

        // Delete
        const csrf2 = await getCsrf(app)
        const deleteRes = await app.inject({
            method:  'DELETE',
            url:     `/v1/budgets/${budgetId}`,
            headers: authHeaders(accessToken, csrf2),
        })
        expect(deleteRes.statusCode).toBe(204)

        // Verify it no longer appears in the list (isActive = false)
        const csrf3 = await getCsrf(app)
        const listRes = await app.inject({
            method:  'GET',
            url:     `/v1/budgets?projectId=${projectId}`,
            headers: authGetHeaders(accessToken, csrf3),
        })
        expect(listRes.json<{ data: unknown[] }>().data).toHaveLength(0)
    })

    it('returns 404 for an unknown budget id', async () => {
        const { accessToken } = await setupUserAndProject()

        const csrf = await getCsrf(app)
        const res = await app.inject({
            method:  'DELETE',
            url:     '/v1/budgets/00000000-0000-0000-0000-000000000000',
            headers: authHeaders(accessToken, csrf),
        })

        expect(res.statusCode).toBe(404)
    })

    it('returns 401 without authentication', async () => {
        // Send CSRF token but no access_token — auth should fail
        const csrf = await getCsrf(app)
        const res = await app.inject({
            method: 'DELETE',
            url:    '/v1/budgets/00000000-0000-0000-0000-000000000000',
            headers: { cookie: csrf.cookie, 'x-csrf-token': csrf.token },
        })

        expect(res.statusCode).toBe(401)
    })
})
