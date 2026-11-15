import { buildDataset, displayName, type Overrides, type RawCountry, type RawHolder } from './build-lib.ts';

const TODAY = new Date(Date.UTC(2026, 10, 15));

const country = (p: Partial<RawCountry>): RawCountry => ({
  country: 'Q183', countryLabel: 'Germany', sovereign: true, iso2: 'DE', iso3: 'DEU', continent: 'Q46', continentLabel: 'Europe',
  office: 'Q4970706', officeLabel: 'Federal Chancellor of Germany', kind: 'gov', ...p,
});

const holder = (p: Partial<RawHolder>): RawHolder => ({
  office: 'Q4970706', person: 'Q567', personLabel: 'Angela Merkel', start: '2005-11-22T00:00:00Z', end: '2021-12-08T00:00:00Z',
  birth: '1954-07-17T00:00:00Z', sitelinks: 222, article: 'https://en.wikipedia.org/wiki/Angela_Merkel', ...p,
});

const GERMANY = [country({}), country({ office: 'Q25223', officeLabel: 'president of Germany', kind: 'state' })];
const none: Overrides = {};

const build = (holders: RawHolder[], countries = GERMANY, overrides = none, aliases: Record<string, string[]> = {}) =>
  buildDataset({ countries, holders, aliases, settlements: [] }, overrides, { today: TODAY, minSitelinks: 0, answerableSitelinks: 100 });

describe('displayName', () => {
  it('uses the English Wikipedia title without disambiguation', () => {
    expect(displayName('Kuan Yew Lee', 'https://en.wikipedia.org/wiki/Lee_Kuan_Yew')).toBe('Lee Kuan Yew');
    expect(displayName('x', 'https://en.wikipedia.org/wiki/John_Howard_(Australian_politician)')).toBe('John Howard');
    expect(displayName('x', 'https://en.wikipedia.org/wiki/Gerhard_Schr%C3%B6der')).toBe('Gerhard Schröder');
    expect(displayName('Angela Merkel', undefined)).toBe('Angela Merkel');
  });
});

