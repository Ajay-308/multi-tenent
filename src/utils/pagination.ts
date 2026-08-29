export interface OffsetPaginationInput {
  page: number;
  limit: number;
}

export interface OffsetPaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export function toOffset({ page, limit }: OffsetPaginationInput): number {
  return (page - 1) * limit;
}

export function buildOffsetResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): OffsetPaginationResult<T> {
  return { data, total, page, limit };
}
