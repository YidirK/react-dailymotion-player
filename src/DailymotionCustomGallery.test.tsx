import { fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearApiCache, DailymotionCustomGallery } from './index'

const makeVideos = (ids: string[]) =>
  ids.map((id) => ({
    id,
    title: `Video ${id}`,
    duration: 120,
    thumbnail_480_url: `https://img.example/${id}.jpg`,
  }))

describe('DailymotionCustomGallery', () => {
  let createPlayer: ReturnType<typeof vi.fn>

  beforeEach(() => {
    clearApiCache()
    createPlayer = vi.fn()
    ;(window as unknown as { dailymotion: unknown }).dailymotion = { createPlayer }
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ list: makeVideos(['v1', 'v2', 'v3']), has_more: false }),
      })),
    )
  })

  afterEach(() => {
    delete (window as unknown as { dailymotion?: unknown }).dailymotion
    vi.unstubAllGlobals()
  })

  it('lists custom query videos and plays the first one in player', async () => {
    const onVideoSelect = vi.fn()
    const { container } = render(
      <DailymotionCustomGallery
        playerId="xplayer"
        sort="visited"
        title="Top Vues"
        onVideoSelect={onVideoSelect}
      />,
    )

    await waitFor(() => expect(container.querySelectorAll('.dmp-card')).toHaveLength(3))
    await waitFor(() => expect(createPlayer).toHaveBeenCalled())

    expect(createPlayer).toHaveBeenCalledWith(
      expect.stringMatching(/^dailymotion-player-/),
      expect.objectContaining({ video: 'v1' }),
    )

    // Clicking next card triggers video selection
    fireEvent.click(container.querySelectorAll('.dmp-card')[1]!)
    expect(onVideoSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'v2' }))
  })
})
