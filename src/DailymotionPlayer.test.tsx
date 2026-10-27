import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DailymotionPlayer } from './index'

describe('DailymotionPlayer', () => {
  let destroy: ReturnType<typeof vi.fn>
  let loadContent: ReturnType<typeof vi.fn>
  let play: ReturnType<typeof vi.fn>
  let createPlayer: ReturnType<typeof vi.fn>

  beforeEach(() => {
    destroy = vi.fn()
    loadContent = vi.fn()
    play = vi.fn(() => Promise.resolve())
    createPlayer = vi.fn(() => Promise.resolve({ destroy, loadContent, play }))
    ;(window as unknown as { dailymotion: unknown }).dailymotion = { createPlayer }
  })

  afterEach(() => {
    delete (window as unknown as { dailymotion?: unknown }).dailymotion
  })

  it('calls createPlayer with the video and calls onReady', async () => {
    const onReady = vi.fn()
    await act(async () => {
      render(<DailymotionPlayer playerId="x8lr5" video="x84sh87" onReady={onReady} />)
    })

    expect(createPlayer).toHaveBeenCalledTimes(1)
    const [targetId, config] = createPlayer.mock.calls[0] as [string, Record<string, unknown>]
    expect(targetId).toMatch(/^dailymotion-player-\d+$/)
    expect(config.video).toBe('x84sh87')
    expect(onReady).toHaveBeenCalledWith({ destroy, loadContent, play })
  })

  it('passes playlist and options to createPlayer', async () => {
    await act(async () => {
      render(
        <DailymotionPlayer
          playerId="x8lr5"
          playlist="x79dlo"
          video="x84sh87"
          options={{ mute: true }}
        />,
      )
    })
    const config = createPlayer.mock.calls[0]?.[1] as Record<string, unknown>
    expect(config).toMatchObject({ playlist: 'x79dlo', video: 'x84sh87', mute: true })
  })

  it('destroys the player and empties the wrapper on unmount', async () => {
    let view!: ReturnType<typeof render>
    await act(async () => {
      view = render(<DailymotionPlayer playerId="x8lr5" video="x84sh87" data-testid="host" />)
    })
    const host = view.getByTestId('host')
    expect(host.children.length).toBe(1)

    view.unmount()
    expect(destroy).toHaveBeenCalledTimes(1)
    expect(host.children.length).toBe(0)
  })

  it('switches content with loadContent() when the video changes', async () => {
    let view!: ReturnType<typeof render>
    await act(async () => {
      view = render(<DailymotionPlayer playerId="x8lr5" video="x84sh87" />)
    })
    expect(loadContent).not.toHaveBeenCalled()

    await act(async () => {
      view.rerender(<DailymotionPlayer playerId="x8lr5" video="xabc12" />)
    })
    expect(createPlayer).toHaveBeenCalledTimes(1)
    expect(destroy).not.toHaveBeenCalled()
    expect(loadContent).toHaveBeenCalledTimes(1)
    expect(loadContent).toHaveBeenCalledWith({ video: 'xabc12' })
  })

  it('passes both video and playlist to loadContent()', async () => {
    let view!: ReturnType<typeof render>
    await act(async () => {
      view = render(<DailymotionPlayer playerId="x8lr5" video="x84sh87" />)
    })
    await act(async () => {
      view.rerender(<DailymotionPlayer playerId="x8lr5" video="x84sh87" playlist="x79dlo" />)
    })
    expect(loadContent).toHaveBeenCalledWith({ video: 'x84sh87', playlist: 'x79dlo' })
  })

  it('re-creates the player when playerId or options change', async () => {
    let view!: ReturnType<typeof render>
    await act(async () => {
      view = render(<DailymotionPlayer playerId="x8lr5" video="x84sh87" />)
    })
    await act(async () => {
      view.rerender(<DailymotionPlayer playerId="xother" video="x84sh87" />)
    })
    await act(async () => {
      view.rerender(<DailymotionPlayer playerId="xother" video="x84sh87" options={{ mute: true }} />)
    })
    expect(createPlayer).toHaveBeenCalledTimes(3)
    expect(destroy).toHaveBeenCalledTimes(2)
  })

  it('reports an error when playerId is missing', async () => {
    const onError = vi.fn()
    await act(async () => {
      render(<DailymotionPlayer playerId="" video="x84sh87" onError={onError} />)
    })
    expect(onError).toHaveBeenCalledTimes(1)
    expect(createPlayer).not.toHaveBeenCalled()
  })

  it('calls play() after loadContent() only when playOnChange is set', async () => {
    let view!: ReturnType<typeof render>
    await act(async () => {
      view = render(<DailymotionPlayer playerId="x8lr5" video="a" playOnChange />)
    })
    // Content given at creation is not played by the component.
    expect(play).not.toHaveBeenCalled()

    await act(async () => {
      view.rerender(<DailymotionPlayer playerId="x8lr5" video="b" playOnChange />)
    })
    expect(loadContent).toHaveBeenCalledWith({ video: 'b' })
    expect(play).toHaveBeenCalledTimes(1)

    await act(async () => {
      view.rerender(<DailymotionPlayer playerId="x8lr5" video="c" playOnChange={false} />)
    })
    expect(loadContent).toHaveBeenLastCalledWith({ video: 'c' })
    expect(play).toHaveBeenCalledTimes(1)
  })

  it('ignores a play() that is refused by the browser', async () => {
    play.mockImplementation(() => Promise.reject(new Error('NotAllowedError')))
    const onError = vi.fn()
    let view!: ReturnType<typeof render>
    await act(async () => {
      view = render(<DailymotionPlayer playerId="x8lr5" video="a" playOnChange onError={onError} />)
    })
    await act(async () => {
      view.rerender(<DailymotionPlayer playerId="x8lr5" video="b" playOnChange onError={onError} />)
    })
    expect(onError).not.toHaveBeenCalled()
  })
})
