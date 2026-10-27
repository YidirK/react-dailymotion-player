import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchPlaylistVideos } from './api'
import type { DailymotionVideo } from './api'
import { toError } from './utils'

export interface UsePlaylistVideosOptions {
  /** Videos per page. Defaults to 8. */
  pageSize?: number
  /** API fields to request. Defaults to the fields needed by `DailymotionGallery`. */
  fields?: string[]
}

export interface UsePlaylistVideosResult {
  videos: DailymotionVideo[]
  /** True while the first page is loading. */
  loading: boolean
  /** True while a following page is loading. */
  loadingMore: boolean
  error: Error | null
  hasMore: boolean
  /** Loads the next page. Resolves with the full, updated list of videos. */
  loadMore: () => Promise<DailymotionVideo[]>
}

interface State {
  videos: DailymotionVideo[]
  hasMore: boolean
  loading: boolean
  loadingMore: boolean
  error: Error | null
}

const idleState: State = { videos: [], hasMore: false, loading: false, loadingMore: false, error: null }

function mergeUnique(current: DailymotionVideo[], incoming: DailymotionVideo[]): DailymotionVideo[] {
  const seen = new Set(current.map((video) => video.id))
  const merged = [...current]
  for (const video of incoming) {
    if (video.id && !seen.has(video.id)) {
      seen.add(video.id)
      merged.push(video)
    }
  }
  return merged
}

/** Loads the videos of a Dailymotion playlist, page by page, from the public API. */
export function usePlaylistVideos(
  playlistId: string | undefined,
  { pageSize = 8, fields }: UsePlaylistVideosOptions = {},
): UsePlaylistVideosResult {
  const fieldsKey = fields ? fields.join(',') : ''
  const [state, setState] = useState<State>({ ...idleState, loading: Boolean(playlistId) })

  const stateRef = useRef(state)
  stateRef.current = state
  const pageRef = useRef(1)
  const loadingMoreRef = useRef(false)
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!playlistId) {
      setState(idleState)
      return undefined
    }

    const controller = new AbortController()
    controllerRef.current = controller
    pageRef.current = 1
    loadingMoreRef.current = false
    setState({ ...idleState, loading: true })

    fetchPlaylistVideos(playlistId, {
      page: 1,
      limit: pageSize,
      fields: fieldsKey ? fieldsKey.split(',') : undefined,
      signal: controller.signal,
    })
      .then((page) => {
        if (controller.signal.aborted) return
        setState({
          videos: mergeUnique([], page.list),
          hasMore: page.has_more,
          loading: false,
          loadingMore: false,
          error: null,
        })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({ ...idleState, error: toError(error) })
      })

    return () => controller.abort()
  }, [playlistId, pageSize, fieldsKey])

  const loadMore = useCallback(async (): Promise<DailymotionVideo[]> => {
    const controller = controllerRef.current
    if (!playlistId || !controller || !stateRef.current.hasMore || loadingMoreRef.current) {
      return stateRef.current.videos
    }

    loadingMoreRef.current = true
    setState((previous) => ({ ...previous, loadingMore: true, error: null }))
    try {
      const nextPage = pageRef.current + 1
      const page = await fetchPlaylistVideos(playlistId, {
        page: nextPage,
        limit: pageSize,
        fields: fieldsKey ? fieldsKey.split(',') : undefined,
        signal: controller.signal,
      })
      if (controller.signal.aborted) return stateRef.current.videos

      pageRef.current = nextPage
      const merged = mergeUnique(stateRef.current.videos, page.list)
      stateRef.current = { ...stateRef.current, videos: merged, hasMore: page.has_more }
      setState((previous) => ({
        ...previous,
        videos: merged,
        hasMore: page.has_more,
        loadingMore: false,
      }))
      return merged
    } catch (error: unknown) {
      if (!controller.signal.aborted) {
        setState((previous) => ({ ...previous, loadingMore: false, error: toError(error) }))
      }
      return stateRef.current.videos
    } finally {
      loadingMoreRef.current = false
    }
  }, [playlistId, pageSize, fieldsKey])

  return {
    videos: state.videos,
    loading: state.loading,
    loadingMore: state.loadingMore,
    error: state.error,
    hasMore: state.hasMore,
    loadMore,
  }
}
