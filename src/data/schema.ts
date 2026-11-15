import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const TermSchema = z.object({
  start: isoDate,
  end: isoDate.nullable(),
  office: z.string().optional(),
});

export const LeaderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  country: z.string().min(1),
  countryCode: z.string().length(3),
  iso2: z.string().length(2).nullable(),
  continent: z.enum(['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania']),
  role: z.enum(['state', 'gov', 'both']),
  tookOffice: z.number().int().min(1800).max(2100),
  ageAtStart: z.number().int().min(0).max(110),
  yearsInOffice: z.number().int().min(0).max(100),
  terms: z.array(TermSchema).optional(),
  wiki: z.string().url().optional(),
  blurb: z.string().optional(),
  answerable: z.boolean().optional(),
});

export const LeaderFileSchema = z.object({
  version: z.number().int(),
  leaders: z.array(LeaderSchema),
});

/** Leader Mayhem ratings: leader id → five whole numbers from 1 to 10 (education, war, economy, domestic, foreign). */
export const MayhemFileSchema = z.object({
  version: z.number().int(),
  ratings: z.record(z.array(z.number().int().min(1).max(10)).length(5)),
});

const five = z.array(z.string()).length(5);

export const DayPuzzleSchema = z.object({
  n: z.number().int().min(1),
  classic: z.object({ answer: z.string() }),
  letters: z.object({
    answer: z.string(),
    /** The name to spell: capital letters, single spaces between words. */
    word: z.string().regex(/^[A-Z]+( [A-Z]+)*$/),
  }),
  succession: z.object({
    before: z.string(),
    answer: z.string(),
    after: z.string(),
    /** The answer's term between the two neighbours, e.g. "2005 – 2021". */
    years: z.string(),
    beforeYears: z.string(),
    afterYears: z.string(),
  }),
  timeline: z
    .object({
      /** Correct order, earliest first. */
      order: five,
      /** Order shown at the start. */
      start: five,
    })
    .refine((t) => new Set(t.order).size === 5 && [...t.start].sort().join() === [...t.order].sort().join(), {
      message: 'Timeline start must be the same five distinct cards as order',
    }),
});

export type DayPuzzle = z.infer<typeof DayPuzzleSchema>;
