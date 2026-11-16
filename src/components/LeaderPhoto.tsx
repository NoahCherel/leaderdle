import { useEffect, useRef, useState } from 'react';
import type { Leader } from '../game/types';
import s from './ui.module.css';

export type PhotoSize = 'xs' | 'sm' | 'md' | 'lg';

const photoCache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

function wikiSlug(leader: Leader): string {
  if (leader.wiki) {
    const idx = leader.wiki.indexOf('/wiki/');
    if (idx !== -1) return leader.wiki.slice(idx + 6);
  }
  return encodeURIComponent(leader.name.replace(/ /g, '_'));
}

export function fetchLeaderPhoto(leader: Leader): Promise<string | null> {
  if (photoCache.has(leader.id)) return Promise.resolve(photoCache.get(leader.id)!);
  const existing = inflight.get(leader.id);
  if (existing) return existing;

  const slug = wikiSlug(leader);
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`;
  const req = (typeof fetch === 'function' ? fetch(url) : Promise.reject(new Error('no fetch')))
    .then(async (res) => {
      if (!res.ok) return null;
      const json = (await res.json()) as { thumbnail?: { source?: string } };
      const src = typeof json?.thumbnail?.source === 'string' ? json.thumbnail.source : null;
      if (src && typeof Image !== 'undefined') {
        const img = new Image();
        img.src = src;
      }
      return src;
    })
    .catch(() => null)
    .then((src) => {
      photoCache.set(leader.id, src);
      inflight.delete(leader.id);
      return src;
    });

  inflight.set(leader.id, req);
  return req;
}

export function prefetchLeaderPhotos(leaders: ReadonlyArray<Leader | null | undefined>): void {
  for (const l of leaders) {
    if (l) void fetchLeaderPhoto(l);
  }
}

export function LeaderPhoto({ leader, size = 'md', className }: { leader: Leader; size?: PhotoSize; className?: string }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const cached = photoCache.get(leader.id);
  const [src, setSrc] = useState<string | null>(cached ?? null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const hit = photoCache.get(leader.id);
    if (hit !== undefined) {
      setSrc(hit);
      setFailed(false);
      return;
    }
    setSrc(null);
    setLoaded(false);
    setFailed(false);
    void fetchLeaderPhoto(leader).then((url) => {
      if (active) setSrc(url);
    });
    return () => {
      active = false;
    };
  }, [leader.id]);

  useEffect(() => {
    const el = imgRef.current;
    if (src && el && el.complete && el.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  const cls = [s.photo, s[`photo_${size}`], className].filter(Boolean).join(' ');
  return (
    <span aria-hidden="true" className={cls}>
      <svg viewBox="0 0 40 48" className={s.photoFallback} focusable="false">
        <circle cx="20" cy="16" r="8" />
        <path d="M6 44c0-9 6-15 14-15s14 6 14 15" />
      </svg>
      {src && !failed && (
        <img
          ref={imgRef}
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className={`${s.photoImg} ${loaded ? s.photoLoaded : ''}`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
