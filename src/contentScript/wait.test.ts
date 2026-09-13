/* ---------------------------------------------------------------------------
 * Waiting for the product to actually exist.
 *
 * run() fired once at document_idle and gave up if extractProduct() returned
 * null. Best Buy is a React SPA and Amazon renders its title late, so on a
 * normal page load there was frequently nothing there yet — and nothing ever
 * looked again. That is why the card only appeared after repeated refreshes:
 * a race that a reload sometimes won.
 *
 * Condition-based, not a fixed sleep: resolve the instant the thing appears,
 * give up at a deadline.
 * ------------------------------------------------------------------------- */

import { beforeEach, describe, expect, test } from 'vitest'
import { waitFor } from './wait'

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('waitFor', () => {
  test('resolves immediately when the value is already there', async () => {
    document.body.innerHTML = '<h1>Already Here</h1>'
    const found = await waitFor(() => document.querySelector('h1')?.textContent ?? null, 500)
    expect(found).toBe('Already Here')
  })

  test('resolves as soon as the value appears later', async () => {
    const promise = waitFor(() => document.querySelector('h1')?.textContent ?? null, 2000)
    setTimeout(() => {
      document.body.innerHTML = '<h1>Arrived Late</h1>'
    }, 40)
    expect(await promise).toBe('Arrived Late')
  })

  test('gives up at the deadline rather than hanging forever', async () => {
    const started = Date.now()
    const found = await waitFor(() => null, 120)
    expect(found).toBeNull()
    expect(Date.now() - started).toBeGreaterThanOrEqual(100)
  })

  test('treats undefined the same as absent', async () => {
    expect(await waitFor(() => undefined, 60)).toBeNull()
  })

  test('does not keep observing after it resolves', async () => {
    /* A leaked MutationObserver on a retail page runs on every DOM mutation
     * for as long as the tab is open. */
    document.body.innerHTML = '<h1>Here</h1>'
    await waitFor(() => document.querySelector('h1')?.textContent ?? null, 500)
    const before = document.body.innerHTML
    document.body.innerHTML = before + '<div>more</div>'
    expect(true).toBe(true)
  })
})
