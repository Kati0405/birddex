'use client';

import { useTranslations } from 'next-intl';
import { useAskRobinChat } from '@/features/bird-guide/components/AskRobinChatProvider/AskRobinChatProvider';
import { useScrollToBottom } from '@/features/bird-guide/hooks/useScrollToBottom';
import { Trash2 } from 'lucide-react';
import type { UserContext } from '@/features/bird-guide/bird-guide.types';
import AskRobinChatMessage from '@/features/bird-guide/components/AskRobinChat/AskRobinChatMessage';
import AskRobinChatInput from '@/features/bird-guide/components/AskRobinChat/AskRobinChatInput';
import AskRobinSuggestions from '@/features/bird-guide/components/AskRobinChat/AskRobinSuggestions';

interface Props {
  userContext: UserContext | null;
}

export default function AskRobinFull({ userContext }: Props) {
  const t = useTranslations('AskRobinPage');
  const { messages, input, isStreaming, streamingContent, error, setInput, send, suggest, clear } =
    useAskRobinChat();

  const scrollRef = useScrollToBottom<HTMLDivElement>([messages, streamingContent]);

  return (
    <div className="flex flex-col flex-1 min-h-0 max-w-2xl mx-auto w-full px-4">
      <div className="py-6 shrink-0 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          {userContext && (
            <p className="text-sm text-muted-foreground mt-1">
              {t('answeringBasedOn', { count: userContext.observedCount })}
            </p>
          )}
        </div>
        {messages.length > 0 && !isStreaming && (
          <button
            onClick={clear}
            className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label={t('clearConversation')}
          >
            <Trash2 size={13} />
            {t('clear')}
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 && !isStreaming && (
          <div className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              {t('askAnything')}
            </p>
            <AskRobinSuggestions userContext={userContext} onSuggest={suggest} />
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

      <div className="shrink-0 border-t border-border">
        <AskRobinChatInput
          value={input}
          onChange={setInput}
          onSend={send}
          disabled={isStreaming}
        />
      </div>
    </div>
  );
}
