/*
 * The inline card. BUILD_PLAN.md §06.
 *
 * Rendered as plain DOM inside a SHADOW ROOT — Amazon's stylesheet would
 * obliterate an ordinary injected div, and ours must not leak into theirs.
 * Plain DOM rather than React on purpose: this runs on every product page the
 * user opens, and it has to be there before they've finished reading the title.
 *
 * The order on the card is the argument: money, then verdict, then carbon,
 * then the listings. Web fonts are deliberately not loaded — a retailer's
 * font-src CSP would block them and leave the card in a fallback anyway, so
 * the stacks below ARE the design.
 */

const TOKENS = `
  :host { all: initial; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .verte {
    --base:#FAF6ED; --moss:#D0E2B8; --tint:#E8F0DA; --shade:#9FB87E;
    --ink:#42473C; --soft:#868C7C; --accent:#3C4A2C; --mark:#5C8A6B;
    --serif: Georgia, 'Times New Roman', serif;
    --sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background: var(--base);
    border: 1px solid var(--shade);
    border-radius: 28px;
    box-shadow: 0 8px 24px rgba(92,138,107,.10);
    color: var(--ink);
    font-family: var(--sans);
    font-size: 13px;
    line-height: 1.45;
    margin: 16px 0;
    overflow: hidden;
    max-width: 420px;
  }
  .head { background: var(--tint); position:relative; }
  .toggle {
    align-items:center; background:none; border:0; color:inherit; cursor:pointer;
    display:flex; font:inherit; gap:8px; padding:10px 44px 10px 16px;
    text-align:left; width:100%;
  }
  .toggle:focus-visible { outline:2px solid var(--shade); outline-offset:-4px; border-radius:20px; }
  .summary { color:var(--soft); font-size:12px; margin-left:auto;
             overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .chev { color:var(--soft); flex:none; transition:transform .15s ease; }
  .verte.collapsed .chev { transform:rotate(-90deg); }
  .verte.collapsed .body { display:none; }
  @media (prefers-reduced-motion: reduce) { .chev { transition:none; } }
  .word { color: var(--mark); font-family: var(--serif); font-size:16px; font-weight:600; }
  .x {
    background:none; border:0; color:var(--soft); cursor:pointer; font-size:16px;
    line-height:1; padding:4px; position:absolute; right:12px; top:50%; transform:translateY(-50%);
  }
  .x:hover { color: var(--ink); }
  .body { padding: 18px 20px 20px; }
  .rule { background:var(--shade); border:0; height:1px; margin:14px 0; opacity:.5; }
  .title { color:var(--soft); font-size:12px; margin-bottom:6px;
           overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lead { color:var(--ink); font-family:var(--serif); font-size:19px; font-weight:700; }
  .cite { color:var(--soft); font-size:11px; margin-top:4px; }
  .alts { list-style:none; }
  .alt { border-top:1px solid var(--shade); padding:11px 0; }
  .alt:first-child { border-top:0; padding-top:4px; }
  .alt a { color:var(--accent); font-weight:600; text-decoration:none; }
  .alt a:hover { text-decoration:underline; }
  .why { color:var(--soft); font-size:12px; margin-top:2px; }
  .delta { color:var(--accent); font-size:11px; font-weight:600; margin-top:3px; }
  .foot { color:var(--soft); font-size:11px; margin-top:14px; }
  .skeleton { background:var(--tint); border-radius:8px; height:12px; }
  .skeleton + .skeleton { margin-top:10px; }
  .w60 { width:60%; } .w40 { width:40%; } .w80 { width:80%; }
`;

const MARK = `<svg width="26" height="12" viewBox="-132 -114 264 124" aria-hidden="true">
  <g transform="rotate(-15) translate(-100 -100)"><path d="M 0 0 A 100 100 0 0 1 100 100 A 100 100 0 0 1 0 0 Z" fill="#9DC9AC"/></g>
  <g transform="rotate(15) scale(-1 1) translate(-100 -100)"><path d="M 0 0 A 100 100 0 0 1 100 100 A 100 100 0 0 1 0 0 Z" fill="#6FA984" fill-opacity=".88"/></g>
</svg>`;

const CHEVRON = `<svg class="chev" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
  <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/* The header is the collapse control. `summary` stays visible when collapsed,
 * so a folded card still says what's inside it. */
function shell(inner, summary = '') {
  return `<div class="verte">
    <div class="head">
      <button class="toggle" aria-expanded="true" aria-controls="verte-body" title="Collapse">
        ${MARK}<span class="word">Verte</span>
        <span class="summary">${summary}</span>
        ${CHEVRON}
      </button>
      <button class="x" title="Dismiss" aria-label="Dismiss">&times;</button>
    </div>
    <div class="body" id="verte-body">${inner}</div>
  </div>`;
}

/** A blank flash on someone else's page is worse than not appearing. */
export function skeletonHtml() {
  return shell('<div class="skeleton w60"></div><div class="skeleton w80"></div><div class="skeleton w40"></div>');
}

export function cardHtml(result) {
  const { product, guidance, alternatives = [], embodiedCo2Kg } = result;

  // The sourced baseline: what making this thing costs. Shown only when the
  // knowledge base has a citation for it — never estimated into existence.
  const baseline =
    embodiedCo2Kg > 0
      ? `<div class="lead">~${Math.round(embodiedCo2Kg)} kg CO\u2082e to manufacture</div>
         <div class="cite">${guidance.co2Source}</div>`
      : `<div class="lead">${alternatives.length ? 'Lower-carbon options' : 'No lower-carbon option found'}</div>`;

  const list = alternatives.length
    ? `<hr class="rule"><ul class="alts">${alternatives
        .map(
          (a) => `<li class="alt">
            <a href="${a.url}" target="_blank" rel="noopener">${a.title}</a>
            <div class="why">${a.why}</div>
            ${a.co2SavingKgPerYear ? `<div class="delta">~${a.co2SavingKgPerYear} kg CO\u2082e/year less</div>` : ''}
          </li>`
        )
        .join('')}</ul>
       <div class="foot">Picked by Verte AI from energy use, certifications and lifespan.</div>`
    : `<div class="why" style="margin-top:8px">${
        guidance.note || 'Nothing here is meaningfully lower-carbon than what you are looking at.'
      }</div>`;

  const summary = alternatives.length
    ? `${alternatives.length} lower-carbon option${alternatives.length === 1 ? '' : 's'}`
    : embodiedCo2Kg > 0
    ? `~${Math.round(embodiedCo2Kg)} kg CO\u2082e to make`
    : '';

  return shell(`
    <div class="title">${product.title}</div>
    ${baseline}
    ${list}
  `, summary);
}

export { TOKENS };
