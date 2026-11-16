# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

English-speaking players of daily Wordle-style deduction games, history and geopolitics enthusiasts, and students. Most visitors arrive for a quick daily session (~3 minutes) on mobile or desktop—often from a friend's shared score grid—and optionally stay for replayable tournament runs in Leader Mayhem.

## Product Purpose

Leaderdle (`leaderdle.com`) is a daily guessing game about national political leaders (heads of state and heads of government worldwide, from 1900 to today). Every day at local midnight it serves four short puzzles identical for all players—**Classic** (guess the leader in 8 tries from five compared attribute clues, with an optional free initials hint after 5 misses), **Letters** (spell the leader's common name in 6 tries), **Succession** (name who governed between a predecessor and successor in 5 tries with progressive clues), and **Timeline** (order five leaders chronologically by first start date in 3 checks)—plus **Leader Mayhem**, an unlimited replayable bonus mode where players draft a five-leader cabinet across five portfolios and take it through a seeded tournament. Success means solving the daily docket, maintaining a daily Classic streak, earning a "Perfect day" (4/4 daily modes won), and sharing spoiler-free emoji results.

## Positioning

Unlike single-mechanic trivia or geography clones, Leaderdle pairs four distinct daily deduction mechanics built on a verified post-1900 political leadership dataset (attribute comparison, name spelling, succession chains, and chronological ordering) with an unlimited cabinet-drafting tournament mode (Leader Mayhem), governed by strict political neutrality in daily play and a complete absence of leader portraits or caricatures.

## Operating Context

- **Daily cadence:** Sequential numbered puzzles (`No. N`) resetting at the player's local midnight, with spoiler-free emoji/text sharing via the native mobile share sheet or clipboard.
- **Local-first, zero-account state:** Progress, daily streaks (counted on consecutive days where Classic is completed, won or lost), and per-mode statistics live in browser `localStorage` (`leaderdle`), with an automatic in-memory fallback when storage is unavailable and offline playability via service worker once loaded.
- **Session flow:** First visit to any mode opens its illustrated help modal; finishing a daily mode locks it until midnight, reveals a factual leader card (current ISO flag, name, country, role, tenure dates, neutral one-sentence context, Wikipedia link, and "Report an error" link), and chains directly to the next unfinished daily mode or the full-day summary screen.

## Capabilities and Constraints

- **Wikidata-backed dataset pipeline (`data/` and `public/data/`):** Built from Wikidata (CC0) with curated overrides in `data/overrides.json` and validated by `npm run check:data` before every build. Includes 2,729 guessable leaders (25+ Wikipedia interwiki links), 177 widely known daily answers (`answerable=true`), 144 curated uppercase ASCII names (max 11 letters) in `data/letters.json`, contiguous succession chains in `data/offices.json`, and 436 leaders rated privately across five portfolios (`education`, `war`, `economy`, `domestic`, `foreign`, 1–10 scale) in `data/mayhem-ratings.csv`.
- **Role and tenure rules:** `Role` is strictly `Head of state`, `Head of government`, or `Both`. Across multiple non-consecutive terms, `Took office` is the first start year, `Years in office` is the cumulative total rounded down (counting up to today with an `In office` label for incumbents), and `Age at start` is the age on the first start date.
- **Search and disambiguation:** Case- and accent-insensitive combobox supporting common aliases/initials (e.g., "FDR", "JFK") and showing name, country, and tenure years on every suggestion to distinguish homonyms; previously guessed leaders stay visible as disabled (`Already guessed`).
- **Advertising and consent constraints:** Ads are restricted to reserved, fixed-size slots (`300x600` desktop rail, `300x250` home/summary box, `320x100` mobile/tablet below-game banner) labeled `Advertisement`. Ads never appear before play, between input and guesses, over the mobile keyboard, or with layout shift; popups, autoplay video, audio, and political ads are prohibited. The cookie consent banner gives `Decline` and `Accept` equal weight, and declining never restricts gameplay.
- **Open pre-launch constraints:**
  - Human review of flagged records in `data/review.csv` (`held state and government offices`, `several countries`, `open term after death`, `odd age`, `term outside country dates`) and final confirmation of the `answerable` daily answer pool.
  - Production environment configuration: `VITE_LAUNCH_DATE` (defaults to `2026-07-11`) and `VITE_CONTACT_EMAIL` (required to enable the "Report an error" submission button).
  - Privacy page placeholders in `src/screens/Pages.tsx`: `[AD PARTNER]` and `[COOKIE LIST]`.

## Brand Commitments

- **Identity and voice:** Leaderdle (`leaderdle.com`). All player-facing UI copy is written in concise, warm, matter-of-fact English.
- **Strict political neutrality:** Every leader receives identical visual and structural treatment regardless of ideology, regime, or reputation. Daily modes present checkable facts only (country, role, dates) with no quotes, ratings, or partisan color coding (never red for error or red-versus-blue opposition). Leader Mayhem duels are explicitly framed in *How we pick and describe leaders* as editorial judgments of historical weight and effectiveness—never shown as numerical scores or moral endorsements.
- **Archival portraits and flags:** Leaders are accompanied by archival portraits sourced from Wikipedia/Wikimedia Commons (with a neutral silhouette fallback when offline) and current ISO country flags (`flag-icons`); historical or regime flags that differ from current ISO flags are omitted (e.g., historical German regimes merged under `Germany` display no flag).
- **Celebrate the player, never the subject:** Victory animations and copy ("You got it!") celebrate the player's deduction, never the historical figure, and avoid humor about the leaders.

## Evidence on Hand

- Production web app (`src/`), build/prerender and verification scripts (`scripts/`), dataset and 800-day generated puzzle schedule (`data/`, `public/data/`).
- Original product brief and handoff specification (`leaderdle-passation/brief-original.txt`, `leaderdle-passation/PASSATION.md`) and data curation guide (`data/README.md`).
- Brand and social preview assets in `public/` (`favicon.svg`, `icon-32.png`, `icon-180.png`, `icon-512.png`, `og-image.png`, `manifest.webmanifest`).
- No customer testimonials, external press coverage, traffic benchmarks, or named advertising partners exist yet; future work must not fabricate them.

## Product Principles

1. **Verifiable facts over commentary in daily play:** Daily modes rely strictly on checkable dates, roles, and countries, giving every historical figure identical, non-partisan treatment without portraits.
2. **Playful for the solver, sober for the subject:** Feedback rewards the player's reasoning while treating political history—including dictators and war criminals—with dry restraint.
3. **Zero-friction daily ritual:** Players go straight into the day's puzzles with no accounts, no paywalls, and no ads blocking the path between input and guess.
4. **Recognizable daily answers, deep historical pool:** Daily answers are curated for broad public recognition so puzzles stay fair, while a wide historical roster powers deduction and Leader Mayhem drafting.

## Accessibility & Inclusion

- WCAG AA contrast minimum across both light and dark themes.
- Meaning is never carried by color alone: tiles pair status colors with distinct symbols and directional arrows, and a dedicated colorblind mode (`cb`) replaces green/amber hues with high-distinction blue/orange.
- Full keyboard accessibility across all modes, including combobox keyboard navigation, Timeline up/down reorder buttons that jump over locked cards, visible focus rings, and modal Escape/focus management.
- Screen reader announcements (`aria-live`, `role="status"`) for remaining tries, input validation feedback, and complete per-tile accessible descriptions.
- Minimum `44px` interactive hit targets, mobile keyboard handling that keeps the input and latest guess visible, and a `Reduce motion` setting that also respects `prefers-reduced-motion`.
