/* ---------------------------------------------------------------------------
 * Landing page.  Owned by lane/site.
 *
 * This is a SCAFFOLD, not a design — it exists so the lane starts from a
 * running page on the real design system rather than a blank file. Rip out
 * the layout freely; keep importing tokens from ../../src/tokens so the site
 * and the card never drift apart.
 *
 * The thesis is the whole pitch and should stay the largest thing here:
 * the greenest product is the one that already exists — and for a student,
 * it is also the affordable one.
 * ------------------------------------------------------------------------- */

import { color, font, pageGround, radius, shadow } from '../../src/tokens'

export function App() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: pageGround,
        color: color.ink,
        fontFamily: font.body,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
      }}
    >
      <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <span
          style={{
            fontFamily: font.display,
            fontWeight: 600,
            fontSize: 22,
            color: '#5C8A6B',
          }}
        >
          Verte
        </span>

        <h1
          style={{
            fontFamily: font.heading,
            fontWeight: 700,
            fontSize: 'clamp(32px, 6vw, 56px)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          The greenest product is the one that already exists.
        </h1>

        <p style={{ fontSize: 18, lineHeight: 1.6, margin: 0, maxWidth: 560 }}>
          Verte shows you the secondhand option at the moment you are about to buy new — the
          price, whether that category is actually safe to buy used, and the manufacturing
          emissions you avoid by not buying new.
        </p>

        <div
          style={{
            background: color.base,
            border: `1px solid ${color.shade}`,
            borderRadius: radius.panel,
            boxShadow: shadow,
            padding: 24,
            maxWidth: 480,
          }}
        >
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>
            A used desk is a great idea. A used mattress is not. Verte knows the difference,
            and tells you what to check before you buy.
          </p>
        </div>

        <p style={{ margin: 0, fontSize: 13, color: color.inkSoft }}>
          {/* TODO lane/site: install CTA, screenshots, the category table from §07 */}
          Built at a 12-hour hackathon. Chrome extension, Manifest V3.
        </p>
      </div>
    </main>
  )
}
