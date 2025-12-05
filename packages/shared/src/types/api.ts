/**
 * Standardized API response and error types.
 * All API endpoints return one of these shapes.
 */

export interface ApiSuccess<T> {
  data: T
  meta?: {
    page?: number
    perPage?: number
    total?: number
    hasMore?: boolean
  }
}

export interface ApiError {
  error: {
    code: string
    message: string
    field?: string
    details?: Record<string, unknown>
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

/** Pagination query parameters */
export interface PaginationParams {
  page?: number
  perPage?: number
}

/** Date range filter */
export interface DateRangeParams {
  from: string // ISO 8601
  to: string   // ISO 8601
}

/** Standard API error codes */
export const ApiErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  BUDGET_EXCEEDED: 'BUDGET_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode]
