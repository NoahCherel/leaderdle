---
name: Leaderdle
description: A printed daily dossier for post-1900 world leadership deduction puzzles.
colors:
  stamp-crimson: "#b92d18"
  stamp-coral-dark: "#ff7a5c"
  match-sage: "#6fbf8b"
  match-sky-cb: "#7fb2f0"
  close-amber: "#f0a44b"
  focus-cobalt: "#1f4fd8"
  focus-gold-dark: "#ffd23f"
  manila-ground: "#f3eee3"
  index-paper: "#fbf8f1"
  carbon-ink: "#1a1916"
  graphite-muted: "#5f5a50"
  rule-soft: "#cfc8b8"
  miss-stone: "#d9d3c5"
  night-ground: "#171613"
  night-surface: "#201f1b"
  parchment-text: "#f0ebe0"
  ash-muted: "#a8a294"
  night-soft: "#45423b"
  night-miss: "#3a3832"
typography:
  display:
    fontFamily: "'Barlow Condensed', 'Arial Narrow', 'Helvetica Neue', sans-serif"
    fontSize: "84px"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "0.01em"
  headline:
    fontFamily: "'Barlow Condensed', 'Arial Narrow', 'Helvetica Neue', sans-serif"
    fontSize: "44px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.01em"
  title:
    fontFamily: "'Barlow Condensed', 'Arial Narrow', 'Helvetica Neue', sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.01em"
  body:
    fontFamily: "'Public Sans', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "'IBM Plex Mono', ui-monospace, 'Courier New', monospace"
    fontSize: "11.5px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.06em"
rounded:
  xs: "2px"
  sm: "3px"
  md: "4px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "28px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.carbon-ink}"
    textColor: "{colors.manila-ground}"
    typography: "{typography.title}"
    rounded: "{rounded.sm}"
    padding: "0 22px"
    height: "48px"
  button-lg:
    backgroundColor: "{colors.carbon-ink}"
    textColor: "{colors.manila-ground}"
    typography: "{typography.title}"
    rounded: "{rounded.sm}"
    padding: "0 32px"
    height: "56px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.carbon-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "44px"
  card-dossier:
    backgroundColor: "{colors.index-paper}"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.sm}"
    padding: "22px"
  input-search:
    backgroundColor: "{colors.index-paper}"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "52px"
---

# Design System: Leaderdle

## Overview

**Creative North Star: "The Printed Daily Dossier"**

Leaderdle treats every daily puzzle session as a freshly issued archival briefing folder: warm manila paper, crisp carbon ink, hair-thin structural rules, typewriter-stamped metadata labels, and a single authoritative rubber-stamp crimson reserved for masthead marks and victory verdicts. Because the historical roster spans democratic leaders, monarchs, and twentieth-century dictators alike, the visual language stays matter-of-fact and documentary—celebrating the player's deduction while refusing portraits, caricatures, or partisan spectacle.

Light mode (`th-light`) is the default experience, evoking physical index stock read in daylight, while dark mode (`th-dark`) translates the same archival hierarchy onto warm charcoal carbon paper without inverting the physical evaluation tiles. Density is disciplined and scannable: rules, numbered docket rows, and tabular figures do the structural work that lesser interfaces outsource to drop shadows and nested cards.

**Key Characteristics:**
- **Editorial rule hierarchy:** `4px double` masthead rules, `3px solid` section dividers, `1px solid` index cards, and `1px dotted` statistical ledgers replace decorative shadows.
- **Tri-voice typography:** Condensed uppercase headlines (`Barlow Condensed`), high-legibility humanist body copy (`Public Sans`), and stamped monospace field labels (`IBM Plex Mono`).
- **Non-partisan semantic color:** Evaluation tiles use sage green (`#6fbf8b` or colorblind sky blue `#7fb2f0`), warm amber (`#f0a44b`), and neutral stone (`#d9d3c5` / `#3a3832`)—never partisan red-versus-blue opposition and never red for player errors.
- **Redundant state encoding:** Every game tile, mode pill, and progress pip pairs color with iconography (`✓`, `~`, `↑`, `↓`, diagonal strike) and complete screen-reader descriptions.

## Colors

The palette balances warm archival paper neutrals against a single editorial crimson stamp and three high-contrast, theme-invariant deduction tile fills.

### Primary
- **Stamp Crimson** (`#b92d18` in light, **Stamp Coral** `#ff7a5c` in dark, `--accent`): Reserved strictly for the `-dle` logo mark, active streak counts, the Home dateline, active mode tab underlines, and victory rubber stamps. Never used for error states or missed guesses.

