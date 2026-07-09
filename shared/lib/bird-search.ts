export function matchesBirdQuery(
  bird: { name_eng?: string | null; name_latin?: string | null },
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (q === '') return true;
  return (bird.name_eng ?? '').toLowerCase().includes(q) || (bird.name_latin ?? '').toLowerCase().includes(q);
}
