import { fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearApiCache, DailymotionProgrammes } from './index'

describe('DailymotionProgrammes', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    clearApiCache()
    fetchMock = vi.fn(async (url: string) => {
      const parsed = new URL(url)
      if (parsed.pathname.endsWith('/videos')) {
        return { ok: true, json: async () => ({ list: [{ id: 'v1', thumbnail_480_url: 'https://img.example/first.jpg' }], has_more: true }) }
      }
      if (parsed.pathname === '/playlist/broken') return { ok: false, status: 404 }
      return { ok: true, json: async () => ({ name: `Name of ${parsed.pathname.split('/').pop()}` }) }
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => vi.unstubAllGlobals())

  it('does not call the API when title and image are provided', () => {
    const { container } = render(
      <DailymotionProgrammes
        items={[{ playlistId: 'p1', title: 'Morning Show', imageUrl: 'https://img.example/p1.jpg', description: 'Every day' }]}
        href={(id) => `/shows?pl=${id}`}
      />,
    )
    expect(fetchMock).not.toHaveBeenCalled()
    const link = container.querySelector<HTMLAnchorElement>('a.dmp-card')!
    expect(link.getAttribute('href')).toBe('/shows?pl=p1')
    expect(link.textContent).toContain('Morning Show')
    expect(link.textContent).toContain('Every day')
    expect(link.querySelector('img')?.getAttribute('src')).toBe('https://img.example/p1.jpg')
  })

  it('fetches the name and the first thumbnail when they are missing', async () => {
    const { container } = render(<DailymotionProgrammes items={[{ playlistId: 'p2' }]} href={(id) => `/s/${id}`} tag="Show" />)
    await waitFor(() => expect(container.querySelector('.dmp-programme-title')?.textContent).toBe('Name of p2'))
    await waitFor(() => expect(container.querySelector('img')?.getAttribute('src')).toBe('https://img.example/first.jpg'))
    expect(container.querySelector('.dmp-tag')?.textContent).toBe('Show')

    const urls = fetchMock.mock.calls.map((call) => new URL((call as unknown as [string])[0]))
    expect(urls.some((u) => u.pathname === '/playlist/p2' && u.searchParams.get('fields') === 'name')).toBe(true)
    expect(
      urls.some((u) => u.pathname === '/playlist/p2/videos' && u.searchParams.get('limit') === '1'),
    ).toBe(true)
  })

  it('renders buttons and calls onSelect when there is no href', () => {
    const onSelect = vi.fn()
    const item = { playlistId: 'p1', title: 'Show', imageUrl: 'https://img.example/x.jpg' }
    const { container } = render(<DailymotionProgrammes items={[item]} onSelect={onSelect} />)
    expect(container.querySelector('a')).toBeNull()
    fireEvent.click(container.querySelector('button.dmp-card')!)
    expect(onSelect).toHaveBeenCalledWith(item, expect.anything())
  })

  it('hides a programme that cannot be loaded', async () => {
    const { container } = render(
      <DailymotionProgrammes
        items={[
          { playlistId: 'ok', title: 'Fine', imageUrl: 'https://img.example/ok.jpg' },
          { playlistId: 'broken' },
        ]}
        href={(id) => `/s/${id}`}
      />,
    )
    await waitFor(() => expect(container.querySelectorAll('.dmp-card')).toHaveLength(1))
    expect(container.textContent).toContain('Fine')
  })

  it('defaults to a carousel and supports the vertical variant and inline ads', () => {
    const items = ['a', 'b', 'c'].map((id) => ({ playlistId: id, title: id, imageUrl: `https://img.example/${id}.jpg` }))
    const { container } = render(
      <DailymotionProgrammes
        items={items}
        variant="vertical"
        title="Shows"
        inlineAds={{ every: 2, render: () => <span>ad</span> }}
      />,
    )
    const root = container.querySelector('.dmp-root')!
    expect(root.getAttribute('data-dmp-layout')).toBe('carousel')
    expect(root.getAttribute('data-dmp-variant')).toBe('vertical')
    expect(container.querySelector('h2')?.textContent).toBe('Shows')
    expect(container.querySelectorAll('.dmp-item-ad')).toHaveLength(1)
  })
})
