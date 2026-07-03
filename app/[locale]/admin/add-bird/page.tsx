import { setRequestLocale } from 'next-intl/server';
import { requireAdmin } from '@/features/auth/auth-helpers';
import AddBirdForm from '@/features/birds/components/AddBirdForm/AddBirdForm';
import { locales, type Locale } from '@/i18n/locales';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function AddBirdPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  await requireAdmin();
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-lg font-bold mb-6">Add Bird</h1>
      <AddBirdForm />
    </div>
  );
}
