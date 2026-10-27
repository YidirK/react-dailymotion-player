import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchVideos } from './api'
import type { DailymotionVideo, VideoQueryOptions } from './api'
import { toError } from './utils'

export interface UseVideosOptions extends Omit<VideoQueryOptions, 'page' | 'limit' | 'signal'> {
  /** Videos per page. Defaults to 8. */
  pageSize?: number
  /** Skip automatic loading (e.g. if waiting for user input). Defaults to false. */
  enabled?: boolean
}

export interface UseVideosResult {
  videos: DailymotionVideo[]
  /** True while the first page is loading. */
  loading: boolean
  /** True while a following page is loading. */
  loadingMore: boolean
  error: Error | null
  hasMore: boolean
  /** Total number of videos matching query, if provided by API. */
  total?: number
  /** Loads the next page. Resolves with the full, updated list of videos. */
  loadMore: () => Promise<DailymotionVideo[]>
  /** Reloads the list from page 1. */
  refresh: () => Promise<DailymotionVideo[]>
}

interface State {
  videos: DailymotionVideo[]
  hasMore: boolean
  total?: number
  loading: boolean
  loadingMore: boolean
  error: Error | null
}

const idleState: State = {
  videos: [],
  hasMore: false,
  total: undefined,
  loading: false,
  loadingMore: false,
  error: null,
}

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

/**
 * Loads videos from the Dailymotion API (`/videos` or `/user/:id/videos`) page by page.
 * Supports sorting (e.g. `sort="visited"` for most viewed), search, channel, owner, tags, etc.
 */
export function useVideos(options: UseVideosOptions = {}): UseVideosResult {
  const {
    pageSize = 8,
    enabled = true,
    fields,
    sort,
    search,
    channel,
    owner,
    tags,
    country,
    language,
    createdAfter,
    createdBefore,
    longerThan,
    shorterThan,
    live,
    verified,
    explicit,
    params,
    cache,
  } = options

  // Serialize query options to detect genuine changes in dependencies
  const tagsKey = Array.isArray(tags) ? tags.slice().sort().join(',') : (tags ?? '')
  const fieldsKey = fields ? fields.slice().sort().join(',') : ''
  const paramsKey = params ? JSON.stringify(params) : ''
  const queryKey = JSON.stringify({
    sort,
    search,
    channel,
    owner,
    tagsKey,
    country,
    language,
    createdAfter,
    createdBefore,
    longerThan,
    shorterThan,
    live,
    verified,
    explicit,
    fieldsKey,
    paramsKey,
    pageSize,
    enabled,
    cache,
  })

  const [state, setState] = useState<State>({ ...idleState, loading: enabled })

  const stateRef = useRef(state)
  stateRef.current = state
  const pageRef = useRef(1)
  const loadingMoreRef = useRef(false)
  const controllerRef = useRef<AbortController | null>(null)
  const latestOptionsRef = useRef(options)
  latestOptionsRef.current = options

  const fetchPage = useCallback(
    async (pageNumber: number, signal?: AbortSignal) => {
      const opts = latestOptionsRef.current
      return fetchVideos({
        page: pageNumber,
        limit: opts.pageSize ?? 8,
        fields: opts.fields,
        sort: opts.sort,
        search: opts.search,
        channel: opts.channel,
        owner: opts.owner,
        tags: opts.tags,
        country: opts.country,
        language: opts.language,
        createdAfter: opts.createdAfter,
        createdBefore: opts.createdBefore,
        longerThan: opts.longerThan,
        shorterThan: opts.shorterThan,
        live: opts.live,
        verified: opts.verified,
        explicit: opts.explicit,
        params: opts.params,
        cache: opts.cache,
        signal,
      })
    },
    [],
  )

  useEffect(() => {
    if (!enabled) {
      setState(idleState)
      return undefined
    }

    const controller = new AbortController()
    controllerRef.current = controller
    pageRef.current = 1
    loadingMoreRef.current = false
    setState({ ...idleState, loading: true })

    fetchPage(1, controller.signal)
      .then((page) => {
        if (controller.signal.aborted) return
        setState({
          videos: mergeUnique([], page.list),
          hasMore: page.has_more,
          total: page.total,
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
  }, [queryKey, enabled, fetchPage])

  const loadMore = useCallback(async (): Promise<DailymotionVideo[]> => {
    const controller = controllerRef.current
    if (!enabled || !controller || !stateRef.current.hasMore || loadingMoreRef.current) {
      return stateRef.current.videos
    }

    loadingMoreRef.current = true
    setState((prev) => ({ ...prev, loadingMore: true, error: null }))
    try {
      const nextPage = pageRef.current + 1
      const page = await fetchPage(nextPage, controller.signal)
      if (controller.signal.aborted) return stateRef.current.videos

      pageRef.current = nextPage
      const merged = mergeUnique(stateRef.current.videos, page.list)
      stateRef.current = {
        ...stateRef.current,
        videos: merged,
        hasMore: page.has_more,
        total: page.total,
      }
      setState((prev) => ({
        ...prev,
        videos: merged,
        hasMore: page.has_more,
        total: page.total,
        loadingMore: false,
      }))
      return merged
    } catch (error: unknown) {
      if (!controller.signal.aborted) {
        setState((prev) => ({ ...prev, loadingMore: false, error: toError(error) }))
      }
      return stateRef.current.videos
    } finally {
      loadingMoreRef.current = false
    }
  }, [enabled, fetchPage])

  const refresh = useCallback(async (): Promise<DailymotionVideo[]> => {
    pageRef.current = 1
    loadingMoreRef.current = false
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const page = await fetchPage(1)
      const fresh = mergeUnique([], page.list)
      setState({
        videos: fresh,
        hasMore: page.has_more,
        total: page.total,
        loading: false,
        loadingMore: false,
        error: null,
      })
      return fresh
    } catch (error: unknown) {
      const err = toError(error)
      setState((prev) => ({ ...prev, loading: false, error: err }))
      throw err
    }
  }, [fetchPage])

  return {
    videos: state.videos,
    loading: state.loading,
    loadingMore: state.loadingMore,
    error: state.error,
    hasMore: state.hasMore,
    total: state.total,
    loadMore,
    refresh,
  }
}
