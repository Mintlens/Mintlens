import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ZodSchema } from 'zod'
import { ValidationError } from '../errors/app-errors.js'

export function validateQuery<T>(schema: ZodSchema<T>) {
  return async (req: FastifyRequest, _reply: FastifyReply) => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      const first = result.error.errors[0]
      const field = first?.path.join('.')
      const message = first?.message ?? 'Validation failed'
      throw new ValidationError(`${field ? `${field}: ` : ''}${message}`, field)
    }
    req.query = result.data as typeof req.query
  }
}
