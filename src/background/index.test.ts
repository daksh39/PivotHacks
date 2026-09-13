/* ---------------------------------------------------------------------------
 * The listings must survive the trip through the service worker.
 *
 * This file exists because they once did not. The content script scraped real
 * used listings, put them in the message, and this worker forwarded only
 * { product, context } — so the proxy saw an empty array and every card on
 * every product read "nothing secondhand listed". Everything typechecked and
 * every other test passed. Only a human loading the extension could see it.
 * ------------------------------------------------------------------------- */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LookupRequest, LookupResponse, UsedOption } from '../types'

type Listener = (
  message: LookupRequest,
  sender: unknown,
  sendResponse: (response: LookupResponse) => void,
) => boolean

let listener: Listener
let fetchMock: ReturnType<typeof vi.fn>

const option = (over: Partial<UsedOption> = {}): UsedOption => ({
  source: 'amazon',
  title: 'Used - Very Good',
  price: 52,
  currency: 'USD',
  url: 'https://example.test/a',
  imageUrl: null,
  condition: 'Used - Very Good',
  daysToHand: 7,
  ...over,
})

const request = (over: Partial<LookupRequest> = {}): LookupRequest => ({
  type: 'VERTE_LOOKUP',
  product: {
    title: 'Midea 3.1 Cu. Ft. Compact Mini Fridge',
    price: 89,
    currency: 'USD',
    category: '',
    imageUrl: null,
    sourceUrl: 'https://www.amazon.com/dp/TEST',
  },
  context: { needInDays: null, hasCar: false },
  options: [option()],
  ...over,
})

/** Drive the listener the way Chrome does and wait for its async reply. */
function send(message: LookupRequest): Promise<LookupResponse> {
  return new Promise((resolve) => {
    const kept = listener(message, null, resolve)
    expect(kept).toBe(true) // or Chrome closes the channel before we answer
  })
}

function respondWith(body: unknown, ok = true) {
  fetchMock.mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => body })
}

/** What the worker actually put on the wire. */
function sentBody() {
  return JSON.parse(fetchMock.mock.calls[0][1].body)
}

beforeEach(async () => {
  vi.resetModules()
  const store: Record<string, unknown> = {}
  ;(globalThis as any).chrome = {
    runtime: { onMessage: { addListener: (fn: Listener) => (listener = fn) } },
    storage: {
      local: {
        get: async (key: string) => ({ [key]: store[key] }),
        set: async (patch: Record<string, unknown>) => Object.assign(store, patch),
      },
    },
  }
  fetchMock = vi.fn()
  ;(globalThis as any).fetch = fetchMock
  respondWith({ options: [option()], co2AvoidedKg: null, savingsUsd: 37 })

  await import('./index')
})

describe('service worker lookup', () => {
  it('forwards the scraped listings to the proxy', async () => {
    await send(request())
    expect(sentBody().options).toHaveLength(1)
    expect(sentBody().options[0].price).toBe(52)
  })

  it('forwards the product and the buyer context alongside them', async () => {
    await send(request({ context: { needInDays: 3, hasCar: true } }))
    const body = sentBody()
    expect(body.product.title).toMatch(/Mini Fridge/)
    expect(body.context).toEqual({ needInDays: 3, hasCar: true })
  })

  it('sends an empty array rather than undefined when nothing was found', async () => {
    await send(request({ options: undefined as unknown as UsedOption[] }))
    expect(sentBody().options).toEqual([])
  })

  it('does not serve a cached empty answer once listings show up', async () => {
    /* The listings are read from a page that is still rendering, so the first
     * pass can legitimately find none. Caching on the product alone would pin
     * that answer for ten minutes at a product that plainly has listings. */
    await send(request({ options: [] }))
    await send(request({ options: [option()] }))
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(sentBody().options).toEqual([])
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).options).toHaveLength(1)
  })

  it('still caches a genuine repeat of the same request', async () => {
    await send(request())
    await send(request())
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('reports a proxy error instead of pretending it succeeded', async () => {
    respondWith(null, false)
    const response = await send(request())
    expect(response.ok).toBe(false)
  })

  it('answers locally when the proxy is not running', async () => {
    /* Everything /lookup does today is pure, so an unreachable proxy is not a
     * reason to show nothing. Loading dist/ has to work on its own. */
    fetchMock.mockRejectedValue(new Error('Failed to fetch'))
    const response = await send(request())
    expect(response.ok).toBe(true)
    if (!response.ok) throw new Error('expected a local result')
    expect(response.result.guidance.category).toBe('mini-fridge')
    expect(response.result.options).toHaveLength(1)
    expect(response.result.savingsUsd).toBe(37)
  })

  it('still says nothing when it has no guidance for the category offline', async () => {
    fetchMock.mockRejectedValue(new Error('Failed to fetch'))
    const response = await send(
      request({
        product: { ...request().product, title: 'Artisanal Sourdough Starter' },
      }),
    )
    expect(response).toEqual({ ok: false, error: 'proxy returned 404' })
  })

  it('does not fall back when the proxy answered with a 404', async () => {
    /* That is the proxy saying it has no guidance — a real answer. Falling
     * back would substitute our ignorance for its. */
    respondWith(null, false)
    const response = await send(request())
    expect(response.ok).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('ignores messages that are not ours', async () => {
    const kept = listener({ type: 'SOMETHING_ELSE' } as unknown as LookupRequest, null, () => {})
    expect(kept).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
