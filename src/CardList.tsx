import { useRef } from 'react'
import type { ReactNode } from 'react'
import type { DailymotionGalleryClassNames, DailymotionGalleryLabels, DailymotionGalleryStyles, InlineAds } from './types'
import { cx } from './utils'

/** Wraps items in `<li>` elements and inserts `inlineAds` between them. */
export function buildEntries<T>(
  items: T[],
  ads: InlineAds | undefined,
  classNames: DailymotionGalleryClassNames,
  slotStyles: DailymotionGalleryStyles,
  unstyled: boolean,
  getKey: (item: T) => string,
  renderItem: (item: T) => ReactNode,
): ReactNode[] {
  const every = ads && ads.every > 0 ? Math.floor(ads.every) : 0
  const start = every ? Math.max(1, Math.floor(ads?.startAfter ?? every)) : 0
  const entries: ReactNode[] = []

  items.forEach((item, index) => {
    entries.push(
      <li
        key={getKey(item)}
        className={cx(unstyled ? undefined : 'dmp-item', classNames.item)}
        style={slotStyles.item}
      >
        {renderItem(item)}
      </li>,
    )
    const count = index + 1
    // No ad after the last card.
    if (ads && every && count >= start && (count - start) % every === 0 && count < items.length) {
      entries.push(
        <li
          key={`ad-${count}`}
          className={cx(unstyled ? undefined : 'dmp-item dmp-item-ad', classNames.itemAd)}
          style={slotStyles.itemAd}
        >
          {ads.render(count)}
        </li>,
      )
    }
  })
  return entries
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d={direction === 'left' ? 'M10 3 5 8l5 5' : 'M6 3l5 5-5 5'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface CardListProps {
  carousel: boolean
  labels: DailymotionGalleryLabels
  classNames: DailymotionGalleryClassNames
  slotStyles: DailymotionGalleryStyles
  unstyled: boolean
  /** Carousel only: called instead of scrolling when the right arrow is used at the end. */
  onEnd?: () => void
  children: ReactNode
}

/** The list of cards: a plain `<ul>` (grid) or a scrolling `<ul>` with arrows (carousel). */
export function CardList({ carousel, labels, classNames, slotStyles, unstyled, onEnd, children }: CardListProps) {
  const listRef = useRef<HTMLUListElement>(null)

  const scroll = (direction: 1 | -1) => {
    const list = listRef.current
    if (!list) return
    const atEnd = list.scrollLeft + list.clientWidth >= list.scrollWidth - 1
    if (direction === 1 && atEnd && onEnd) {
      onEnd()
      return
    }
    if (typeof list.scrollBy === 'function') {
      list.scrollBy({ left: direction * list.clientWidth * 0.9, behavior: 'smooth' })
    }
  }

  const list = (
    <ul
      ref={listRef}
      className={cx(unstyled ? undefined : 'dmp-list', classNames.list)}
      style={slotStyles.list}
    >
      {children}
    </ul>
  )
  if (!carousel) return list

  return (
    <div
      className={cx(unstyled ? undefined : 'dmp-shell', classNames.shell)}
      style={slotStyles.shell}
    >
      <button
        type="button"
        className={cx(
          unstyled ? undefined : 'dmp-btn dmp-arrow dmp-arrow-prev',
          classNames.navButton,
          classNames.arrow,
          classNames.arrowPrev,
        )}
        style={{ ...slotStyles.navButton, ...slotStyles.arrow, ...slotStyles.arrowPrev }}
        aria-label={labels.carouselPrevious}
        onClick={() => scroll(-1)}
      >
        <Chevron direction="left" />
      </button>
      {list}
      <button
        type="button"
        className={cx(
          unstyled ? undefined : 'dmp-btn dmp-arrow dmp-arrow-next',
          classNames.navButton,
          classNames.arrow,
          classNames.arrowNext,
        )}
        style={{ ...slotStyles.navButton, ...slotStyles.arrow, ...slotStyles.arrowNext }}
        aria-label={labels.carouselNext}
        onClick={() => scroll(1)}
      >
        <Chevron direction="right" />
      </button>
    </div>
  )
}

export { Chevron }
