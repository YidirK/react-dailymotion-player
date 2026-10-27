import { useCallback, useEffect, useRef, useState } from 'react'
import type { HTMLAttributes } from 'react'
import type { DailymotionVideo, DailymotionVideoSort, VideoQueryOptions } from './api'
import { Chevron } from './CardList'
import { DailymotionPlayer } from './DailymotionPlayer'
import type { DailymotionPlayerInstance } from './DailymotionPlayer'
import { Shell } from './Shell'
import { DEFAULT_LABELS } from './types'
import type {
  DailymotionGalleryLabels,
  DailymotionLayoutProps,
  DailymotionStyleProps,
} from './types'
import { useVideos } from './useVideos'
import { cx, toError } from './utils'
import { VideoList } from './VideoList'

export interface DailymotionCustomGalleryProps
  extends DailymotionStyleProps,
    DailymotionLayoutProps,
    Omit<VideoQueryOptions, 'page' | 'limit' | 'signal'>,
    Omit<HTMLAttributes<HTMLElement>, 'onError' | 'children' | 'title' | 'onSelect'> {
  /** Player ID (Dailymotion Studio > Players). Used for the main player. */
  playerId: string
  /**
   * Sort order from the Dailymotion API:
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
  /** Video to start with. Defaults to the first video returned by the query. */
  video?: string
  /** Videos loaded per page. Defaults to 8. */
  pageSize?: number
  showDescription?: boolean
  showDuration?: boolean
  showDate?: boolean
  /** Previous / next buttons under the player. Defaults to `true`. */
  showNavigation?: boolean
  /** Grid: "Show more" button. Carousel: the right arrow loads the next page at the end. Defaults to `true`. */
  showMore?: boolean
  /** Scroll the player into view when a card is clicked. Defaults to `true`. */
  scrollToPlayer?: boolean
  /** Start playing right away when the visitor picks a video (card or previous / next). Defaults to `true`. */
  autoplayOnSelect?: boolean
  /** Extra options forwarded to the player (`createPlayer()`). */
  playerOptions?: Record<string, unknown>
  onVideoSelect?: (video: DailymotionVideo) => void
  onReady?: (player: DailymotionPlayerInstance) => void
  onError?: (error: Error) => void
}

/**
 * A player with custom query videos listed underneath (e.g. Most viewed videos,
 * channel videos, trending videos, search results, etc.).
 * Clicking a card loads that video in the player.
 */
export function DailymotionCustomGallery({
  playerId,
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
  video,
  pageSize = 8,
  title,
  layout = 'grid',
  variant,
  tag,
  inlineAds,
  showDescription = true,
  showDuration = true,
  showDate = true,
  showNavigation = true,
  showMore = true,
  scrollToPlayer = true,
  autoplayOnSelect = true,
  playerOptions,
  locale,
  labels,
  classNames = {},
  styles: slotStyles = {},
  unstyled = false,
  onVideoSelect,
  onReady,
  onError,
  ...shellProps
}: DailymotionCustomGalleryProps) {
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

  const [selectedId, setSelectedId] = useState<string | undefined>(video)
  const [userPicked, setUserPicked] = useState(false)
  const playerWrapRef = useRef<HTMLDivElement>(null)
  const onVideoSelectRef = useRef(onVideoSelect)
  const onErrorRef = useRef(onError)
  onVideoSelectRef.current = onVideoSelect
  onErrorRef.current = onError

  useEffect(() => {
    setSelectedId(video)
    setUserPicked(false)
  }, [video, sort, search, channel, owner])

  useEffect(() => {
    if (error && onErrorRef.current) onErrorRef.current(error)
  }, [error])

  const selectVideo = useCallback(
    (next: DailymotionVideo, scroll: boolean) => {
      setSelectedId(next.id)
      setUserPicked(true)
      if (onVideoSelectRef.current) onVideoSelectRef.current(next)
      const target = playerWrapRef.current
      if (scroll && scrollToPlayer && target && typeof target.scrollIntoView === 'function') {
        const reduceMotion =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
      }
    },
    [scrollToPlayer],
  )

  const currentId = selectedId ?? videos[0]?.id
  const index = currentId ? videos.findIndex((item) => item.id === currentId) : -1
  const hasPrevious = index > 0
  const hasNext = index >= 0 && (index < videos.length - 1 || hasMore)

  const goPrevious = () => {
    const previous = videos[index - 1]
    if (previous) selectVideo(previous, false)
  }

  const goNext = async () => {
    if (index < 0) return
    let list = videos
    if (index === list.length - 1 && hasMore) list = await loadMore()
    const next = list[index + 1]
    if (next) selectVideo(next, false)
  }

  return (
    <Shell
      {...shellProps}
      layout={layout}
      variant={variant}
      classNames={classNames}
      styles={slotStyles}
      unstyled={unstyled}
    >
      <div
        ref={playerWrapRef}
        className={cx(unstyled ? undefined : 'dmp-player', classNames.player)}
        style={slotStyles.player}
      >
        {currentId ? (
          <DailymotionPlayer
            playerId={playerId}
            video={currentId}
            playOnChange={autoplayOnSelect && userPicked}
            options={playerOptions}
            onReady={onReady}
            onError={onError}
          />
        ) : (
          <div
            className={cx(unstyled ? undefined : 'dmp-player-placeholder', classNames.playerPlaceholder)}
            style={slotStyles.playerPlaceholder}
            aria-hidden="true"
          />
        )}
        {showNavigation ? (
          <div
            className={cx(unstyled ? undefined : 'dmp-nav', classNames.navigation)}
            style={slotStyles.navigation}
          >
            <button
              type="button"
              className={cx(unstyled ? undefined : 'dmp-btn', classNames.navButton)}
              style={slotStyles.navButton}
              aria-label={text.previous}
              disabled={!hasPrevious}
              onClick={goPrevious}
            >
              <Chevron direction="left" />
            </button>
            <button
              type="button"
              className={cx(unstyled ? undefined : 'dmp-btn', classNames.navButton)}
              style={slotStyles.navButton}
              aria-label={text.next}
              disabled={!hasNext}
              onClick={() => void goNext().catch((e: unknown) => onErrorRef.current?.(toError(e)))}
            >
              <Chevron direction="right" />
            </button>
          </div>
        ) : null}
      </div>

      <VideoList
        title={title}
        videos={videos}
        loading={loading}
        loadingMore={loadingMore}
        error={error}
        hasMore={hasMore}
        loadMore={loadMore}
        selectedId={currentId}
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
        onSelect={(picked) => selectVideo(picked, true)}
      />
    </Shell>
  )
}
