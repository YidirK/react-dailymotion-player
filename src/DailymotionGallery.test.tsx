import { fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearApiCache, DailymotionGallery } from './index'

const makeVideos = (ids: string[]) =>
  ids.map((id) => ({
    id,
    title: `Video ${id}`,
    description: `Description ${id}`,
    duration: 75,
    created_time: 1700000000,
    thumbnail_480_url: `https://img.example/${id}.jpg`,
  }))

describe('DailymotionGallery', () => {
  let destroy: ReturnType<typeof vi.fn>
  let loadContent: ReturnType<typeof vi.fn>
  let play: ReturnType<typeof vi.fn>
  let createPlayer: ReturnType<typeof vi.fn>
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    clearApiCache()
    destroy = vi.fn()
    loadContent = vi.fn()
    play = vi.fn(() => Promise.resolve())
    createPlayer = vi.fn(() => Promise.resolve({ destroy, loadContent, play }))
    ;(window as unknown as { dailymotion: unknown }).dailymotion = { createPlayer }

    fetchMock = vi.fn(async (url: string) => {
      const page = new URL(url).searchParams.get('page')
      return {
        ok: true,
        json: async () =>
          page === '1'
            ? { list: makeVideos(['a', 'b', 'c']), has_more: true }
            : { list: makeVideos(['d']), has_more: false },
      }
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    delete (window as unknown as { dailymotion?: unknown }).dailymotion
    vi.unstubAllGlobals()
  })

  const cards = (container: HTMLElement) => container.querySelectorAll<HTMLButtonElement>('.dmp-card')
  const card = (container: HTMLElement, id: string) =>
    container.querySelector<HTMLButtonElement>(`.dmp-card[data-video-id="${id}"]`)!
  const button = (container: HTMLElement, label: string) =>
    container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!

  it('lists the playlist videos and plays the first one', async () => {
    const { container } = render(<DailymotionGallery playerId="p1" playlist="pl1" />)

    await waitFor(() => expect(createPlayer).toHaveBeenCalledTimes(1))
    expect((createPlayer.mock.calls[0] as unknown as [string, Record<string, unknown>])[1].video).toBe('a')
    expect(cards(container)).toHaveLength(3)

    const url = new URL((fetchMock.mock.calls[0] as unknown as [string])[0])
    expect(url.pathname).toBe('/playlist/pl1/videos')
    expect(url.searchParams.get('limit')).toBe('8')
    expect(card(container, 'a').getAttribute('aria-pressed')).toBe('true')
  })

  it('starts on the `video` prop when given', async () => {
    render(<DailymotionGallery playerId="p1" playlist="pl1" video="b" />)
    await waitFor(() => expect(createPlayer).toHaveBeenCalledTimes(1))
    expect((createPlayer.mock.calls[0] as unknown as [string, Record<string, unknown>])[1].video).toBe('b')
  })

  it('loads the clicked video in the same player', async () => {
    const onVideoSelect = vi.fn()
    const { container } = render(
      <DailymotionGallery playerId="p1" playlist="pl1" onVideoSelect={onVideoSelect} />,
    )
    await waitFor(() => expect(cards(container)).toHaveLength(3))
    await waitFor(() => expect(createPlayer).toHaveBeenCalled())

    fireEvent.click(card(container, 'c'))

    await waitFor(() => expect(loadContent).toHaveBeenCalledWith({ video: 'c' }))
    expect(createPlayer).toHaveBeenCalledTimes(1)
    expect(destroy).not.toHaveBeenCalled()
    expect(card(container, 'c').getAttribute('aria-pressed')).toBe('true')
    expect(onVideoSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'c' }))
  })

  it('moves with the previous / next buttons', async () => {
    const { container } = render(<DailymotionGallery playerId="p1" playlist="pl1" />)
    await waitFor(() => expect(createPlayer).toHaveBeenCalled())
    await waitFor(() => expect(button(container, 'Next video').disabled).toBe(false))

    expect(button(container, 'Previous video').disabled).toBe(true)
    fireEvent.click(button(container, 'Next video'))
    await waitFor(() => expect(loadContent).toHaveBeenCalledWith({ video: 'b' }))

    expect(button(container, 'Previous video').disabled).toBe(false)
    fireEvent.click(button(container, 'Previous video'))
    await waitFor(() => expect(loadContent).toHaveBeenLastCalledWith({ video: 'a' }))
  })

  it('loads the next page with "Show more"', async () => {
    const { container, getByText, queryByText } = render(
      <DailymotionGallery playerId="p1" playlist="pl1" />,
    )
    await waitFor(() => expect(cards(container)).toHaveLength(3))

    fireEvent.click(getByText('Show more'))
    await waitFor(() => expect(cards(container)).toHaveLength(4))
    expect(new URL((fetchMock.mock.calls[1] as unknown as [string])[0]).searchParams.get('page')).toBe('2')
    expect(queryByText('Show more')).toBeNull()
  })

  it('loads the next page when "Next video" is used on the last loaded video', async () => {
    const { container } = render(<DailymotionGallery playerId="p1" playlist="pl1" video="c" />)
    await waitFor(() => expect(createPlayer).toHaveBeenCalled())
    await waitFor(() => expect(button(container, 'Next video').disabled).toBe(false))

    fireEvent.click(button(container, 'Next video'))
    await waitFor(() => expect(loadContent).toHaveBeenCalledWith({ video: 'd' }))
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('applies theme, color scheme, columns and class names', async () => {
    const { getByTestId, container } = render(
      <DailymotionGallery
        data-testid="gallery"
        playerId="p1"
        playlist="pl1"
        theme={{ accentColor: '#0066ff', borderRadius: 12 }}
        colorScheme="dark"
        columns={3}
        className="mine"
        classNames={{ card: 'my-card', cardActive: 'my-active' }}
      />,
    )
    const root = getByTestId('gallery')
    expect(root.style.getPropertyValue('--dmp-accent')).toBe('#0066ff')
    expect(root.style.getPropertyValue('--dmp-radius')).toBe('12px')
    expect(root.style.getPropertyValue('--dmp-columns')).toBe('3')
    expect(root.style.getPropertyValue('--dmp-columns-tablet')).toBe('2')
    expect(root.getAttribute('data-dmp-scheme')).toBe('dark')
    expect(root.className).toContain('mine')

    await waitFor(() => expect(container.querySelectorAll('.my-card')).toHaveLength(3))
    await waitFor(() => expect(container.querySelectorAll('.my-active')).toHaveLength(1))
  })

  it('translates labels, hides parts and can skip the stylesheet', async () => {
    const { container, getByText } = render(
      <DailymotionGallery
        playerId="p1"
        playlist="pl1"
        injectStyles={false}
        showDescription={false}
        showDuration={false}
        showDate={false}
        labels={{ showMore: 'Voir plus', playing: 'En lecture' }}
      />,
    )
    await waitFor(() => expect(cards(container)).toHaveLength(3))
    expect(container.querySelector('style[data-dmp-styles]')).toBeNull()
    expect(container.querySelector('.dmp-description')).toBeNull()
    expect(container.querySelector('.dmp-duration')).toBeNull()
    expect(container.querySelector('.dmp-date')).toBeNull()
    expect(getByText('Voir plus')).toBeTruthy()
    await waitFor(() => expect(getByText('En lecture')).toBeTruthy())
  })

  it('injects the stylesheet by default and renders the carousel layout', async () => {
    const { container } = render(<DailymotionGallery playerId="p1" playlist="pl1" layout="carousel" />)
    await waitFor(() => expect(cards(container)).toHaveLength(3))
    expect(container.querySelector('style[data-dmp-styles]')).not.toBeNull()
    expect(container.querySelector('[data-dmp-layout="carousel"]')).not.toBeNull()
    expect(button(container, 'Scroll left')).toBeTruthy()
    expect(button(container, 'Scroll right')).toBeTruthy()
  })

  it('shows an error and calls onError when the playlist cannot be loaded', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })))
    const onError = vi.fn()
    const { findByText } = render(<DailymotionGallery playerId="p1" playlist="pl1" onError={onError} />)
    expect(await findByText('Unable to load the videos')).toBeTruthy()
    expect(onError).toHaveBeenCalledTimes(1)
    expect(createPlayer).not.toHaveBeenCalled()
  })

  it('plays the picked video, but not the one shown at start', async () => {
    const { container } = render(<DailymotionGallery playerId="p1" playlist="pl1" />)
    await waitFor(() => expect(createPlayer).toHaveBeenCalled())
    await waitFor(() => expect(cards(container)).toHaveLength(3))
    expect(play).not.toHaveBeenCalled()

    fireEvent.click(card(container, 'b'))
    await waitFor(() => expect(loadContent).toHaveBeenCalledWith({ video: 'b' }))
    expect(play).toHaveBeenCalledTimes(1)

    fireEvent.click(button(container, 'Next video'))
    await waitFor(() => expect(loadContent).toHaveBeenLastCalledWith({ video: 'c' }))
    expect(play).toHaveBeenCalledTimes(2)
  })

  it('does not call play() when autoplayOnSelect is false', async () => {
    const { container } = render(<DailymotionGallery playerId="p1" playlist="pl1" autoplayOnSelect={false} />)
    await waitFor(() => expect(createPlayer).toHaveBeenCalled())
    await waitFor(() => expect(cards(container)).toHaveLength(3))
    fireEvent.click(card(container, 'b'))
    await waitFor(() => expect(loadContent).toHaveBeenCalledWith({ video: 'b' }))
    expect(play).not.toHaveBeenCalled()
  })

  it('gives the playlist to the player with playPlaylist', async () => {
    const { container } = render(<DailymotionGallery playerId="p1" playlist="pl1" playPlaylist />)
    await waitFor(() => expect(createPlayer).toHaveBeenCalled())
    const config = (createPlayer.mock.calls[0] as unknown as [string, Record<string, unknown>])[1]
    expect(config).toMatchObject({ video: 'a', playlist: 'pl1' })

    await waitFor(() => expect(cards(container)).toHaveLength(3))
    fireEvent.click(card(container, 'c'))
    await waitFor(() => expect(loadContent).toHaveBeenCalledWith({ video: 'c', playlist: 'pl1' }))
  })

  it('supports tag, vertical variant and inline ads', async () => {
    const { container } = render(
      <DailymotionGallery
        playerId="p1"
        playlist="pl1"
        tag="News"
        variant="vertical"
        inlineAds={{ every: 1, render: (n) => <span>ad {n}</span> }}
      />,
    )
    await waitFor(() => expect(cards(container)).toHaveLength(3))
    expect(container.querySelector('.dmp-root')?.getAttribute('data-dmp-variant')).toBe('vertical')
    expect(container.querySelectorAll('.dmp-tag')).toHaveLength(3)
    expect(Array.from(container.querySelectorAll('.dmp-item-ad')).map((el) => el.textContent)).toEqual(['ad 1', 'ad 2'])
  })
})
