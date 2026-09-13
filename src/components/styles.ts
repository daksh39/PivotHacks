/* ---------------------------------------------------------------------------
 * All card CSS as one string, injected into the shadow root (verte-plan.md
 * §08). Authored as a plain string on purpose: no CSS-in-JS dependency, and
 * it drops into a shadow root and a normal page identically, so the dev
 * preview at src/dev/preview.html renders exactly what Amazon will.
 *
 * Everything is scoped under .verte — the host page cannot reach in and we
 * do not reach out.
 * ------------------------------------------------------------------------- */

import { color, font, radius, shadow, verdictColor } from '../tokens'

export const cardStyles = /* css */ `
:host { all: initial; }

.verte, .verte * { box-sizing: border-box; margin: 0; padding: 0; }

.verte {
  font-family: ${font.body};
  color: ${color.ink};
  background: ${color.base};
  border: 1px solid ${color.shade};
  border-radius: ${radius.panel};
  box-shadow: ${shadow};
  overflow: hidden;
  max-width: 420px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;

  /* Anchored top-left: the card grows out of where the collapsed strip sits,
   * so expanding reads as the same object rather than a new one (spatial
   * consistency). Scaling from the centre makes it look like a popup. */
  transform-origin: top left;
  animation: verte-arrive 260ms cubic-bezier(0.32, 0.72, 0, 1) both;
}

/* ---------------------------------------------------------------------------
 * Motion.
 *
 * This card appears uninvited on somebody else's page, so the entrance is
 * deliberately quiet — a short rise and settle, no bounce. Overshoot is for
 * motion the user themselves set going; there is no gesture here, so bounce
 * would read as attention-seeking.
 *
 * Press feedback fires on pointer-down rather than on click, because the
 * moment feedback waits for release the whole thing stops feeling direct.
 * ------------------------------------------------------------------------- */

@keyframes verte-arrive {
  from { opacity: 0; transform: translateY(4px) scale(0.985); }
  to   { opacity: 1; transform: none; }
}

/* --- header -------------------------------------------------------------- */

.verte__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  background: ${color.tint};
  border-bottom: 1px solid ${color.shade};
}
.verte__wordmark {
  font-family: ${font.display};
  font-weight: 600;
  font-size: 16px;
  color: #5C8A6B;
  letter-spacing: 0.01em;
}
.verte__dismiss {
  margin-left: auto;
  border: 0;
  background: none;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  color: ${color.inkSoft};
  padding: 4px;
  border-radius: ${radius.pill};
}
.verte__dismiss:hover { color: ${color.ink}; }

/* --- body ---------------------------------------------------------------- */

.verte__body { padding: 18px; display: flex; flex-direction: column; gap: 16px; }

.verte__rule { height: 1px; background: ${color.shade}; opacity: 0.45; border: 0; }

/* --- price: money leads (§06) -------------------------------------------- */

.verte__price { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.verte__price-was {
  font-family: ${font.heading};
  font-size: 20px;
  color: ${color.inkSoft};
  text-decoration: line-through;
}
.verte__price-arrow { color: ${color.inkSoft}; font-size: 16px; }
.verte__price-now {
  font-family: ${font.heading};
  font-weight: 700;
  font-size: 33px;
  color: ${color.ink};
  letter-spacing: -0.01em;
}
.verte__save {
  margin-left: auto;
  background: ${color.moss};
  color: ${color.accentText};
  font-weight: 600;
  font-size: 13px;
  padding: 5px 12px;
  border-radius: ${radius.pill};
  white-space: nowrap;
}

/* --- verdict ------------------------------------------------------------- */

.verte__verdict { display: flex; flex-direction: column; gap: 8px; }
.verte__verdict-badge {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 13px;
  padding: 5px 12px;
  border-radius: ${radius.pill};
}
.verte__verdict--safe  { background: ${verdictColor.safe.bg};  color: ${verdictColor.safe.text}; }
.verte__verdict--check { background: ${verdictColor.check.bg}; color: ${verdictColor.check.text}; }
.verte__verdict--avoid { background: ${verdictColor.avoid.bg}; color: ${verdictColor.avoid.text}; }

.verte__tips { list-style: none; display: flex; flex-direction: column; gap: 4px; }
.verte__tips li { font-size: 13.5px; color: ${color.ink}; padding-left: 14px; position: relative; }
.verte__tips li::before {
  content: '';
  position: absolute;
  left: 0; top: 8px;
  width: 5px; height: 5px;
  border-radius: 50%;
  background: ${color.shade};
}
.verte__note { font-size: 13px; color: ${color.inkSoft}; }

/* --- carbon: present, never preachy. the tilde stays (§06) --------------- */

/* --- pivot 03: why this one won ----------------------------------------- */

.verte__reason {
  margin-top: 6px;
  font-size: 13px;
  font-weight: 600;
  color: ${color.accentText};
}

/* Essential meaning, so it wraps rather than truncating (ui-ux: don't clamp
 * meaning to keep cards uniform). Content-driven height, unitless leading. */
.verte__passed {
  margin-top: 4px;
  font-size: 12.5px;
  line-height: 1.45;
  color: ${color.inkSoft};
  overflow-wrap: anywhere;
}

.verte__blocked {
  background: ${verdictColor.avoid.bg};
  border-radius: ${radius.block};
  padding: 12px 14px;
}
.verte__blocked-head {
  font-family: ${font.heading};
  font-size: 15px;
  font-weight: 600;
  color: ${verdictColor.avoid.text};
}
.verte__blocked-sub {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.45;
  color: ${color.ink};
}

/* --- popup: the two context questions ------------------------------------ */

.verte__ctx { border: 0; display: block; }
.verte__ctx-legend {
  font-size: 12px;
  font-weight: 600;
  color: ${color.accentText};
  margin-bottom: 8px;
}
.verte__ctx-row { display: flex; gap: 6px; flex-wrap: wrap; }
.verte__ctx-legend--spaced { margin-top: 14px; }

/* 44px min target (ui-ux priority 2), 8px spacing, visible pressed state. */
.verte__chip {
  font: inherit;
  font-size: 12.5px;
  min-height: 44px;
  padding: 0 14px;
  border-radius: ${radius.pill};
  border: 1px solid ${color.shade};
  background: transparent;
  color: ${color.ink};
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease;
}
.verte__chip:hover { background: ${color.tint}; }
.verte__chip[aria-checked='true'] {
  background: ${color.moss};
  border-color: ${color.moss};
  color: ${color.accentText};
  font-weight: 600;
}
.verte__chip:focus-visible { outline: 2px solid ${color.accentText}; outline-offset: 2px; }

.verte__ctx-check {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  min-height: 44px;
  font-size: 13px;
  color: ${color.ink};
  cursor: pointer;
}
.verte__ctx-check input { width: 16px; height: 16px; accent-color: ${color.accentText}; }

.verte__ctx-help {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.45;
  color: ${color.inkSoft};
}

@media (prefers-reduced-motion: reduce) {
  .verte__chip { transition: none; }
}

/* --- listing meta: arrival is the field the ranking turns on ------------- */

.verte__listing-meta { display: flex; align-items: baseline; gap: 8px; }
.verte__eta { font-size: 12px; color: ${color.ink}; }

/* Doesn't meet the deadline. Colour alone never carries it — the blocked
 * banner and the reason line both say it in words too (ui-ux priority 10). */
.verte__eta--late { color: ${verdictColor.avoid.text}; }


.verte__listing-dist { font-size: 12px; color: ${color.inkSoft}; }

.verte__routes-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${color.accentText};
}

/* The environmental claim is the argument, not a footnote. It gets its own
 * surface so it reads at a glance on every card — including the many cards
 * that have no listing and used to carry nothing at all. */
.verte__impact {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  margin-top: 14px;
  padding: 11px 13px;
  background: ${color.tint};
  border-radius: ${radius.block};
}
.verte__impact svg { flex: none; margin-top: 2px; }
.verte__impact-text {
  font-size: 13px;
  line-height: 1.45;
  color: ${color.accentText};
  font-weight: 500;
}

.verte__tagline {
  margin-left: 8px;
  font-size: 11px;
  letter-spacing: 0.02em;
  color: ${color.accentText};
  opacity: 0.75;
}

/* --- rung 2: a greener NEW option --------------------------------------- */

.verte__greener { margin-top: 14px; }
.verte__greener-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${color.accentText};
  margin-bottom: 6px;
}
/* Says "new" on every row. This is the weaker answer and must read that way. */
.verte__cert {
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 700;
  color: ${color.accentText};
  background: ${color.moss};
  border-radius: 100px;
  padding: 2px 8px;
}
.verte__cert-detail {
  font-size: 12px;
  line-height: 1.45;
  color: ${color.inkSoft};
  margin: 2px 0 8px 2px;
  overflow-wrap: anywhere;
}

.verte__carbon { font-size: 13.5px; color: ${color.ink}; }
.verte__carbon-eq { color: ${color.inkSoft}; }

/* The citation marker. Present only when the figure is quantified, so its
 * absence is itself information: no marker means a qualitative claim. */
.verte__carbon-src {
  margin-left: 6px;
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${color.accentText};
  background: ${color.tint};
  border-radius: 100px;
  padding: 2px 7px;
  cursor: help;
}

/* --- listings ------------------------------------------------------------ */

.verte__routes { display: flex; gap: 10px; flex-wrap: wrap; }
.verte__route {
  flex: 1 1 0;
  min-width: 130px;
  text-align: center;
  font-family: ${font.body};
  font-weight: 600;
  font-size: 13px;
  padding: 10px 14px;
  border-radius: ${radius.pill};
  cursor: pointer;
  text-decoration: none;
  color: ${color.accentText};
}
.verte__route--fill { background: ${color.moss}; border: 1px solid ${color.moss}; }
.verte__route--fill:hover { background: ${color.shade}; }
.verte__route--outline { background: transparent; border: 1px solid ${color.shade}; }
.verte__route--outline:hover { background: ${color.tint}; }
.verte__route[aria-pressed="true"] { outline: 2px solid ${color.shade}; outline-offset: 2px; }

.verte__listings { list-style: none; display: flex; flex-direction: column; gap: 2px; }
.verte__listing {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 9px 12px;
  border-radius: ${radius.block};
  text-decoration: none;
  color: ${color.ink};
}
.verte__listing:hover { background: ${color.tint}; }
.verte__listing-price { font-family: ${font.heading}; font-weight: 700; font-size: 15px; white-space: nowrap; }
.verte__listing-title {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.verte__listing-meta { font-size: 11.5px; color: ${color.inkSoft}; white-space: nowrap; }

/* --- collapsed strip ----------------------------------------------------- */

.verte--collapsed { max-width: 420px; }
.verte__strip {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 18px;
  background: none;
  border: 0;
  cursor: pointer;
  font-family: ${font.body};
  font-size: 14px;
  color: ${color.ink};
  text-align: left;
}
.verte__strip strong { font-family: ${font.heading}; font-weight: 700; }
.verte__strip-chevron { margin-left: auto; color: ${color.inkSoft}; font-size: 12px; }

/* --- skeleton: never flash blank on someone else's page (§06) ------------ */

.verte__skeleton { display: flex; flex-direction: column; gap: 12px; padding: 18px; }
.verte__bone {
  height: 14px;
  border-radius: ${radius.pill};
  background: linear-gradient(90deg, ${color.tint} 25%, ${color.base} 50%, ${color.tint} 75%);
  background-size: 200% 100%;
  animation: verte-shimmer 1.4s ease-in-out infinite;
}
.verte__bone--lg { height: 30px; width: 55%; }
.verte__bone--sm { width: 75%; }
@keyframes verte-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .verte__bone { animation: none; }
}

/* --- empty --------------------------------------------------------------- */

.verte__empty { font-size: 13.5px; color: ${color.inkSoft}; }
/* --- press feedback: instant, on the way down ---------------------------- */

.verte__strip,
.verte__route,
.verte__chip,
.verte__dismiss,
.verte__listing {
  transition: transform 100ms ease-out, background-color 140ms ease-out;
}

.verte__strip:active,
.verte__route:active,
.verte__chip:active,
.verte__listing:active {
  transform: scale(0.985);
}

.verte__dismiss:active { transform: scale(0.9); }

.verte__listing:hover { background: ${color.tint}; }

/* --- focus: visible, always ---------------------------------------------- */

.verte :focus-visible {
  outline: 2px solid ${color.accentText};
  outline-offset: 2px;
  border-radius: 6px;
}

/* --- reduced motion ------------------------------------------------------
 * Not "no feedback" — a gentler, non-vestibular equivalent. The cross-fade
 * survives so the card still reads as arriving; the movement does not.
 * ------------------------------------------------------------------------- */

@media (prefers-reduced-motion: reduce) {
  .verte { animation: verte-fade 160ms ease-out both; }
  @keyframes verte-fade { from { opacity: 0; } to { opacity: 1; } }

  .verte__strip,
  .verte__route,
  .verte__chip,
  .verte__dismiss,
  .verte__listing { transition: background-color 140ms ease-out; }

  .verte__strip:active,
  .verte__route:active,
  .verte__chip:active,
  .verte__listing:active,
  .verte__dismiss:active { transform: none; }
}

/* --- the impact band: what the card leads with --------------------------- */
.verte__payoff {
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 14px;
  border: 1px solid transparent;
}
/* #D0E2B8 and #9FB87E are fills and borders, never text on cream (§06).
 * All accent text here is #3C4A2C at ~9:1. */
.verte__payoff--high { background: #D0E2B8; border-color: #9FB87E; }
.verte__payoff--moderate { background: #E8F0DA; border-color: #D0E2B8; }
.verte__payoff--low { background: #F2EFE6; border-color: #E0DACB; }

.verte__payoff-head {
  margin: 0;
  font-family: "Domine", Georgia, serif;
  font-size: 14px;
  font-weight: 600;
  color: #3C4A2C;
}
.verte__payoff--low .verte__payoff-head { color: #6B6B5E; }

.verte__payoff-figure {
  margin: 6px 0 0;
  font-family: "Newsreader", Georgia, serif;
  font-size: 20px;
  line-height: 1.2;
  color: #42473C;
}
.verte__payoff-meaning {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: #5C6152;
}

/* The catch we would rather state than hide. */
.verte__payoff-src {
  margin: 8px 0 0;
  font-size: 10px;
  line-height: 1.4;
  color: #7A8070;
  overflow-wrap: anywhere;
}

.verte__caveat {
  margin: 0 0 14px;
  padding: 10px 12px;
  border-left: 3px solid #9FB87E;
  background: #FBF8F1;
  font-size: 12px;
  line-height: 1.45;
  color: #5C6152;
}
`
