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

.verte__carbon { font-size: 13.5px; color: ${color.ink}; }
.verte__carbon-eq { color: ${color.inkSoft}; }

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
`
