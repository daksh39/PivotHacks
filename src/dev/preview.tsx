/* ---------------------------------------------------------------------------
 * The card, in a plain local page, against mocked VerteResults.
 * verte-plan.md §04 lane C: "Zero dependency on lanes A or B."
 *
 *     npm run preview:card
 *
 * Every state the card can be in is on this page at once. If it looks right
 * here it will look right in the shadow root on Amazon, because it is the
 * same CSS string injected the same way.
 * ------------------------------------------------------------------------- */

import { StrictMode, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { Card } from '../components/Card'
import { Skeleton } from '../components/Skeleton'
import { cardStyles } from '../components/styles'
import {
  FIXTURE_EMPTY,
  FIXTURE_GREENER,
  FIXTURE_HEADPHONES,
  FIXTURE_MATTRESS,
  FIXTURE_MONITOR,
  FIXTURE_NOTHING_FOUND,
  FIXTURE_OVER_BUDGET,
  FIXTURE_TEXTBOOK,
  FIXTURE_UNKNOWN,
} from './fixtures'
import { pageGround } from '../tokens'

/** Renders children into a real shadow root, exactly like the content script. */
function Shadow({ children }: { children: React.ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null)

  useEffect(() => {
    const host = hostRef.current!
    if (!host.shadowRoot) {
      const shadow = host.attachShadow({ mode: 'open' })
      const style = document.createElement('style')
      style.textContent = cardStyles
      shadow.appendChild(style)
      const container = document.createElement('div')
      shadow.appendChild(container)
      rootRef.current = createRoot(container)
    }
    rootRef.current?.render(<>{children}</>)
  }, [children])

  return <div ref={hostRef} />
}

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2
        style={{
          font: '500 12px/1 "IBM Plex Mono", monospace',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#868C7C',
          margin: 0,
        }}
      >
        {label}
      </h2>
      <Shadow>{children}</Shadow>
    </section>
  )
}

function Preview() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: pageGround,
        padding: 40,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 40,
        alignItems: 'flex-start',
      }}
    >
      <Panel label="THE DEMO — every figure cited">
        <Card result={FIXTURE_MONITOR} defaultExpanded onDismiss={() => {}} />
      </Panel>

      <Panel label="UNKNOWN CATEGORY — the common case">
        <Card result={FIXTURE_UNKNOWN} defaultExpanded onDismiss={() => {}} />
      </Panel>

      <Panel label="NOTHING FOUND — now the most common card">
        <Card result={FIXTURE_NOTHING_FOUND} defaultExpanded onDismiss={() => {}} />
      </Panel>

      <Panel label="NO SECONDHAND — GREENER NEW OPTION">
        <Card result={FIXTURE_GREENER} defaultExpanded onDismiss={() => {}} />
      </Panel>

      <Panel label="collapsed">
        <Card result={FIXTURE_TEXTBOOK} />
      </Panel>
      <Panel label="expanded — safe">
        <Card result={FIXTURE_TEXTBOOK} defaultExpanded onDismiss={() => {}} />
      </Panel>
      <Panel label="expanded — Best Buy open box">
        <Card result={FIXTURE_HEADPHONES} defaultExpanded onDismiss={() => {}} />
      </Panel>

      <Panel label="BUDGET CHANGED THE ANSWER">
        <Card result={FIXTURE_OVER_BUDGET} defaultExpanded onDismiss={() => {}} />
      </Panel>

      <Panel label="expanded — nothing usable">
        <Card result={FIXTURE_EMPTY} defaultExpanded onDismiss={() => {}} />
      </Panel>

      <Panel label="expanded — buy new">
        <Card result={FIXTURE_MATTRESS} defaultExpanded onDismiss={() => {}} />
      </Panel>
      <Panel label="nothing found">
        <Card result={FIXTURE_EMPTY} defaultExpanded onDismiss={() => {}} />
      </Panel>
      <Panel label="loading">
        <Skeleton />
      </Panel>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Preview />
  </StrictMode>,
)
