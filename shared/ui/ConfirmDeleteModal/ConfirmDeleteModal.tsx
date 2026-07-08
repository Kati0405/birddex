'use client';

import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';

interface ConfirmDeleteModalProps {
  title: string;
  children: React.ReactNode;
  error?: string | null;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteModal({
  title,
  children,
  error,
  pending,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  const t = useTranslations('Common');

  return createPortal(
    <div
      className='fixed inset-0 z-[110] flex items-center justify-center p-4'
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => {
        e.stopPropagation();
        if (!pending) onCancel();
      }}
    >
      <div
        className='w-full max-w-xs rounded-xl overflow-hidden bg-card flex flex-col'
        style={{
          border: '2px solid #fca5a5',
          boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className='h-1 w-full shrink-0 bg-destructive' />
        <div className='px-5 py-4 flex flex-col gap-3'>
          <p className='text-[7px] uppercase tracking-[0.18em] font-mono text-muted-foreground'>
            {title}
          </p>
          <div className='text-sm text-card-foreground'>{children}</div>
          {error && (
            <p className='text-[10px] font-mono text-destructive'>⚠ {error}</p>
          )}
          <div className='flex gap-2 justify-end'>
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              disabled={pending}
              className='px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-[0.1em] border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors disabled:opacity-50'
            >
              {t('cancel')}
            </button>
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation();
                onConfirm();
              }}
              disabled={pending}
              className='px-4 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-[0.1em] transition-all active:scale-[0.97] disabled:opacity-60'
              style={{ background: '#dc2626', color: '#ffffff' }}
            >
              {pending ? t('deleting') : t('delete')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
