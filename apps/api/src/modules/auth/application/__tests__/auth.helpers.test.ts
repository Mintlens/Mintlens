import { describe, it, expect } from 'vitest'
import { issueTokens, verifyToken, slugify } from '../auth.helpers.js'

describe('issueTokens + verifyToken', () => {
  it('issues a verifiable JWT', () => {
    const tokens = issueTokens('user-123', 'org-456', 'owner')
    expect(tokens.accessToken).toBeTruthy()
    expect(tokens.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)

    const payload = verifyToken(tokens.accessToken)
    expect(payload.sub).toBe('user-123')
    expect(payload.org).toBe('org-456')
    expect(payload.role).toBe('owner')
  })

  it('throws on tampered token', () => {
    const tokens = issueTokens('user-1', 'org-1', 'member')
    const tampered = tokens.accessToken.slice(0, -4) + 'XXXX'
    expect(() => verifyToken(tampered)).toThrow()
  })
})

describe('slugify', () => {
  it('converts org names to safe slugs', () => {
    expect(slugify('Acme Corp')).toBe('acme-corp')
    expect(slugify('Hello World 123!')).toBe('hello-world-123')
    expect(slugify('--Leading--')).toBe('leading')
  })
})
