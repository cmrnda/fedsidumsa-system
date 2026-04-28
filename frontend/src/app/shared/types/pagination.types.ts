export interface PaginationMeta {
  enabled: boolean;
  page: number;
  per_page: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination?: PaginationMeta;
}
