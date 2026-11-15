// Downloads raw data from Wikidata into data/raw/ (cached; delete a file to refetch).
//   1. countries.json: sovereign and historical states with their head-of-state (P1906)
//      and head-of-government (P1313) offices, ISO codes and continent.
//   2. holders.json: every person who held one of those offices (P39) with term dates,
//      predecessor/successor qualifiers, birth and death dates, Wikipedia article and sitelink count.
//   3. aliases.json: English alternative names of those people.
// Usage: node scripts/leaders/fetch.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const ENDPOINT = 'https://query.wikidata.org/sparql';
const UA = 'LeaderdleDataBuild/0.1 (static game data build; https://leaderdle.com)';
const RAW = 'data/raw';
mkdirSync(RAW, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sparql(query, attempt = 1) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Accept: 'application/sparql-results+json', 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
    body: new URLSearchParams({ query }),
  });
  if (res.status === 429 || res.status >= 500) {
    if (attempt > 5) throw new Error(`Wikidata ${res.status} after ${attempt} attempts`);
    const wait = Number(res.headers.get('retry-after') ?? 0) * 1000 || 5000 * attempt;
    console.warn(`  ${res.status}, retrying in ${wait / 1000}s`);
    await sleep(wait);
    return sparql(query, attempt + 1);
  }
  if (!res.ok) throw new Error(`Wikidata ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  return json.results.bindings.map((b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.value])));
}

const qid = (uri) => uri?.replace('http://www.wikidata.org/entity/', '');

async function cached(name, fn) {
  const path = `${RAW}/${name}.json`;
  if (existsSync(path)) return JSON.parse(readFileSync(path, 'utf8'));
  const data = await fn();
  writeFileSync(path, JSON.stringify(data));
  return data;
}

const chunks = (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

// 1. Countries and their offices.
const countries = await cached('countries', async () => {
  console.log('countries…');
  const rows = await sparql(`
    SELECT DISTINCT ?country ?countryLabel ?sovereign ?iso2 ?iso3 ?continent ?continentLabel ?dissolved ?office ?officeLabel ?kind WHERE {
      { ?country wdt:P31 wd:Q3624078 . BIND(true AS ?sovereign) }
      UNION { ?country wdt:P31/wdt:P279* wd:Q3024240 . }
      { ?country wdt:P1906 ?office . BIND("state" AS ?kind) } UNION { ?country wdt:P1313 ?office . BIND("gov" AS ?kind) }
      OPTIONAL { ?country wdt:P576 ?dissolved . }
      FILTER(!BOUND(?dissolved) || YEAR(?dissolved) >= 1900)
      OPTIONAL { ?country wdt:P297 ?iso2 . }
      OPTIONAL { ?country wdt:P298 ?iso3 . }
      OPTIONAL { ?country wdt:P30 ?continent . }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }`);
  return rows.map((r) => ({ ...r, country: qid(r.country), office: qid(r.office), continent: qid(r.continent), sovereign: r.sovereign === 'true' }));
});
const offices = [...new Set(countries.map((c) => c.office))];
console.log(`${new Set(countries.map((c) => c.country)).size} countries, ${offices.length} offices`);

// 1b. Which of those "countries" are really cities or other settlements (their mayors show up as heads of government).
await cached('settlements', async () => {
  console.log('settlements…');
  const ids = [...new Set(countries.map((c) => c.country))];
  const rows = await sparql(`
    SELECT DISTINCT ?country WHERE {
      VALUES ?country { ${ids.map((c) => `wd:${c}`).join(' ')} }
      ?country wdt:P31/wdt:P279* wd:Q486972 .
    }`);
  return rows.map((r) => qid(r.country));
});

// 2. Office holders, in batches.
const holders = await cached('holders', async () => {
  const out = [];
  for (const [i, batch] of chunks(offices, 40).entries()) {
    console.log(`holders ${i + 1}/${Math.ceil(offices.length / 40)}…`);
    const rows = await sparql(`
      SELECT ?office ?person ?personLabel ?start ?end ?birth ?death ?replaces ?replacedBy ?role ?sitelinks ?article WHERE {
        VALUES ?office { ${batch.map((o) => `wd:${o}`).join(' ')} }
        ?person p:P39 ?st . ?st ps:P39 ?office .
        ?person wdt:P31 wd:Q5 .
        OPTIONAL { ?st pq:P580 ?start . }
        OPTIONAL { ?st pq:P582 ?end . }
        OPTIONAL { ?st pq:P1365 ?replaces . }
        OPTIONAL { ?st pq:P1366 ?replacedBy . }
        OPTIONAL { ?st pq:P2868 ?role . }
        OPTIONAL { ?person wdt:P569 ?birth . }
        OPTIONAL { ?person wdt:P570 ?death . }
        OPTIONAL { ?person wikibase:sitelinks ?sitelinks . }
        OPTIONAL { ?article schema:about ?person ; schema:isPartOf <https://en.wikipedia.org/> . }
        FILTER(!BOUND(?end) || YEAR(?end) >= 1900)
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }`);
    out.push(...rows.map((r) => ({ ...r, office: qid(r.office), person: qid(r.person), replaces: qid(r.replaces), replacedBy: qid(r.replacedBy), role: qid(r.role), sitelinks: Number(r.sitelinks ?? 0) })));
    await sleep(1000);
  }
  return out;
});
const people = [...new Set(holders.map((h) => h.person))];
console.log(`${holders.length} term rows, ${people.length} people`);

// 3. English aliases.
await cached('aliases', async () => {
  const out = {};
  for (const [i, batch] of chunks(people, 300).entries()) {
    console.log(`aliases ${i + 1}/${Math.ceil(people.length / 300)}…`);
    const rows = await sparql(`
      SELECT ?person ?alias WHERE {
        VALUES ?person { ${batch.map((p) => `wd:${p}`).join(' ')} }
        ?person skos:altLabel ?alias . FILTER(LANG(?alias) = "en")
      }`);
    for (const r of rows) (out[qid(r.person)] ??= []).push(r.alias);
    await sleep(1000);
  }
  return out;
});
console.log('done');
