import type { ReactNode } from 'react'
import type { DailymotionVideo } from './api'
import { buildEntries, CardList } from './CardList'
import type {
  DailymotionGalleryClassNames,
  DailymotionGalleryLabels,
  DailymotionGalleryStyles,
  DailymotionLayout,
  InlineAds,
} from './types'
import { cx } from './utils'
import { VideoCard } from './VideoCard'

export interface VideoListProps {
  title?: ReactNode
  videos: DailymotionVideo[]
  loading: boolean
  loadingMore: boolean
  error: Error | null
  hasMore: boolean
  loadMore: () => Promise<DailymotionVideo[]>
  selectedId?: string
  layout: DailymotionLayout
  showMore: boolean
  inlineAds?: InlineAds
  tag?: string
  showDescription: boolean
  showDuration: boolean
  showDate: boolean
  locale?: string
  labels: DailymotionGalleryLabels
  classNames: DailymotionGalleryClassNames
  slotStyles: DailymotionGalleryStyles
  unstyled: boolean
  onSelect: (video: DailymotionVideo) => void
}

/** Heading, statuses, cards and "show more" for a list of playlist videos. */
export function VideoList({
  title,
  videos,
  loading,
  loadingMore,
  error,
  hasMore,
  loadMore,
  selectedId,
  layout,
  showMore,
  inlineAds,
  tag,
  showDescription,
  showDuration,
  showDate,
  locale,
  labels,
  classNames,
  slotStyles,
  unstyled,
  onSelect,
}: VideoListProps) {
  const carousel = layout === 'carousel'
  const showFullError = Boolean(error) && videos.length === 0

  const entries = buildEntries(
    videos,
    inlineAds,
    classNames,
    slotStyles,
    unstyled,
    (video) => video.id,
    (video) => (
      <VideoCard
        video={video}
        selected={video.id === selectedId}
        tag={tag}
        locale={locale}
        labels={labels}
        classNames={classNames}
        slotStyles={slotStyles}
        unstyled={unstyled}
        showDescription={showDescription}
        showDuration={showDuration}
        showDate={showDate}
        onSelect={onSelect}
      />
    ),
  )

  // Helper to conditionally apply dmp-* classes
  const s = (base: string, slot?: string) => unstyled ? (slot || '') : cx(base, slot)

  return (
    <>
      {title ? (
        <h2
          className={s('dmp-heading', classNames.heading)}
          style={slotStyles.heading}
        >
          {title}
        </h2>
      ) : null}

      {loading ? (
        <p className={s('dmp-status', classNames.status)} style={slotStyles.status}>
          {labels.loading}
        </p>
      ) : null}
      {showFullError ? (
        <p className={s('dmp-status', classNames.status)} style={slotStyles.status} role="alert">
          {labels.loadError}
        </p>
      ) : null}
      {!loading && !error && videos.length === 0 ? (
        <p className={s('dmp-status', classNames.status)} style={slotStyles.status}>
          {labels.empty}
        </p>
      ) : null}

      {videos.length > 0 ? (
        <CardList
          carousel={carousel}
          labels={labels}
          classNames={classNames}
          slotStyles={slotStyles}
          unstyled={unstyled}
          onEnd={showMore && hasMore ? () => void loadMore() : undefined}
        >
          {entries}
        </CardList>
      ) : null}

      {!carousel && showMore && hasMore ? (
        <div
          className={cx(unstyled ? undefined : 'dmp-more', classNames.more)}
          style={slotStyles.more}
        >
          <button
            type="button"
            className={cx(unstyled ? undefined : 'dmp-more-btn', classNames.showMore, classNames.moreButton)}
            style={{ ...slotStyles.showMore, ...slotStyles.moreButton }}
            disabled={loadingMore}
            onClick={() => void loadMore()}
          >
            {loadingMore ? labels.loading : labels.showMore}
          </button>
        </div>
      ) : null}

      {error && videos.length > 0 ? (
        <p className={s('dmp-status', classNames.status)} style={slotStyles.status} role="status">
          {labels.loadMoreError}
        </p>
      ) : null}
    </>
  )
}