### Secondary
- **Match Sage** (`#6fbf8b`, `--g`) / **Match Sky (Colorblind)** (`#7fb2f0`, `.cb --g`): Exact attribute match, right-place letter, locked Timeline card, and solved mode badge. Always paired with **Carbon Ink** (`#1a1916`, `--ink`) text in both themes.
- **Close Amber** (`#f0a44b`, `--y`): Near-miss attribute clue (same continent, shared role, or within numeric tolerance), wrong-place letter, initial-hint banner, and Mayhem `Upset` badge. Always paired with **Carbon Ink** (`#1a1916`, `--ink`) text.

### Tertiary
- **Focus Cobalt** (`#1f4fd8` in light) / **Focus Gold** (`#ffd23f` in dark, `--focus`): High-visibility `3px solid` keyboard focus outlines (`outline-offset: 2px`).

### Neutral
- **Manila Ground** (`#f3eee3`, `--ground`) / **Night Ground** (`#171613` in dark): Primary page background and themed scrollbar track.
- **Index Paper** (`#fbf8f1`, `--surf` and `--paper`) / **Night Surface** (`#201f1b` in dark): Elevated dossier cards, combobox inputs, modal sheets, keyboard keys, and tear-off share receipts.
- **Carbon Ink** (`#1a1916`, `--text`, `--line`, `--ink`) / **Parchment Text** (`#f0ebe0` in dark): Primary typography, structural rules, and reversed primary buttons.
- **Graphite Muted** (`#5f5a50`, `--muted`) / **Ash Muted** (`#a8a294` in dark): Eyebrow labels, secondary rules, tenure metadata, and locked clue descriptions.
- **Miss Stone** (`#d9d3c5`, `--x`) / **Night Miss** (`#3a3832` in dark): Non-matching tiles, disabled buttons, missed docket badges, and absent keyboard keys.
- **Rule Soft** (`#cfc8b8`, `--soft`) / **Night Soft** (`#45423b` in dark): Unplayed docket state borders and empty letter-grid cells.

### Named Rules
**The Non-Partisan Palette Rule.** Never use red for an incorrect guess or pit red against blue. Crimson (`--accent`) marks editorial identity and victory stamps only; misses and losses always use **Miss Stone** (`--x`) with **Carbon Ink** / **Parchment Text** (`--xt`).

**The Fixed Ink-on-Tile Rule.** Evaluation tiles (`--g` and `--y`) and physical paper badges (`--paper`) keep **Carbon Ink** (`#1a1916`, `--ink`) foreground text in both light and dark themes, guaranteeing ≥7.9:1 WCAG AAA contrast without muddy dark-mode desaturation.

## Typography

**Display Font:** `Barlow Condensed` (weights 600, 700; fallback `'Arial Narrow', 'Helvetica Neue', sans-serif`)
**Body Font:** `Public Sans` (weights 400, 600, 700; fallback `system-ui, sans-serif`)
**Label/Mono Font:** `IBM Plex Mono` (weight 500; fallback `ui-monospace, 'Courier New', monospace`)

**Character:** Compact, authoritative condensed capitals headline the page like a diplomatic cable, while `Public Sans` keeps dense historical names and dates effortless to scan and `IBM Plex Mono` stamps field headers with mechanical precision.

### Hierarchy
- **Display** (`700`, `clamp(52px, 9vw, 84px)`, line-height `0.9`, uppercase): Home hero title ("Today's puzzles") and Mayhem draw decade (`64px`).
- **Headline** (`700`, `44px` desktop / `38px` mobile, line-height `1.0`, uppercase): Mode screen headers (`Classic #128`, `Leader Mayhem`) and Result hero headings (`56px` desktop / `48px` mobile).
- **Title** (`700`, `26px–34px`, line-height `1.0`, uppercase): Docket game titles (`32px` desktop / `27px` mobile), modal titles (`34px`), leader file names (`34px`), and match round headers (`28px`).
- **Body** (`400` / `700`, `16px–17px`, line-height `1.45`, max-width `60ch–65ch`): Game briefs, historical leader blurbs, combobox options, and static editorial pages.
- **Label / Eyebrow** (`500`, `11.5px–13px`, letter-spacing `0.06em`, uppercase `IBM Plex Mono`): Docket indices (`01`–`04`), datelines, remaining-guess counters, clue headers, and portfolio codes (`EDU`, `WAR`, `ECO`, `DOM`, `FOR`).

