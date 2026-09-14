import { requireAuth } from '@/features/auth/auth-helpers';
import { getSavedLocations } from '@/features/locations/location-queries';
import {
  getJournalMonthData,
  getJournalPhotoOfMonth,
  getJournalPhotoOptions,
  parseMonthKey,
  currentMonthKey,
  clampToCurrentMonth,
} from '@/features/observations/journal-queries';
import JournalPage from '@/features/observations/components/JournalPage/JournalPage';

interface Props {
  searchParams: Promise<{ month?: string }>;
}

export default async function ObservationsPage({ searchParams }: Props) {
  const user = await requireAuth();
  const { month } = await searchParams;

  const monthKey = clampToCurrentMonth(parseMonthKey(month) ?? currentMonthKey());

  const [savedLocations, data, photoOfMonth] = await Promise.all([
    getSavedLocations(user.id),
    getJournalMonthData(monthKey),
    getJournalPhotoOfMonth(user.id, monthKey),
  ]);

  return (
    <JournalPage
      monthKey={monthKey}
      savedLocations={savedLocations}
      data={data}
      photoOfMonth={photoOfMonth}
      photoOptions={getJournalPhotoOptions(data)}
    />
  );
}
