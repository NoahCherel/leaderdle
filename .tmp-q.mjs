import { writeFileSync } from 'node:fs';
const sparql = async (q, n = 1) => {
  const r = await fetch('https://query.wikidata.org/sparql', { method: 'POST', headers: { Accept: 'application/sparql-results+json', 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'LeaderdleDataBuild/0.1 (static game data build; https://leaderdle.com)' }, body: new URLSearchParams({ query: q }) });
  if (!r.ok) { if (n < 5) { await new Promise((s) => setTimeout(s, 5000 * n)); return sparql(q, n + 1); } throw new Error(r.status); }
  return (await r.json()).results.bindings;
};
const id = (v) => v.split('/').pop();
// States: sovereign, or historical country still existing in 1900.
const states = await sparql(`SELECT DISTINCT ?c WHERE { { ?c wdt:P31 wd:Q3624078 } UNION { ?c wdt:P31/wdt:P279* wd:Q3024240 . OPTIONAL { ?c wdt:P576 ?d } FILTER(!BOUND(?d) || YEAR(?d) >= 1900) } }`);
const stateSet = new Set(states.map((b) => id(b.c.value)));
console.log('states', stateSet.size);
const rows = await sparql(`SELECT ?c ?cLabel WHERE { VALUES ?p { wd:Q48352 wd:Q116 wd:Q30461 wd:Q2285706 wd:Q14212 } ?c wdt:P279 ?p . FILTER NOT EXISTS { ?c wdt:P1001 ?j } SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }`);
const labels = [...new Set(rows.map((b) => b.cLabel.value))].sort();
console.log(labels.length); console.log(labels.join(' | '));
writeFileSync('.tmp-states.json', JSON.stringify([...stateSet]));
