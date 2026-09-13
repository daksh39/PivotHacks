import './styles/AlternativesScreen.css';
import VerteHeader from '../components/VerteHeader';
import GeneralButton from '../components/GeneralButton';
import { LINKS } from '../config';

/*
 * The popup's view of the same answer the card is showing on the page.
 *
 * Two tiers, kept visually distinct because they are not equally trustworthy:
 * the manufacturing figure is sourced and carries its citation; the
 * alternatives are model estimates and say so.
 */
function AlternativesScreen({ result }) {
    const { product, guidance, alternatives, embodiedCo2Kg } = result;

    return (
        <div className="alt-container">
            <VerteHeader isSmall={true} />

            <div className="alt-product">{product.title}</div>

            {embodiedCo2Kg > 0 ? (
                <div className="alt-baseline">
                    <div className="alt-figure">~{Math.round(embodiedCo2Kg)} kg CO₂e to manufacture</div>
                    <div className="alt-cite">{guidance.co2Source}</div>
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
                                {alternative.co2SavingKgPerYear ? (
                                    <div className="alt-delta">
                                        ~{alternative.co2SavingKgPerYear} kg CO₂e/year less
                                    </div>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                    <div className="alt-foot">
                        Suggestions are AI estimates, not published figures. Links open a search.
                    </div>
                </>
            )}

            <div className="alt-action">
                <GeneralButton text={"How we pick these"} height={"34px"} width={"150px"} isOutline={true}
                               handleClick={() => window.open(LINKS.methodology, "_blank")} />
            </div>
        </div>
    );
}

export default AlternativesScreen;
