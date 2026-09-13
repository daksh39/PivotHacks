import './styles/MessageScreen.css';
import VerteMark from '../components/VerteMark';

/*
 * What the popup says when there's no card on the page.
 *
 * "Not a product page" used to be the message for every failure — extraction,
 * an unknown category, a proxy that wasn't running. That made a working
 * product look broken and gave no way to tell the cases apart. Each one now
 * says what actually happened and what to do about it.
 */
const MESSAGES = {
  'no-product': [
    "Couldn't read this page",
    'Verte found no product details here. If this is a product page, the retailer may not be supported yet.',
  ],
  'no-anchor': [
    'Found the product, but nowhere to put the card',
    'The page layout is one Verte does not recognise. The details are in the page console.',
  ],
  'unknown-category': [
    'Nothing to say about this one',
    "Verte has no guidance for this category, and would rather say nothing than guess.",
  ],
  offline: [
    'Verte is not connected',
    'The local service is not running. Start it with npm run proxy and refresh the page.',
  ],
  dismissed: ['Dismissed', 'You dismissed the card for this product. Refresh the page to bring it back.'],
  none: [
    "This doesn't look like a product page",
    'Verte works on product listings — open one and check back.',
  ],
};

function StatusScreen({ status }) {
  const [heading, detail] = MESSAGES[status] || MESSAGES.none;

  return (
    <div className="message-container">
      <div className="message-content">
        <VerteMark height={28} />
        <div className="message-text">
          <div>{heading}</div>
          <div>{detail}</div>
        </div>
      </div>
    </div>
  );
}

export default StatusScreen;
