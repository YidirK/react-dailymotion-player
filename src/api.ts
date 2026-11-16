const API_BASE = 'https://api.dailymotion.com'
const MAX_LIMIT = 100 // plafond de l'API Dailymotion
const MAX_CACHE_ENTRIES = 200

export const DEFAULT_VIDEO_FIELDS = [
  'id',
  'title',
  'thumbnail_480_url',
  'description',
  'duration',
  'created_time',
  'mode',
]

/** A video as returned by the public Dailymotion API (only the requested fields are present). */
export interface DailymotionVideo {
  id: string
  title?: string
  description?: string
  thumbnail_480_url?: string
  /** Duration in seconds. */
  duration?: number
  /** Unix timestamp, in seconds. */
  created_time?: number
  /** Total view count if requested in fields. */
  views_total?: number
  /** e.g. "vod" or "live". */
  mode?: string
  [field: string]: unknown
}

export interface PlaylistPage {
  list: DailymotionVideo[]
  has_more: boolean
}

export interface VideosPage {
  list: DailymotionVideo[]
  has_more: boolean
  total?: number
}

export type DailymotionVideoSort =
    | 'visited'
    | 'visited-today'
    | 'visited-week'
    | 'visited-month'
    | 'recent'
    | 'trending'
    | 'relevance'
    | 'ranking'
    | 'random'
    | (string & {})

export interface FetchOptions {
  /** API fields to request. Defaults to the fields needed by `DailymotionGallery`. */
  fields?: string[]
  signal?: AbortSignal
  /** Reuse a previous identical response during the session. Defaults to `true`. */
  cache?: boolean
}

/** Filter and sorting options for querying videos from the public Dailymotion API (`/videos`). */
export interface VideoQueryOptions extends FetchOptions {
  /** 1-based page number. Defaults to 1. */
  page?: number
  /** Videos per page (1 to 100). Defaults to 8. */
  limit?: number
  /**
   * Sort order:
   * - `'visited'`: Most viewed of all time ("LES VIDÉOS LES + VUES")
   * - `'visited-today'`: Most viewed today
   * - `'visited-week'`: Most viewed this week
   * - `'visited-month'`: Most viewed this month
   * - `'recent'`: Most recent first
   * - `'trending'`: Currently trending
   * - `'relevance'`: Search relevance (needs `search`)
   * - `'random'`: Random
   */
  sort?: DailymotionVideoSort
  /** Search keywords. */
  search?: string
  /** Filter by category / channel (e.g. `'news'`, `'sport'`, `'music'`, `'tech'`, etc.). */
  channel?: string
  /** Filter by creator username or user ID. */
  owner?: string
  /** Filter by tag or tags. */
  tags?: string | string[]
  /** Filter by country code (e.g. `'fr'`, `'us'`). */
  country?: string
  /** Filter by language code (e.g. `'fr'`, `'en'`). */
  language?: string
  /** Filter videos created after this Unix timestamp (seconds). */
  createdAfter?: number
  /** Filter videos created before this Unix timestamp (seconds). */
  createdBefore?: number
  /** Minimum video duration in minutes. */
  longerThan?: number
  /** Maximum video duration in minutes. */
  shorterThan?: number
  /** Only live broadcasts (`true`) or VOD only (`false`). */
  live?: boolean
  /** Only videos from verified partner channels. */
  verified?: boolean
  /** Allow or filter explicit / mature content. */
  explicit?: boolean
  /** Any extra query parameters forwarded directly to the Dailymotion API. */
  params?: Record<string, string | number | boolean | undefined>
}

/** A playlist as returned by the public Dailymotion API (only the requested fields are present). */
export interface DailymotionPlaylistInfo {
  id?: string
  name?: string
  description?: string
  [field: string]: unknown
}

export interface FetchPlaylistOptions extends FetchOptions {
  /** 1-based page number. Defaults to 1. */
  page?: number
  /** Videos per page (1 to 100). Defaults to 8. */
  limit?: number
}

const responseCache = new Map<string, unknown>()

/** Forgets every cached API response. */
export function clearApiCache(): void {
  responseCache.clear()
}

function clampLimit(limit: number): number {
  if (!Number.isFinite(limit)) return 8
  return Math.min(Math.max(1, Math.floor(limit)), MAX_LIMIT)
}

