// Turns raw Wikidata rows into the game's leader list (PASSATION §13.1). Pure functions, tested.
import { yearsInOffice } from '../../src/game/tenure.ts';
import type { Leader, Role, Term } from '../../src/game/types.ts';

export type Continent = 'Africa' | 'Asia' | 'Europe' | 'North America' | 'South America' | 'Oceania';

export interface RawCountry {
  country: string;
  countryLabel: string;
  sovereign: boolean;
  iso2?: string;
  iso3?: string;
  continent?: string;
  continentLabel?: string;
  dissolved?: string;
  office: string;
  officeLabel: string;
  kind: 'state' | 'gov';
}

export interface RawHolder {
  office: string;
  person: string;
  personLabel: string;
  start?: string;
  end?: string;
  birth?: string;
  death?: string;
  replaces?: string;
  replacedBy?: string;
  /** "Subject has role" qualifier, e.g. acting or interim. */
  role?: string;
  sitelinks: number;
  article?: string;
}

/** A state an office belongs to, with its dates. */
export interface RawState {
  id: string;
  label: string;
  sovereign: boolean;
  iso2?: string;
  iso3?: string;
  continents: string[];
  inception?: string;
  dissolved?: string;
}

/** National office found through the class tree (subclass of head of state/government with a jurisdiction). */
export interface RawTreeOffice {
  office: string;
  label: string;
  countries: string[];
  kinds: Array<'state' | 'gov'>;
}

export interface RawData {
  countries: RawCountry[];
  holders: RawHolder[];
  aliases: Record<string, string[]>;
  settlements: string[];
  states?: RawState[];
  treeOffices?: RawTreeOffice[];
  /** Generic titles ("prime minister", "president"): never an office of a given country. */
  generic?: string[];
}

/** Hand corrections, kept in data/overrides.json. Keys are Wikidata ids. */
export interface Overrides {
  names?: Record<string, string>;
  aliases?: Record<string, string[]>;
  exclude?: string[];
  /** Keep these people even under the notability bar. */
  include?: string[];
  answerable?: { add?: string[]; remove?: string[] };
  /** Country id → continent, for transcontinental or unmapped countries. */
  continents?: Record<string, Continent>;
  /** Country id → three-letter code shown on phone tiles, for countries without ISO code. */
  countryCodes?: Record<string, string>;
  /** Country id → display name. */
  countryNames?: Record<string, string>;
  /** Person id → country id, when someone led several countries. */
  countries?: Record<string, string>;
  roles?: Record<string, Role>;
  /** Person id → terms checked by hand, replacing Wikidata's (first start, total and age follow). */
  terms?: Record<string, Term[]>;
  /** Office id → name used in descriptions, when Wikidata's label is wrong. */
  officeNames?: Record<string, string>;
  blurbs?: Record<string, string>;
  excludeOffices?: string[];
  excludeCountries?: string[];
  /** When someone led several countries for about as long (monarchs of several realms), prefer these. */
  preferCountries?: string[];
  /** Former state id → today's country id. The flag is shown only with `flag: true` (same flag as today). */
  mergeCountries?: Record<string, { into: string; flag?: boolean }>;
  /** Countries described by hand, for merge targets that hold no office in Wikidata. */
  countryInfo?: Record<string, { label: string; iso2?: string; iso3?: string; continent: Continent }>;
  /** Office id → country id, when an office is linked to several states. */
  countryOfOffice?: Record<string, string>;
}

export interface Options {
  today: Date;
  /** Sitelinks needed to appear in the guess list. */
  minSitelinks: number;
  /** Sitelinks needed to be proposed as a daily answer. */
  answerableSitelinks: number;
}

export interface OfficeOut {
  label: string;
  country: string;
  /** Country name as shown in the game, to match the answer's country. */
  countryName: string;
  kind: Role;
  holders: Array<{ id: string; start: string; end: string | null }>;
}

export interface ReviewRow {
  id: string;
  name: string;
  country: string;
  role: Role;
  tookOffice: number;
  yearsInOffice: number;
  ageAtStart: number | null;
  sitelinks: number;
  guessable: boolean;
  answerable: boolean;
  flags: string[];
}

