'use server';

import { z } from 'zod';
import OpenAI from 'openai';
import { buildSystemPrompt } from '@/features/bird-guide/bird-guide-prompt';
import type { ChatActionInput } from '@/features/bird-guide/bird-guide.types';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2000),
});

const ChatActionSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(20),
  userContext: z
    .object({
      observedCount: z.number().int().nonnegative(),
      collectedCount: z.number().int().nonnegative(),
      totalBirdsInCatalog: z.number().int().nonnegative(),
      observations: z.array(
        z.object({
          name: z.string(),
          sightings: z.array(
            z.object({
              date: z.string(),
              seen: z.boolean(),
              heard: z.boolean(),
              photographed: z.boolean(),
              quality: z.enum(['bad', 'good', 'excellent']).nullable(),
              notes: z.string().nullable(),
              locationName: z.string().nullable(),
            })
          ),
        })
      ),
    })
    .optional(),
});

export async function chatAction(input: ChatActionInput): Promise<ReadableStream<string> | { error: string }> {
  if (!process.env.OPENAI_API_KEY) {
    return { error: 'Chat is not configured.' };
  }

  const parsed = ChatActionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') };
  }

  const { messages, userContext } = parsed.data;
  const systemPrompt = buildSystemPrompt(userContext);

  let client: OpenAI;
  try {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch {
    return { error: 'Failed to initialize chat client.' };
  }

  const stream = new ReadableStream<string>({
    async start(controller) {
      try {
        const response = await client.chat.completions.create({
          model: 'gpt-5.4-mini',
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
        });

        for await (const chunk of response) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) controller.enqueue(text);
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
