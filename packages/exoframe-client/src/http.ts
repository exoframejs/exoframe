export const getStatusCode = (error: { response?: { statusCode?: number } } | null | undefined): number | undefined =>
  error?.response?.statusCode;
