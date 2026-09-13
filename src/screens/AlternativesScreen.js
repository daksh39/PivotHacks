import './styles/AlternativesScreen.css';

/* The real Amazon.ca price once the exact listing is found; the model's
 * estimate, marked "~", until then. */
function priceLabel(alternative) {
    if (alternative.livePrice) {
        const p = alternative.livePrice;
        return `CA$${Number.isInteger(p) ? p : p.toFixed(2)}`;
    }
    if (alternative.typicalPriceCad) return `~CA$${alternative.typicalPriceCad}`;
    return null;
}

function Pick({ alternative }) {
    const price = priceLabel(alternative);
    return (
        <>
            <a href={alternative.url} target="_blank" rel="noopener noreferrer">
                {alternative.title}
            </a>
            <div className="alt-why">{alternative.why}</div>
            {(price || alternative.fitsContext) && (
                <div className="alt-fit">
                    {[price, alternative.fitsContext].filter(Boolean).join(' · ')}
                </div>
            )}
            {alternative.co2SavingKgPerYear ? (
                <div className="alt-delta">
                    ~{alternative.co2SavingKgPerYear} kg CO₂e/year less
                </div>
            ) : null}
        </>
    );
}

/* "University essentials": every item a student needs, one pick each. */
function EssentialsScreen({ result }) {
    const { essentials = [], contextTags = [] } = result;
    return (
        <div className="alt-container">
            {contextTags.length > 0 && (
                <div className="alt-context">Recommended for: {contextTags.join(' · ')}</div>
            )}
            <div className="alt-baseline">
                <div className="alt-figure">University essentials</div>
                <div className="alt-cite">One lower-carbon pick for everything you need to move out.</div>
            </div>
            <ul className="alt-list">
                {essentials.map(({ item, alternative }) => (
                    <li key={item} className="alt-item">
                        <div className="alt-essential">{item}</div>
                        {alternative
                            ? <Pick alternative={alternative} />
                            : <div className="alt-why">No pick found that fits.</div>}
                    </li>
                ))}
            </ul>
            <div className="alt-foot">
                Picked by Verte AI from energy use, certifications and lifespan.
            </div>
        </div>
    );
}

/*
 * The popup's view of the same answer the card is showing on the page.
 *
 * Two tiers, kept visually distinct because they are not equally trustworthy:
 * the manufacturing figure is sourced and carries its citation; the
 * alternatives are model estimates and say so.
 */
function AlternativesScreen({ result }) {
    if (result.kind === 'essentials') return <EssentialsScreen result={result} />;
    const { product, guidance, alternatives, embodiedCo2Kg, scarcityReason, contextTags = [] } = result;

    return (
        <div className="alt-container">
            <div className="alt-product">{product.title}</div>

            {contextTags.length > 0 && (
                // The context that changed these picks, exactly as understood.
                <div className="alt-context">Recommended for: {contextTags.join(' · ')}</div>
            )}

            {embodiedCo2Kg > 0 ? (
                <div className="alt-baseline">
                    <div className="alt-figure">~{Math.round(embodiedCo2Kg)} kg CO₂e to manufacture</div>
                    <div className="alt-cite">{guidance.co2Source}</div>
                </div>
            ) : scarcityReason ? (
                // Few real lower-carbon options for this kind of product: say
                // why, then still give them something to buy.
                <div className="alt-baseline">
                    <div className="alt-figure">Not many lower-carbon options</div>
                    <div className="alt-reason">{scarcityReason}</div>
                    <div className="alt-cite">Here's the best pick we found.</div>
                </div>
            ) : (
                <div className="alt-baseline">
                    <div className="alt-figure">
                        {alternatives.length ? 'Lower-carbon options' : 'No lower-carbon option found'}
                    </div>
                    <div className="alt-cite">
                        No published manufacturing figure for this category, so we show none.
                    </div>
                </div>
            )}

            {alternatives.length > 0 && (
                <>
                    <ul className="alt-list">
                        {alternatives.map((alternative) => (
                            <li key={alternative.url} className="alt-item">
                                <Pick alternative={alternative} />
                            </li>
                        ))}
                    </ul>
                    <div className="alt-foot">
                        Picked by Verte AI from energy use, certifications and lifespan.
                    </div>
                </>
            )}
        </div>
    );
}

export default AlternativesScreen;
