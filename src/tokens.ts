/* ---------------------------------------------------------------------------
 * Design system.  verte-plan.md §12.  Owned by lane/ui.
 *
 * Contrast rules are not suggestions (§12):
 *   - #9FB87E on cream is ~2.3:1 and FAILS as text. Borders and fills only.
 *   - #D0E2B8 is a fill, never text on cream.
 *   - #868C7C is ~3.1:1 — small meta labels only, never running body copy.
 *   - All accent TEXT uses #3C4A2C (~9:1 on cream).
 * ------------------------------------------------------------------------- */

export const color = {
  base: '#FAF6ED',
  moss: '#D0E2B8',
  tint: '#E8F0DA',
  shade: '#9FB87E',
  ink: '#42473C',
  inkSoft: '#868C7C',
  accentText: '#3C4A2C',
} as const

export const verdictColor = {
  safe: { text: '#3C4A2C', bg: '#D0E2B8', label: 'Safe to buy used' },
  check: { text: '#8A6E2F', bg: '#F3EBD6', label: 'Check before you buy' },
  avoid: { text: '#9A4B37', bg: '#F4E2DC', label: 'Buy this one new' },
} as const

export const font = {
  display: '"Newsreader", Georgia, serif',
  heading: '"Domine", Georgia, serif',
  body: '"Instrument Sans", system-ui, -apple-system, sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, monospace',
} as const

export const radius = {
  panel: '28px',
  block: '18px',
  pill: '100px',
} as const

export const shadow = '0 8px 24px rgba(92, 138, 107, 0.10)'

export const pageGround =
  'linear-gradient(160deg, #FDF6EC 0%, #F2ECDD 45%, #E8F0E6 100%)'

/** The mark: two overlapping leaf forms on a shared base point (§12). */
export const mark = {
  leftLeaf: '#9DC9AC',
  rightLeaf: '#6FA984',
  wordmark: '#5C8A6B',
} as const
