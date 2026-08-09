# MangaVAn

MangaVAn is a private-by-default manga and manhwa discovery and reading SPA. MangaDex supplies its catalog, English chapters, and reader images; AniList optionally enriches linked titles with public metadata and recommendations. It has no accounts, analytics, backend, or cookies. Reading progress stays in the visitor's browser.

## Features

- Trending Action, Horror, Romance, and Drama rows
- Daily recommendations influenced by recently read genres
- Search autocomplete, genres, sorting, and numbered pagination
- Dedicated Korean manhwa discovery and origin-based browsing
- Manga metadata and English chapter feeds grouped by volume
- Full-page reader with click zones, keyboard controls, chapter navigation, page preloading, and retry states
- Versioned local reading progress and a five-title recent list
- Responsive, accessible custom CSS with reduced-motion support
- Cached, throttled MangaDex requests with rate-limit-aware retry
- Optional AniList scores, popularity, synopsis fallback, and recommendations
- Chapter language switching, official publisher links, and alternate-edition fallbacks
- Google Books English editions, region-aware previews, and purchase links

## Requirements and setup

- Node.js 20.19 or newer
- npm 10 or newer

```bash
npm install
npm run dev
```

Vite prints the local URL, normally `http://localhost:5173`. MangaDex requests use the local `/api/mangadex` path, which Vite proxies in development and Vercel proxies in production. AniList uses its public endpoint directly. To enable official English edition fallbacks, copy `.env.example` to `.env.local`, enable the Google Books API in Google Cloud, and set a browser key restricted to your deployment's HTTP referrers and the Books API.

## Commands

```bash
npm run dev        # development server
npm run lint       # ESLint
npm run typecheck  # strict TypeScript validation
npm test           # Vitest suite
npm run test:watch # interactive tests
npm run build      # production bundle in dist/
npm run preview    # preview the production bundle
```

## Structure

```text
src/
  api/          Axios client, API services, response normalizers, query client
  components/   Shared navigation, cards, filters, pagination, and states
  context/      Reading progress provider and public progress interface
  hooks/        Debounce and TanStack Query hooks
  pages/        TypeScript/TSX home, browse, details, reader, and not-found routes
  providers/    Manga source contract and MangaDex provider adapter
  styles/       Global custom dark-theme CSS
  test/         Vitest/MSW setup
  utils/        Storage, formatting, chapter labels, seeded shuffle
public/
  _redirects    Netlify SPA fallback
  cover-placeholder.svg
vercel.json     Vercel SPA rewrite
```

## Reading progress

Progress is stored under `mangavan:reading-progress:v1` in `localStorage`. Each manga record contains display metadata, the last chapter/page, completed chapter IDs, genres used for local recommendations, and an ISO `lastReadAt` time. Invalid data is ignored and only the 100 most recent records are retained. Clearing site storage removes all history.

## API behavior

The browser calls MangaDex directly and sends no credentials. Results are limited to English chapters with `safe` and `suggestive` content ratings. Manga and manhwa filters use MangaDex's original-language field (`ja` for Japanese manga and `ko` for Korean manhwa). API calls are queued below MangaDex's documented global baseline and cached with TanStack Query. A MangaDex search can expose at most 10,000 results; filters create a new result window.

The public MangaDex API is documented at `https://api.mangadex.org/docs`, and its documentation source is available at `https://gitlab.com/mangadex-pub/mangadex-api-docs`.

When a MangaDex title includes an AniList ID, the details page makes a separate public GraphQL request to AniList. AniList never supplies chapter or page data. Its recommendations open a local MangaVAn search so MangaDex availability is checked before reading. An AniList failure is non-blocking and does not prevent MangaDex details or chapters from rendering.

AniList external links are filtered to licensed reading platforms and displayed as outbound links. When MangaDex has no English chapters and `VITE_GOOGLE_BOOKS_API_KEY` is configured, Google Books supplies possible English editions, legal embedded previews, and purchase/detail links. Google controls preview and sale availability by publisher and reader region; MangaVAn does not proxy or store preview pages.

The details page loads readable MangaDex chapters across available translation languages, defaults to English, and lets the reader switch languages. If English is unavailable, it exposes any MangaDex-provided official English link and suggests possible alternate MangaDex editions. Suggestions are title matches and must be confirmed by the reader.

Cover files use `https://uploads.mangadex.org/covers/{mangaId}/{filename}`. Reader pages use the exact MangaDex@Home `baseUrl`, chapter hash, and filenames returned for the selected chapter.

## Deployment

Build with `npm run build` and deploy `dist/` as a static site.

- **Vercel:** import the repository, select Vite, and keep the default build command/output. `vercel.json` handles client routes and proxies same-origin MangaDex API requests to avoid browser CORS restrictions.
- **Netlify:** use `npm run build` and publish `dist`. `public/_redirects` is copied into the bundle for client routes.
- **Other static hosts:** rewrite every unknown route to `/index.html`; otherwise direct visits to manga and reader URLs will return a host-level 404.

No API keys or server environment variables are required. Network filtering, region restrictions, MangaDex downtime, AniList downtime, or MangaDex@Home availability can still affect content.

## Attribution

Manga metadata and reader images are supplied by MangaDex and their upstream contributors. Enrichment data labelled “Metadata by AniList” is supplied by AniList. MangaVAn does not host manga files. Follow both services' API rules and content policies when deploying publicly.
