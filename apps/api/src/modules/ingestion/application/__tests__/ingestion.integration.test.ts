/**
 * Integration tests — Ingestion flow
 *
 * Tests: signup → project → API key → POST /v1/events/llm-usage
 *
 * Requires: Docker postgres + redis running
 * Run: pnpm --filter @mintlens/api test:integration
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../../../../app.js'
import { extractAccessToken, getCsrf, authHeaders } from '../../../../test/helpers.js'

let app: FastifyInstance

beforeAll(async () => {
    app = await buildApp()
})

afterAll(async () => {
    await app.close()
})

// ─── Helpers ────────────────────────────────────────────────────────────────

const SIGNUP_PAYLOAD = {
    email: 'ingestion-test@mintlens-test.io',
    password: 'Secret1234!',
    firstName: 'Test',
    lastName: 'User',
    organisationName: 'Ingestion Test Corp',
}

async function setupUserAndApiKey(app: FastifyInstance): Promise<{ rawKey: string; projectId: string }> {
    // 1. Signup
    const csrf = await getCsrf(app)
    const signupRes = await app.inject({
        method: 'POST',
        url: '/v1/auth/signup',
        headers: { cookie: csrf.cookie, 'x-csrf-token': csrf.token },
        payload: SIGNUP_PAYLOAD,
    })
    expect(signupRes.statusCode).toBe(201)
    const accessToken = extractAccessToken(signupRes.headers['set-cookie']!)

    // 2. Create project
    const csrf2 = await getCsrf(app)
    const projectRes = await app.inject({
        method: 'POST',
        url: '/v1/projects',
        headers: authHeaders(accessToken, csrf2),
        payload: { name: 'Ingestion Test App', environment: 'production' },
    })
    expect(projectRes.statusCode).toBe(201)
    const projectId = projectRes.json<{ data: { id: string } }>().data.id

    // 3. Generate API key
    const csrf3 = await getCsrf(app)
    const keyRes = await app.inject({
        method: 'POST',
        url: '/v1/auth/api-keys',
        headers: authHeaders(accessToken, csrf3),
        payload: { projectId, name: 'Ingestion SDK Key' },
    })
    expect(keyRes.statusCode).toBe(201)
    const rawKey = keyRes.json<{ data: { rawKey: string } }>().data.rawKey

    return { rawKey, projectId }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('POST /v1/events/llm-usage', () => {
    it('accepts a batch of LLM events and returns 202', async () => {
        const { rawKey } = await setupUserAndApiKey(app)

        const res = await app.inject({
            method: 'POST',
            url: '/v1/events/llm-usage',
            headers: { authorization: `Bearer ${rawKey}` },
            payload: {
                events: [
                    {
                        provider: 'openai',
                        model: 'gpt-4o',
                        tokens_input: 1500,
                        tokens_output: 400,
                        feature_key: 'chat',
                        tenant_id: 'user-42',
                        latency_ms: 1200,
                    },
                ],
            },
        })

        expect(res.statusCode).toBe(202)
        const body = res.json<{ data: { accepted: number } }>()
        expect(body.data.accepted).toBe(1)
    })

    it('accepts a batch of multiple events', async () => {
        const { rawKey } = await setupUserAndApiKey(app)

        const events = Array.from({ length: 5 }, (_, i) => ({
            provider: 'anthropic' as const,
            model: 'claude-3-5-sonnet',
            tokens_input: 1000 + i * 100,
            tokens_output: 200 + i * 50,
            tenant_id: `user-${i}`,
            feature_key: 'summarization',
        }))

        const res = await app.inject({
            method: 'POST',
            url: '/v1/events/llm-usage',
            headers: { authorization: `Bearer ${rawKey}` },
            payload: { events },
        })

        expect(res.statusCode).toBe(202)
        expect(res.json<{ data: { accepted: number } }>().data.accepted).toBe(5)
    })

    it('returns 401 without an API key', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/v1/events/llm-usage',
            payload: {
                events: [{ provider: 'openai', model: 'gpt-4o', tokens_input: 100, tokens_output: 50 }],
            },
        })
        expect(res.statusCode).toBe(401)
    })

    it('returns 401 with an invalid API key', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/v1/events/llm-usage',
            headers: { authorization: 'Bearer sk_live_invalidkeyvalue' },
            payload: {
                events: [{ provider: 'openai', model: 'gpt-4o', tokens_input: 100, tokens_output: 50 }],
            },
        })
        expect(res.statusCode).toBe(401)
    })

    it('returns 400 with an empty events array', async () => {
        const { rawKey } = await setupUserAndApiKey(app)

        const res = await app.inject({
            method: 'POST',
            url: '/v1/events/llm-usage',
            headers: { authorization: `Bearer ${rawKey}` },
            payload: { events: [] },
        })
        expect(res.statusCode).toBe(400)
    })

    it('returns 400 with an invalid event payload', async () => {
        const { rawKey } = await setupUserAndApiKey(app)

        const res = await app.inject({
            method: 'POST',
            url: '/v1/events/llm-usage',
            headers: { authorization: `Bearer ${rawKey}` },
            payload: {
                events: [{ provider: 'unknown-provider', model: 'gpt-4o', tokens_input: 100, tokens_output: 50 }],
            },
        })
        expect(res.statusCode).toBe(400)
    })
})
