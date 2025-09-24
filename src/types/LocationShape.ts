export type LocationShape<T = unknown> = {
  params?: Record<string, T> | null | undefined;
  query?: Record<string, T> | null | undefined;
} | null;
