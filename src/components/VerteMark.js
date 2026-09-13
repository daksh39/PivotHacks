/*
 * The Verte mark: two leaf forms sharing a base point.
 *
 * Each leaf is a square with two opposite corners fully rounded, which is the
 * SVG equivalent of `border-radius: 0 100% 0 100%` — the lens shape leaves
 * tips on the remaining diagonal. The left leaf tilts -15deg, the right +15deg,
 * both about the shared base point at the origin.
 */

const LEAF = 'M 0 0 A 100 100 0 0 1 100 100 A 100 100 0 0 1 0 0 Z';

// Natural proportions of the splayed pair, used to keep the mark unsquashed.
const VIEW_W = 264;
const VIEW_H = 124;

function VerteMark({ height = 24, title = 'Verte' }) {
  return (
    <svg
      width={Math.round((height * VIEW_W) / VIEW_H)}
      height={height}
      viewBox={`-132 -114 ${VIEW_W} ${VIEW_H}`}
      fill="none"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* left leaf — its near corner lands on the shared base point */}
      <g transform="rotate(-15) translate(-100 -100)">
        <path d={LEAF} fill="#9DC9AC" />
      </g>
      {/* right leaf — the same form mirrored, tilted the other way */}
      <g transform="rotate(15) scale(-1 1) translate(-100 -100)">
        <path d={LEAF} fill="#6FA984" fillOpacity="0.88" />
      </g>
    </svg>
  );
}

export default VerteMark;