async function getJson<T>(path: string, { signal, cache = true }: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE}/${path}`
  if (cache && responseCache.has(url)) return responseCache.get(url) as T

  const response = await fetch(url, { signal })
  if (!response.ok) {
    // Remonte le message de l'API (ex. "Invalid parameter...") au lieu du seul code HTTP
    let detail = ''
    try {
      const body = (await response.json()) as { error?: { message?: string } }
      if (body.error?.message) detail = `: ${body.error.message}`
    } catch {
      /* corps non JSON */
    }
    throw new Error(`[Dailymotion API] Request failed with status ${response.status}${detail}`)
  }
  const json = (await response.json()) as T
  if (cache) {
    // Évite que le cache grossisse sans limite pendant une longue session
    if (responseCache.size >= MAX_CACHE_ENTRIES) {
      const oldest = responseCache.keys().next().value
      if (oldest !== undefined) responseCache.delete(oldest)
    }
    responseCache.set(url, json)
  }
  return json
}

/** Fetches one page of videos of a playlist from the public Dailymotion API. */
export async function fetchPlaylistVideos(
    playlistId: string,
    { page = 1, limit = 8, fields = DEFAULT_VIDEO_FIELDS, signal, cache }: FetchPlaylistOptions = {},
): Promise<PlaylistPage> {
  const query = new URLSearchParams({
    fields: fields.join(','),
    limit: String(clampLimit(limit)),
    page: String(page),
  })
  const data = await getJson<Partial<PlaylistPage>>(
      `playlist/${encodeURIComponent(playlistId)}/videos?${query.toString()}`,
      { signal, cache },
  )
  return { list: data.list ?? [], has_more: Boolean(data.has_more) }
}

/** Fetches a single video from the public Dailymotion API. */
export async function fetchVideo(
    videoId: string,
    { fields = DEFAULT_VIDEO_FIELDS, signal, cache }: FetchOptions = {},
): Promise<DailymotionVideo> {
  const query = new URLSearchParams({ fields: fields.join(',') })
  return getJson<DailymotionVideo>(`video/${encodeURIComponent(videoId)}?${query.toString()}`, {
    signal,
    cache,
  })
}

/** Fetches a playlist (name, description...) from the public Dailymotion API. */
export async function fetchPlaylist(
    playlistId: string,
    { fields = ['id', 'name', 'description'], signal, cache }: FetchOptions = {},
): Promise<DailymotionPlaylistInfo> {
  const query = new URLSearchParams({ fields: fields.join(',') })
  return getJson<DailymotionPlaylistInfo>(
      `playlist/${encodeURIComponent(playlistId)}?${query.toString()}`,
      { signal, cache },
  )
}

/**
 * Queries videos from the public Dailymotion API.
 * Supports sorting (e.g. most viewed `sort="visited"`), search, category, owner, tags, etc.
 *
 * With `owner`, the dedicated `/user/:id/videos` endpoint is used first (the owner is then
 * in the path, not in the query string). If the API rejects it, the request is retried on
 * `/videos?owner=...`.
 */
export async function fetchVideos({
                                    page = 1,
                                    limit = 8,
                                    fields = DEFAULT_VIDEO_FIELDS,
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
                                    signal,
                                    cache,
                                  }: VideoQueryOptions = {}): Promise<VideosPage> {
  const cleanOwner = owner?.trim()
  const cleanSearch = search?.trim()

  const buildQuery = (withOwnerParam: boolean): string => {
    const query = new URLSearchParams()
    query.set('fields', fields.join(','))
    query.set('limit', String(clampLimit(limit)))
    query.set('page', String(page))

    if (sort) query.set('sort', sort)
    if (cleanSearch) query.set('search', cleanSearch)
    if (channel) query.set('channel', channel)
    if (cleanOwner && withOwnerParam) query.set('owner', cleanOwner)
    if (tags && (!Array.isArray(tags) || tags.length)) {
      query.set('tags', Array.isArray(tags) ? tags.join(',') : tags)
    }
    if (country) query.set('country', country)
    if (language) query.set('language', language)
    if (createdAfter !== undefined) query.set('created_after', String(createdAfter))
    if (createdBefore !== undefined) query.set('created_before', String(createdBefore))
    if (longerThan !== undefined) query.set('longer_than', String(longerThan))
    if (shorterThan !== undefined) query.set('shorter_than', String(shorterThan))
    if (live !== undefined) query.set('live', live ? '1' : '0')
    if (verified !== undefined) query.set('verified', verified ? '1' : '0')
    if (explicit !== undefined) query.set('explicit', explicit ? '1' : '0')

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) query.set(key, String(value))
      }
    }
    return query.toString()
  }

  let data: Partial<VideosPage>
  if (cleanOwner) {
    try {
      data = await getJson<Partial<VideosPage>>(
          `user/${encodeURIComponent(cleanOwner)}/videos?${buildQuery(false)}`,
          { signal, cache },
      )
    } catch (error) {
      if (signal?.aborted) throw error
      // Repli : certains filtres ne sont acceptés que par /videos
      data = await getJson<Partial<VideosPage>>(`videos?${buildQuery(true)}`, { signal, cache })
    }
  } else {
    data = await getJson<Partial<VideosPage>>(`videos?${buildQuery(false)}`, { signal, cache })
  }

  const total = typeof data.total === 'number' ? data.total : undefined
  const list = data.list ?? []
  // Si l'API n'envoie pas has_more, on le déduit du total
  const hasMore =
      typeof data.has_more === 'boolean'
          ? data.has_more
          : total !== undefined
              ? page * clampLimit(limit) < total
              : false

  return { list, has_more: hasMore, total }
}