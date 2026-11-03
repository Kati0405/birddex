interface ApiErrorLike {
  status?: number;
  code?: string | null;
}

// OpenAI error messages can echo key fragments, so users only ever see these.
export function toRobinErrorMessage(e: unknown): string {
  const { status, code } = (e ?? {}) as ApiErrorLike;
  if (code === 'insufficient_quota') return 'Robin is resting right now. Please try again later.';
  if (status === 429) return 'Robin is busy. Please try again in a minute.';
  return 'Robin could not answer right now. Please try again.';
}
