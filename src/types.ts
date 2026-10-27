import type { ReactNode } from 'react'
import type { DailymotionTheme } from './styles'

/** Texts used by the gallery, playlist and programme components. Override them to translate the UI. */
export interface DailymotionGalleryLabels {
  /** Badge on the video being played. */
  playing: string
  /** Badge on live videos. */
  live: string
  previous: string
  next: string
  carouselPrevious: string
  carouselNext: string
  showMore: string
  loading: string
  loadError: string
  loadMoreError: string
  empty: string
}

export const DEFAULT_LABELS: DailymotionGalleryLabels = {
  playing: 'Playing',
  live: 'Live',
  previous: 'Previous video',
  next: 'Next video',
  carouselPrevious: 'Scroll left',
  carouselNext: 'Scroll right',
  showMore: 'Show more',
  loading: 'Loading…',
  loadError: 'Unable to load the videos',
  loadMoreError: 'Unable to load more videos',
  empty: 'No videos in this playlist',
}

/**
 * Every stylable part of the gallery / playlist / programme components.
 * Use these keys in `classNames` to add Tailwind or custom CSS classes,
 * and in `styles` to pass inline CSSProperties.
 */
export type DailymotionSlot =
  | 'root'
  | 'player'
  | 'playerPlaceholder'
  | 'heading'
  | 'navigation'
  | 'navButton'
  | 'list'
  | 'item'
  | 'itemAd'
  | 'card'
  | 'cardActive'
  | 'thumbnail'
  | 'thumbnailImage'
  | 'badge'
  | 'duration'
  | 'tag'
  | 'playing'
  | 'live'
  | 'content'
  | 'title'
  | 'date'
  | 'description'
  | 'more'
  | 'moreButton'
  | 'showMore'
  | 'status'
  | 'shell'
  | 'arrow'
  | 'arrowPrev'
  | 'arrowNext'
  | 'programmeShade'
  | 'programmeTitle'

/** Class names you can add to each part. Works with Tailwind CSS or any CSS framework. */
export type DailymotionGalleryClassNames = Partial<Record<DailymotionSlot, string>>

/** Inline styles you can add to each part. */
export type DailymotionGalleryStyles = Partial<Record<DailymotionSlot, import('react').CSSProperties>>

export interface DailymotionGalleryColumns {
  desktop?: number
  tablet?: number
  mobile?: number
}

/** An ad (or any element) inserted between cards. */
export interface InlineAds {
  /** Insert an element after every `every` cards. */
  every: number
  /** Number of cards before the first element. Defaults to `every`. */
  startAfter?: number
  /** Renders the element. `position` is the number of cards before it. */
  render: (position: number) => ReactNode
}

export type DailymotionLayout = 'grid' | 'carousel'
/** `"landscape"` (16:9 thumbnails) or `"vertical"` (9:16 thumbnails). */
export type DailymotionVariant = 'landscape' | 'vertical'
export type DailymotionColorScheme = 'light' | 'dark' | 'auto'

/** Style options shared by `DailymotionGallery`, `DailymotionPlaylist` and `DailymotionProgrammes`. */
export interface DailymotionStyleProps {
  /** Colors, radius, gap, font... See `DailymotionTheme`. */
  theme?: DailymotionTheme
  /** `"light"` (default), `"dark"`, or `"auto"` to follow the visitor's system setting. */
  colorScheme?: DailymotionColorScheme
  /** Extra class names for each part. Works perfectly with Tailwind CSS. */
  classNames?: DailymotionGalleryClassNames
  /** Inline styles for each part. */
  styles?: DailymotionGalleryStyles
  /**
   * Set to `true` to completely strip the built-in stylesheet.
   * Use this for full Tailwind CSS control — combine with `classNames` to style every part.
   * Equivalent to `injectStyles={false}` but also removes the internal `.dmp-*` class names.
   */
  unstyled?: boolean
  /** Set to `false` to skip the built-in stylesheet (see `defaultStyles`). */
  injectStyles?: boolean
  /** Locale used to format dates, e.g. `"fr"`. */
  locale?: string
  /** Translate or change the texts of the UI. */
  labels?: Partial<DailymotionGalleryLabels>
}

/** Layout options shared by `DailymotionGallery`, `DailymotionPlaylist` and `DailymotionProgrammes`. */
export interface DailymotionLayoutProps {
  /** Heading displayed above the list. */
  title?: ReactNode
  /** `"grid"` (default) or a horizontal `"carousel"`. */
  layout?: DailymotionLayout
  /** Grid columns. A number is used for desktop (tablet: max 2, mobile: 1). Defaults to 4 / 2 / 1. */
  columns?: number | DailymotionGalleryColumns
  /** `"landscape"` (default) or `"vertical"` thumbnails. */
  variant?: DailymotionVariant
  /** Badge displayed on each card. */
  tag?: string
  /** Insert ads (or any element) between cards. */
  inlineAds?: InlineAds
}

function clampColumns(value: number | undefined, fallback: number): number {
  return Math.max(1, Math.floor(Number.isFinite(value) ? (value as number) : fallback))
}

export function resolveColumns(columns: DailymotionLayoutProps['columns']) {
  if (typeof columns === 'number') {
    const desktop = clampColumns(columns, 4)
    return { desktop, tablet: Math.min(desktop, 2), mobile: 1 }
  }
  return {
    desktop: clampColumns(columns?.desktop, 4),
    tablet: clampColumns(columns?.tablet, 2),
    mobile: clampColumns(columns?.mobile, 1),
  }
}
