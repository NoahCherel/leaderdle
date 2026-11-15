import { yearsInOffice, isInOffice, termSpan } from './tenure';
import { byId } from './fixtures';
import type { Leader } from './types';

const today = new Date(2026, 10, 15);
const withTerms = (terms: Leader['terms']): Leader => ({ ...byId('mer'), terms });

describe('yearsInOffice', () => {
  it('falls back to the stored total when no terms are known', () => {
    expect(yearsInOffice(byId('tha'), today)).toBe(11);
  });

  it('floors a single closed term to whole years', () => {
    expect(yearsInOffice(withTerms([{ start: '2005-11-22', end: '2021-12-08' }]), today)).toBe(16);
  });

  it('sums separate terms before flooring', () => {
    // 1 y 8 m + 1 y 6 m = 3 y 2 m
    const l = withTerms([
      { start: '2000-01-01', end: '2001-09-01' },
      { start: '2010-01-01', end: '2011-07-01' },
    ]);
    expect(yearsInOffice(l, today)).toBe(3);
  });

  it('does not double count overlapping terms', () => {
    const l = withTerms([
      { start: '2000-01-01', end: '2004-01-01' },
      { start: '2002-01-01', end: '2006-01-01' },
    ]);
    expect(yearsInOffice(l, today)).toBe(6);
  });

  it('counts an open term up to today', () => {
    expect(yearsInOffice(withTerms([{ start: '2020-11-16', end: null }]), today)).toBe(5);
    expect(yearsInOffice(withTerms([{ start: '2020-11-15', end: null }]), today)).toBe(6);
  });
});

describe('isInOffice', () => {
  it('is true only when a term is open', () => {
    expect(isInOffice(byId('mer'))).toBe(false);
    expect(isInOffice(withTerms([{ start: '2020-01-01', end: null }]))).toBe(true);
  });
});

describe('termSpan', () => {
  it('shows first start to last end when terms are known', () => {
    expect(termSpan(withTerms([{ start: '2005-11-22', end: '2021-12-08' }]))).toBe('2005 – 2021');
    expect(termSpan(withTerms([{ start: '2020-11-16', end: null }]))).toBe('2020 – present');
  });

  it('falls back to the prototype wording without terms', () => {
    expect(termSpan(byId('tha'))).toBe('from 1979, 11 years in office');
  });
});
