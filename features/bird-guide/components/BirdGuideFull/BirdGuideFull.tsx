'use client';

import { useBirdGuideChat } from '@/features/bird-guide/components/BirdGuideChatProvider/BirdGuideChatProvider';
import { useScrollToBottom } from '@/features/bird-guide/hooks/useScrollToBottom';
import { Trash2 } from 'lucide-react';
import BirdGuideChatMessage from '@/features/bird-guide/components/BirdGuideChat/BirdGuideChatMessage';
import BirdGuideChatInput from '@/features/bird-guide/components/BirdGuideChat/BirdGuideChatInput';
import BirdGuideSuggestions from '@/features/bird-guide/components/BirdGuideChat/BirdGuideSuggestions';

export default function BirdGuideFull() {
  const { messages, input, isStreaming, streamingContent, error, userContext, setInput, send, suggest, clear } =
    useBirdGuideChat();

  const scrollRef = useScrollToBottom<HTMLDivElement>([messages, streamingContent]);

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full px-4">
      <div className="py-6 shrink-0 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bird Guide</h1>
          {userContext && (
            <p className="text-sm text-muted-foreground mt-1">
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

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 && !isStreaming && (
          <div className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Ask anything about birds — or pick a question to get started:
            </p>
            <BirdGuideSuggestions userContext={userContext} onSuggest={suggest} />
          </div>
        )}
        {messages.map((msg, i) => (
          <BirdGuideChatMessage key={i} message={msg} />
        ))}
        {isStreaming && streamingContent && (
          <BirdGuideChatMessage
            message={{ role: 'assistant', content: streamingContent }}
            isStreaming
          />
        )}
        {error && <p className="text-xs text-destructive text-center">{error}</p>}
      </div>

      <div className="shrink-0 border-t border-border">
        <BirdGuideChatInput
          value={input}
          onChange={setInput}
          onSend={send}
          disabled={isStreaming}
        />
      </div>
    </div>
  );
}