const CONTINENTS: Record<string, Continent | null> = {
  Africa: 'Africa',
  Asia: 'Asia',
  Europe: 'Europe',
  'North America': 'North America',
  'Central America': 'North America',
  'South America': 'South America',
  Oceania: 'Oceania',
  'Insular Oceania': 'Oceania',
  Australia: 'Oceania',
  'Australian continent': 'Oceania',
  Eurasia: null,
  Americas: null,
};
const CONTINENT_ORDER: Continent[] = ['Europe', 'Asia', 'Africa', 'North America', 'South America', 'Oceania'];

/** Representatives and ex officio titles, not heads of state or government in their own right. */
const NOT_HEAD =
  /^(governor|governor-general|reichsstatthalter|list of governors|high commissioner|resident-general)|co-prince|acting|interim|caretaker|deputy|vice[- ]|emeritus|designate|in exile|consort|secretary|communist party|paramount leader|imperial house|pretender|region|province|provincial|district|intendant|traditional chief|olympic|comitee|committee|shura council|landesbevollmächtigter|İK|club/i;
/** Federated republics of the Soviet Union are not sovereign states. */
const NOT_STATE = /Soviet Socialist Republic/;

const day = (iso: string) => iso.slice(0, 10);
const time = (iso: string) => Date.parse(`${day(iso)}T00:00:00Z`);
const DAY_MS = 86_400_000;
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Name shown in the game: the English Wikipedia title (curated, common name), without disambiguation. */
export function displayName(label: string, article: string | undefined): string {
  if (!article) return label;
  const title = decodeURIComponent(article.split('/wiki/')[1] ?? '').replace(/_/g, ' ');
  return title.replace(/\s*\([^)]*\)$/, '').trim() || label;
}

/** Whole years from birth to a date. */
const age = (birth: string, at: string) => {
  const b = new Date(time(birth));
  const a = new Date(time(at));
  let y = a.getUTCFullYear() - b.getUTCFullYear();
  if (a.getUTCMonth() < b.getUTCMonth() || (a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() < b.getUTCDate())) y -= 1;
  return y;
};

/** Merges overlapping or touching intervals; with a tolerance, also intervals that many days apart. */
function mergeTerms(terms: Term[], toleranceDays = 0): Term[] {
  const sorted = [...terms].sort((a, b) => a.start.localeCompare(b.start));
  const out: Term[] = [];
  for (const t of sorted) {
    const last = out[out.length - 1];
    if (last && (last.end === null || time(t.start) <= time(last.end) + toleranceDays * DAY_MS)) {
      if (last.end !== null && (t.end === null || t.end > last.end)) last.end = t.end;
    } else out.push({ start: t.start, end: t.end });
  }
  return out;
}

const spanDays = (terms: Term[], today: Date) =>
  mergeTerms(terms).reduce((sum, t) => sum + ((t.end ? time(t.end) : today.getTime()) - time(t.start)) / DAY_MS, 0);

/** Days covered by both sets of terms. */
function overlapDays(a: Term[], b: Term[], today: Date): number {
  let sum = 0;
  for (const x of mergeTerms(a)) {
    for (const y of mergeTerms(b)) {
      const start = Math.max(time(x.start), time(y.start));
      const end = Math.min(x.end ? time(x.end) : today.getTime(), y.end ? time(y.end) : today.getTime());
      if (end > start) sum += (end - start) / DAY_MS;
    }
  }
  return sum;
}

interface PersonTerm extends Term {
  office: string;
  country: string;
}

