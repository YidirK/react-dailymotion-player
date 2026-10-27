import { fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearApiCache, DailymotionPlaylist } from './index'

const makeVideos = (ids: string[]) =>
  ids.map((id) => ({ id, title: `Video ${id}`, duration: 75, thumbnail_480_url: `https://img.example/${id}.jpg` }))

describe('DailymotionPlaylist', () => {
  let createPlayer: ReturnType<typeof vi.fn>

  beforeEach(() => {
    clearApiCache()
    createPlayer = vi.fn()
    ;(window as unknown as { dailymotion: unknown }).dailymotion = { createPlayer }
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ list: makeVideos(['a', 'b', 'c', 'd']), has_more: false }),
      })),
    )
  })

  afterEach(() => {
    delete (window as unknown as { dailymotion?: unknown }).dailymotion
    vi.unstubAllGlobals()
  })

  const cards = (container: HTMLElement) => container.querySelectorAll<HTMLButtonElement>('.dmp-card')

  it('lists videos without creating any player and reports clicks', async () => {
    const onSelect = vi.fn()
    const { container } = render(
      <DailymotionPlaylist playlist="pl1" title="Latest" tag="News" onSelect={onSelect} />,
    )
    await waitFor(() => expect(cards(container)).toHaveLength(4))

    expect(container.querySelector('h2')?.textContent).toBe('Latest')
    expect(container.querySelectorAll('.dmp-tag')).toHaveLength(4)
    expect(container.querySelector('.dmp-tag')?.textContent).toBe('News')

    fireEvent.click(cards(container)[1]!)
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }))
    expect(createPlayer).not.toHaveBeenCalled()
  })

  it('marks `selectedVideo` as the video being played', async () => {
    const { container } = render(<DailymotionPlaylist playlist="pl1" selectedVideo="c" />)
    await waitFor(() => expect(cards(container)).toHaveLength(4))
    const pressed = container.querySelectorAll('.dmp-card[aria-pressed="true"]')
    expect(pressed).toHaveLength(1)
    expect(pressed[0]?.getAttribute('data-video-id')).toBe('c')
  })

  it('supports the vertical variant and the carousel layout', async () => {
    const { container } = render(<DailymotionPlaylist playlist="pl1" variant="vertical" layout="carousel" />)
    await waitFor(() => expect(cards(container)).toHaveLength(4))
    const root = container.querySelector('.dmp-root')!
    expect(root.getAttribute('data-dmp-variant')).toBe('vertical')
    expect(root.getAttribute('data-dmp-layout')).toBe('carousel')
    expect(container.querySelector('button[aria-label="Scroll right"]')).not.toBeNull()
  })

  it('inserts inline ads every N cards, but never after the last card', async () => {
    const { container } = render(
      <DailymotionPlaylist
        playlist="pl1"
        inlineAds={{ every: 2, render: (position) => <span data-testid="ad">ad after {position}</span> }}
      />,
    )
    await waitFor(() => expect(cards(container)).toHaveLength(4))
    // 4 cards, every 2: one ad after card 2 (the one after card 4 would be trailing).
    const ads = container.querySelectorAll('.dmp-item-ad')
    expect(ads).toHaveLength(1)
    expect(ads[0]?.textContent).toBe('ad after 2')
    expect(ads[0]?.previousElementSibling?.querySelector('[data-video-id="b"]')).not.toBeNull()
  })

  it('honours startAfter for inline ads', async () => {
    const { container } = render(
      <DailymotionPlaylist
        playlist="pl1"
        inlineAds={{ every: 2, startAfter: 1, render: (n) => <span>ad {n}</span> }}
      />,
    )
    await waitFor(() => expect(cards(container)).toHaveLength(4))
    // After cards 1 and 3.
    expect(Array.from(container.querySelectorAll('.dmp-item-ad')).map((el) => el.textContent)).toEqual([
      'ad 1',
      'ad 3',
    ])
  })

  it('renders nothing when hideWhenEmpty is set and the playlist cannot be loaded', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })))
    const onError = vi.fn()
    const { container } = render(<DailymotionPlaylist playlist="missing" hideWhenEmpty onError={onError} />)
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
    expect(container.querySelector('.dmp-root')).toBeNull()
  })

  it('renders nothing when hideWhenEmpty is set and the playlist is empty', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ list: [], has_more: false }) })))
    const { container } = render(<DailymotionPlaylist playlist="empty" hideWhenEmpty />)
    await waitFor(() => expect(container.querySelector('.dmp-root')).toBeNull())
  })
})