### Named Rules
**The Tabular Figures Rule.** Every year, tenure duration, age, countdown timer, streak counter, and score ratio uses `font-variant-numeric: tabular-nums` (`.num`) or `IBM Plex Mono` so vertical columns of numbers never jitter.

**The Meaning-First Eyebrow Rule.** Monospace eyebrows (`.eyebrow`) are used strictly for functional metadata (dates, docket status badges, clue slot labels, portfolio codes)—never as decorative marketing kickers above self-explanatory headings.

## Layout

- **Page Frame:** Maximum width `1080px` (`--max`), centered with `16px` horizontal padding and `40px` bottom breathing room (`.page`). Text-focused editorial pages and the daily summary use `.page--narrow` (`max-width: 680px`).
- **Home Grid:** Two-column flex layout (`gap: 32px 56px`): `.main` (`flex: 999 1 520px`, `gap: 28px`) holds the dateline, primary CTA, 4-game numbered docket, and Leader Mayhem bonus row; `.aside` (`flex: 1 1 260px`, `gap: 28px`) holds "Your record", the midnight countdown, and the reserved `300 × 250` ad box.
- **Game Screen Grid:** Two-column flex layout (`gap: 40px` desktop, `28px` mobile): `.main` (`flex: 999 1 560px`, `gap: 20px`) holds `ModePills`, `TitleRow`, active gameplay, and post-game `Result`; `.rail` (`flex: 1 1 300px`) holds the `300 × 600` desktop ad rail (collapsing to a centered `320 × 100` banner below `1000px`); `.foot` spans `100%` across the bottom.
- **Responsive Breakpoints:**
  - `1000px+` (Desktop): Two-column game layout with right-hand `300 × 600` rail and full text labels on Classic tiles (`United Kingdom`, `Head of government`).
  - `620px–999px` (Tablet): Single-column stack with `320 × 100` banner below the game and full text labels on tiles.
  - `<620px` (Phone, down to `320px`): Single-column stack; `ModePills` transform their `12px` status dots into full-width `5px` top bars so all 5 mode tabs fit on one line without horizontal scroll; `Classic` tiles switch to ISO/role short codes (`GBR`, `Gov`) with `6px` grid gaps; `NameInput` suggestion listbox switches from `position: absolute` to `position: static` so it pushes content down instead of colliding with the mobile keyboard.

## Elevation & Depth

Leaderdle is **flat-by-default and rule-driven**. Depth is communicated through surface contrast (`--ground` vs. `--surf`), border weight (`1px solid`, `3px solid`, `4px double`), and physical ink-stamp motion rather than drop shadows or glassmorphism.

### Named Rules
**The Zero-Shadow Dossier Rule.** Cards, tiles, buttons, and modals use crisp `1px solid var(--line)` borders and `3px` top rules instead of `box-shadow`. Only the native `<dialog>` modal uses a flat translucent backdrop veil (`--veil: rgba(26, 25, 22, 0.55)` in light, `rgba(0, 0, 0, 0.7)` in dark) to separate the top layer from the page.

## Shapes

- **Corner Radius:** Tightly cut index-card corners (`--r: 3px`) across all buttons, cards, inputs, tiles, and modals; `2px` on small pips and `Upset` tags; `4px` on the rotated `.stamp`; `50%` circles reserved exclusively for the `18 × 18px` corner verification badges on `Classic` tiles and the status dot inside settings switches.
- **Border Grammar:**
  - `4px double var(--line)`: Masthead bottom rule.
  - `3px solid var(--line)`: Section top rules (`.docket`, `.side`, `.results`, `.sheet`, `.nextBar`, `.shareCard`, `.dayCard`, `.mNote`).
  - `1px solid var(--line)`: Cards, active clues, tiles, buttons, and inputs.
  - `1px dashed var(--muted)`: Unrevealed clue slots, unplayed tournament stages, empty guess placeholders, and reserved ad slots.
  - `1px dotted var(--muted)`: Ledger rows in "Your record", Mayhem duel rows, and Mayhem stats footnote.

## Components

