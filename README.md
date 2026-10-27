# react-dailymotion-player

Small React components that embed the [Dailymotion Player](https://developers.dailymotion.com/docs/player-library-script) using the **Player Library Script (Web)** and the `createPlayer()` API, and show Dailymotion playlists as a gallery, without writing any script-loading, API or cleanup code yourself.

> Unofficial wrapper, not affiliated with or endorsed by Dailymotion.

[![NPM](https://img.shields.io/npm/v/react-dailymotion-player.svg)](https://www.npmjs.com/package/react-dailymotion-player)  [![NPM](https://img.shields.io/npm-stat/dw/yidirk)](https://www.npmjs.com/package/react-dailymotion-player)
## Features

- Loads the Dailymotion library script directly from Dailymotion, **once per page**
- Embeds a **video**, a **playlist**, or a playlist starting on a specific video
- **Multiple players** with different configurations, using a single library script
- **`DailymotionCustomPlaylist` & `DailymotionCustomGallery`**: dynamic feedsb : trending, channels, creators, keywords
- **`DailymotionPlaylist`**: the videos of a playlist as a grid or carousel, without any player (pair it with your own hero player)
- **`DailymotionProgrammes`**: playlists as programme cards linking to your own pages
- Tags, vertical (9:16) cards and inline ads between cards
- **Playlist gallery** (`DailymotionGallery`): player + grid or carousel of the playlist's videos, previous/next buttons, "show more" pagination
- Switches video or playlist with `loadContent()`, **without re-creating the player**
- **Total styling freedom**: **Tailwind CSS** support with `unstyled`, slot `classNames`, `styles` inline, themes, CSS variables
- Headless hooks `useVideos` and `usePlaylistVideos` for 100% custom UI control
- Exposes the Web SDK player instance (`onReady`) for `play()`, `pause()`, events, etc.
- Cleans up on unmount and works with **React 18 StrictMode**
- SSR-safe (Next.js, Remix, etc.): nothing runs on the server
- Written in **TypeScript**, types included (ESM + CJS builds)
- No dependency besides React

## Installation

```bash
npm install react-dailymotion-player
```

## Quick start

```jsx
import { DailymotionPlayer } from "react-dailymotion-player";

export default function App() {
  return <DailymotionPlayer playerId="x9kr5" video="x74jh87" />;
}
```

Replace `x9kr5` and `x74jh87 ` with your own Player ID and Video ID.

## DailymotionPlayer props

| Prop | Type | Default | Description |
|---|---|---|---|
| `playerId` | `string` | **required** | Player ID. Used to load the library script and to select the Player configuration. |
| `video` | `string` | | Video ID to play. |
| `playlist` | `string` | | Playlist ID to play. Pass both `video` and `playlist` to start on a specific video of the playlist. |
| `options` | `object` | | Extra options forwarded as-is to `createPlayer()`. See the [Web SDK docs](https://developers.dailymotion.com/docs/add-runtime-player-parameters-web). |
| `playOnChange` | `boolean` | `false` | Call `play()` right after `loadContent()` when `video` / `playlist` change. Does not apply to the content given at creation. |
| `aspectRatio` | `string \| null` | `"16 / 9"` | CSS `aspect-ratio` of the wrapper. Use `null` to disable it. |
| `className` | `string` | | Class name of the wrapper `<div>`. |
| `style` | `object` | | Inline style of the wrapper `<div>`. |
| `onReady` | `(player) => void` | | Called once the player is created, with the Web SDK player instance. |
| `onError` | `(error) => void` | `console.error` | Called if the library fails to load or the player cannot be created. |

Any other prop (`id`, `aria-label`, `data-*`, ...) is passed to the wrapper `<div>`.

## DailymotionPlayer examples

### Video

```jsx
<DailymotionPlayer playerId="x8lr5" video="x84sh87" />
```

### Playlist

```jsx
<DailymotionPlayer playerId="x8lr5" playlist="x79dlo" />
```

### Playlist starting on a specific video

```jsx
<DailymotionPlayer playerId="x8lr5" playlist="x79dlo" video="x84sh87" />
```

### Several players with different configurations

Only one library script is loaded. Each component selects its own Player configuration through `playerId`:

```jsx
<>
  <DailymotionPlayer playerId="x8lr5" video="x84sh87" />
  <DailymotionPlayer playerId="xbzld" video="x84sh87" />
</>
```

> Only enable Picture-in-Picture on **one** Player configuration per page, since only one PiP can run at a time.

### Control the player with the Web SDK

```jsx
import { useRef } from "react";
import { DailymotionPlayer } from "react-dailymotion-player";

export default function Demo() {
  const playerRef = useRef(null);

  return (
    <>
      <DailymotionPlayer
        playerId="x8lr5"
        video="x84sh87"
        onReady={(player) => (playerRef.current = player)}
        onError={(error) => console.error("Player failed:", error)}
      />
      <button onClick={() => playerRef.current?.play()}>Play</button>
      <button onClick={() => playerRef.current?.pause()}>Pause</button>
    </>
  );
}
```

All available methods and events are listed in the [Web SDK reference](https://developers.dailymotion.com/v2/reference/web-sdk-player-methods).

### Custom size

```jsx
<DailymotionPlayer
  playerId="x8lr5"
  video="x84sh87"
  style={{ maxWidth: 720, margin: "0 auto" }}
/>

{/* Fixed height, no forced ratio */}
<DailymotionPlayer playerId="x8lr5" video="x84sh87" aspectRatio={null} style={{ height: 400 }} />
```

### Preloading the library

The helper used internally is also exported, in case you want to start loading the script early:

```jsx
import { loadDailymotionLibrary } from "react-dailymotion-player";

loadDailymotionLibrary("x8lr5"); // returns a Promise
```

## Playlist gallery

`DailymotionGallery` shows a player and the videos of a playlist underneath. Clicking a card loads that video in the same player.

```tsx
import { DailymotionGallery } from "react-dailymotion-player";

<DailymotionGallery
  playerId="x8lr5"
  playlist="x79dlo"
  title="Latest videos"
/>
```

It reads the playlist from the public Dailymotion API (`api.dailymotion.com`, no API key needed for public playlists) and loads `pageSize` videos at a time.

### Props

All the props of a `<section>` are accepted too (`id`, `aria-label`, `data-*`...).

| Prop | Type | Default | Description |
|---|---|---|---|
| `playerId` | `string` | **required** | Player ID used for the main player. |
| `playlist` | `string` | **required** | Playlist ID. |
| `video` | `string` | first video | Video to start with. Changing it switches the player. |
| `title` | `ReactNode` | | Heading above the list. |
| `layout` | `"grid" \| "carousel"` | `"grid"` | Grid, or horizontal scrolling carousel. |
| `columns` | `number \| { desktop?, tablet?, mobile? }` | `4` / `2` / `1` | Grid columns. A number sets desktop (tablet is capped at 2, mobile is 1). |
| `pageSize` | `number` | `8` | Videos loaded per page. |
| `showDescription` | `boolean` | `true` | Show the video description on cards. |
| `showDuration` | `boolean` | `true` | Show the duration badge. |
| `showDate` | `boolean` | `true` | Show the publication date. |
| `showNavigation` | `boolean` | `true` | Previous / next buttons under the player. |
| `showMore` | `boolean` | `true` | "Show more" button (grid layout). In the carousel, the right arrow loads the next page at the end. |
| `scrollToPlayer` | `boolean` | `true` | Scroll the player into view when a card is clicked. |
| `autoplayOnSelect` | `boolean` | `true` | Start playing when the visitor picks a video (card or previous / next). The video shown at start is never autoplayed by the gallery. |
| `playPlaylist` | `boolean` | `false` | Also give the playlist to the player so it keeps playing the next videos by itself. The highlighted card does not follow those automatic changes. |
| `variant` | `"landscape" \| "vertical"` | `"landscape"` | 16:9 or 9:16 thumbnails. |
| `tag` | `string` | | Badge displayed on each card. |
| `inlineAds` | `{ every, startAfter?, render }` | | Insert elements (ads) between cards, see below. |
| `playerOptions` | `object` | | Extra options for `createPlayer()` (same as `options` on `DailymotionPlayer`). |
| `theme` | `DailymotionTheme` | | Colors, radius, gap, font (see below). |
| `colorScheme` | `"light" \| "dark" \| "auto"` | `"light"` | `"auto"` follows the visitor's system setting. |
| `classNames` | `object` | | Extra class names per slot (see Styling below). Works with Tailwind CSS. |
| `styles` | `object` | | Inline styles per slot (same keys as `classNames`). |
| `unstyled` | `boolean` | `false` | Strip all built-in CSS and `.dmp-*` classes. Full Tailwind / custom CSS freedom. |
| `injectStyles` | `boolean` | `true` | Set to `false` to skip the built-in stylesheet. |
| `locale` | `string` | browser | Locale for dates, e.g. `"fr"`. |
| `labels` | `object` | English | Translate the UI texts. |
| `onVideoSelect` | `(video) => void` | | Called when a video is chosen (card or previous / next). |
| `onReady` | `(player) => void` | | Web SDK player instance. |
| `onError` | `(error) => void` | | Playlist loading or player errors. |

### Styling

The components offer **three levels of styling freedom**, from quick theming to full custom control with Tailwind CSS.

#### 1. Theme object (quick theming)

Each key sets a CSS variable on the gallery. Numbers are pixels.

```tsx
<DailymotionGallery
  playerId="x8lr5"
  playlist="x79dlo"
  colorScheme="dark"
  columns={3}
  theme={{
    accentColor: "#7c3aed",
    surfaceColor: "#14141a",
    borderRadius: 16,
    gap: 20,
    fontFamily: "Inter, sans-serif",
  }}
/>
```

| Theme key | CSS variable | What it changes |
|---|---|---|
| `accentColor` | `--dmp-accent` | Hover / selected card, focus ring, "Playing" badge |
| `backgroundColor` | `--dmp-bg` | Gallery background (transparent by default) |
| `surfaceColor` | `--dmp-surface` | Cards and buttons |
| `borderColor` | `--dmp-border` | Card and button borders |
| `textColor` | `--dmp-text` | Titles and main text |
| `mutedTextColor` | `--dmp-text-muted` | Dates and descriptions |
| `badgeBackground` | `--dmp-badge-bg` | Duration badge background |
| `badgeTextColor` | `--dmp-badge-text` | Duration badge text |
| `tagBackground` | `--dmp-tag-bg` | Tag badge background (the accent color by default) |
| `tagTextColor` | `--dmp-tag-text` | Tag badge text |
| `borderRadius` | `--dmp-radius` | Card corners |
| `gap` | `--dmp-gap` | Space between cards and sections |
| `cardWidth` | `--dmp-card-width` | Card width in the carousel |
| `fontFamily` | `--dmp-font` | Font (inherits from your page by default) |

The theme overrides `colorScheme`, so you can use `colorScheme="dark"` as a base and change only a few colors.

**CSS variables.** The same variables can be set from your own stylesheet:

```css
.my-gallery {
  --dmp-accent: #e11d48;
  --dmp-radius: 4px;
}
```

#### 2. Class names and inline styles per slot

Add your own classes (including **Tailwind CSS classes**) or inline styles to **every part** of the component:

```tsx
<DailymotionGallery
  playerId="x8lr5"
  playlist="x79dlo"
  classNames={{
    root: "font-sans",
    card: "shadow-lg hover:shadow-xl transition-shadow",
    cardActive: "ring-2 ring-violet-500",
    title: "font-serif text-lg",
    thumbnail: "rounded-xl overflow-hidden",
    badge: "text-xs",
    duration: "bg-black/70 text-white",
    tag: "bg-violet-600 text-white",
    playing: "bg-green-500 text-white",
    date: "text-gray-400 text-sm",
    description: "text-gray-500",
    more: "mt-6",
    moreButton: "bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-full",
    navigation: "flex gap-2 mt-2",
    navButton: "rounded-full border border-gray-300 p-2 hover:border-violet-500",
  }}
  styles={{
    root: { maxWidth: 1200, margin: "0 auto" },
    card: { borderRadius: 16 },
  }}
/>
```

**All available slots:**

| Slot | Element |
|---|---|
| `root` | Outermost `<section>` |
| `player` | Player wrapper |
| `playerPlaceholder` | Placeholder shown before the first video loads |
| `heading` | `<h2>` title |
| `navigation` | Previous / next button container |
| `navButton` | Previous / next buttons |
| `list` | `<ul>` list of cards |
| `item` | `<li>` wrapping each card |
| `itemAd` | `<li>` wrapping inline ad elements |
| `card` | Card button / link |
| `cardActive` | Extra class added to the currently playing card |
| `thumbnail` | Thumbnail wrapper |
| `thumbnailImage` | `<img>` inside the thumbnail |
| `badge` | Base class for all badges (duration, tag, playing, live) |
| `duration` | Duration badge |
| `tag` | Tag badge |
| `playing` | "Playing" badge |
| `live` | "Live" badge |
| `content` | Card text content area |
| `title` | Video title |
| `date` | Publication date |
| `description` | Video description |
| `more` | "Show more" container |
| `moreButton` | "Show more" button |
| `showMore` | Alias for `moreButton` |
| `status` | Loading / error / empty messages |
| `shell` | Carousel scroll container |
| `arrow` | Base class for carousel arrows |
| `arrowPrev` | Left carousel arrow |
| `arrowNext` | Right carousel arrow |
| `programmeShade` | Gradient overlay on programme cards |
| `programmeTitle` | Title on programme cards |

#### 3. Full Tailwind CSS control (`unstyled`)

Set `unstyled` to completely strip the built-in CSS. The internal `.dmp-*` class names are removed too — **only your `classNames` are applied**. This gives you a blank canvas for Tailwind CSS or any other framework:

```tsx
<DailymotionGallery
  playerId="x8lr5"
  playlist="x79dlo"
  unstyled
  classNames={{
    root: "max-w-6xl mx-auto p-4 font-sans",
    player: "mb-6",
    heading: "text-2xl font-bold mb-4",
    list: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
    item: "min-w-0",
    card: "group flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden cursor-pointer hover:shadow-lg transition-all",
    cardActive: "ring-2 ring-orange-500",
    thumbnail: "relative aspect-video bg-black overflow-hidden",
    thumbnailImage: "w-full h-full object-cover",
    duration: "absolute right-2 bottom-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-xs font-bold",
    tag: "absolute left-2 top-2 px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wide",
    playing: "absolute right-2 top-2 px-2 py-0.5 rounded-full bg-orange-500 text-white text-xs font-bold",
    live: "absolute right-2 top-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold",
    content: "flex flex-col gap-1.5 p-3",
    title: "font-bold text-gray-900 line-clamp-2",
    date: "text-xs text-gray-500",
    description: "text-sm text-gray-600 line-clamp-2",
    more: "flex justify-center pt-6",
    moreButton: "px-5 py-2 rounded-full bg-gray-900 text-white font-bold hover:bg-gray-700 transition-colors",
    navigation: "flex justify-end gap-2 mt-2",
    navButton: "inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 hover:border-orange-500 transition-colors",
    status: "my-4 text-gray-500",
  }}
/>
```

> With `unstyled`, the built-in stylesheet is never injected. The `data-dmp-layout`, `data-dmp-variant` and `data-dmp-scheme` attributes are still set on the root element, so you can use them in your own CSS if needed.

**Your own stylesheet.** The built-in CSS is added as a `<style>` element next to the gallery, so it works with SSR and without any import. To take full control, set `injectStyles={false}` and use the exported `defaultStyles` string as a starting point:

```tsx
import { defaultStyles } from "react-dailymotion-player";
console.log(defaultStyles);
```

**Translations.**

```tsx
<DailymotionGallery
  playerId="x8lr5"
  playlist="x79dlo"
  locale="fr"
  labels={{
    playing: "En lecture",
    live: "Direct",
    previous: "Vidéo précédente",
    next: "Vidéo suivante",
    showMore: "Voir plus",
    loading: "Chargement…",
    loadError: "Impossible de charger les vidéos",
    loadMoreError: "Impossible de charger plus de vidéos",
    empty: "Cette playlist est vide",
  }}
/>
```

### Build your own UI

If you want your own cards, use the data layer on its own:

```tsx
import { DailymotionPlayer, usePlaylistVideos } from "react-dailymotion-player";

function MyGallery() {
  const { videos, loading, hasMore, loadMore } = usePlaylistVideos("x79dlo", { pageSize: 12 });
  const [current, setCurrent] = useState<string>();

  return (
    <>
      <DailymotionPlayer playerId="x8lr5" video={current ?? videos[0]?.id} />
      {loading && <p>Loading…</p>}
      {videos.map((v) => (
        <button key={v.id} onClick={() => setCurrent(v.id)}>{v.title}</button>
      ))}
      {hasMore && <button onClick={loadMore}>More</button>}
    </>
  );
}
```

`usePlaylistVideos(playlistId, { pageSize, fields })` returns `{ videos, loading, loadingMore, error, hasMore, loadMore }`. The plain functions `fetchPlaylistVideos(playlistId, { page, limit, fields, signal })` and `fetchVideo(videoId, { fields, signal })` are exported as well, for use outside React.

## Playlist list without a player

`DailymotionPlaylist` is the list on its own: use it when your player lives elsewhere on the page (a hero player, for example) and the cards should drive it.

```tsx
import { useState } from "react";
import { DailymotionPlayer, DailymotionPlaylist } from "react-dailymotion-player";

export function Home() {
  const [video, setVideo] = useState("x84sh87");

  return (
    <>
      <DailymotionPlayer playerId="x8lr5" video={video} playOnChange />

      <DailymotionPlaylist
        playlist="x79dlo"
        title="Latest videos"
        tag="News"
        layout="carousel"
        pageSize={8}
        showMore={false}
        selectedVideo={video}
        hideWhenEmpty
        onSelect={(v) => setVideo(v.id)}
      />
    </>
  );
}
```

It accepts the same layout and style options as the gallery (`layout`, `columns`, `variant`, `tag`, `inlineAds`, `theme`, `colorScheme`, `classNames`, `labels`, `locale`, `showDescription`, `showDuration`, `showDate`, `showMore`, `pageSize`, `onError`) plus:

| Prop | Type | Default | Description |
|---|---|---|---|
| `playlist` | `string` | **required** | Playlist ID. |
| `selectedVideo` | `string` | | Video to mark as being played. |
| `onSelect` | `(video) => void` | | Called when a card is clicked. |
| `hideWhenEmpty` | `boolean` | `false` | Render nothing if the playlist is empty or cannot be loaded. |

With `showMore={false}`, only the first `pageSize` videos are loaded: no button, and the carousel's right arrow does not fetch more.

## Custom playlists & feeds (Most viewed, trending, channels, search...)

`DailymotionCustomPlaylist` and `DailymotionCustomGallery` let you build **dynamic, custom playlists** directly powered by the Dailymotion API (`/videos`), without needing to create or manage a playlist manually in Dailymotion Studio!

### Example: Most viewed videos

```tsx
import { DailymotionCustomPlaylist } from "react-dailymotion-player";

export function TopVideos() {
  return (
    <DailymotionCustomPlaylist
      title="Most viewed videos"
      sort="visited"               // Most viewed of all time
      channel="news"               // Filter by channel/category
      tag="Top Vues"
      layout="grid"
      columns={4}
      onSelect={(video) => console.log("Selected:", video.id)}
    />
  );
}
```

### Example: Custom gallery with built-in player

```tsx
import { DailymotionCustomGallery } from "react-dailymotion-player";

export function TrendingFeed() {
  return (
    <DailymotionCustomGallery
      playerId="x8lr5"
      title="TENDANCES"
      sort="trending"              // Trending videos
      layout="carousel"
      autoplayOnSelect
      unstyled                     // or use full Tailwind CSS!
      classNames={{
        root: "max-w-6xl mx-auto font-sans",
        card: "bg-white rounded-xl shadow hover:shadow-lg transition-all",
        title: "font-bold text-gray-900",
      }}
    />
  );
}
```

### Available query filters

| Prop | Type | Default | Description |
|---|---|---|---|
| `sort` | `DailymotionVideoSort` | | `'visited'` (most viewed all time), `'visited-today'`, `'visited-week'`, `'visited-month'`, `'trending'`, `'recent'`, `'relevance'`, `'ranking'`, `'random'` |
| `channel` | `string` | | Category/channel (e.g. `'news'`, `'sport'`, `'music'`, `'tech'`, `'fun'`, `'videogames'`, etc.) |
| `owner` | `string` | | Channel creator username or ID (e.g. `'lemonde'`) |
| `search` | `string` | | Keyword search query |
| `tags` | `string \| string[]` | | Filter by tag(s) |
| `country` | `string` | | Country code (e.g. `'fr'`, `'us'`) |
| `language` | `string` | | Language code (e.g. `'fr'`, `'en'`) |
| `live` | `boolean` | | `true` for live streams only, `false` for VOD only |
| `verified` | `boolean` | | Only videos from verified partner channels |
| `longerThan` | `number` | | Minimum duration in minutes |
| `shorterThan` | `number` | | Maximum duration in minutes |
| `createdAfter` | `number` | | Unix timestamp in seconds (videos after date) |
| `createdBefore` | `number` | | Unix timestamp in seconds (videos before date) |
| `pageSize` | `number` | `8` | Number of videos loaded per page |
| `params` | `object` | | Any extra Dailymotion API parameter |

Both components support all layout options (`layout`, `columns`, `variant`, `title`, `tag`, `inlineAds`) and styling options (`unstyled`, `classNames`, `styles`, `theme`, `colorScheme`).

### Custom hook `useVideos`

For complete headless freedom, use the `useVideos()` hook directly:

```tsx
import { useVideos } from "react-dailymotion-player";

function MostViewedList() {
  const { videos, loading, hasMore, loadMore } = useVideos({
    sort: "visited",
    channel: "music",
    pageSize: 10,
  });

  return (
    <div>
      {videos.map((v) => (
        <div key={v.id}>{v.title} — {v.views_total?.toLocaleString()} views</div>
      ))}
      {hasMore && <button onClick={loadMore}>Load more</button>}
    </div>
  );
}
```

## Programme cards

`DailymotionProgrammes` shows playlists as cards (a "programme" or show) that open a page of your own. The title and the image come from the props, or from the Dailymotion API when you leave them out (playlist name and thumbnail of its first video). A programme that cannot be loaded is hidden.

```tsx
import { DailymotionProgrammes } from "react-dailymotion-player";

<DailymotionProgrammes
  title="Our shows"
  tag="Show"
  variant="vertical"
  href={(playlistId) => `/show?pl=${playlistId}`}
  items={[
    { playlistId: "x79dlo" },                                  // name + image from the API
    { playlistId: "x7abcd", title: "Morning Show",
      imageUrl: "/img/morning.jpg", description: "Every day at 8am" },
  ]}
/>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `{ playlistId, title?, imageUrl?, description? }[]` | **required** | The programmes. |
| `href` | `(playlistId, item) => string` | | Makes each card a link (`<a>`). |
| `onSelect` | `(item, event) => void` | | Click handler. Without `href`, cards are buttons: use it with your router. |
| `layout` | `"grid" \| "carousel"` | `"carousel"` | Layout. |

The other layout and style options (`title`, `columns`, `variant`, `tag`, `inlineAds`, `theme`, `colorScheme`, `classNames`, `labels`, `injectStyles`) work as in the gallery.

A programme page is a `DailymotionGallery` for that playlist:

```tsx
// /show?pl=x79dlo
const playlist = new URLSearchParams(window.location.search).get("pl");

<DailymotionGallery
  playerId="x8lr5"
  playlist={playlist!}
  title="Episodes"
  playPlaylist
  columns={4}
/>
```

## Tags, vertical cards and inline ads

```tsx
<DailymotionPlaylist
  playlist="x79dlo"
  variant="vertical"     // 9:16 thumbnails, narrower carousel cards
  tag="News"             // badge on every card
  inlineAds={{
    every: 4,            // an element after every 4 cards...
    startAfter: 4,       // ...first one after the 4th card (defaults to `every`)
    render: (position) => <MyAdSlot id={`ad-${position}`} />,
  }}
/>
```

`render` can return anything. The element is never added after the last card. In a grid it spans the full row; in a carousel it takes its natural width.

## Next.js

The built files start with `"use client"`, so the component can be imported from Server Components in the App Router. Nothing is executed during server rendering: the script is injected in a `useEffect`.

## How it works

1. On mount, the component injects `https://geo.dailymotion.com/libs/player/{playerId}.js` in `<body>` (only if `window.dailymotion` is not already available).
2. It creates a placeholder element inside its own wrapper and calls `dailymotion.createPlayer(placeholderId, { video, playlist, ...options })`.
3. If the library was loaded for a different Player ID, `player: playerId` is added automatically so the right configuration is used.
4. On unmount (or when `playerId`, `video`, `playlist` or `options` change), the player is destroyed and the wrapper is emptied.

`createPlayer()` replaces its target element, so the component never hands it a node managed by React. This avoids DOM conflicts.



## Useful links

- [Player Library Script (Web)](https://developers.dailymotion.com/docs/player-library-script)
- [Web SDK reference](https://developers.dailymotion.com/v2/reference/web-sdk-player-methods)
- [Listen to Player events (Web)](https://developers.dailymotion.com/docs/listen-to-player-events-web)
- [Dailymotion Studio: Players](https://www.dailymotion.com/partner/embed/players)

## TypeScript

Types are included. `DailymotionPlayerProps`, `DailymotionPlayerInstance`, `DailymotionLibrary`, `DailymotionGalleryProps`, `DailymotionTheme`, `DailymotionVideo` and the other prop types are exported:

```tsx
import { DailymotionPlayer, type DailymotionPlayerInstance } from "react-dailymotion-player";

<DailymotionPlayer
  playerId="x8lr5"
  video="x84sh87"
  onReady={(player: DailymotionPlayerInstance) => player.play()}
/>;
```

`DailymotionPlayerInstance` is loosely typed (`destroy` plus any Web SDK method) because the SDK methods come from Dailymotion's script at runtime. See the [Web SDK reference](https://developers.dailymotion.com/v2/reference/web-sdk-player-methods).

## Development

Built with [tsdown](https://github.com/rolldown/tsdown) (requires Node.js 22.18+ to build), tested with [Vitest](https://vitest.dev/).

```bash
npm install

npm run dev         # rebuild on change
npm run typecheck   # tsc --noEmit
npm test            # unit tests (Vitest + Testing Library)
npm run build       # ESM + CJS + .d.ts in dist/, then publint
```


## License

MIT
