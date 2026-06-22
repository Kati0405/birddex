'use server';

import { z } from 'zod';
import OpenAI from 'openai';
import { getUser } from '@/features/auth/auth-helpers';
import { buildUserContext } from '@/features/bird-guide/bird-guide-context';
import { buildSystemPrompt } from '@/features/bird-guide/bird-guide-prompt';
import { ROBIN_TOOLS, executeToolCall } from '@/features/bird-guide/robin-tools';
import type { ChatActionInput } from '@/features/bird-guide/bird-guide.types';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2000),
});

const ChatActionSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(20),
});

const MAX_TOOL_ROUNDS = 5;

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
  const userContext = user ? await buildUserContext(user.id) : undefined;
  const systemPrompt = buildSystemPrompt(userContext);

  let client: OpenAI;
  try {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch {
    return { error: 'Failed to initialize chat client.' };
  }

  const userId = user?.id ?? null;

  const apiMessages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  const stream = new ReadableStream<string>({
    async start(controller) {
      try {
        for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
          const response = await client.chat.completions.create({
            model: 'gpt-5.4-mini',
            tools: ROBIN_TOOLS,
            stream: true,
            messages: apiMessages,
          });

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
          if (toolCalls.size === 0) break;

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
              const args = JSON.parse(tc.args);
              const result = await executeToolCall(tc.name, args, userId);
              return {
                role: 'tool' as const,
                tool_call_id: tc.id,
                content: result,
              };
            }),
          );

          apiMessages.push(...toolResults);
        }
      } catch (e) {
        controller.error(e instanceof Error ? e.message : 'Stream error');
      } finally {
        controller.close();
      }
    },
  });

  return stream;
}
