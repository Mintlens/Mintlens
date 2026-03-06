/**
 * Integration tests — Auth flow
 *
 * Tests the complete HTTP flow using Fastify's inject() method:
 * signup → login → generate API key
 *
 * Requires: Docker postgres + redis running
 * Run: pnpm --filter @mintlens/api test:integration
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../../../../app.js'

let app: FastifyInstance

beforeAll(async () => {
    app = await buildApp()
})

afterAll(async () => {
    await app.close()
})

// ─── Helpers ────────────────────────────────────────────────────────────────

const SIGNUP_PAYLOAD = {
    email: 'admin@mintlens-test.io',
    password: 'Secret1234!',
    firstName: 'Admin',
    lastName: 'Test',
    organisationName: 'Test Corp',
}

/** Returns the access_token cookie value from a set-cookie header */
function extractCookie(setCookieHeader: string | string[]): string {
    const header = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader
    const match = header?.match(/access_token=([^;]+)/)
    if (!match?.[1]) throw new Error('access_token cookie not found in response')
    return match[1]
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('POST /v1/auth/signup', () => {
    it('creates an organisation + user and sets an access_token cookie', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/v1/auth/signup',
            payload: SIGNUP_PAYLOAD,
        })

        expect(res.statusCode).toBe(201)

        const body = res.json<{ data: { expiresAt: string } }>()
        expect(body.data.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)

        const setCookie = res.headers['set-cookie']
        expect(setCookie).toBeDefined()
        expect(setCookie).toMatch(/access_token=/)
        expect(setCookie).toMatch(/HttpOnly/)
    })

    it('returns 409 if email already exists', async () => {
        // First signup
        await app.inject({ method: 'POST', url: '/v1/auth/signup', payload: SIGNUP_PAYLOAD })

        // Second signup with same email
        const res = await app.inject({ method: 'POST', url: '/v1/auth/signup', payload: SIGNUP_PAYLOAD })
        expect(res.statusCode).toBe(409)
        expect(res.json().error.code).toBe('CONFLICT')
    })

    it('returns 400 if required fields are missing', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/v1/auth/signup',
            payload: { email: 'incomplete@test.com' }, // missing fields
        })
        expect(res.statusCode).toBe(400)
    })
})

describe('POST /v1/auth/login', () => {
    it('logs in an existing user and sets access_token cookie', async () => {
        // Create user first
        await app.inject({ method: 'POST', url: '/v1/auth/signup', payload: SIGNUP_PAYLOAD })

        const res = await app.inject({
            method: 'POST',
            url: '/v1/auth/login',
            payload: { email: SIGNUP_PAYLOAD.email, password: SIGNUP_PAYLOAD.password },
        })

        expect(res.statusCode).toBe(200)
        expect(res.headers['set-cookie']).toMatch(/access_token=/)
    })

    it('returns 401 for wrong password', async () => {
        await app.inject({ method: 'POST', url: '/v1/auth/signup', payload: SIGNUP_PAYLOAD })

        const res = await app.inject({
            method: 'POST',
            url: '/v1/auth/login',
            payload: { email: SIGNUP_PAYLOAD.email, password: 'wrong-password' },
        })

        expect(res.statusCode).toBe(401)
    })

    it('returns 401 for unknown email', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/v1/auth/login',
            payload: { email: 'ghost@test.com', password: 'doesntmatter' },
        })
        expect(res.statusCode).toBe(401)
    })
})

describe('POST /v1/auth/api-keys', () => {
    it('generates an API key for an authenticated user with a project', async () => {
        // 1. Signup
        const signupRes = await app.inject({
            method: 'POST', url: '/v1/auth/signup', payload: SIGNUP_PAYLOAD,
        })
        const accessToken = extractCookie(signupRes.headers['set-cookie']!)

        // 2. Create a project
        const projectRes = await app.inject({
            method: 'POST',
            url: '/v1/projects',
            headers: { cookie: `access_token=${accessToken}` },
            payload: { name: 'My Test App', environment: 'production' },
        })
        expect(projectRes.statusCode).toBe(201)
        const projectId = projectRes.json<{ data: { id: string } }>().data.id

        // 3. Generate API key
        const keyRes = await app.inject({
            method: 'POST',
            url: '/v1/auth/api-keys',
            headers: { cookie: `access_token=${accessToken}` },
            payload: { projectId, name: 'My SDK Key' },
        })

        expect(keyRes.statusCode).toBe(201)
        const keyBody = keyRes.json<{ data: { rawKey: string; keyPrefix: string; keyId: string } }>()
        expect(keyBody.data.rawKey).toMatch(/^sk_live_/)
        expect(keyBody.data.keyPrefix).toHaveLength(16)
        expect(keyBody.data.keyId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        )
    })

    it('returns 401 without authentication', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/v1/auth/api-keys',
            payload: { projectId: 'some-uuid', name: 'Key' },
        })
        expect(res.statusCode).toBe(401)
    })
})
