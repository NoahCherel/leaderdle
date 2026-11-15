import type { Leader } from './types';

/** The 17 prototype leaders (leaderdle-passation/donnees/leaders.json). Used by tests and dev scenes. */
const raw: Array<Omit<Leader, 'aliases' | 'iso2'> & { aliases?: string[]; iso2: string }> = [
  { id: 'lky', name: 'Lee Kuan Yew', country: 'Singapore', countryCode: 'SGP', iso2: 'sg', continent: 'Asia', role: 'gov', tookOffice: 1959, yearsInOffice: 31, ageAtStart: 35 },
  { id: 'tha', name: 'Margaret Thatcher', country: 'United Kingdom', countryCode: 'GBR', iso2: 'gb', continent: 'Europe', role: 'gov', tookOffice: 1979, yearsInOffice: 11, ageAtStart: 53 },
  { id: 'man', name: 'Nelson Mandela', country: 'South Africa', countryCode: 'ZAF', iso2: 'za', continent: 'Africa', role: 'both', tookOffice: 1994, yearsInOffice: 5, ageAtStart: 75 },
  { id: 'mer', name: 'Angela Merkel', country: 'Germany', countryCode: 'DEU', iso2: 'de', continent: 'Europe', role: 'gov', tookOffice: 2005, yearsInOffice: 16, ageAtStart: 51 },
  { id: 'ard', name: 'Jacinda Ardern', country: 'New Zealand', countryCode: 'NZL', iso2: 'nz', continent: 'Oceania', role: 'gov', tookOffice: 2017, yearsInOffice: 5, ageAtStart: 37 },
  { id: 'chu', name: 'Winston Churchill', country: 'United Kingdom', countryCode: 'GBR', iso2: 'gb', continent: 'Europe', role: 'gov', tookOffice: 1940, yearsInOffice: 8, ageAtStart: 65 },
  { id: 'fdr', name: 'Franklin D. Roosevelt', aliases: ['FDR', 'Franklin Delano Roosevelt'], country: 'United States', countryCode: 'USA', iso2: 'us', continent: 'North America', role: 'both', tookOffice: 1933, yearsInOffice: 12, ageAtStart: 51 },
  { id: 'jfk', name: 'John F. Kennedy', aliases: ['JFK', 'John Fitzgerald Kennedy'], country: 'United States', countryCode: 'USA', iso2: 'us', continent: 'North America', role: 'both', tookOffice: 1961, yearsInOffice: 2, ageAtStart: 43 },
  { id: 'rea', name: 'Ronald Reagan', country: 'United States', countryCode: 'USA', iso2: 'us', continent: 'North America', role: 'both', tookOffice: 1981, yearsInOffice: 8, ageAtStart: 69 },
  { id: 'oba', name: 'Barack Obama', country: 'United States', countryCode: 'USA', iso2: 'us', continent: 'North America', role: 'both', tookOffice: 2009, yearsInOffice: 8, ageAtStart: 47 },
  { id: 'neh', name: 'Jawaharlal Nehru', country: 'India', countryCode: 'IND', iso2: 'in', continent: 'Asia', role: 'gov', tookOffice: 1947, yearsInOffice: 16, ageAtStart: 57 },
  { id: 'gan', name: 'Indira Gandhi', country: 'India', countryCode: 'IND', iso2: 'in', continent: 'Asia', role: 'gov', tookOffice: 1966, yearsInOffice: 15, ageAtStart: 48 },
  { id: 'mei', name: 'Golda Meir', country: 'Israel', countryCode: 'ISR', iso2: 'il', continent: 'Asia', role: 'gov', tookOffice: 1969, yearsInOffice: 5, ageAtStart: 70 },
  { id: 'koh', name: 'Helmut Kohl', country: 'Germany', countryCode: 'DEU', iso2: 'de', continent: 'Europe', role: 'gov', tookOffice: 1982, yearsInOffice: 16, ageAtStart: 52 },
  { id: 'bla', name: 'Tony Blair', country: 'United Kingdom', countryCode: 'GBR', iso2: 'gb', continent: 'Europe', role: 'gov', tookOffice: 1997, yearsInOffice: 10, ageAtStart: 43 },
  { id: 'eli', name: 'Elizabeth II', aliases: ['Queen Elizabeth', 'Queen Elizabeth II', 'Elizabeth the Second'], country: 'United Kingdom', countryCode: 'GBR', iso2: 'gb', continent: 'Europe', role: 'state', tookOffice: 1952, yearsInOffice: 70, ageAtStart: 25 },
  { id: 'cla', name: 'Helen Clark', country: 'New Zealand', countryCode: 'NZL', iso2: 'nz', continent: 'Oceania', role: 'gov', tookOffice: 1999, yearsInOffice: 8, ageAtStart: 49 },
];

export const SAMPLE_LEADERS: Leader[] = raw.map((l) => ({ ...l, aliases: l.aliases ?? [] }));
export const byId = (id: string): Leader => {
  const l = SAMPLE_LEADERS.find((x) => x.id === id);
  if (!l) throw new Error('unknown leader ' + id);
  return l;
};
