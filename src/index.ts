export { DailymotionPlayer, loadDailymotionLibrary } from './DailymotionPlayer'
export type {
  DailymotionLibrary,
  DailymotionPlayerInstance,
  DailymotionPlayerProps,
} from './DailymotionPlayer'

export { DailymotionGallery } from './DailymotionGallery'
export type { DailymotionGalleryProps } from './DailymotionGallery'

export { DailymotionPlaylist } from './DailymotionPlaylist'
export type { DailymotionPlaylistProps } from './DailymotionPlaylist'

export { DailymotionCustomPlaylist } from './DailymotionCustomPlaylist'
export type { DailymotionCustomPlaylistProps } from './DailymotionCustomPlaylist'

export { DailymotionCustomGallery } from './DailymotionCustomGallery'
export type { DailymotionCustomGalleryProps } from './DailymotionCustomGallery'

export { DailymotionProgrammes } from './DailymotionProgrammes'
export type { DailymotionProgramme, DailymotionProgrammesProps } from './DailymotionProgrammes'

export type {
  DailymotionColorScheme,
  DailymotionGalleryClassNames,
  DailymotionGalleryColumns,
  DailymotionGalleryLabels,
  DailymotionGalleryStyles,
  DailymotionLayout,
  DailymotionLayoutProps,
  DailymotionSlot,
  DailymotionStyleProps,
  DailymotionVariant,
  InlineAds,
} from './types'

export { usePlaylistVideos } from './usePlaylistVideos'
export type { UsePlaylistVideosOptions, UsePlaylistVideosResult } from './usePlaylistVideos'

export { useVideos } from './useVideos'
export type { UseVideosOptions, UseVideosResult } from './useVideos'

export {
  fetchPlaylist,
  fetchPlaylistVideos,
  fetchVideos,
  fetchVideo,
  clearApiCache,
  DEFAULT_VIDEO_FIELDS,
} from './api'
export type {
  DailymotionPlaylistInfo,
  DailymotionVideo,
  DailymotionVideoSort,
  FetchOptions,
  FetchPlaylistOptions,
  PlaylistPage,
  VideoQueryOptions,
  VideosPage,
} from './api'

export { defaultStyles } from './styles'
export type { DailymotionTheme } from './styles'
