'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { chatAction } from '@/features/bird-guide/actions/chat-action';
import type { ChatMessage } from '@/features/bird-guide/bird-guide.types';

interface ChatState {
  messages: ChatMessage[];
  input: string;
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
  isAuthenticated: boolean;
  setInput: (v: string) => void;
  send: () => void;
  suggest: (question: string) => void;
  clear: () => void;
}

const AskRobinChatContext = createContext<ChatState | null>(null);

export function useAskRobinChat() {
  const ctx = useContext(AskRobinChatContext);
  if (!ctx) throw new Error('useAskRobinChat must be used inside AskRobinChatProvider');
  return ctx;
}

interface Props {
  isAuthenticated: boolean;
  children: React.ReactNode;
}

export default function AskRobinChatProvider({ isAuthenticated, children }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async () => {
    const content = input.trim();
    if (!content || isStreaming) return;

    const userMessage: ChatMessage = { role: 'user', content };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setError(null);
    setIsStreaming(true);
    setStreamingContent('');

    const result = await chatAction({ messages: nextMessages });

    if ('error' in result) {
      setError(result.error);
      setIsStreaming(false);
      return;
    }

    const reader = result.getReader();
    let accumulated = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += value;
        setStreamingContent(accumulated);
      }
    } finally {
      setMessages((prev) => [...prev, { role: 'assistant', content: accumulated }]);
      setStreamingContent('');
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages]);

  const suggest = useCallback((question: string) => {
    setInput(question);
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setInput('');
    setStreamingContent('');
    setError(null);
  }, []);

  return (
    <AskRobinChatContext.Provider
      value={{ messages, input, isStreaming, streamingContent, error, isAuthenticated, setInput, send, suggest, clear }}
    >
      {children}
    </AskRobinChatContext.Provider>
  );
}
