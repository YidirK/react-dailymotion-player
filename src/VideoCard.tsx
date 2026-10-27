import type { DailymotionVideo } from './api'
import type { DailymotionGalleryClassNames, DailymotionGalleryLabels, DailymotionGalleryStyles } from './types'
import { cx, formatDate, formatDuration } from './utils'

interface VideoCardProps {
  video: DailymotionVideo
  selected: boolean
  tag?: string
  locale?: string
  labels: DailymotionGalleryLabels
  classNames: DailymotionGalleryClassNames
  slotStyles: DailymotionGalleryStyles
  unstyled: boolean
  showDescription: boolean
  showDuration: boolean
  showDate: boolean
  onSelect: (video: DailymotionVideo) => void
}

export function VideoCard({
  video,
  selected,
  tag,
  locale,
  labels,
  classNames,
  slotStyles,
  unstyled,
  showDescription,
  showDuration,
  showDate,
  onSelect,
}: VideoCardProps) {
  const isLive = video.mode === 'live'
  const date = showDate ? formatDate(video.created_time, locale) : ''

  // When unstyled, only user-provided classNames are used (no dmp-* classes)
  const s = (base: string, slot?: string) => unstyled ? (slot || '') : cx(base, slot)

  return (
    <button
      type="button"
      className={cx(
        unstyled ? undefined : 'dmp-card',
        classNames.card,
        selected && classNames.cardActive,
      )}
      style={{ ...slotStyles.card, ...(selected ? slotStyles.cardActive : {}) }}
      aria-pressed={selected}
      data-video-id={video.id}
      onClick={() => onSelect(video)}
    >
      <span className={s('dmp-thumb', classNames.thumbnail)} style={slotStyles.thumbnail}>
        {video.thumbnail_480_url ? (
          <img
            src={video.thumbnail_480_url}
            alt=""
            loading="lazy"
            className={classNames.thumbnailImage || undefined}
            style={slotStyles.thumbnailImage}
          />
        ) : null}
        {tag ? (
          <span className={cx(unstyled ? undefined : 'dmp-badge dmp-tag', classNames.badge, classNames.tag)} style={{ ...slotStyles.badge, ...slotStyles.tag }}>
            {tag}
          </span>
        ) : null}
        {selected ? (
          <span className={cx(unstyled ? undefined : 'dmp-badge dmp-playing', classNames.badge, classNames.playing)} style={{ ...slotStyles.badge, ...slotStyles.playing }}>
            {labels.playing}
          </span>
        ) : null}
        {!selected && isLive ? (
          <span className={cx(unstyled ? undefined : 'dmp-badge dmp-live', classNames.badge, classNames.live)} style={{ ...slotStyles.badge, ...slotStyles.live }}>
            {labels.live}
          </span>
        ) : null}
        {showDuration && !isLive && video.duration ? (
          <span className={cx(unstyled ? undefined : 'dmp-badge dmp-duration', classNames.badge, classNames.duration)} style={{ ...slotStyles.badge, ...slotStyles.duration }}>
            {formatDuration(video.duration)}
          </span>
        ) : null}
      </span>
      <span className={s('dmp-content', classNames.content)} style={slotStyles.content}>
        <span className={s('dmp-title', classNames.title)} style={slotStyles.title}>{video.title}</span>
        {date ? <span className={s('dmp-date', classNames.date)} style={slotStyles.date}>{date}</span> : null}
        {showDescription && video.description ? (
          <span className={s('dmp-description', classNames.description)} style={slotStyles.description}>{video.description}</span>
        ) : null}
      </span>
    </button>
  )
}
