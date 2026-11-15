import type { Leader, Tile as TileData } from '../game/types';
import { IconCheck, IconDown, IconUp, IconWave } from './icons';
import s from './GuessRow.module.css';

export function ColumnHeads() {
  return (
    <div className={s.heads} aria-hidden="true">
      <span>Country</span>
      <span>Role</span>
      <span>Took office</span>
      <span>Years in office</span>
      <span>Age at start</span>
    </div>
  );
}

export function Tile({ tile, animate, index }: { tile: TileData; animate: boolean; index: number }) {
  const cls = [s.tile, s[tile.state], tile.numeric && s.numeric, animate && s.flip].filter(Boolean).join(' ');
  return (
    <div role="img" aria-label={tile.aria} className={cls} style={animate ? { animationDelay: `${index * 130}ms` } : undefined}>
      <span className={s.full}>{tile.value}</span>
      <span className={s.short}>{tile.short}</span>
      {tile.dir === 'up' && <IconUp size={18} />}
      {tile.dir === 'down' && <IconDown size={18} />}
      {tile.inOffice && <span className={s.inOffice}>In office</span>}
      {tile.state === 'correct' && (
        <span className={s.badge}>
          <IconCheck size={12} weight={4.5} />
        </span>
      )}
      {tile.state === 'close' && (
        <span className={s.badge}>
          <IconWave size={12} />
        </span>
      )}
    </div>
  );
}

export function GuessRow({ leader, tiles, animate }: { leader: Leader; tiles: TileData[]; animate: boolean }) {
  return (
    <div className={s.row}>
      <div className={s.who}>
        <strong className={s.name}>{leader.name}</strong>
        <span className={s.country}>{leader.country}</span>
      </div>
      <div className={s.grid}>
        {tiles.map((t, i) => (
          <Tile key={t.key} tile={t} animate={animate} index={i} />
        ))}
      </div>
    </div>
  );
}
