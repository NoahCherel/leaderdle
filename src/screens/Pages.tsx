import { useState, type FormEvent } from 'react';
import { Link, useSearch } from 'wouter';
import { CONTACT_EMAIL } from '../config';
import { Footer } from '../components/Chrome';
import { IconBack } from '../components/icons';
import s from './home.module.css';

/** Footer pages. Texts come from the prototype; [PLACEHOLDERS] are filled by the site owner. */
export const PAGES: Record<string, [title: string, paragraphs: string[]]> = {
  about: [
    'About Leaderdle',
    [
      'Leaderdle is a daily guessing game about the people who have led countries: heads of state and heads of government, from 1900 to today.',
      'There are four short puzzles a day: Classic, Letters, Succession and Timeline. Everyone gets the same puzzles, and new ones arrive at midnight, your time.',
      'No account needed. Your streak and stats stay in your browser.',
    ],
  ],
  'how-we-pick': [
    'How we pick and describe leaders',
    [
      'Every leader in the game was a head of state or a head of government at some point since 1900.',
      'The daily answer is always someone widely known. Lesser-known leaders can be guessed, but they are never the answer.',
      'In the four daily games, we describe leaders with checkable facts only: country, role and dates. No quotes, no ratings, no opinions.',
      'Leader Mayhem is the exception. A duel there goes to the leader who weighed more in a field, and that weight is our own judgement of what each leader achieved, whatever their aims. It is an opinion, never shown as a score, and not a verdict on anyone. Every leader is in it, including dictators, because the game is about history as it happened.',
      'Every leader gets the same visual treatment, whoever they are. We never show photos, portraits or caricatures. Appearing in the game is not an endorsement.',
      'For leaders with several separate terms, Took office is the first start date and Years in office is the total. For leaders still in office, the count runs to today.',
      'Spotted a mistake? Tell us through Report an error.',
    ],
  ],
  privacy: [
    'Privacy',
    [
      'Leaderdle has no accounts. Your progress, streak and stats are saved in this browser only, and you can erase them any time in Settings.',
      'The game shows ads. Cookies for ads and visit counts are used only if you accept them. If you decline, the game works exactly the same.',
      'Political ads are excluded.',
      'Ads are served by [AD PARTNER]. The cookies they set are listed here: [COOKIE LIST].',
      `Questions about your data? Write to ${CONTACT_EMAIL}.`,
    ],
  ],
  report: [
    'Report an error',
    ['Found a wrong date, role or country? Tell us what to fix and, if you can, where you checked.', `You can also write to ${CONTACT_EMAIL}.`],
  ],
};

function ReportForm() {
  const params = new URLSearchParams(useSearch());
  const [leader, setLeader] = useState(params.get('leader') ?? '');
  const [text, setText] = useState('');
  const ready = CONTACT_EMAIL.includes('@');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const body = `Leader: ${leader}\n\n${text}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Leaderdle error report: ${leader}`)}&body=${encodeURIComponent(body)}`;
  };
  return (
    <form className={`card ${s.form}`} onSubmit={submit}>
      {!ready && <p className={`muted ${s.formNotice}`}>Reports open as soon as a contact address is set.</p>}
      <div className={s.field}>
        <label htmlFor="rep-leader">Which leader?</label>
        <input id="rep-leader" type="text" placeholder="Name" value={leader} onChange={(e) => setLeader(e.target.value)} required />
      </div>
      <div className={s.field}>
        <label htmlFor="rep-text">What should we fix?</label>
        <textarea id="rep-text" rows={4} placeholder="The date, role or country that looks wrong, and where you checked" value={text} onChange={(e) => setText(e.target.value)} required />
      </div>
      <button type="submit" className={`btn btn--md ${s.submitBtn}`} disabled={!ready}>
        Send report
      </button>
    </form>
  );
}

export function Page({ slug }: { slug: keyof typeof PAGES }) {
  const [title, paras] = PAGES[slug]!;
  return (
    <main className="page page--narrow">
      <div className={s.page}>
        <Link href="/" className={`btn btn--outline ${s.backBtn}`}>
          <IconBack size={18} />
          Back to puzzles
        </Link>
        <h1 className="title">{title}</h1>
        {paras.map((p) => (
          <p key={p}>{p}</p>
        ))}
        {slug === 'report' && <ReportForm />}
        <Footer />
      </div>
    </main>
  );
}

export type ErrorKind = 'offline' | 'data' | '404';

const ERRORS: Record<ErrorKind, [glyph: string, title: string, text: string, cta: string]> = {
  offline: ['!', 'You’re offline', 'Reconnect to load today’s puzzles. Games you already started are safe on this device.', 'Try again'],
  data: ['!', 'Today’s puzzles aren’t ready', 'Something went wrong on our side. Please try again in a moment.', 'Try again'],
  '404': ['?', 'Page not found', 'That page doesn’t exist. Today’s puzzles are waiting, though.', 'Back to puzzles'],
};

export function ErrorScreen({ kind, onAction }: { kind: ErrorKind; onAction?: () => void }) {
  const [glyph, title, text, cta] = ERRORS[kind];
  return (
    <main className={s.error}>
      <span aria-hidden="true" className={s.glyph}>
        {glyph}
      </span>
      <h1 className="title">{title}</h1>
      <p>{text}</p>
      {kind === '404' ? (
        <Link href="/" className="btn btn--md">
          {cta}
        </Link>
      ) : (
        <button type="button" className="btn btn--md" onClick={onAction ?? (() => window.location.reload())}>
          {cta}
        </button>
      )}
      <div className={s.errorFoot}>
        <Footer />
      </div>
    </main>
  );
}
