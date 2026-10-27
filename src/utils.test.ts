import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearApiCache, fetchPlaylist, fetchPlaylistVideos, fetchVideo } from './api'
import { cx, formatDate, formatDuration } from './utils'
import { themeToCssVariables } from './styles'

describe('utils', () => {
  it('formats durations', () => {
    expect(formatDuration(75)).toBe('01:15')
    expect(formatDuration(3725)).toBe('1:02:05')
    expect(formatDuration(undefined)).toBe('00:00')
  })

  it('formats Unix timestamps and ignores invalid ones', () => {
    expect(formatDate(1700000000, 'en')).toContain('2023')
    expect(formatDate(undefined)).toBe('')
    expect(formatDate(1700000000, 'not a locale!!')).toContain('2023')
  })

  it('joins class names', () => {
    expect(cx('a', false, undefined, 'b')).toBe('a b')
  })

  it('maps a theme to CSS variables, treating numbers as pixels', () => {
    const vars = themeToCssVariables({ accentColor: '#0066ff', borderRadius: 12, gap: '1rem' })
    expect(vars).toEqual({ '--dmp-accent': '#0066ff', '--dmp-radius': '12px', '--dmp-gap': '1rem' })
    expect(themeToCssVariables(undefined)).toEqual({})
  })
})

describe('api', () => {
  beforeEach(() => clearApiCache())

  it('requests a playlist page with fields, limit and page', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ list: [{ id: 'a' }], has_more: true }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const page = await fetchPlaylistVideos('x79dlo', { page: 2, limit: 3 })
    expect(page).toEqual({ list: [{ id: 'a' }], has_more: true })

    const url = new URL((fetchMock.mock.calls[0] as unknown as [string])[0])
    expect(url.origin + url.pathname).toBe('https://api.dailymotion.com/playlist/x79dlo/videos')
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('limit')).toBe('3')
    expect(url.searchParams.get('fields')).toContain('thumbnail_480_url')
    vi.unstubAllGlobals()
  })

  it('throws on a failed request', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })))
    await expect(fetchVideo('xabc')).rejects.toThrow('404')
    vi.unstubAllGlobals()
  })

  it('caches identical requests, unless told not to', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ list: [], has_more: false }) }))
    vi.stubGlobal('fetch', fetchMock)

    await fetchPlaylistVideos('x1', { limit: 4 })
    await fetchPlaylistVideos('x1', { limit: 4 })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await fetchPlaylistVideos('x1', { limit: 4, cache: false })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    clearApiCache()
    await fetchPlaylistVideos('x1', { limit: 4 })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    vi.unstubAllGlobals()
  })

  it('does not cache failures', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ name: 'Show' }) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchPlaylist('x1')).rejects.toThrow('500')
    await expect(fetchPlaylist('x1', { fields: ['name'] })).resolves.toEqual({ name: 'Show' })
    vi.unstubAllGlobals()
  })
})
