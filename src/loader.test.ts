import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Loader = typeof import('./DailymotionPlayer').loadDailymotionLibrary

describe('loadDailymotionLibrary', () => {
  let load: Loader

  beforeEach(async () => {
    vi.resetModules()
    vi.useFakeTimers()
    delete (window as unknown as { dailymotion?: unknown }).dailymotion
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    load = (await import('./DailymotionPlayer')).loadDailymotionLibrary
  })

  afterEach(() => {
    vi.useRealTimers()
    delete (window as unknown as { dailymotion?: unknown }).dailymotion
  })

  const scripts = () => document.querySelectorAll('script[src*="geo.dailymotion.com/libs/player/"]')

  it('injects the library script once and resolves when `dailymotion` appears', async () => {
    const first = load('x8lr5')
    const second = load('x8lr5')
    expect(first).toBe(second)
    expect(scripts()).toHaveLength(1)
    expect(scripts()[0]?.getAttribute('src')).toBe('https://geo.dailymotion.com/libs/player/x8lr5.js')

    const library = { createPlayer: vi.fn() }
    ;(window as unknown as { dailymotion: unknown }).dailymotion = library
    await vi.advanceTimersByTimeAsync(60)
    await expect(first).resolves.toBe(library)
  })

  it('reuses a library script that is already in the page', async () => {
    const existing = document.createElement('script')
    existing.src = 'https://geo.dailymotion.com/libs/player/xexisting.js'
    document.head.appendChild(existing)

    const promise = load('x8lr5')
    expect(scripts()).toHaveLength(1)

    const library = { createPlayer: vi.fn() }
    ;(window as unknown as { dailymotion: unknown }).dailymotion = library
    await vi.advanceTimersByTimeAsync(60)
    await expect(promise).resolves.toBe(library)
  })

  it('resolves right away when `dailymotion` is already available', async () => {
    const library = { createPlayer: vi.fn() }
    ;(window as unknown as { dailymotion: unknown }).dailymotion = library
    await expect(load('x8lr5')).resolves.toBe(library)
    expect(scripts()).toHaveLength(0)
  })

  it('rejects and removes the script when it fails to load', async () => {
    const promise = load('x8lr5')
    const assertion = expect(promise).rejects.toThrow('Failed to load')
    scripts()[0]?.dispatchEvent(new Event('error'))
    await assertion
    expect(scripts()).toHaveLength(0)

    // A new attempt is possible afterwards.
    void load('x8lr5').catch(() => undefined)
    expect(scripts()).toHaveLength(1)
  })

  it('rejects after 10 seconds if `dailymotion` never appears', async () => {
    const promise = load('x8lr5')
    const assertion = expect(promise).rejects.toThrow('timed out')
    await vi.advanceTimersByTimeAsync(10_100)
    await assertion
  })
})
