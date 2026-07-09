import { describe, expect, it } from 'vitest';
import { matchesBirdQuery } from './bird-search';

const ROBIN = { name_eng: 'European Robin', name_latin: 'Erithacus rubecula' };

describe('matchesBirdQuery', () => {
  it('shows all birds for an empty query', () => {
    expect(matchesBirdQuery(ROBIN, '')).toBe(true);
  });

  it('shows all birds for a whitespace-only query', () => {
    expect(matchesBirdQuery(ROBIN, '   ')).toBe(true);
  });

  it('matches case-insensitively', () => {
    expect(matchesBirdQuery(ROBIN, 'ROBIN')).toBe(true);
    expect(matchesBirdQuery(ROBIN, 'robin')).toBe(true);
  });

  it('trims leading/trailing spaces from the query', () => {
    expect(matchesBirdQuery(ROBIN, '  robin  ')).toBe(true);
  });

  it('matches against the English name', () => {
    expect(matchesBirdQuery(ROBIN, 'european')).toBe(true);
  });

  it('matches against the Latin name', () => {
    expect(matchesBirdQuery(ROBIN, 'erithacus')).toBe(true);
  });

  it('returns false when neither name matches', () => {
    expect(matchesBirdQuery(ROBIN, 'penguin')).toBe(false);
  });

  it('does not crash on null or undefined name fields', () => {
    expect(matchesBirdQuery({ name_eng: null, name_latin: null }, 'robin')).toBe(false);
    expect(matchesBirdQuery({ name_eng: undefined, name_latin: undefined }, '')).toBe(true);
    expect(matchesBirdQuery({ name_eng: null, name_latin: 'Erithacus rubecula' }, 'erithacus')).toBe(true);
  });
});
