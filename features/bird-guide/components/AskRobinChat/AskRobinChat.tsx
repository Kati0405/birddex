'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Bird, Maximize2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAskRobinChat } from '@/features/bird-guide/components/AskRobinChatProvider/AskRobinChatProvider';
import { useScrollToBottom } from '@/features/bird-guide/hooks/useScrollToBottom';
import AskRobinChatMessage from './AskRobinChatMessage';
import AskRobinChatInput from './AskRobinChatInput';
import AskRobinSuggestions from './AskRobinSuggestions';

export default function AskRobinChat() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { messages, input, isStreaming, streamingContent, error, isAuthenticated, setInput, send, suggest, clear } =
    useAskRobinChat();

  const scrollRef = useScrollToBottom<HTMLDivElement>([messages, streamingContent]);

  if (pathname === '/ask-robin') return null;

  const hasConversation = messages.length > 0;

  const modal = open ? (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        className="absolute bottom-24 right-6 w-[380px] max-h-[560px] flex flex-col rounded-2xl border border-border bg-background shadow-2xl pointer-events-auto overflow-hidden"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Bird size={18} className="text-primary" />
            <span className="text-sm font-semibold">Ask Robin</span>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && !isStreaming && (
              <button
                onClick={clear}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear conversation"
              >
                <Trash2 size={14} />
              </button>
            )}
            <Link
              href="/ask-robin"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Open full screen"
            >
              <Maximize2 size={15} />
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
          {messages.length === 0 && !isStreaming && (
            <AskRobinSuggestions isAuthenticated={isAuthenticated} onSuggest={suggest} />
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

        <AskRobinChatInput
          value={input}
          onChange={setInput}
          onSend={send}
          disabled={isStreaming}
        />
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Open Ask Robin"
      >
        <Bird size={24} />
        {hasConversation && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#f9a01f] border-2 border-primary-foreground" />
        )}
      </button>
      {typeof document !== 'undefined' && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
