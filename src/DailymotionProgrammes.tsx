import { useEffect, useState } from 'react'
import type { HTMLAttributes, MouseEvent } from 'react'
import { fetchPlaylist, fetchPlaylistVideos } from './api'
import { buildEntries, CardList } from './CardList'
import { Shell } from './Shell'
import { DEFAULT_LABELS } from './types'
import type {
  DailymotionGalleryClassNames,
  DailymotionGalleryLabels,
  DailymotionGalleryStyles,
  DailymotionLayoutProps,
  DailymotionStyleProps,
} from './types'
import { cx } from './utils'

/** A programme (show) is a playlist presented as one card. */
export interface DailymotionProgramme {
  playlistId: string
  /** Defaults to the playlist name from the Dailymotion API. */
  title?: string
  /** Defaults to the thumbnail of the playlist's first video. */
  imageUrl?: string
  description?: string
}

export interface DailymotionProgrammesProps
  extends DailymotionStyleProps,
    DailymotionLayoutProps,
    Omit<HTMLAttributes<HTMLElement>, 'onError' | 'children' | 'title' | 'onSelect'> {
  items: DailymotionProgramme[]
  /** Link of a programme card, e.g. `(id) => \`/shows?pl=${id}\``. Renders cards as `<a>`. */
  href?: (playlistId: string, item: DailymotionProgramme) => string
  /** Called on click. Without `href`, cards are buttons: use it for client-side routing. */
  onSelect?: (item: DailymotionProgramme, event: MouseEvent<HTMLElement>) => void
}

interface ProgrammeCardProps {
  item: DailymotionProgramme
  tag?: string
  href?: string
  classNames: DailymotionGalleryClassNames
  slotStyles: DailymotionGalleryStyles
  unstyled: boolean
  onSelect?: (item: DailymotionProgramme, event: MouseEvent<HTMLElement>) => void
}

function ProgrammeCard({ item, tag, href, classNames, slotStyles, unstyled, onSelect }: ProgrammeCardProps) {
  const [meta, setMeta] = useState({ title: item.title, thumbnail: item.imageUrl })
  const [hidden, setHidden] = useState(false)

  // Fill in what the props do not provide, from the Dailymotion API.
  useEffect(() => {
    if (item.title && item.imageUrl) return undefined
    const controller = new AbortController()
    Promise.all([
      item.title ? null : fetchPlaylist(item.playlistId, { fields: ['name'], signal: controller.signal }),
      item.imageUrl
        ? null
        : fetchPlaylistVideos(item.playlistId, {
            limit: 1,
            fields: ['thumbnail_480_url'],
            signal: controller.signal,
          }),
    ])
      .then(([playlist, videos]) => {
        if (controller.signal.aborted) return
        setMeta({
          title: item.title ?? playlist?.name,
          thumbnail: item.imageUrl ?? videos?.list[0]?.thumbnail_480_url,
        })
      })
      .catch(() => {
        if (!controller.signal.aborted) setHidden(true)
      })
    return () => controller.abort()
  }, [item.playlistId, item.title, item.imageUrl])

  if (hidden) return null

  const content = (
    <>
      <span
        className={cx(unstyled ? undefined : 'dmp-thumb', classNames.thumbnail)}
        style={slotStyles.thumbnail}
      >
        {meta.thumbnail ? (
          <img
            src={meta.thumbnail}
            alt=""
            loading="lazy"
            className={classNames.thumbnailImage || undefined}
            style={slotStyles.thumbnailImage}
          />
        ) : null}
        <span
          className={cx(unstyled ? undefined : 'dmp-programme-shade', classNames.programmeShade)}
          style={slotStyles.programmeShade}
        />
        {tag ? (
          <span
            className={cx(unstyled ? undefined : 'dmp-badge dmp-tag', classNames.badge, classNames.tag)}
            style={{ ...slotStyles.badge, ...slotStyles.tag }}
          >
            {tag}
          </span>
        ) : null}
        <span
          className={cx(unstyled ? undefined : 'dmp-programme-title', classNames.programmeTitle, classNames.title)}
          style={{ ...slotStyles.programmeTitle, ...slotStyles.title }}
        >
          {meta.title}
        </span>
      </span>
      {item.description ? (
        <span
          className={cx(unstyled ? undefined : 'dmp-content', classNames.content)}
          style={slotStyles.content}
        >
          <span
            className={cx(unstyled ? undefined : 'dmp-description', classNames.description)}
            style={slotStyles.description}
          >
            {item.description}
          </span>
        </span>
      ) : null}
    </>
  )

  const className = cx(unstyled ? undefined : 'dmp-card dmp-programme', classNames.card)
  const cardStyle = slotStyles.card
  return href ? (
    <a className={className} style={cardStyle} href={href} onClick={(event) => onSelect?.(item, event)}>
      {content}
    </a>
  ) : (
    <button type="button" className={className} style={cardStyle} onClick={(event) => onSelect?.(item, event)}>
      {content}
    </button>
  )
}

/**
 * Playlists presented as programme cards (grid or carousel), linking to a page of your own.
 * Titles and images are taken from the props, or from the Dailymotion API when missing.
 */
export function DailymotionProgrammes({
  items,
  href,
  onSelect,
  title,
  layout = 'carousel',
  variant,
  tag,
  inlineAds,
  labels,
  classNames = {},
  styles: slotStyles = {},
  unstyled = false,
  ...shellProps
}: DailymotionProgrammesProps) {
  const text: DailymotionGalleryLabels = { ...DEFAULT_LABELS, ...labels }
  const entries = buildEntries(
    items,
    inlineAds,
    classNames,
    slotStyles,
    unstyled,
    (item) => item.playlistId,
    (item) => (
      <ProgrammeCard
        item={item}
        tag={tag}
        href={href ? href(item.playlistId, item) : undefined}
        classNames={classNames}
        slotStyles={slotStyles}
        unstyled={unstyled}
        onSelect={onSelect}
      />
    ),
  )

  return (
    <Shell
      {...shellProps}
      layout={layout}
      variant={variant}
      classNames={classNames}
      styles={slotStyles}
      unstyled={unstyled}
    >
      {title ? (
        <h2
          className={cx(unstyled ? undefined : 'dmp-heading', classNames.heading)}
          style={slotStyles.heading}
        >
          {title}
        </h2>
      ) : null}
      {items.length > 0 ? (
        <CardList
          carousel={layout === 'carousel'}
          labels={text}
          classNames={classNames}
          slotStyles={slotStyles}
          unstyled={unstyled}
        >
          {entries}
        </CardList>
      ) : null}
    </Shell>
  )
}
