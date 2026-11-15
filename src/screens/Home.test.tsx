import { render, screen } from '@testing-library/react';
import { AppProvider } from '../app/context';
import type { DayPuzzle } from '../data/schema';
import { SAMPLE_LEADERS } from '../game/fixtures';
import { initialState, reducer } from '../store/state';
import { Home } from './Home';

const puzzle = (n: number, classic: string): DayPuzzle => ({
  n,
  classic: { answer: classic },
  letters: { answer: 'oba', word: 'OBAMA' },
  succession: { before: 'tha', answer: 'mer', after: 'ard', years: '2005 – 2021', beforeYears: '1979 – 1990', afterYears: '2017 – 2023' },
  timeline: { order: ['lky', 'tha', 'man', 'mer', 'ard'], start: ['man', 'ard', 'lky', 'mer', 'tha'] },
});

const home = (yesterdayAnswer: string) => {
  const initial = reducer(initialState(), { type: 'start', puzzle: puzzle(127, yesterdayAnswer) });
  return render(
    <AppProvider leaders={SAMPLE_LEADERS} puzzle={puzzle(128, 'mer')} initial={initial} store={null} frozen>
      <Home />
    </AppProvider>,
  );
};

describe('Home', () => {
  it("names yesterday's Classic answer for a returning player", () => {
    home('tha');
    expect(screen.getByText('Margaret Thatcher')).toBeInTheDocument();
  });

  it('still opens when yesterday’s answer is no longer in the leader list', () => {
    home('removed-since');
    expect(screen.getByRole('heading', { name: "Today's puzzles" })).toBeInTheDocument();
    expect(screen.queryByText(/Yesterday/)).not.toBeInTheDocument();
  });
});
