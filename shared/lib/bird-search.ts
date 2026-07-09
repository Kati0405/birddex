export function matchesBirdQuery(bird: { name_eng: string; name_latin: string }, query: string): boolean {
  if (query === '') return true;
  const q = query.toLowerCase();
  return bird.name_eng.toLowerCase().includes(q) || bird.name_latin.toLowerCase().includes(q);
}
