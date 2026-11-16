import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type Announcements, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, type SortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMemo } from 'react';
import { useApp } from '../app/context';
import { IconCheck, IconDown, IconGrip, IconUp } from '../components/icons';
import { shareTimeline } from '../game/share';
import { checkOrder, moveFree, swap, target } from '../game/timeline';
import type { Leader } from '../game/types';
import { GameLayout, OrderCard, Result, ResumedBanner, TitleRow, gameStyles as s, leftLabel } from './GameParts';

interface CardProps {
  leader: Leader;
  pos: number;
  locked: boolean;
  good: boolean;
  done: boolean;
  upTo: number;
  downTo: number;
  onMove: (to: number) => void;
}

function Card({ leader, pos, locked, good, done, upTo, downTo, onMove }: CardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: leader.id, disabled: locked });
  const cls = [s.tcard, good && s.tcardGood, !good && done && s.tcardBad, isDragging && s.tcardDragging].filter(Boolean).join(' ');
  return (
    <li ref={setNodeRef} className={cls} style={{ transform: CSS.Translate.toString(transform), transition }}>
      {locked ? (
        <span className={s.pos}>{pos}</span>
      ) : (
        <button type="button" ref={setActivatorNodeRef} className={s.handle} aria-label={`Drag ${leader.name}, position ${pos}`} {...attributes} {...listeners}>
          <IconGrip size={16} />
          <span className={s.pos} aria-hidden="true">
            {pos}
          </span>
        </button>
      )}
      <span className={s.who}>
        <strong>{leader.name}</strong>
        <span>{done ? `${leader.country} · ${leader.tookOffice}` : leader.country}</span>
      </span>
      {locked ? (
        <span className={s.lock}>
          {good && <IconCheck size={18} />}
          {good ? 'Right spot' : 'Wrong spot'}
        </span>
      ) : (
        <span className={s.moves}>
          <button type="button" className={s.move} aria-label={`Move ${leader.name} up`} disabled={upTo < 0} onClick={() => onMove(upTo)}>
            <IconUp size={20} weight={3} />
          </button>
          <button type="button" className={s.move} aria-label={`Move ${leader.name} down`} disabled={downTo < 0} onClick={() => onMove(downTo)}>
            <IconDown size={20} weight={3} />
          </button>
        </span>
      )}
    </li>
  );
}

export function Timeline() {
  const { day, status, byId, dispatch, n, fresh, markFresh, flash } = useApp();
  const st = status.timeline;
  const order = day.order;
  const locked = st.locked;
  const sorted = day.puzzle.timeline.order;
  // The order already checked would cost a check for nothing.
  const unchanged = day.checked?.join() === order.join();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Locked cards never move, even while another card is dragged over them.
  const strategy = useMemo<SortingStrategy>(
    () =>
      ({ rects, activeIndex, overIndex, index }) => {
        const idx = order.map((_, i) => i);
        const next = moveFree(idx, locked, activeIndex, overIndex);
        const to = next.indexOf(index);
        const from = rects[index];
        const dest = rects[to];
        if (to === index || !from || !dest) return { x: 0, y: 0, scaleX: 1, scaleY: 1 };
        return { x: 0, y: dest.top - from.top, scaleX: 1, scaleY: 1 };
      },
    [order, locked],
  );

  const setOrder = (next: readonly string[]) => {
    if (next !== order) dispatch({ type: 'order', n, order: [...next] });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    setOrder(moveFree(order, locked, order.indexOf(String(active.id)), order.indexOf(String(over.id))));
  };

  const name = (id: string | number) => byId(String(id)).name;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${name(active.id)}. Use the arrow keys to move, space to drop.`,
    onDragOver: ({ active, over }) => (over ? `${name(active.id)} is over position ${order.indexOf(String(over.id)) + 1}.` : `${name(active.id)} is not over a position.`),
    onDragEnd: ({ active, over }) => (over ? `${name(active.id)} dropped at position ${order.indexOf(String(over.id)) + 1}.` : `${name(active.id)} dropped.`),
    onDragCancel: ({ active }) => `Moving ${name(active.id)} was cancelled.`,
  };

  const check = () => {
    const right = checkOrder(order, sorted).filter(Boolean).length;
    dispatch({ type: 'check', n });
    markFresh('timeline', String(day.checks.length + 1));
    if (right < 5 && day.checks.length + 1 < 3) flash(`${right} of 5 in the right spot`);
  };

  return (
    <GameLayout mode="timeline">
      <TitleRow mode="timeline" left={leftLabel('timeline', st)} />
      {st.done && (
        <Result
          mode="timeline"
          won={st.won}
          used={st.used}
          scoreLine={st.won ? `Solved in ${st.used} of 3 ${st.used === 1 ? 'check' : 'checks'}` : 'Out of checks. Here is the right order.'}
          celebrate={st.won && fresh?.mode === 'timeline' && fresh.id === String(st.used)}
          grid={day.checks.map((row) => row.map((v) => ({ kind: v ? 'g' : 'x' })))}
          shareText={shareTimeline(n, day.checks, st)}
        >
          <OrderCard ids={sorted} />
        </Result>
      )}
      <ResumedBanner mode="timeline" />
      <div className={s.stack}>
        {!st.done && <p>Put these five leaders in order, from the earliest to take office to the most recent. Drag the cards or use the arrows.</p>}
        {!st.done && <span aria-hidden="true" className={`eyebrow ${s.axisLabel}`}>↑ Earliest to take office</span>}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} accessibility={{ announcements }}>
          <SortableContext items={order} strategy={strategy}>
            <ol className={s.cards} aria-label="Leaders to order">
              {order.map((id, i) => (
                <Card
                  key={id}
                  leader={byId(id)}
                  pos={i + 1}
                  locked={!!locked[i] || st.done}
                  good={!!locked[i]}
                  done={st.done}
                  upTo={target(locked, i, -1)}
                  downTo={target(locked, i, 1)}
                  onMove={(to) => setOrder(swap(order, locked, i, to))}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
        {!st.done && <span aria-hidden="true" className={`eyebrow ${s.axisLabel}`}>↓ Most recent to take office</span>}
        {!st.done && (
          <>
            <button type="button" className="btn btn--lg" onClick={check} disabled={unchanged} aria-describedby={unchanged ? 'check-hint' : undefined}>
              Check my order
            </button>
            {unchanged && (
              <p id="check-hint" className={`muted ${s.checkHint}`}>
                Move a card to check again.
              </p>
            )}
          </>
        )}
      </div>
    </GameLayout>
  );
}
