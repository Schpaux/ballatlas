// Shared TypeScript types for BallAtlas
// Zero runtime dependencies — pure type definitions only
//
// Domain types are in packages/golf-data/src/
// DB types are in packages/database/src/types.generated.ts
// This package holds utility/cross-cutting types only.

// Utility types
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type MaybePromise<T> = T | Promise<T>

// API response shape used by all Route Handlers
export type ApiResponse<T> = { data: T; error: null } | { data: null; error: string }

// Pagination
export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Sort direction
export type SortDirection = 'asc' | 'desc'

// Environment tiers
export type Environment = 'development' | 'preview' | 'production'
