import { describe, expect, it } from 'vitest';
import { parseCsv, toCsv } from './csv';

describe('csv', () => {
  it('reads quoted cells with commas, quotes and CRLF line ends', () => {
    expect(parseCsv('id,name\r\nQ1,"Hussein, King"\r\nQ2,"Say ""hi"""\r\n')).toEqual([
      ['id', 'name'],
      ['Q1', 'Hussein, King'],
      ['Q2', 'Say "hi"'],
    ]);
  });
  it('keeps empty cells and skips blank lines', () => {
    expect(parseCsv('a,,c\n\n1,2,\n')).toEqual([
      ['a', '', 'c'],
      ['1', '2', ''],
    ]);
  });
  it('writes what it reads back', () => {
    const rows = [['Q1', 'Hussein, King', 'a "b"', 5]];
    expect(parseCsv(toCsv(rows))).toEqual([['Q1', 'Hussein, King', 'a "b"', '5']]);
  });
});
