/**
 * Shared pagination utility to avoid repeated pagination logic
 * across services and ensure consistent bounds checking.
 */

export interface PaginationParams {
  page?: number | string;
  limit?: number | string;
}

export interface PaginationResult {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

/**
 * Builds safe pagination parameters with bounded limits.
 * @param params - Raw page/limit values (may be strings from query params)
 * @param defaultLimit - Default items per page (default: 20)
 * @param maxLimit - Maximum allowed items per page (default: 100)
 */
export function buildPagination(
  params: PaginationParams,
  defaultLimit = 20,
  maxLimit = 100
): PaginationResult {
  const page = Math.max(1, parseInt(String(params.page)) || 1);
  const limit = Math.min(Math.max(1, parseInt(String(params.limit)) || defaultLimit), maxLimit);
  return {
    skip: (page - 1) * limit,
    take: limit,
    page,
    limit,
  };
}
