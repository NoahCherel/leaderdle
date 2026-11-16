import { describe, expect, it } from 'vitest';
import { PORTFOLIOS } from './mayhem';
import { buildDuelStory, rivalCoalitionName } from './mayhem-actions';
import type { Leader } from './types';

const makeLeader = (id: string, name: string): Leader => ({
  id,
  name,
  aliases: [],
  country: 'France',
  countryCode: 'FRA',
  iso2: 'fr',
  continent: 'Europe',
  role: 'state',
  tookOffice: 1958,
  ageAtStart: 67,
  yearsInOffice: 10,
});

describe('mayhem-actions', () => {
  const l1 = makeLeader('Q8016', 'Winston Churchill');
  const l2 = makeLeader('Q2042', 'Charles de Gaulle');
  const generic1 = makeLeader('Q9991', 'Leader One');
  const generic2 = makeLeader('Q9992', 'Leader Two');

  it('produces deterministic stories for the same seed, round, and portfolio', () => {
    const a = buildDuelStory(42, 0, 1, l1, l2, 10, 8, true);
    const b = buildDuelStory(42, 0, 1, l1, l2, 10, 8, true);
    expect(a).toEqual(b);
    expect(rivalCoalitionName(42, 0)).toBe(rivalCoalitionName(42, 0));
  });

  it('uses signature actions for iconic leaders when available and distinct actions for generic leaders', () => {
    const warStory = buildDuelStory(7, 1, 1, l1, l2, 10, 8, true);
    expect(warStory.myAction).toContain('Grand Alliance');
    expect(warStory.theirAction).toContain('Free France');

    for (let slot = 0; slot < PORTFOLIOS.length; slot++) {
      for (const score of [2, 6, 9]) {
        const s = buildDuelStory(19, 0, slot, generic1, generic2, score, score, true);
        expect(s.myAction).not.toBe(s.theirAction);
        expect(s.crisis.length).toBeGreaterThan(5);
        expect(s.climax.length).toBeGreaterThan(5);
      }
    }
  });

  it('marks upsets and generates upset climax copy when the lower-scored leader wins', () => {
    const upsetWin = buildDuelStory(12, 0, 2, generic1, generic2, 3, 9, true);
    expect(upsetWin.upset).toBe(true);
    expect(upsetWin.climax).toMatch(/upset|expectations/i);

    const upsetLoss = buildDuelStory(12, 0, 2, generic1, generic2, 9, 3, false);
    expect(upsetLoss.upset).toBe(true);
    expect(upsetLoss.climax).toMatch(/upset|odds|twist/i);
  });

  it('never emits any string matching /\\/10|\\/50|rating/i (guarded by e2e test)', () => {
    const forbidden = /\/10|\/50|rating/i;
    for (let seed = 1; seed <= 50; seed++) {
      for (let round = 0; round < 3; round++) {
        expect(rivalCoalitionName(seed, round)).not.toMatch(forbidden);
        for (let slot = 0; slot < PORTFOLIOS.length; slot++) {
          for (const [m, t, w] of [
            [9, 2, true],
            [2, 9, true],
            [9, 2, false],
            [6, 6, true],
            [5, 6, false],
          ] as const) {
            const story = buildDuelStory(seed, round, slot, generic1, generic2, m, t, w);
            expect(story.crisis).not.toMatch(forbidden);
            expect(story.myAction).not.toMatch(forbidden);
            expect(story.theirAction).not.toMatch(forbidden);
            expect(story.climax).not.toMatch(forbidden);
          }
        }
      }
    }
  });
});
