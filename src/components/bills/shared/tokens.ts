/* Chart colours for the Bills pages — computed, not eyeballed.

   Validated with the dataviz skill's validate_palette.js (light mode, white
   card surface):
   - AGEING_RAMP  `--ordinal` → PASS: monotone lightness, every adjacent
     ΔL ≥ 0.06, light end #7698BC at 3.01:1, single hue (spread 4°).
   - ACCENT #3C5E86 is 6.69:1 on white; vs DEEMPH #B7CCE0 the pair separates at
     ΔE 36 (normal) / 35.7 (protan). DEEMPH is 1.65:1 by design (it is the
     "context" grey of an emphasis chart) — its relief channel is the tooltip
     plus the bills table (the table-view twin), so it never gates a value.

   All from the app's own slate-blue scale: navy stays reserved for actions and
   "you are here"; status colours (ok/warn/bad) appear only on status chips,
   always with an icon + label — never as chart series. */

/** Ordinal ramp for ageing buckets — lightest = youngest, darkest = oldest. */
export const AGEING_RAMP = ['#7698BC', '#4E709A', '#3C5E86', '#2F4B6D', '#1E3045'] as const;

/** Single-series / emphasis accent (party bars, due columns, outstanding). */
export const ACCENT = '#3C5E86';

/** De-emphasis grey (settled context in the monthly chart; "no due date"). */
export const DEEMPH = '#B7CCE0';

/** Meter track: a lighter step of the accent's own ramp. */
export const METER_TRACK = '#E1EBF5';

/** Recessive chart chrome — one step off the white surface, solid hairlines. */
export const GRID = '#E7F0F9';
export const AXIS_TEXT = '#4C5A6A'; // ink-2 — axis/legend text (7.05:1)
