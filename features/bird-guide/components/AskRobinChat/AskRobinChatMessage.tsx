'use client';

import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import type { ChatMessage } from '@/features/bird-guide/bird-guide.types';

interface Props {
  message: ChatMessage;
  isStreaming?: boolean;
}

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="mb-2 ml-4 space-y-0.5 list-disc">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 ml-4 space-y-0.5 list-decimal">{children}</ol>,
  li: ({ children }) => <li className="leading-snug">{children}</li>,
  h1: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
  h2: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
  h3: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
  code: ({ children }) => (
    <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>
  ),
};

export default function AskRobinChatMessage({ message, isStreaming }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-card border border-border text-foreground rounded-bl-sm'
        }`}
      >
        {isUser ? (
          message.content
        ) : (
          <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
        )}
        {isStreaming && (
          <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-current rounded-sm animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
}
