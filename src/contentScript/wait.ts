/* ---------------------------------------------------------------------------
 * Waiting for something on the page to exist.
 *
 * The content script runs at document_idle, which on these sites is well
 * before the product actually renders — Best Buy is a React SPA, and Amazon
 * fills in its title late. The old code called extractProduct() once and
 * returned if it got null, so a page that was a fraction of a second slow got
 * no card at all, forever. Reloading sometimes won the race, which is why the
 * card seemed to appear at random.
 *
 * Condition-based rather than a fixed sleep: resolve the moment the thing
 * appears, and give up at a deadline instead of hanging.
 * ------------------------------------------------------------------------- */

/**
 * Resolves with the first non-null value `read()` returns, or null at the
 * deadline.
 *
 * Watches the DOM rather than polling on a timer, so it fires on the same
 * frame the element arrives. The poll is only a backstop for changes a
 * MutationObserver does not see (an attribute flip inside a closed shadow
 * root, say).
 */
export function waitFor<T>(read: () => T | null | undefined, timeoutMs = 8000): Promise<T | null> {
  const immediate = read()
  if (immediate != null) return Promise.resolve(immediate)

  return new Promise((resolve) => {
    let settled = false

    const finish = (value: T | null) => {
      if (settled) return
      settled = true
      observer.disconnect()
      clearInterval(poll)
      clearTimeout(deadline)
      resolve(value)
    }

    const check = () => {
      const value = read()
      if (value != null) finish(value)
    }

    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    /* Backstop for mutations the observer cannot see. */
    const poll = setInterval(check, 250)
    const deadline = setTimeout(() => finish(null), timeoutMs)

    check()
  })
}
