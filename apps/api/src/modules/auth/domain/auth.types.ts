/** Auth domain types — no framework dependencies. */

export interface SignupInput {
  email: string
  password: string
  firstName: string
  lastName: string
  organisationName: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface GenerateApiKeyInput {
  projectId: string
  name: string
  scopes?: string[]
  expiresAt?: Date
}

export interface AuthTokens {
  accessToken: string
  /** ISO8601 expiry string */
  expiresAt: string
}

export interface GeneratedApiKey {
  /** Raw key shown ONCE to the user — never stored */
  rawKey: string
  /** First 16 chars for UI display */
  keyPrefix: string
  keyId: string
}

export interface JwtPayload {
  sub: string        // userId
  org: string        // organisationId
  role: string       // 'owner' | 'admin' | 'member'
  iat: number
  exp: number
}
