import { ApiErrorCode } from '@mintlens/shared'

/**
 * Base application error — all domain errors extend this.
 * Operational errors are expected and handled gracefully.
 * Non-operational errors are bugs and trigger a 500 + log.error.
 */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly isOperational: boolean = true,
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(ApiErrorCode.VALIDATION_ERROR, message, 400)
  }
}

export class AuthError extends AppError {
  constructor(message = 'Unauthorized') {
    super(ApiErrorCode.AUTH_REQUIRED, message, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(ApiErrorCode.FORBIDDEN, message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const msg = id ? `${resource} '${id}' not found` : `${resource} not found`
    super(ApiErrorCode.NOT_FOUND, msg, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(ApiErrorCode.CONFLICT, message, 409)
  }
}

export class BudgetExceededError extends AppError {
  constructor(
    public readonly budgetId: string,
    public readonly projectId: string,
    public readonly tenantId?: string,
  ) {
    super(ApiErrorCode.BUDGET_EXCEEDED, 'Budget limit reached. Request blocked by Mintlens kill-switch.', 429)
  }
}
