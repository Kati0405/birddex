export function getErrorMessage(e: unknown, fallback = 'Unknown error') {
  return e instanceof Error ? e.message : fallback;
}
