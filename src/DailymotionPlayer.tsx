import { useCallback, useEffect, useRef } from 'react'
import type { CSSProperties, HTMLAttributes } from 'react'
import { toError } from './utils'

/**
 * React wrapper around the Dailymotion "Player Library Script (Web)".
 * Docs: https://developers.dailymotion.com/docs/player-library-script
 */

const LIB_BASE_URL = 'https://geo.dailymotion.com/libs/player'

/** Web SDK player instance. See the Web SDK reference for available methods. */
export interface DailymotionPlayerInstance {
  destroy?: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [method: string]: any
}

/** The global `dailymotion` object exposed by the library script. */
export interface DailymotionLibrary {
  createPlayer: (
    containerId: string,
    config: Record<string, unknown>,
  ) => Promise<DailymotionPlayerInstance>
}

type WindowWithDailymotion = Window & { dailymotion?: DailymotionLibrary }

// Module-level state: the library must only be loaded once per page.
let libraryPromise: Promise<DailymotionLibrary> | null = null
let libraryPlayerId: string | null = null // Player ID of the library script in the page
let instanceCounter = 0

const LOAD_TIMEOUT_MS = 10_000
const POLL_INTERVAL_MS = 50

function playerIdFromSrc(src: string): string | null {
  const match = /\/libs\/player\/([^/?#]+)\.js/.exec(src)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

/**
 * Loads the Dailymotion Player library (once) and resolves with the global
 * `dailymotion` object.
 *
 * - If a library script is already in the page (for example added in your HTML),
 *   it is reused instead of adding a second one.
 * - Rejects if the script fails to load or `dailymotion` is still missing after 10 seconds.
 *
 * @param playerId Player ID from Dailymotion Studio (Players tab) or the API.
 */
export function loadDailymotionLibrary(playerId: string): Promise<DailymotionLibrary> {
  if (typeof window === 'undefined') {
    return Promise.reject(
      new Error('[DailymotionPlayer] The library can only be loaded in a browser.'),
    )
  }

  const win = window as WindowWithDailymotion

  // Already available (loaded by this module or by a <script> tag in your HTML).
  if (win.dailymotion?.createPlayer) return Promise.resolve(win.dailymotion)

  // A load is already in progress.
  if (libraryPromise) return libraryPromise

  libraryPromise = new Promise<DailymotionLibrary>((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(`script[src^="${LIB_BASE_URL}/"]`)
    const injected = !script
    if (!script) {
      script = document.createElement('script')
      script.src = `${LIB_BASE_URL}/${encodeURIComponent(playerId)}.js`
      script.async = true
      document.body.appendChild(script)
    }
    libraryPlayerId = playerIdFromSrc(script.src) ?? (injected ? playerId : null)

    const startedAt = Date.now()
    let timer: ReturnType<typeof setTimeout> | undefined

    const fail = (message: string) => {
      if (timer) clearTimeout(timer)
      libraryPromise = null
      libraryPlayerId = null
      if (injected) script?.remove()
      reject(new Error(message))
    }

    const check = () => {
      if (win.dailymotion?.createPlayer) {
        resolve(win.dailymotion)
        return
      }
      if (Date.now() - startedAt > LOAD_TIMEOUT_MS) {
        fail('[DailymotionPlayer] The Dailymotion library is unavailable (timed out).')
        return
      }
      timer = setTimeout(check, POLL_INTERVAL_MS)
    }

    script.addEventListener('error', () =>
      fail(`[DailymotionPlayer] Failed to load the library script for Player ID "${playerId}".`),
    )
    script.addEventListener('load', () => {
      if (timer) clearTimeout(timer)
      check()
    })
    check()
  })

  return libraryPromise
}

function safeDestroy(player: DailymotionPlayerInstance | null) {
  try {
    if (player && typeof player.destroy === 'function') player.destroy()
  } catch {
    /* the player may already be gone */
  }
}

export interface DailymotionPlayerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onError' | 'children'> {
  /** Player ID (Dailymotion Studio > Players, or API). Loads the library and selects the config. */
  playerId: string
  /** Video ID to play. */
  video?: string
  /** Playlist ID to play. Combine with `video` to start on a given video. */
  playlist?: string
  /** Extra options forwarded as-is to `createPlayer()`. Compared by value. */
  options?: Record<string, unknown>
  /**
   * Call `play()` right after `loadContent()` when `video` / `playlist` change.
   * Content loaded with `loadContent()` otherwise follows the autostart setting of the Player ID.
   * Does not apply to the content given at creation. Defaults to `false`.
   */
  playOnChange?: boolean
  /** CSS aspect-ratio of the wrapper. `null` to disable. Defaults to `"16 / 9"`. */
  aspectRatio?: string | null
  className?: string
  style?: CSSProperties
  /** Called once the player is created, with the Web SDK player instance. */
  onReady?: (player: DailymotionPlayerInstance) => void
  /** Called if loading or creating the player fails. Defaults to `console.error`. */
  onError?: (error: Error) => void
}

export function DailymotionPlayer({
  playerId,
  video,
  playlist,
  options,
  playOnChange = false,
  aspectRatio = '16 / 9',
  className,
  style,
  onReady,
  onError,
  ...rest
}: DailymotionPlayerProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<DailymotionPlayerInstance | null>(null)
  // Content the current player instance has been told to play.
  const loadedRef = useRef<{ video?: string; playlist?: string }>({})

  // Keep the latest props in refs so the player is not re-created on each render.
  const videoRef = useRef(video)
  const playlistRef = useRef(playlist)
  const onReadyRef = useRef(onReady)
  const onErrorRef = useRef(onError)
  const optionsRef = useRef(options)
  const playOnChangeRef = useRef(playOnChange)
  playOnChangeRef.current = playOnChange
  videoRef.current = video
  playlistRef.current = playlist
  onReadyRef.current = onReady
  onErrorRef.current = onError
  optionsRef.current = options

  // Options are compared by value: changing them re-creates the player.
  const optionsKey = JSON.stringify(options ?? {})

  const reportError = useCallback((error: Error) => {
    if (onErrorRef.current) onErrorRef.current(error)
    else console.error(error)
  }, [])

  // Switches the existing player to the latest `video` / `playlist` with `loadContent()`.
  const syncContent = useCallback(() => {
    const player = instanceRef.current
    if (!player) return

    const nextVideo = videoRef.current
    const nextPlaylist = playlistRef.current
    const loaded = loadedRef.current
    if (nextVideo === loaded.video && nextPlaylist === loaded.playlist) return
    if (!nextVideo && !nextPlaylist) return

    loadedRef.current = { video: nextVideo, playlist: nextPlaylist }
    if (typeof player.loadContent !== 'function') {
      reportError(new Error('[DailymotionPlayer] `loadContent()` is not available on this player.'))
      return
    }
    try {
      const result = player.loadContent({
        ...(nextVideo ? { video: nextVideo } : null),
        ...(nextPlaylist ? { playlist: nextPlaylist } : null),
      })
      if (result && typeof result.catch === 'function') {
        result.catch((error: unknown) => reportError(toError(error)))
      }
      if (playOnChangeRef.current && typeof player.play === 'function') {
        const played = player.play()
        // Browsers may refuse to play without a user gesture: that is not an error.
        if (played && typeof played.catch === 'function') played.catch(() => undefined)
      }
    } catch (error) {
      reportError(toError(error))
    }
  }, [reportError])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    if (!playerId) {
      reportError(new Error('[DailymotionPlayer] The `playerId` prop is required.'))
      return undefined
    }

    let cancelled = false
    let instance: DailymotionPlayerInstance | null = null
    const initialVideo = videoRef.current
    const initialPlaylist = playlistRef.current

    // createPlayer() takes over its target element, so we give it a throwaway
    // child instead of a node owned by React.
    instanceCounter += 1
    const containerId = `dailymotion-player-${instanceCounter}`
    const container = document.createElement('div')
    container.id = containerId
    container.style.width = '100%'
    container.style.height = '100%'
    host.appendChild(container)

    loadDailymotionLibrary(playerId)
      .then((dailymotion) => {
        if (cancelled) return null

        const config: Record<string, unknown> = { ...optionsRef.current }
        if (initialVideo) config.video = initialVideo
        if (initialPlaylist) config.playlist = initialPlaylist

        // The library script only embeds one Player config. If it was loaded for
        // another Player ID (or outside this component), select this config explicitly.
        if (libraryPlayerId !== playerId && config.player === undefined) {
          config.player = playerId
        }

        return dailymotion.createPlayer(containerId, config)
      })
      .then((player) => {
        if (!player) return
        if (cancelled) {
          safeDestroy(player)
          return
        }
        instance = player
        instanceRef.current = player
        loadedRef.current = { video: initialVideo, playlist: initialPlaylist }
        if (onReadyRef.current) onReadyRef.current(player)
        // `video` / `playlist` may have changed while the player was being created.
        syncContent()
      })
      .catch((error: unknown) => {
        if (!cancelled) reportError(toError(error))
      })

    return () => {
      cancelled = true
      instanceRef.current = null
      loadedRef.current = {}
      safeDestroy(instance)
      while (host.firstChild) host.removeChild(host.firstChild)
    }
  }, [playerId, optionsKey, reportError, syncContent])

  useEffect(() => {
    syncContent()
  }, [video, playlist, syncContent])

  return (
    <div
      ref={hostRef}
      className={className}
      style={{ width: '100%', ...(aspectRatio ? { aspectRatio } : null), ...style }}
      {...rest}
    />
  )
}