export function buildDataset(raw: RawData, ov: Overrides, opts: Options) {
  const { today } = opts;
  const todayIso = today.toISOString().slice(0, 10);
  const excludedCountries = new Set(ov.excludeCountries ?? []);

  // Countries.
  const countries = new Map<string, { label: string; sovereign: boolean; iso2?: string; iso3?: string; continents: Set<string>; inception?: string; dissolved?: string }>();
  for (const s of raw.states ?? []) {
    countries.set(s.id, { label: s.label, sovereign: s.sovereign, iso2: s.iso2, iso3: s.iso3, continents: new Set(s.continents), inception: s.inception, dissolved: s.dissolved });
    if (NOT_STATE.test(s.label) && !s.sovereign) excludedCountries.add(s.id);
  }
  for (const c of raw.countries) {
    const cur = countries.get(c.country) ?? { label: c.countryLabel, sovereign: c.sovereign, iso2: c.iso2, iso3: c.iso3, continents: new Set<string>() };
    if (c.continentLabel) cur.continents.add(c.continentLabel);
    cur.sovereign ||= c.sovereign;
    countries.set(c.country, cur);
  }
  for (const s of raw.settlements) if (!countries.get(s)?.sovereign) excludedCountries.add(s);
  for (const [id, c] of Object.entries(ov.countryInfo ?? {})) {
    countries.set(id, { label: c.label, sovereign: true, iso2: c.iso2, iso3: c.iso3, continents: new Set([c.continent]) });
  }
  for (const [from, m] of Object.entries(ov.mergeCountries ?? {})) {
    if (!countries.has(m.into)) throw new Error(`mergeCountries: ${from} merges into ${m.into}, which is unknown. Describe it in countryInfo.`);
  }

  // Offices.
  const offices = new Map<string, { label: string; kinds: Set<'state' | 'gov'>; countries: Set<string> }>();
  for (const c of raw.countries) {
    if (excludedCountries.has(c.country)) continue;
    const cur = offices.get(c.office) ?? { label: c.officeLabel, kinds: new Set(), countries: new Set() };
    cur.kinds.add(c.kind);
    cur.countries.add(c.country);
    offices.set(c.office, cur);
  }
  for (const o of raw.treeOffices ?? []) {
    const cs = o.countries.filter((c) => !excludedCountries.has(c));
    if (!cs.length) continue;
    const cur = offices.get(o.office) ?? { label: o.label, kinds: new Set(), countries: new Set() };
    for (const k of o.kinds) cur.kinds.add(k);
    for (const c of cs) cur.countries.add(c);
    offices.set(o.office, cur);
  }
  const generic = new Set(raw.generic ?? []);
  for (const id of [...offices.keys()]) {
    if (generic.has(id) || NOT_HEAD.test(offices.get(id)!.label) || ov.excludeOffices?.includes(id)) offices.delete(id);
  }
  /** The state existed at that date (a year of slack on the start for transitions). */
  const alive = (c: string, start: string) => {
    const s = countries.get(c);
    return !!s && (!s.inception || time(s.inception) <= time(start) + 366 * DAY_MS) && (!s.dissolved || time(s.dissolved) >= time(start));
  };
  /** Country of one term. An office shared by several states belongs to the one alive at the time, the narrowest first. */
  const termCountry = (office: string, start: string) => {
    if (ov.countryOfOffice?.[office]) return ov.countryOfOffice[office]!;
    const list = [...offices.get(office)!.countries];
    if (list.length === 1) return list[0]!;
    const life = (c: string) => {
      const s = countries.get(c)!;
      return (s.dissolved ? time(s.dissolved) : today.getTime()) - (s.inception ? time(s.inception) : -1e15);
    };
    const fit = list.filter((c) => alive(c, start)).sort((a, b) => life(a) - life(b));
    return fit[0] ?? list.find((c) => countries.get(c)?.sovereign) ?? list[0]!;
  };
  const officeCountry = (id: string) => {
    if (ov.countryOfOffice?.[id]) return ov.countryOfOffice[id]!;
    const list = [...offices.get(id)!.countries];
    return list.find((c) => countries.get(c)?.sovereign) ?? list[0]!;
  };
  const officeKind = (id: string): Role => {
    const k = offices.get(id)!.kinds;
    return k.size > 1 ? 'both' : [...k][0]!;
  };

  // Terms per person.
  const people = new Map<string, { label: string; birth?: string; death?: string; sitelinks: number; article?: string; terms: PersonTerm[]; flags: Set<string> }>();
  const seen = new Set<string>();
  for (const h of raw.holders) {
    if (!offices.has(h.office) || h.role || !h.start) continue;
    const key = `${h.person}|${h.office}|${h.start}|${h.end ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const p = people.get(h.person) ?? { label: h.personLabel, birth: h.birth, death: h.death, sitelinks: 0, article: h.article, terms: [], flags: new Set<string>() };
    p.sitelinks = Math.max(p.sitelinks, h.sitelinks);
    p.birth ??= h.birth;
    p.death ??= h.death;
    p.article ??= h.article;
    let end: string | null = h.end ? day(h.end) : null;
    if (!end && p.death) {
      end = day(p.death);
      p.flags.add('open term after death');
    }
    if (end !== null && end < '1900-01-01') continue;
    if (end !== null && end < day(h.start)) {
      p.flags.add('term ends before it starts');
      continue;
    }
    const country = termCountry(h.office, day(h.start));
    if (!alive(country, day(h.start))) p.flags.add('term outside country dates');
    p.terms.push({ office: h.office, country, start: day(h.start), end });
    people.set(h.person, p);
  }

  const leaders: Leader[] = [];
  const review: ReviewRow[] = [];
  const excluded = new Set(ov.exclude ?? []);
  const include = new Set(ov.include ?? []);
  const addAnswer = new Set(ov.answerable?.add ?? []);
  const removeAnswer = new Set(ov.answerable?.remove ?? []);

  for (const [id, p] of people) {
    if (!p.terms.length || excluded.has(id)) continue;
    const flags = p.flags;

    // Days per office, per country, per role kind.
    const byOffice = new Map<string, PersonTerm[]>();
    // A unit is one office in one state.
    const unit = (t: PersonTerm) => `${t.office}|${t.country}`;
    for (const t of p.terms) byOffice.set(unit(t), [...(byOffice.get(unit(t)) ?? []), t]);
    const officeDays = [...byOffice].map(([office, ts]) => ({ office, days: spanDays(ts, today) })).sort((a, b) => b.days - a.days);
    const total = (pick: (office: string) => string) => {
      const m = new Map<string, number>();
      for (const o of officeDays) m.set(pick(o.office), (m.get(pick(o.office)) ?? 0) + o.days);
      return [...m].sort((a, b) => b[1] - a[1]);
    };

    const unitCountry = (u: string) => u.split('|')[1]!;
    const unitOffice = (u: string) => u.split('|')[0]!;
    const resolve = (u: string) => ov.mergeCountries?.[unitCountry(u)]?.into ?? unitCountry(u);
    const byCountry = total(resolve);
    const preferred = byCountry.find(([c, d]) => ov.preferCountries?.includes(c) && d >= 0.9 * byCountry[0]![1]);
    if (byCountry.length > 1 && !ov.countries?.[id] && !preferred) flags.add('several countries');
    const countryId = ov.countries?.[id] ?? preferred?.[0] ?? byCountry[0]![0];
    const country = countries.get(countryId)!;

    const kinds = new Set(officeDays.map((o) => officeKind(unitOffice(o.office))));
    let role: Role;
    if (kinds.has('both')) role = 'both';
    else if (kinds.size > 1) {
      // Both at the same time for most of the tenure (e.g. a president who is also prime minister).
      const of = (k: Role) => p.terms.filter((t) => officeKind(t.office) === k);
      const both = overlapDays(of('state'), of('gov'), today);
      if (both >= 0.5 * spanDays(p.terms, today)) role = 'both';
      else {
        role = total((u) => officeKind(unitOffice(u)))[0]![0] as Role;
        flags.add('held state and government offices');
      }
    } else role = [...kinds][0]!;
    role = ov.roles?.[id] ?? role;

    const mapped = [...new Set([...country.continents].map((c) => CONTINENTS[c]))];
    let continent: Continent | undefined = ov.continents?.[countryId];
    if (!continent) {
      const valid = mapped.filter((c): c is Continent => !!c);
      if (mapped.length !== 1 || !valid.length) flags.add(country.continents.size ? 'several continents' : 'no continent');
      continent = CONTINENT_ORDER.find((c) => valid.includes(c)) ?? 'Europe';
    }

    let countryCode = ov.countryCodes?.[countryId] ?? country.iso3;
    if (!countryCode) {
      flags.add('no ISO code');
      countryCode = country.label.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase().padEnd(3, 'X');
    }

    const terms = ov.terms?.[id] ? mergeTerms(ov.terms[id]!) : mergeTerms(p.terms);
    const first = terms[0]!.start;
    const name = ov.names?.[id] ?? displayName(p.label, p.article);
    const ageAtStart = p.birth ? age(p.birth, first) : null;
    if (ageAtStart === null) flags.add('no birth date');
    else if (ageAtStart < 10 || ageAtStart > 110) flags.add('odd age');
    const years = yearsInOffice({ terms } as Leader, today);

    const main = (officeDays.find((o) => resolve(o.office) === countryId) ?? officeDays[0]!).office;
    const mainTerms = mergeTerms(byOffice.get(main)!);
    const officeLabel = ov.officeNames?.[unitOffice(main)] ?? offices.get(unitOffice(main))!.label;
    const merged = ov.mergeCountries?.[unitCountry(main)];
    const from = mainTerms[0]!.start.slice(0, 4);
    const lastEnd = mainTerms[mainTerms.length - 1]!.end;
    const generic = role === 'both' ? 'Head of state and government' : role === 'state' ? 'Head of state' : 'Head of government';
    const title = /^(list of|Q\d+$)/i.test(officeLabel) ? `${generic} of ${country.label}` : capitalize(officeLabel);
    const blurb = ov.blurbs?.[id] ?? (lastEnd === null ? `${title} since ${from}.` : from === lastEnd.slice(0, 4) ? `${title} in ${from}.` : `${title} from ${from} to ${lastEnd.slice(0, 4)}.`);

    const answerable = !removeAnswer.has(id) && (addAnswer.has(id) || (p.sitelinks >= opts.answerableSitelinks && !!p.article && ageAtStart !== null));
    const guessable = ageAtStart !== null && (answerable || include.has(id) || p.sitelinks >= opts.minSitelinks);

    const lc = name.toLowerCase();
    const aliases = [...new Set([...(raw.aliases[id] ?? []), ...(name !== p.label ? [p.label] : []), ...(ov.aliases?.[id] ?? [])])]
      .filter((a, i, all) => a.toLowerCase() !== lc && all.findIndex((b) => b.toLowerCase() === a.toLowerCase()) === i);

    review.push({ id, name, country: ov.countryNames?.[countryId] ?? country.label, role, tookOffice: Number(first.slice(0, 4)), yearsInOffice: years, ageAtStart, sitelinks: p.sitelinks, guessable, answerable, flags: [...flags] });
    if (!guessable) continue;

    leaders.push({
      id,
      name,
      aliases,
      country: ov.countryNames?.[countryId] ?? country.label,
      countryCode: countryCode.toUpperCase(),
      iso2: country.iso2 && (!merged || merged.flag) ? country.iso2.toLowerCase() : null,
      continent,
      role,
      tookOffice: Number(first.slice(0, 4)),
      yearsInOffice: years,
      ageAtStart: ageAtStart!,
      terms,
      ...(p.article ? { wiki: p.article } : {}),
      blurb,
      answerable,
      sitelinks: p.sitelinks,
    } as Leader & { sitelinks: number });
  }

  leaders.sort((a, b) => ((b as Leader & { sitelinks: number }).sitelinks ?? 0) - ((a as Leader & { sitelinks: number }).sitelinks ?? 0));
  for (const l of leaders) delete (l as Partial<Leader & { sitelinks: number }>).sitelinks;

  // Office holder sequences, for Succession.
  const officesOut: Record<string, OfficeOut> = {};
  for (const [office, info] of offices) {
    const holders: OfficeOut['holders'] = [];
    for (const [id, p] of people) {
      if (excluded.has(id)) continue;
      // Wikidata often splits one tenure by government or election: join terms a month apart.
      for (const t of mergeTerms(p.terms.filter((t) => t.office === office), 31)) holders.push({ id, start: t.start, end: t.end });
    }
    if (!holders.length) continue;
    holders.sort((a, b) => a.start.localeCompare(b.start) || (a.end ?? todayIso).localeCompare(b.end ?? todayIso));
    const c = officeCountry(office);
    const shown = ov.mergeCountries?.[c]?.into ?? c;
    officesOut[office] = { label: info.label, country: c, countryName: ov.countryNames?.[shown] ?? countries.get(shown)?.label ?? shown, kind: officeKind(office), holders };
  }

  return { leaders, offices: officesOut, review };
}