describe('buildDataset', () => {
  it('builds a leader with the game attributes', () => {
    const { leaders } = build([holder({})]);
    expect(leaders).toHaveLength(1);
    expect(leaders[0]).toMatchObject({
      id: 'Q567', name: 'Angela Merkel', country: 'Germany', countryCode: 'DEU', iso2: 'de', continent: 'Europe', role: 'gov',
      tookOffice: 2005, yearsInOffice: 16, ageAtStart: 51, terms: [{ start: '2005-11-22', end: '2021-12-08' }],
      wiki: 'https://en.wikipedia.org/wiki/Angela_Merkel', blurb: 'Federal Chancellor of Germany from 2005 to 2021.', answerable: true,
    });
  });

  it('drops acting terms, terms without a start and duplicate rows', () => {
    const { leaders } = build([
      holder({}),
      holder({ replaces: 'Q2530' }),
      holder({ start: '1999-01-01T00:00:00Z', end: '1999-02-01T00:00:00Z', role: 'Q4676846' }),
      holder({ start: undefined, end: undefined }),
    ]);
    expect(leaders[0]!.terms).toEqual([{ start: '2005-11-22', end: '2021-12-08' }]);
  });

  it('closes an open term at the date of death and flags it', () => {
    const { leaders, review } = build([holder({ end: undefined, death: '2020-01-01T00:00:00Z' })]);
    expect(leaders[0]!.terms).toEqual([{ start: '2005-11-22', end: '2020-01-01' }]);
    expect(review.find((r) => r.id === 'Q567')!.flags).toContain('open term after death');
  });

  it('keeps a living leader in office', () => {
    const { leaders } = build([holder({ start: '2020-11-16T00:00:00Z', end: undefined })]);
    expect(leaders[0]!.terms).toEqual([{ start: '2020-11-16', end: null }]);
  });

  it('sums separate terms and takes the first start', () => {
    const { leaders } = build([
      holder({ person: 'Q8016', personLabel: 'Winston Churchill', start: '1940-05-10T00:00:00Z', end: '1945-07-26T00:00:00Z', birth: '1874-11-30T00:00:00Z', article: undefined }),
      holder({ person: 'Q8016', personLabel: 'Winston Churchill', start: '1951-10-26T00:00:00Z', end: '1955-04-05T00:00:00Z', birth: '1874-11-30T00:00:00Z', article: undefined }),
    ]);
    expect(leaders[0]).toMatchObject({ tookOffice: 1940, ageAtStart: 65, yearsInOffice: 8 });
  });

  it('an office that is both head of state and of government gives the role Both', () => {
    const us = [
      country({ country: 'Q30', countryLabel: 'United States', iso2: 'US', iso3: 'USA', continent: 'Q49', continentLabel: 'North America', office: 'Q11696', officeLabel: 'President of the United States', kind: 'state' }),
      country({ country: 'Q30', countryLabel: 'United States', iso2: 'US', iso3: 'USA', continent: 'Q49', continentLabel: 'North America', office: 'Q11696', officeLabel: 'President of the United States', kind: 'gov' }),
    ];
    const { leaders } = build([holder({ office: 'Q11696', person: 'Q76', personLabel: 'Barack Obama', start: '2009-01-20T00:00:00Z', end: '2017-01-20T00:00:00Z', birth: '1961-08-04T00:00:00Z' })], us);
    expect(leaders[0]!.role).toBe('both');
  });

  it('separate state and government offices: longest one wins, flagged for review', () => {
    const { leaders, review } = build([
      holder({ office: 'Q25223', start: '2000-01-01T00:00:00Z', end: '2002-01-01T00:00:00Z' }),
      holder({}),
    ]);
    expect(leaders[0]!.role).toBe('gov');
    expect(review[0]!.flags).toContain('held state and government offices');
  });

  it('heads of state and government at the same time for most of their tenure are Both', () => {
    const { leaders } = build([
      holder({ office: 'Q25223', start: '2000-01-01T00:00:00Z', end: '2010-01-01T00:00:00Z' }),
      holder({ start: '2002-01-01T00:00:00Z', end: '2010-01-01T00:00:00Z' }),
    ]);
    expect(leaders[0]!.role).toBe('both');
  });

  it('ignores ex officio co-prince titles when picking the country', () => {
    const countries = [
      country({ country: 'Q142', countryLabel: 'France', iso2: 'FR', iso3: 'FRA', office: 'Q191954', officeLabel: 'President of the French Republic', kind: 'state' }),
      country({ country: 'Q228', countryLabel: 'Andorra', iso2: 'AD', iso3: 'AND', office: 'Q19808845', officeLabel: 'French co-prince of Andorra', kind: 'state' }),
    ];
    const { leaders } = build([
      holder({ office: 'Q191954', person: 'Q2042', start: '1959-01-08T00:00:00Z', end: '1969-04-28T00:00:00Z' }),
      holder({ office: 'Q19808845', person: 'Q2042', start: '1944-08-20T00:00:00Z', end: '1969-04-28T00:00:00Z' }),
    ], countries);
    expect(leaders[0]).toMatchObject({ country: 'France', tookOffice: 1959 });
  });

  it('breaks country ties with the preferred list (monarchs of several realms)', () => {
    const realms = [
      country({ country: 'Q664', countryLabel: 'New Zealand', iso2: 'NZ', iso3: 'NZL', continent: 'Q538', continentLabel: 'Oceania', office: 'Qnz', officeLabel: 'Monarch of New Zealand', kind: 'state' }),
      country({ country: 'Q145', countryLabel: 'United Kingdom', iso2: 'GB', iso3: 'GBR', office: 'Quk', officeLabel: 'monarch of the United Kingdom', kind: 'state' }),
    ];
    const rows = [holder({ office: 'Qnz', person: 'Q9682', start: '1952-02-06T00:00:00Z', end: '2022-09-08T00:00:00Z' }), holder({ office: 'Quk', person: 'Q9682', start: '1952-02-06T00:00:00Z', end: '2022-09-08T00:00:00Z' })];
    expect(build(rows, realms, { preferCountries: ['Q145'] }).leaders[0]).toMatchObject({ country: 'United Kingdom', blurb: 'Monarch of the United Kingdom from 1952 to 2022.' });
  });

  it('maps continents and uses overrides for transcontinental countries', () => {
    const ru = [country({ country: 'Q159', countryLabel: 'Russia', iso2: 'RU', iso3: 'RUS', continent: 'Q46', continentLabel: 'Europe', office: 'Q218295', officeLabel: 'President of Russia', kind: 'state' }),
      country({ country: 'Q159', countryLabel: 'Russia', iso2: 'RU', iso3: 'RUS', continent: 'Q48', continentLabel: 'Asia', office: 'Q218295', officeLabel: 'President of Russia', kind: 'state' })];
    const h = holder({ office: 'Q218295', person: 'Q7747', personLabel: 'Vladimir Putin', start: '2000-05-07T00:00:00Z', end: undefined, birth: '1952-10-07T00:00:00Z' });
    expect(build([h], ru).review[0]!.flags).toContain('several continents');
    expect(build([h], ru, { continents: { Q159: 'Europe' } }).leaders[0]!.continent).toBe('Europe');
    const fj = [country({ country: 'Q712', countryLabel: 'Fiji', iso2: 'FJ', iso3: 'FJI', continent: 'Q3960', continentLabel: 'Insular Oceania', office: 'Q1', officeLabel: 'Prime Minister of Fiji' })];
    expect(build([holder({ office: 'Q1' })], fj).leaders[0]!.continent).toBe('Oceania');
  });

  it('excludes cities and governors-general but keeps city states', () => {
    const countries = [
      ...GERMANY,
      country({ country: 'Q641', countryLabel: 'Venice', sovereign: false, office: 'Q2', officeLabel: 'mayor of Venice' }),
      country({ country: 'Q766', countryLabel: 'Jamaica', iso2: 'JM', iso3: 'JAM', continent: 'Q49', continentLabel: 'North America', office: 'Q3', officeLabel: 'Governor-General of Jamaica', kind: 'state' }),
      country({ country: 'Q334', countryLabel: 'Singapore', iso2: 'SG', iso3: 'SGP', continent: 'Q48', continentLabel: 'Asia', office: 'Q866756', officeLabel: 'Prime Minister of Singapore' }),
    ];
    const res = buildDataset(
      { countries, settlements: ['Q641', 'Q334'], aliases: {}, holders: [
        holder({ office: 'Q2', person: 'Qa', personLabel: 'Mayor' }),
        holder({ office: 'Q3', person: 'Qb', personLabel: 'Governor' }),
        holder({ office: 'Q866756', person: 'Q1', personLabel: 'Kuan Yew Lee', article: 'https://en.wikipedia.org/wiki/Lee_Kuan_Yew' }),
      ] },
      none, { today: TODAY, minSitelinks: 0, answerableSitelinks: 100 },
    );
    expect(res.leaders.map((l) => l.name)).toEqual(['Lee Kuan Yew']);
  });

  it('keeps well-known leaders only, answers above a higher bar, overrides win', () => {
    const holders = [holder({}), holder({ person: 'Q9', personLabel: 'Obscure', sitelinks: 3 }), holder({ person: 'Q10', personLabel: 'Mid', sitelinks: 50 })];
    const res = buildDataset({ countries: GERMANY, holders, aliases: {}, settlements: [] }, { answerable: { add: ['Q10'], remove: ['Q567'] } }, { today: TODAY, minSitelinks: 10, answerableSitelinks: 100 });
    expect(res.leaders.map((l) => [l.id, l.answerable])).toEqual([['Q567', false], ['Q10', true]]);
  });

  it('adds aliases from Wikidata and overrides', () => {
    const { leaders } = build([holder({})], GERMANY, { aliases: { Q567: ['Mutti'] } }, { Q567: ['Angela Dorothea Merkel', 'Angela Merkel'] });
    expect(leaders[0]!.aliases).toEqual(['Angela Dorothea Merkel', 'Mutti']);
  });

  it('applies name, country code and exclusion overrides', () => {
    const holders = [holder({}), holder({ person: 'Q9', personLabel: 'Other' })];
    const { leaders } = build(holders, GERMANY, { names: { Q567: 'Angela M.' }, exclude: ['Q9'], countryCodes: { Q183: 'GER' } });
    expect(leaders.map((l) => [l.name, l.countryCode])).toEqual([['Angela M.', 'GER']]);
  });

  it('merges a former state into today’s country, with its flag only when asked', () => {
    const weimar = country({ country: 'Q41304', countryLabel: 'Weimar Republic', sovereign: false, iso2: undefined, iso3: undefined, office: 'Qw', officeLabel: 'Chancellor of Germany (1918–1933)' });
    const dk = country({ country: 'Q756617', countryLabel: 'Kingdom of Denmark', sovereign: false, iso2: undefined, iso3: undefined, office: 'Qd', officeLabel: 'Prime Minister of Denmark' });
    const den = country({ country: 'Q35', countryLabel: 'Denmark', iso2: 'DK', iso3: 'DNK', office: 'Qx', officeLabel: 'Monarch of Denmark', kind: 'state' });
    const merges = { mergeCountries: { Q41304: { into: 'Q183' }, Q756617: { into: 'Q35', flag: true } } };
    const { leaders } = build(
      [holder({ office: 'Qw', person: 'Q1', personLabel: 'A' }), holder({ office: 'Qd', person: 'Q2', personLabel: 'B' })],
      [...GERMANY, den, weimar, dk],
      merges,
    );
    expect(leaders.map((l) => [l.country, l.countryCode, l.iso2])).toEqual([
      ['Germany', 'DEU', null],
      ['Denmark', 'DNK', 'dk'],
    ]);
  });

  it('can merge into a country described only in the overrides', () => {
    const dk = country({ country: 'Q756617', countryLabel: 'Kingdom of Denmark', sovereign: false, iso2: undefined, iso3: undefined, office: 'Qd', officeLabel: 'Prime Minister of Denmark' });
    const ov: Overrides = {
      mergeCountries: { Q756617: { into: 'Q35', flag: true } },
      countryInfo: { Q35: { label: 'Denmark', iso2: 'DK', iso3: 'DNK', continent: 'Europe' } },
    };
    expect(build([holder({ office: 'Qd' })], [dk], ov).leaders[0]).toMatchObject({ country: 'Denmark', countryCode: 'DNK', iso2: 'dk', continent: 'Europe' });
    expect(() => build([holder({ office: 'Qd' })], [dk], { mergeCountries: { Q756617: { into: 'Q35' } } })).toThrow(/Q35/);
  });

  it('lists office holders in order for Succession', () => {
    const { offices } = build([
      holder({ person: 'Q2530', personLabel: 'Gerhard Schröder', start: '1998-10-27T00:00:00Z', end: '2005-11-22T00:00:00Z', birth: '1944-04-07T00:00:00Z' }),
      holder({}),
      holder({ person: 'Q61053', personLabel: 'Olaf Scholz', start: '2021-12-08T00:00:00Z', end: '2025-05-06T00:00:00Z', birth: '1958-06-14T00:00:00Z' }),
    ]);
    expect(offices.Q4970706!.holders.map((h) => [h.id, h.start, h.end])).toEqual([
      ['Q2530', '1998-10-27', '2005-11-22'],
      ['Q567', '2005-11-22', '2021-12-08'],
      ['Q61053', '2021-12-08', '2025-05-06'],
    ]);
  });
});
