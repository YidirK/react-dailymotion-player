import type { CSSProperties } from 'react'

/**
 * Visual options of `DailymotionGallery`. Each key maps to a CSS variable
 * (`--dmp-*`), so you can also set them from your own CSS.
 * Numbers are treated as pixels.
 */
export interface DailymotionTheme {
  /** `--dmp-accent`: hover / selected card, focus rings, "Playing" badge. */
  accentColor?: string
  /** `--dmp-bg`: background of the whole gallery. Transparent by default. */
  backgroundColor?: string
  /** `--dmp-surface`: background of cards and buttons. */
  surfaceColor?: string
  /** `--dmp-border`: card and button borders. */
  borderColor?: string
  /** `--dmp-text`: main text color. */
  textColor?: string
  /** `--dmp-text-muted`: dates and descriptions. */
  mutedTextColor?: string
  /** `--dmp-badge-bg`: duration badge background. */
  badgeBackground?: string
  /** `--dmp-badge-text`: duration badge text. */
  badgeTextColor?: string
  /** `--dmp-tag-bg`: background of the tag badge (the accent color by default). */
  tagBackground?: string
  /** `--dmp-tag-text`: text color of the tag badge. */
  tagTextColor?: string
  /** `--dmp-radius`: corner radius of cards. */
  borderRadius?: string | number
  /** `--dmp-gap`: space between cards and sections. */
  gap?: string | number
  /** `--dmp-card-width`: card width in the carousel layout. */
  cardWidth?: string | number
  /** `--dmp-font`: font family. Inherits from the page by default. */
  fontFamily?: string
}

const THEME_VARIABLES: Record<keyof DailymotionTheme, string> = {
  accentColor: '--dmp-accent',
  backgroundColor: '--dmp-bg',
  surfaceColor: '--dmp-surface',
  borderColor: '--dmp-border',
  textColor: '--dmp-text',
  mutedTextColor: '--dmp-text-muted',
  badgeBackground: '--dmp-badge-bg',
  badgeTextColor: '--dmp-badge-text',
  tagBackground: '--dmp-tag-bg',
  tagTextColor: '--dmp-tag-text',
  borderRadius: '--dmp-radius',
  gap: '--dmp-gap',
  cardWidth: '--dmp-card-width',
  fontFamily: '--dmp-font',
}

/** Converts a theme object into inline CSS variables. */
export function themeToCssVariables(theme?: DailymotionTheme): CSSProperties {
  const variables: Record<string, string> = {}
  if (!theme) return variables as CSSProperties
  for (const key of Object.keys(THEME_VARIABLES) as Array<keyof DailymotionTheme>) {
    const value = theme[key]
    if (value === undefined || value === null || value === '') continue
    variables[THEME_VARIABLES[key]] = typeof value === 'number' ? `${value}px` : value
  }
  return variables as CSSProperties
}

/**
 * Default stylesheet of `DailymotionGallery`. It is injected automatically; set
 * `injectStyles={false}` and include this string in your own CSS to control it.
 */
