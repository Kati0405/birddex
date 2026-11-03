import { describe, expect, it, vi, beforeEach } from 'vitest';

const { getUser, getUserRole } = vi.hoisted(() => ({
  getUser: vi.fn(),
  getUserRole: vi.fn(),
}));
vi.mock('@/features/auth/auth-helpers', () => ({ getUser, getUserRole }));

const { consumeRobinQuota } = vi.hoisted(() => ({ consumeRobinQuota: vi.fn() }));
vi.mock('@/features/bird-guide/robin-usage-queries', () => ({ consumeRobinQuota }));

vi.mock('@/features/bird-guide/bird-guide-context', () => ({
  buildUserContext: vi.fn().mockResolvedValue({
    observedCount: 0,
    collectedCount: 0,
    totalBirdsInCatalog: 0,
    observations: [],
  }),
}));

const { executeToolCall } = vi.hoisted(() => ({
  executeToolCall: vi.fn().mockResolvedValue('{"ok":true}'),
}));
vi.mock('@/features/bird-guide/robin-tools', () => ({ ROBIN_TOOLS: [], executeToolCall }));

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('openai', () => ({
  default: class {
    chat = { completions: { create } };
  },
}));

import { chatAction } from './chat-action';
import { ROBIN_DAILY_LIMIT, ROBIN_GLOBAL_DAILY_LIMIT, MAX_COMPLETION_TOKENS } from '@/features/bird-guide/robin-limits';

const input = { messages: [{ role: 'user' as const, content: 'Hi Robin' }] };

async function* chunks(...deltas: object[]) {
  for (const delta of deltas) yield { choices: [{ delta }] };
}

async function readAll(stream: ReadableStream<string>) {
  const reader = stream.getReader();
  let out = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) return out;
    out += value;
  }
}

describe('chatAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
    getUser.mockResolvedValue({ id: 'user-1' });
    getUserRole.mockResolvedValue('user');
    consumeRobinQuota.mockResolvedValue('ok');
    create.mockResolvedValue(chunks({ content: 'Hello!' }));
  });

  it('rejects anonymous users without touching quota or OpenAI', async () => {
    getUser.mockResolvedValue(null);

    const result = await chatAction(input);

    expect(result).toEqual({ error: 'Sign in to chat with Robin.' });
    expect(consumeRobinQuota).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('returns a limit error and skips OpenAI when the user quota is exhausted', async () => {
    consumeRobinQuota.mockResolvedValue('user_limit');

    const result = await chatAction(input);

    expect(result).toEqual({ error: 'Daily limit reached. Come back tomorrow.' });
    expect(create).not.toHaveBeenCalled();
  });

  it('returns a distinct error and skips OpenAI when the global quota is exhausted', async () => {
    consumeRobinQuota.mockResolvedValue('global_limit');

    const result = await chatAction(input);

    expect(result).toEqual({ error: 'Robin is out of energy for today. Please try again tomorrow.' });
    expect(create).not.toHaveBeenCalled();
  });

  it('consumes the quota once and streams the answer for a signed-in user', async () => {
    const result = await chatAction(input);

    expect(consumeRobinQuota).toHaveBeenCalledTimes(1);
    expect(consumeRobinQuota).toHaveBeenCalledWith(ROBIN_DAILY_LIMIT, ROBIN_GLOBAL_DAILY_LIMIT);
    expect('error' in result).toBe(false);
    expect(await readAll(result as ReadableStream<string>)).toBe('Hello!');
  });

  it('does not consume quota for admins', async () => {
    getUserRole.mockResolvedValue('admin');

    const result = await chatAction(input);

    expect(consumeRobinQuota).not.toHaveBeenCalled();
    expect('error' in result).toBe(false);
  });

  it('returns an error when the quota check itself fails', async () => {
    consumeRobinQuota.mockRejectedValue(new Error('db down'));

    const result = await chatAction(input);

    expect(result).toEqual({ error: 'Could not start chat. Please try again.' });
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects histories longer than the allowed window', async () => {
    const messages = Array.from({ length: 11 }, () => ({ role: 'user' as const, content: 'x' }));

    const result = await chatAction({ messages });

    expect('error' in result).toBe(true);
    expect(consumeRobinQuota).not.toHaveBeenCalled();
  });

  it('survives malformed tool-call arguments and reports them to the model', async () => {
    create
      .mockResolvedValueOnce(
        chunks({ tool_calls: [{ index: 0, id: 'call-1', function: { name: 'search_birds', arguments: '{bad json' } }] }),
      )
      .mockResolvedValueOnce(chunks({ content: 'Sorry, retrying.' }));

    const result = await chatAction(input);

    expect(await readAll(result as ReadableStream<string>)).toBe('Sorry, retrying.');
    expect(executeToolCall).not.toHaveBeenCalled();
    const secondCallMessages = create.mock.calls[1][0].messages;
    expect(secondCallMessages.at(-1)).toMatchObject({
      role: 'tool',
      content: JSON.stringify({ error: 'Invalid tool arguments' }),
    });
  });

  it('maps exhausted OpenAI credits to a friendly error without leaking details', async () => {
    create.mockRejectedValue(
      Object.assign(new Error('You exceeded your current quota, sk-...abcd'), {
        status: 429,
        code: 'insufficient_quota',
      }),
    );

    const result = await chatAction(input);

    expect(result).toEqual({ error: 'Robin is resting right now. Please try again later.' });
  });

  it('maps OpenAI rate limiting to a retry-later error', async () => {
    create.mockRejectedValue(Object.assign(new Error('rate limited'), { status: 429, code: 'rate_limit_exceeded' }));

    const result = await chatAction(input);

    expect(result).toEqual({ error: 'Robin is busy. Please try again in a minute.' });
  });

  it('uses a generic error for any other OpenAI failure', async () => {
    create.mockRejectedValue(Object.assign(new Error('Incorrect API key sk-...abcd'), { status: 401 }));

    const result = await chatAction(input);

    expect(result).toEqual({ error: 'Robin could not answer right now. Please try again.' });
  });

  it('errors the stream with a safe message when a later round fails', async () => {
    create
      .mockResolvedValueOnce(
        chunks({ tool_calls: [{ index: 0, id: 'call-1', function: { name: 'search_birds', arguments: '{}' } }] }),
      )
      .mockRejectedValueOnce(new Error('Incorrect API key sk-...abcd'));

    const result = await chatAction(input);

    await expect(readAll(result as ReadableStream<string>)).rejects.toThrow(
      'Robin could not answer right now. Please try again.',
    );
  });

  it('asks the model for minimal reasoning and a bounded completion', async () => {
    await chatAction(input);

    expect(create.mock.calls[0][0]).toMatchObject({
      model: 'gpt-5-nano',
      reasoning_effort: 'minimal',
      max_completion_tokens: MAX_COMPLETION_TOKENS,
    });
  });

  it('streams a fallback message instead of an empty answer', async () => {
    create.mockResolvedValue(chunks({}));

    const result = await chatAction(input);

    expect(await readAll(result as ReadableStream<string>)).toBe(
      'Robin lost his train of thought. Please try asking again.',
    );
  });
});
