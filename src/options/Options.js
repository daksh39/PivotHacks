import './Options.css';
import VerteMark from '../components/VerteMark';
import { BRAND, LINKS } from '../config';

function Options() {
  return (
    <div className="verte-options">
      <header className="verte-options-header">
        <VerteMark height={44} />
        <h1 className="verte-options-wordmark">{BRAND.name}</h1>
        <p className="verte-options-thesis">{BRAND.thesis}</p>
        <p className="verte-options-tagline">{BRAND.tagline}</p>
        <a
          className="verte-options-link"
          href={LINKS.methodology}
          target="_blank"
          rel="noopener noreferrer"
        >
          How we pick listings, and where the carbon figures come from
        </a>
      </header>
    </div>
  );
}

export default Options;
