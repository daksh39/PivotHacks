import './styles/Essentials.css';

/*
 * University essentials — one tap shows the whole starter kit, one
 * lower-carbon pick per item. The student doesn't have to know what to search
 * for, and whatever context they've given ("under $200") applies to every item.
 * The item list lives in the proxy (proxy/essentials.js).
 */
function Essentials({ standing, onShowAll, onClearStanding, busy }) {
  return (
    <section className="essentials" aria-label="University essentials">
      <div className="essentials-head">
        <button type="button" className="essential" disabled={busy} onClick={onShowAll}>
          University essentials
        </button>
        {standing && (
          <span className="essentials-context">
            {standing}
            <button type="button" onClick={onClearStanding} aria-label={`Clear “${standing}”`}>×</button>
          </span>
        )}
      </div>
    </section>
  );
}

export default Essentials;
