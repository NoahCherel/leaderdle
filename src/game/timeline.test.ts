import { checkOrder, moveFree, swap, target } from './timeline';

const order = ['a', 'b', 'c', 'd', 'e'];

describe('target (buttons skip locked cards)', () => {
  it('moves to the neighbour when it is free', () => {
    expect(target([0, 0, 0, 0, 0], 2, -1)).toBe(1);
    expect(target([0, 0, 0, 0, 0], 2, 1)).toBe(3);
  });
  it('jumps over locked cards', () => {
    expect(target([1, 0, 1, 0, 1], 1, 1)).toBe(3);
    expect(target([1, 0, 1, 0, 1], 3, -1)).toBe(1);
  });
  it('returns -1 at the edges', () => {
    expect(target([1, 0, 1, 0, 1], 1, -1)).toBe(-1);
    expect(target([0, 0, 0, 0, 0], 4, 1)).toBe(-1);
  });
});

describe('swap', () => {
  it('swaps two free cards', () => {
    expect(swap(order, [0, 0, 0, 0, 0], 0, 1)).toEqual(['b', 'a', 'c', 'd', 'e']);
  });
  it('refuses to move a locked card or leave the list', () => {
    expect(swap(order, [1, 0, 0, 0, 0], 0, 1)).toBe(order);
    expect(swap(order, [0, 0, 0, 0, 0], 0, -1)).toBe(order);
  });
});

describe('moveFree (drag reorders free slots, locked cards stay put)', () => {
  it('reorders like a list when nothing is locked', () => {
    expect(moveFree(order, [0, 0, 0, 0, 0], 0, 3)).toEqual(['b', 'c', 'd', 'a', 'e']);
    expect(moveFree(order, [0, 0, 0, 0, 0], 4, 1)).toEqual(['a', 'e', 'b', 'c', 'd']);
  });
  it('keeps locked cards in place', () => {
    // Free slots 1, 3, 4 hold b, d, e. Dragging b to slot 4 gives d, e, b.
    expect(moveFree(order, [1, 0, 1, 0, 0], 1, 4)).toEqual(['a', 'd', 'c', 'e', 'b']);
  });
  it('ignores drops on or from a locked slot', () => {
    expect(moveFree(order, [1, 0, 1, 0, 0], 1, 2)).toBe(order);
    expect(moveFree(order, [1, 0, 1, 0, 0], 0, 3)).toBe(order);
  });
});

describe('checkOrder', () => {
  it('marks cards in the right spot', () => {
    expect(checkOrder(['lky', 'mer', 'man', 'tha', 'ard'], ['lky', 'tha', 'man', 'mer', 'ard'])).toEqual([1, 0, 1, 0, 1]);
  });
});
