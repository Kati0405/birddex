'use client';

import { useRef, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}

export default function AskRobinChatInput({ value, onChange, onSend, disabled }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  }

  return (
    <div className="py-3">
      <div className="flex items-end gap-2 rounded-2xl border border-border bg-card shadow-sm shadow-black/[0.03] px-3.5 py-2.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-colors">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about any bird…"
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50 py-1 max-h-40"
        />
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity"
        >
          <ArrowUp size={16} />
        </button>
      </div>
    </div>
  );
}
