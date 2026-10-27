const API_BASE = 'https://api.dailymotion.com'

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
  /** Videos per page. Defaults to 8. */
  limit?: number
  /**
   * Sort order:
   * - `'visited'`: Most viewed of all time ("LES VIDÉOS LES + VUES")
   * - `'visited-today'`: Most viewed today
   * - `'visited-week'`: Most viewed this week
   * - `'visited-month'`: Most viewed this month
   * - `'recent'`: Most recent first
   * - `'trending'`: Currently trending
   * - `'relevance'`: Search relevance
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
  /** Videos per page. Defaults to 8. */
  limit?: number
}

const responseCache = new Map<string, unknown>()

/** Forgets every cached API response. */
export function clearApiCache(): void {
  responseCache.clear()
}

async function getJson<T>(path: string, { signal, cache = true }: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE}/${path}`
  if (cache && responseCache.has(url)) return responseCache.get(url) as T

  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`[Dailymotion API] Request failed with status ${response.status}`)
  }
  const json = (await response.json()) as T
  if (cache) responseCache.set(url, json)
  return json
}

/** Fetches one page of videos of a playlist from the public Dailymotion API. */
export async function fetchPlaylistVideos(
  playlistId: string,
  { page = 1, limit = 8, fields = DEFAULT_VIDEO_FIELDS, signal, cache }: FetchPlaylistOptions = {},
): Promise<PlaylistPage> {
  const query = new URLSearchParams({
    fields: fields.join(','),
    limit: String(limit),
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
 * Queries videos from the public Dailymotion API (`/videos`).
 * Supports sorting (e.g. most viewed `sort="visited"`), search, category, owner, tags, etc.
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
  const query = new URLSearchParams()
  query.set('fields', fields.join(','))
  query.set('limit', String(limit))
  query.set('page', String(page))

  if (sort) query.set('sort', sort)
  if (search) query.set('search', search)
  if (channel) query.set('channel', channel)
  if (owner) query.set('owner', owner)
  if (tags) query.set('tags', Array.isArray(tags) ? tags.join(',') : tags)
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
      if (value !== undefined && value !== null) {
        query.set(key, String(value))
      }
    }
  }

  const endpoint = owner ? `user/${encodeURIComponent(owner)}/videos` : 'videos'
  const data = await getJson<Partial<VideosPage>>(`${endpoint}?${query.toString()}`, {
    signal,
    cache,
  })

  return {
    list: data.list ?? [],
    has_more: Boolean(data.has_more),
    total: typeof data.total === 'number' ? data.total : undefined,
  }
}

