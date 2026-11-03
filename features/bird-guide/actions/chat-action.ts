'use server';

import { z } from 'zod';
import OpenAI from 'openai';
import { getUser, getUserRole } from '@/features/auth/auth-helpers';
import { buildUserContext } from '@/features/bird-guide/bird-guide-context';
import { buildSystemPrompt } from '@/features/bird-guide/bird-guide-prompt';
import { ROBIN_TOOLS, executeToolCall } from '@/features/bird-guide/robin-tools';
import { consumeRobinQuota } from '@/features/bird-guide/robin-usage-queries';
import {
  ROBIN_DAILY_LIMIT,
  ROBIN_GLOBAL_DAILY_LIMIT,
  MAX_HISTORY_MESSAGES,
  MAX_TOOL_ROUNDS,
  MAX_COMPLETION_TOKENS,
} from '@/features/bird-guide/robin-limits';
import type { ChatActionInput } from '@/features/bird-guide/bird-guide.types';
import { toRobinErrorMessage } from '@/features/bird-guide/robin-errors';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2000),
});

const ChatActionSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(MAX_HISTORY_MESSAGES),
});

function parseToolArgs(raw: string): Record<string, unknown> | null {
  try {
    const value = JSON.parse(raw || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

export async function chatAction(
  input: ChatActionInput,
): Promise<ReadableStream<string> | { error: string }> {
  if (!process.env.OPENAI_API_KEY) {
    return { error: 'Chat is not configured.' };
  }

  const parsed = ChatActionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') };
  }

  const { messages } = parsed.data;

  const user = await getUser();
  if (!user) return { error: 'Sign in to chat with Robin.' };

  try {
    if ((await getUserRole()) !== 'admin') {
      const quota = await consumeRobinQuota(ROBIN_DAILY_LIMIT, ROBIN_GLOBAL_DAILY_LIMIT);
      if (quota === 'user_limit') return { error: 'Daily limit reached. Come back tomorrow.' };
      if (quota === 'global_limit') {
        return { error: 'Robin is out of energy for today. Please try again tomorrow.' };
      }
    }
  } catch (e) {
    console.error('chatAction quota check failed:', e);
    return { error: 'Could not start chat. Please try again.' };
  }

  const systemPrompt = buildSystemPrompt(await buildUserContext(user.id));

  let client: OpenAI;
  try {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch {
    return { error: 'Failed to initialize chat client.' };
  }

  const apiMessages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  const createCompletion = () =>
    client.chat.completions.create({
      model: 'gpt-5-nano',
      tools: ROBIN_TOOLS,
      stream: true,
      reasoning_effort: 'minimal',
      max_completion_tokens: MAX_COMPLETION_TOKENS,
      messages: apiMessages,
    });

  // Start the first round before returning the stream so credit/key/rate-limit
  // failures reach the user as a plain error instead of a broken stream.
  let firstResponse: Awaited<ReturnType<typeof createCompletion>> | undefined;
  try {
    firstResponse = await createCompletion();
  } catch (e) {
    console.error('chatAction OpenAI request failed:', e);
    return { error: toRobinErrorMessage(e) };
  }

  const stream = new ReadableStream<string>({
    async start(controller) {
      try {
        for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
          const response = firstResponse ?? (await createCompletion());
          firstResponse = undefined;

          // Accumulate the streamed response: text chunks go straight to the
          // client for the typing effect; tool-call deltas are collected so we
          // can execute them after the stream ends.
          let textContent = '';
          const toolCalls: Map<
            number,
            { id: string; name: string; args: string }
          > = new Map();

          for await (const chunk of response) {
            const delta = chunk.choices[0]?.delta;
            if (!delta) continue;

            if (delta.content) {
              textContent += delta.content;
              controller.enqueue(delta.content);
            }

            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                const existing = toolCalls.get(tc.index);
                if (existing) {
                  existing.args += tc.function?.arguments ?? '';
                } else {
                  toolCalls.set(tc.index, {
                    id: tc.id ?? '',
                    name: tc.function?.name ?? '',
                    args: tc.function?.arguments ?? '',
                  });
                }
              }
            }
          }

          // If the model produced text (no tool calls), we're done — it's
          // already been streamed to the client.
          if (toolCalls.size === 0) {
            if (!textContent) {
              controller.enqueue('Robin lost his train of thought. Please try asking again.');
            }
            break;
          }

          // Model requested tool calls — execute them and loop.
          const assistantMsg: OpenAI.ChatCompletionMessageParam = {
            role: 'assistant',
            content: textContent || null,
            tool_calls: [...toolCalls.values()].map((tc, i) => ({
              id: tc.id,
              type: 'function' as const,
              index: i,
              function: { name: tc.name, arguments: tc.args },
            })),
          };
          apiMessages.push(assistantMsg);

          const toolResults = await Promise.all(
            [...toolCalls.values()].map(async (tc) => {
              const args = parseToolArgs(tc.args);
              const content = args
                ? await executeToolCall(tc.name, args, user.id)
                : JSON.stringify({ error: 'Invalid tool arguments' });
              return { role: 'tool' as const, tool_call_id: tc.id, content };
            }),
          );

          apiMessages.push(...toolResults);
        }
        controller.close();
      } catch (e) {
        console.error('chatAction stream failed:', e);
        controller.error(new Error(toRobinErrorMessage(e)));
      }
    },
  });

  return stream;
}
