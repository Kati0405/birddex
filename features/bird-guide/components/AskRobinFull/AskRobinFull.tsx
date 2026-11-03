'use client';

import { useAskRobinChat } from '@/features/bird-guide/components/AskRobinChatProvider/AskRobinChatProvider';
import { useScrollToBottom } from '@/features/bird-guide/hooks/useScrollToBottom';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import type { UserContext } from '@/features/bird-guide/bird-guide.types';
import AskRobinChatMessage from '@/features/bird-guide/components/AskRobinChat/AskRobinChatMessage';
import AskRobinChatInput from '@/features/bird-guide/components/AskRobinChat/AskRobinChatInput';
import AskRobinSuggestions from '@/features/bird-guide/components/AskRobinChat/AskRobinSuggestions';

interface Props {
  userContext: UserContext | null;
}

export default function AskRobinFull({ userContext }: Props) {
  const { messages, input, isStreaming, streamingContent, error, isAuthenticated, setInput, send, suggest, clear } =
    useAskRobinChat();

  const bottomRef = useScrollToBottom<HTMLDivElement>(
    [messages, streamingContent, error],
    messages.length > 0 || isStreaming,
    messages.at(-1)?.role === 'user',
  );

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto w-full px-4 py-10 text-center space-y-4">
        <p className="text-sm text-muted-foreground">Sign in to chat with Robin.</p>
        <Link
          href="/login"
          className="inline-block px-4 py-2 rounded-md text-[11px] font-mono uppercase tracking-widest border border-border text-foreground hover:bg-muted/40 transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 max-w-2xl mx-auto w-full px-4">
      <div className="py-6 shrink-0 flex items-start justify-between">
        <div>
          {userContext && (
            <p className="text-sm text-muted-foreground">
              Answering based on your {userContext.observedCount} observed species.
            </p>
          )}
        </div>
        {messages.length > 0 && !isStreaming && (
          <button
            onClick={clear}
            className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear conversation"
          >
            <Trash2 size={13} />
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 pb-4">
        {messages.length === 0 && !isStreaming && (
          <div className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Ask anything about birds — or pick a question to get started:
            </p>
            <AskRobinSuggestions userContext={userContext} isAuthenticated onSuggest={suggest} />
          </div>
        )}
        {messages.map((msg, i) => (
          <AskRobinChatMessage key={i} message={msg} />
        ))}
        {isStreaming && streamingContent && (
          <AskRobinChatMessage
            message={{ role: 'assistant', content: streamingContent }}
            isStreaming
          />
        )}
        {error && <p className="text-xs text-destructive text-center">{error}</p>}
      </div>

      <div className="shrink-0">
        <AskRobinChatInput
          value={input}
          onChange={setInput}
          onSend={send}
          disabled={isStreaming}
        />
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
