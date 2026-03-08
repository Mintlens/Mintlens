import { z } from 'zod'

export const signupBody = z.object({
  email:            z.string().email(),
  password:         z.string().min(8),
  firstName:        z.string().min(1).max(64),
  lastName:         z.string().min(1).max(64),
  organisationName: z.string().min(2).max(100),
})

export const loginBody = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

export const generateApiKeyBody = z.object({
  projectId: z.string().uuid(),
  name:      z.string().min(1).max(100),
  scopes:    z.array(z.enum(['ingest', 'read'])).optional(),
  expiresAt: z.string().datetime().optional().transform((v) => (v ? new Date(v) : undefined)),
})

export type SignupBody         = z.infer<typeof signupBody>
export type LoginBody          = z.infer<typeof loginBody>
export type GenerateApiKeyBody = z.infer<typeof generateApiKeyBody>
