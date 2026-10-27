import { useEffect, useRef } from 'react'
import type { HTMLAttributes } from 'react'
import type { DailymotionVideo, DailymotionVideoSort, VideoQueryOptions } from './api'
import { Shell } from './Shell'
import { DEFAULT_LABELS } from './types'
import type {
  DailymotionGalleryLabels,
  DailymotionLayoutProps,
  DailymotionStyleProps,
} from './types'
import { useVideos } from './useVideos'
import { VideoList } from './VideoList'

export interface DailymotionCustomPlaylistProps
  extends DailymotionStyleProps,
    DailymotionLayoutProps,
    Omit<VideoQueryOptions, 'page' | 'limit' | 'signal'>,
    Omit<HTMLAttributes<HTMLElement>, 'onError' | 'children' | 'title' | 'onSelect'> {
  /** Videos loaded per page. Defaults to 8. */
  pageSize?: number
  /**
   * Sort order from the Dailymotion API:
   * - `'visited'`: Most viewed of all time ("LES + VUES")
   * - `'visited-today'`: Most viewed today
   * - `'visited-week'`: Most viewed this week
   * - `'visited-month'`: Most viewed this month
   * - `'recent'`: Most recent first
   * - `'trending'`: Currently trending
   * - `'relevance'`: Search relevance
   * - `'random'`: Random
   */
  sort?: DailymotionVideoSort
  /** Video ID to mark as currently selected / active. */
  selectedVideo?: string
  showDescription?: boolean
  showDuration?: boolean
  showDate?: boolean
  /** Grid: "Show more" button. Carousel: the right arrow loads the next page at the end. Defaults to `true`. */
  showMore?: boolean
  /** Render nothing if no videos are returned or an error occurs. Defaults to `false`. */
  hideWhenEmpty?: boolean
  /** Called when a card is clicked. */
  onSelect?: (video: DailymotionVideo) => void
  onError?: (error: Error) => void
}

/**
 * A custom or dynamic playlist based on Dailymotion API queries:
 * - Most viewed videos (`sort="visited"`, `sort="visited-week"`, etc.)
 * - Trending videos (`sort="trending"`)
 * - Category / channel videos (`channel="news"`, `channel="music"`, etc.)
 * - Creator videos (`owner="lemonde"`)
 * - Keyword search (`search="paris 2024"`)
 * - Live broadcasts (`live={true}`)
 *
 * Renders as a grid or carousel with full styling options (including Tailwind CSS via `unstyled`).
 */
export function DailymotionCustomPlaylist({
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
  fields,
  cache,
  pageSize = 8,
  selectedVideo,
  title,
  layout = 'grid',
  variant,
  tag,
  inlineAds,
  showDescription = true,
  showDuration = true,
  showDate = true,
  showMore = true,
  hideWhenEmpty = false,
  locale,
  labels,
  classNames = {},
  styles: slotStyles = {},
  unstyled = false,
  onSelect,
  onError,
  ...shellProps
}: DailymotionCustomPlaylistProps) {
  const text: DailymotionGalleryLabels = { ...DEFAULT_LABELS, ...labels }
  const { videos, loading, loadingMore, error, hasMore, loadMore } = useVideos({
    pageSize,
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
    fields,
    cache,
  })

  const onErrorRef = useRef(onError)
  onErrorRef.current = onError
  useEffect(() => {
    if (error && onErrorRef.current) onErrorRef.current(error)
  }, [error])

  if (hideWhenEmpty && !loading && (error || videos.length === 0)) return null

  return (
    <Shell
      {...shellProps}
      layout={layout}
      variant={variant}
      classNames={classNames}
      styles={slotStyles}
      unstyled={unstyled}
    >
      <VideoList
        title={title}
        videos={videos}
        loading={loading}
        loadingMore={loadingMore}
        error={error}
        hasMore={hasMore}
        loadMore={loadMore}
        selectedId={selectedVideo}
        layout={layout}
        showMore={showMore}
        inlineAds={inlineAds}
        tag={tag}
        showDescription={showDescription}
        showDuration={showDuration}
        showDate={showDate}
        locale={locale}
        labels={text}
        classNames={classNames}
        slotStyles={slotStyles}
        unstyled={unstyled}
        onSelect={(video) => onSelect?.(video)}
      />
    </Shell>
  )
}
