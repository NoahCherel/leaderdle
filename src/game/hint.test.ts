import { initials } from './hint';

describe('initials', () => {
  it.each([
    ['Angela Merkel', 'A. M.'],
    ['Lee Kuan Yew', 'L. K. Y.'],
    ['Franklin D. Roosevelt', 'F. D. R.'],
    ['Elizabeth II', 'E. II'],
    ['Charles de Gaulle', 'C. de G.'],
    ['Ólafur Ragnar Grímsson', 'Ó. R. G.'],
  ])('%s gives %s', (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});
