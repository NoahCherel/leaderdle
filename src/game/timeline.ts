export type Locks = readonly number[];

/** Next free slot from `i` in direction `dir`, skipping locked cards. -1 if none. */
export function target(locked: Locks, i: number, dir: -1 | 1): number {
  let j = i + dir;
  while (j >= 0 && j < locked.length && locked[j]) j += dir;
  return j < 0 || j >= locked.length ? -1 : j;
}

const free = (locked: Locks, i: number) => i >= 0 && i < locked.length && !locked[i];

/** Swaps two free cards (move up and down buttons). Returns the same array when not allowed. */
export function swap<T>(order: readonly T[], locked: Locks, i: number, j: number): readonly T[] {
  if (i === j || !free(locked, i) || !free(locked, j)) return order;
  const out = order.slice();
  [out[i], out[j]] = [out[j]!, out[i]!];
  return out;
}

/** Drag and drop: moves a card among the free slots only, locked cards keep their place. */
export function moveFree<T>(order: readonly T[], locked: Locks, from: number, to: number): readonly T[] {
  if (from === to || !free(locked, from) || !free(locked, to)) return order;
  const slots = order.map((_, i) => i).filter((i) => !locked[i]);
  const items = slots.map((i) => order[i]!);
  const a = slots.indexOf(from);
  const b = slots.indexOf(to);
  const [moved] = items.splice(a, 1);
  items.splice(b, 0, moved!);
  const out = order.slice();
  slots.forEach((slot, k) => {
    out[slot] = items[k]!;
  });
  return out;
}

/** 1 for each card in the right spot. */
export function checkOrder<T>(order: readonly T[], sorted: readonly T[]): number[] {
  return order.map((id, i) => (id === sorted[i] ? 1 : 0));
}
