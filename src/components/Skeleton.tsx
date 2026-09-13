/* A blank flash on someone else's page is worse than not appearing at all
 * (verte-plan.md §06). */

export function Skeleton() {
  return (
    <div className="verte">
      <div className="verte__header">
        <Leaf />
        <span className="verte__wordmark">Verte</span>
      </div>
      <div className="verte__skeleton" aria-busy="true" aria-label="Looking for this secondhand">
        <div className="verte__bone verte__bone--lg" />
        <div className="verte__bone verte__bone--sm" />
        <div className="verte__bone" />
      </div>
    </div>
  )
}

/* Two overlapping leaf forms on a shared base point (§12). */
export function Leaf({ size = 14 }: { size?: number }) {
  const base = {
    position: 'absolute' as const,
    width: size,
    height: size,
    bottom: 0,
  }
  return (
    <span
      aria-hidden="true"
      style={{ position: 'relative', display: 'inline-block', width: size * 1.4, height: size }}
    >
      <span
        style={{
          ...base,
          left: 0,
          background: '#9DC9AC',
          borderRadius: '0 100% 0 100%',
          transform: 'rotate(-15deg)',
        }}
      />
      <span
        style={{
          ...base,
          right: 0,
          background: '#6FA984',
          opacity: 0.88,
          borderRadius: '100% 0 100% 0',
          transform: 'rotate(15deg)',
        }}
      />
    </span>
  )
}
