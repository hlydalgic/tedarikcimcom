/**
 * Safe client-facing error message. Details stay in server logs.
 */
export function getClientErrorMessage(
  fallback: string,
  devDetail?: string
): string {
  if (process.env.NODE_ENV === "development" && devDetail) {
    return devDetail;
  }
  return fallback;
}

export function logServerError(context: string, error: unknown): void {
  console.error(`[${context}]`, error);
}
