import { createSearch, normalize } from './search';
import { SAMPLE_LEADERS } from './fixtures';

const search = createSearch(SAMPLE_LEADERS);
const names = (q: string) => search(q).map((l) => l.name);

describe('normalize', () => {
  it('ignores case, accents and punctuation', () => {
    expect(normalize('  Gerhard  SCHRÖDER ')).toBe('gerhard schroder');
    expect(normalize('John F. Kennedy')).toBe('john f kennedy');
    expect(normalize("Seán O'Kelly")).toBe('sean okelly');
    expect(normalize('Seán O’Kelly')).toBe('sean okelly');
  });
});

describe('search', () => {
  it('lists every leader for an empty query', () => {
    expect(search('')).toHaveLength(SAMPLE_LEADERS.length);
  });

  it('matches anywhere in the name, word starts first (capture 04-suggest)', () => {
    expect(names('ma')).toEqual(['Margaret Thatcher', 'Nelson Mandela', 'Barack Obama']);
  });

  it('accepts known variants', () => {
    expect(names('FDR')).toEqual(['Franklin D. Roosevelt']);
    expect(names('jfk')).toEqual(['John F. Kennedy']);
    expect(names('Queen Elizabeth')).toEqual(['Elizabeth II']);
    expect(names('john f. kennedy')).toEqual(['John F. Kennedy']);
  });

  it('ignores accents in the query', () => {
    expect(names('Ángela')).toEqual(['Angela Merkel']);
  });

  it('puts names whose words start with the query first', () => {
    // Name starts with "t", then a word starts with "t", then substrings.
    expect(names('t').slice(0, 2)).toEqual(['Tony Blair', 'Margaret Thatcher']);
    expect(names('helen')).toEqual(['Helen Clark']);
  });

  it('returns nothing for gibberish (capture 05-nomatch)', () => {
    expect(names('zz')).toEqual([]);
  });
});
