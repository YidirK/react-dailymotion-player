import { useEffect, useRef } from 'react'
import type { HTMLAttributes } from 'react'
import type { DailymotionVideo } from './api'
import { Shell } from './Shell'
import { DEFAULT_LABELS } from './types'
import type {
  DailymotionGalleryLabels,
  DailymotionLayoutProps,
  DailymotionStyleProps,
} from './types'
import { usePlaylistVideos } from './usePlaylistVideos'
import { VideoList } from './VideoList'

export interface DailymotionPlaylistProps
  extends DailymotionStyleProps,
    DailymotionLayoutProps,
    Omit<HTMLAttributes<HTMLElement>, 'onError' | 'children' | 'title' | 'onSelect'> {
  /** Playlist ID. */
  playlist: string
  /** Videos loaded per page. Defaults to 8. */
  pageSize?: number
  /** Video to mark as the one being played. */
  selectedVideo?: string
  showDescription?: boolean
  showDuration?: boolean
  showDate?: boolean
  /** Grid: "Show more" button. Carousel: the right arrow loads the next page at the end. Defaults to `true`. */
  showMore?: boolean
  /** Render nothing if the playlist is empty or cannot be loaded. Defaults to `false`. */
  hideWhenEmpty?: boolean
  /** Called when a card is clicked. Use it to play the video in a player of your own. */
  onSelect?: (video: DailymotionVideo) => void
  onError?: (error: Error) => void
}

/**
 * The videos of a Dailymotion playlist as a grid or a carousel, without any player.
 * Pair it with `DailymotionPlayer` (or your own hero player) through `onSelect`.
 */
export function DailymotionPlaylist({
  playlist,
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
}: DailymotionPlaylistProps) {
  const text: DailymotionGalleryLabels = { ...DEFAULT_LABELS, ...labels }
  const { videos, loading, loadingMore, error, hasMore, loadMore } = usePlaylistVideos(playlist, {
    pageSize,
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
