import { getTranslations } from 'next-intl/server';

export default async function Loading() {
  const t = await getTranslations('Common');

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {t('loading')}
        </p>
      </div>
    </div>
  );
}
