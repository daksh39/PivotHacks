import './styles/AlternativesScreen.css';

/*
 * The popup's view of the same answer the card is showing on the page.
 *
 * Two tiers, kept visually distinct because they are not equally trustworthy:
 * the manufacturing figure is sourced and carries its citation; the
 * alternatives are model estimates and say so.
 */
function AlternativesScreen({ result }) {
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
                                <a href={alternative.url} target="_blank" rel="noopener noreferrer">
                                    {alternative.title}
                                </a>
                                <div className="alt-why">{alternative.why}</div>
                                {(alternative.typicalPriceUsd || alternative.fitsContext) && (
                                    <div className="alt-fit">
                                        {[alternative.typicalPriceUsd ? `~$${alternative.typicalPriceUsd}` : null,
                                          alternative.fitsContext].filter(Boolean).join(' · ')}
                                    </div>
                                )}
                                {alternative.co2SavingKgPerYear ? (
                                    <div className="alt-delta">
                                        ~{alternative.co2SavingKgPerYear} kg CO₂e/year less
                                    </div>
                                ) : null}
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