### Buttons
- **Shape:** Sharp archival corners (`3px` radius) with uppercase `Barlow Condensed` (`600`, `19px`, `letter-spacing: 0.05em`).
- **Primary (`.btn`, `.btn--lg`, `.btn--md`):** Reversed carbon ink fill (`background: var(--text); color: var(--ground)`), `48px` default height (`52px` medium, `56px` large). Active press shifts `translateY(1px)`.
- **Secondary / Outline (`.btn--outline`):** Transparent background, `1px solid var(--text)` border, `44px` height, `17px` type; hovers to `--surf` fill. Used for secondary CTAs (`Next up: ...`, `See all stats`, `View`, rerolls, cookie consent).
- **Icon & Link Buttons (`.icon-btn`, `.link-btn`):** Guaranteed `44 × 44px` minimum hit target across desktop and mobile; `.link-btn` uses `1px` underlined `13px` muted text that darkens to `--text` on hover.

### Cards / Containers
- **Dossier Card (`.card`):** `--surf` background, `1px solid var(--line)` border, `3px` radius.
- **Share Receipt (`.shareCard`, `.dayCard`):** `--surf` background, `1px solid var(--line)` border with a heavy `3px solid var(--line)` top rule, centered tabular emoji/tile preview, and muted `leaderdle.com` footer.
- **Editorial Callout (`.mNote`):** `--surf` background with `1px solid var(--line)` border and `3px solid var(--line)` top rule.

### Inputs / Fields
- **Combobox (`NameInput`):** `52px`-tall `--surf` input with `1px solid var(--text)` border and `caret-color: var(--accent)` paired with a `Guess` button. Suggestions render in a `max-height: 330px` listbox showing leader name (`strong`), `Country · Term span` (`tabular-nums`), and conditional `Also known as [Alias]`. Invalid submissions trigger a `360ms` horizontal shake (`lshake`) and announce recovery copy via `role="status"`.

### Navigation
- **Masthead (`Header`):** `64px` height with `4px double var(--line)` bottom border, housing the `LEADERDLE` wordmark (`dle` in `--accent`), live `Streak` counter, and three `44 × 44px` icon buttons (`How to play`, `Statistics`, `Settings`).
- **Mode Tabs (`ModePills`):** Five horizontal tabs (`Classic`, `Letters`, `Succession`, `Timeline`, and right-aligned italic `Mayhem`) over a `1px solid var(--line)` baseline. Active tab carries a `4px solid var(--accent)` bottom bar; solved tabs show a `--g` square; missed tabs show an `--x` square with a diagonal strike.

### Signature Components
- **Rubber Stamp (`.stamp`):** `3px solid currentColor` border (`4px` radius), `Barlow Condensed` `700` `26px` uppercase (`letter-spacing: 0.08em`), rotated `-4deg`. Victory stamps use `--accent` and slam onto the page with `@keyframes lstamp` (`scale(2.2)` → `scale(0.94)` → `scale(1)`); loss stamps (`.stampLost`) use `--x` fill with `--text` ink.
- **Classic Attribute Tile (`Tile`):** `min-height: 68px` cell in a 5-column grid (`Country`, `Role`, `Took office`, `Years in office`, `Age at start`). Displays full text on desktop/tablet and compact codes on phone, directional `IconUp`/`IconDown` arrows on numeric misses/closes, an `In office` sub-label for incumbents, and an `18 × 18px` circular corner badge (`IconCheck` or `IconWave`) so state is never carried by color alone.

## Do's and Don'ts

### Do:
- **Do** pair every status color (`--g`, `--y`, `--x`) with a redundant shape, icon (`✓`, `~`, `↑`, `↓`, diagonal strike), or text label so colorblind and monochrome users have identical information.
- **Do** keep interactive hit targets at or above `44 × 44px` on all viewports (including header icon buttons, timeline reorder arrows, and modal switches).
- **Do** use `btn--lg` (solid fill) for the single primary action in a group (e.g., `Share result`) and `btn--md btn--outline` for the secondary progression action (e.g., `Next up: Letters`).
- **Do** honor `.reduce` and `@media (prefers-reduced-motion: reduce)` by disabling all flips, shakes, pops, and stamp animations immediately.

### Don't:
- **Don't** display partisan caricatures of political leaders anywhere in the interface; use only archival Wikipedia portraits, text facts, and current ISO country flags (`flag-icons`).
- **Don't** use red (`--accent`) for error messages, missed guesses, or partisan opposition; reserve `--accent` for brand marks, streaks, and victory stamps.
- **Don't** use `box-shadow`, glass blur, gradients, or thick colored `border-left` stripes on cards; rely on `--surf` contrast and `1px` / `3px` ink rules.
- **Don't** place advertisements before gameplay, between the input field and guesses, or without pre-reserved dimensions (`300 × 600`, `300 × 250`, `320 × 100`).
