/* ---------------------------------------------------------------------------
 * What Verte is currently seeing on a tab, and the words for it.
 *
 * This exists because "I clicked the icon and nothing happened" was
 * indistinguishable from six different situations: the site isn't one we
 * support, the page isn't a product, the proxy isn't running, the category has
 * no guidance yet, the product genuinely has no secondhand listings, or the
 * card is right there on the page and the popup simply isn't where it lives.
 *
 * Only the last of those is working as intended, and the buyer could not tell
 * any of them apart. The popup now answers the question it is actually being
 * asked.
 *
 * Deliberately NOT in src/types.ts: that file is the frozen contract every
 * lane builds against (§02), and this is a diagnostic channel between the
 * content script and the popup, not part of the VerteResult contract.
 * ------------------------------------------------------------------------- */

/** Where the card is, or why it isn't. */
export type VerteStatus =
  /** Not a retailer we have an adapter for. Nothing is injected here at all. */
  | { state: 'unsupported-site' }
  /** Right retailer, but a search page, a category, a cart — not a product. */
  | { state: 'not-a-product' }
  /** Still working. */
  | { state: 'looking' }
  /** The proxy isn't answering. Almost always: it isn't running. */
  | { state: 'proxy-unreachable' }
  /** We classified it, but no guidance exists for that category yet. */
  | { state: 'no-category'; title: string }
  /** Anything else the proxy said no to. */
  | { state: 'failed'; detail: string }
  /** Guidance says buy this one new. The card says so on the page. */
  | { state: 'buy-new'; title: string }
  /** Fine to buy used, but this retailer is listing none right now. */
  | { state: 'no-listings'; title: string }
  /** The card is on the page. */
  | { state: 'showing'; count: number; savings: number | null; currency: string }
  /** They dismissed it for this product. The popup can bring it back. */
  | { state: 'dismissed' }

export type StatusRequest = { type: 'VERTE_STATUS' } | { type: 'VERTE_RESHOW' }

/**
 * The seam between the service worker's error strings and these states.
 *
 * The worker reports `proxy returned <code>` for an HTTP answer and the raw
 * network message otherwise. Keep those two shapes stable or this goes back to
 * reporting every failure as the same shrug.
 */
export function statusForLookupError(error: string, title: string): VerteStatus {
  const http = error.match(/^proxy returned (\d+)$/)
  if (!http) return { state: 'proxy-unreachable' }
  if (http[1] === '404') return { state: 'no-category', title }
  return { state: 'failed', detail: error }
}

/** One line, in the buyer's words, plus what they can do about it. */
export function describeStatus(status: VerteStatus): { head: string; sub: string | null } {
  switch (status.state) {
    case 'unsupported-site':
      return {
        head: 'Verte does not run on this site yet',
        sub: 'It works on Amazon and Best Buy product pages.',
      }
    case 'not-a-product':
      return {
        head: 'This is not a product page',
        sub: 'Open a specific item and Verte will look for it secondhand.',
      }
    case 'looking':
      return { head: 'Looking for this one secondhand…', sub: null }
    case 'proxy-unreachable':
      return {
        head: 'Cannot reach the Verte service',
        sub: 'Start it with "npm run proxy" and reload the page.',
      }
    case 'no-category':
      return {
        head: 'No guidance for this kind of thing yet',
        sub: 'Verte only speaks up where it has something useful to say.',
      }
    case 'failed':
      return { head: 'Something went wrong', sub: status.detail }
    case 'buy-new':
      return {
        head: 'Verte suggests buying this one new',
        sub: 'The reason is on the page, next to the buy button.',
      }
    case 'no-listings':
      return {
        head: 'Nothing secondhand listed right now',
        sub: 'Fine to buy used in general — this retailer just has none today.',
      }
    case 'showing':
      return {
        head: 'Verte is on this page',
        sub: 'The card sits next to the buy button.',
      }
    case 'dismissed':
      return { head: 'You dismissed Verte for this product', sub: null }
  }
}