export const defaultStyles = `
.dmp-root{--dmp-accent:#ff4400;--dmp-bg:transparent;--dmp-surface:#fff;--dmp-border:#e8e8e8;--dmp-text:#1e1e1e;--dmp-text-muted:#606060;--dmp-badge-bg:rgba(0,0,0,.75);--dmp-badge-text:#fff;--dmp-tag-bg:var(--dmp-accent);--dmp-tag-text:#fff;--dmp-thumb-ratio:16/9;--dmp-radius:8px;--dmp-gap:24px;--dmp-card-width:280px;--dmp-font:inherit;--dmp-columns:4;--dmp-columns-tablet:2;--dmp-columns-mobile:1;box-sizing:border-box;background:var(--dmp-bg);color:var(--dmp-text);font-family:var(--dmp-font)}
.dmp-root *,.dmp-root *::before,.dmp-root *::after{box-sizing:inherit}
.dmp-root[data-dmp-variant=vertical]{--dmp-thumb-ratio:9/16;--dmp-card-width:190px}
.dmp-root[data-dmp-scheme=dark]{--dmp-surface:#1b1b1b;--dmp-border:#333;--dmp-text:#f5f5f5;--dmp-text-muted:#a8a8a8}
@media (prefers-color-scheme:dark){.dmp-root[data-dmp-scheme=auto]{--dmp-surface:#1b1b1b;--dmp-border:#333;--dmp-text:#f5f5f5;--dmp-text-muted:#a8a8a8}}
.dmp-player{margin-bottom:var(--dmp-gap)}
.dmp-player-placeholder{width:100%;aspect-ratio:16/9;background:var(--dmp-surface);border-radius:var(--dmp-radius)}
.dmp-nav{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}
.dmp-btn{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;padding:0;border:1px solid var(--dmp-border);border-radius:999px;background:var(--dmp-surface);color:var(--dmp-text);cursor:pointer}
.dmp-btn:hover:not(:disabled){border-color:var(--dmp-accent)}
.dmp-btn:disabled{opacity:.35;cursor:default}
.dmp-btn:focus-visible,.dmp-more-btn:focus-visible,.dmp-card:focus-visible{outline:3px solid var(--dmp-accent);outline-offset:2px}
.dmp-heading{margin:0 0 16px;font-size:1.25rem;font-weight:700;color:var(--dmp-text)}
.dmp-shell{position:relative}
.dmp-list{list-style:none;margin:0;padding:0}
.dmp-item{min-width:0}
.dmp-root[data-dmp-layout=grid] .dmp-list{display:grid;grid-template-columns:repeat(var(--dmp-columns),minmax(0,1fr));gap:var(--dmp-gap)}
.dmp-root[data-dmp-layout=carousel] .dmp-list{display:flex;gap:var(--dmp-gap);overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding-bottom:4px}
.dmp-root[data-dmp-layout=carousel] .dmp-list::-webkit-scrollbar{display:none}
.dmp-root[data-dmp-layout=carousel] .dmp-item{flex:0 0 var(--dmp-card-width);scroll-snap-align:start}
.dmp-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:2}
.dmp-arrow-prev{left:-12px}
.dmp-arrow-next{right:-12px}
.dmp-card{text-decoration:none;display:flex;flex-direction:column;width:100%;height:100%;padding:0;text-align:left;font:inherit;color:inherit;background:var(--dmp-surface);border:2px solid var(--dmp-border);border-radius:var(--dmp-radius);overflow:hidden;cursor:pointer;transition:border-color .2s ease,box-shadow .2s ease}
.dmp-card:hover,.dmp-card[aria-pressed=true]{border-bottom-color:var(--dmp-accent);box-shadow:0 4px 12px rgba(0,0,0,.16)}
.dmp-thumb{position:relative;aspect-ratio:var(--dmp-thumb-ratio);background:#000;overflow:hidden}
.dmp-thumb img{display:block;width:100%;height:100%;object-fit:cover}
.dmp-badge{position:absolute;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:700;line-height:20px;background:var(--dmp-badge-bg);color:var(--dmp-badge-text)}
.dmp-duration{right:8px;bottom:8px}
.dmp-tag{left:8px;top:8px;background:var(--dmp-tag-bg);color:var(--dmp-tag-text);font-size:10px;letter-spacing:.04em;text-transform:uppercase}
.dmp-playing{right:8px;top:8px;background:var(--dmp-accent);color:#fff}
.dmp-live{right:8px;top:8px;background:#ea3030;color:#fff}
.dmp-content{display:flex;flex-direction:column;gap:6px;padding:12px 14px 16px}
.dmp-title{margin:0;font-size:1rem;font-weight:700;line-height:1.3;color:var(--dmp-text);display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;line-clamp:3;overflow:hidden;word-break:break-word}
.dmp-date{font-size:12px;color:var(--dmp-text-muted)}
.dmp-description{margin:0;font-size:14px;line-height:1.4;color:var(--dmp-text-muted);display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;line-clamp:3;overflow:hidden;word-break:break-word}
.dmp-programme-shade{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.7),transparent 60%)}
.dmp-programme-title{position:absolute;left:12px;right:12px;bottom:12px;color:#fff;font-weight:800;line-height:1.2;text-shadow:0 1px 7px rgba(13,13,13,.6);display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden}
.dmp-item-ad{display:flex;align-items:center;justify-content:center}
.dmp-root[data-dmp-layout=grid] .dmp-item-ad{grid-column:1/-1}
.dmp-root[data-dmp-layout=carousel] .dmp-item.dmp-item-ad{flex:0 0 auto;scroll-snap-align:start}
.dmp-more{display:flex;justify-content:center;padding:24px 0 0}
.dmp-more-btn{min-height:36px;padding:8px 20px;border:0;border-radius:999px;background:var(--dmp-text);color:var(--dmp-surface);font:inherit;font-weight:700;cursor:pointer}
.dmp-more-btn:disabled{opacity:.65;cursor:wait}
.dmp-status{margin:16px 0;color:var(--dmp-text-muted)}
@media (max-width:1023px){.dmp-root[data-dmp-layout=grid] .dmp-list{grid-template-columns:repeat(var(--dmp-columns-tablet),minmax(0,1fr))}}
@media (max-width:600px){.dmp-root[data-dmp-layout=grid] .dmp-list{grid-template-columns:repeat(var(--dmp-columns-mobile),minmax(0,1fr))}.dmp-arrow{display:none}}
@media (prefers-reduced-motion:reduce){.dmp-card{transition:none}}
`.trim()
