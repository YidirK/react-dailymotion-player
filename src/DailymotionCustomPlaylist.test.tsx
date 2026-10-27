import { fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearApiCache, DailymotionCustomPlaylist } from './index'

const makeVideos = (ids: string[]) =>
  ids.map((id) => ({
    id,
    title: `Video ${id}`,
    duration: 120,
    thumbnail_480_url: `https://img.example/${id}.jpg`,
    views_total: 1000000,
  }))

describe('DailymotionCustomPlaylist', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    clearApiCache()
    fetchMock = vi.fn(async (url: string) => ({
      ok: true,
      json: async () => {
        return { list: makeVideos(['v1', 'v2', 'v3']), has_more: false, total: 3 }
      },
    }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('queries most viewed videos with sort="visited"', async () => {
    const onSelect = vi.fn()
    const { container } = render(
      <DailymotionCustomPlaylist
        title="LES VIDÉOS LES + VUES"
        sort="visited"
        channel="news"
        tag="Top Vues"
        onSelect={onSelect}
      />,
    )

    await waitFor(() => expect(container.querySelectorAll('.dmp-card')).toHaveLength(3))

    expect(fetchMock).toHaveBeenCalled()
    const calledUrl = fetchMock.mock.calls[0]![0] as string
    expect(calledUrl).toContain('videos?')
    expect(calledUrl).toContain('sort=visited')
    expect(calledUrl).toContain('channel=news')

    expect(container.querySelector('h2')?.textContent).toBe('LES VIDÉOS LES + VUES')
    expect(container.querySelector('.dmp-tag')?.textContent).toBe('Top Vues')

    // Click selects video
    fireEvent.click(container.querySelectorAll('.dmp-card')[0]!)
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'v1' }))
  })

  it('queries creator videos using owner prop', async () => {
    const { container } = render(
      <DailymotionCustomPlaylist owner="lemonde" sort="recent" title="Le Monde - Dernières vidéos" />,
    )

    await waitFor(() => expect(container.querySelectorAll('.dmp-card')).toHaveLength(3))

    const calledUrl = fetchMock.mock.calls[0]![0] as string
    expect(calledUrl).toContain('user/lemonde/videos?')
    expect(calledUrl).toContain('sort=recent')
  })

  it('supports unstyled mode with custom Tailwind classNames', async () => {
    const { container } = render(
      <DailymotionCustomPlaylist
        sort="trending"
        unstyled
        classNames={{
          root: 'custom-tailwind-root',
          card: 'bg-white rounded-lg shadow-md',
          title: 'text-xl font-bold',
        }}
      />,
    )

    await waitFor(() => expect(container.querySelectorAll('button')).toHaveLength(3))

    expect(container.querySelector('.dmp-root')).toBeNull()
    expect(container.querySelector('.custom-tailwind-root')).not.toBeNull()
    expect(container.querySelector('.bg-white.rounded-lg.shadow-md')).not.toBeNull()
    expect(container.querySelector('.text-xl.font-bold')).not.toBeNull()
  })
})
