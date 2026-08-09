# MangaVan UI design specification

This theme combines the cinematic hero treatment in `homepage-dark-header.png` with the dense, scannable catalog organization in `homepage-by-line-vertical.png`. MangaVan keeps larger cover cards than the references, but adopts their dark navy canvas, clear collection headings, restrained metadata, and image-led hierarchy.

## Visual direction

- Use deep blue-black backgrounds instead of neutral black. Layer surfaces subtly; avoid large bright panels.
- Let manga artwork carry the color. UI chrome should stay navy, slate, white, and blue.
- Use one bright blue accent for actions, active states, progress, focus, and links.
- Prefer cinematic gradients over decorative symbols. Hero artwork fades into the content canvas on the left and bottom.
- Keep sections visually independent with generous vertical rhythm and horizontally scrollable cover rails.

## Foundation tokens

The canonical tokens live in `src/styles/index.css` under `:root`.

| Role | Token | Value |
| --- | --- | --- |
| App background | `--bg` | `#080d1a` |
| Base surface | `--surface` | `#10182b` |
| Raised surface | `--surface-raised` | `#151f36` |
| Card fallback | `--card` | `#111a2e` |
| Divider/border | `--line` | `#24314a` |
| Primary text | `--text` | `#f7f9ff` |
| Secondary text | `--muted` | `#a8b3c9` |
| Tertiary text | `--dim` | `#71809b` |
| Action blue | `--accent` | `#3b82f6` |
| Hover blue | `--accent-hover` | `#60a5fa` |

Use the shared radii and shadow tokens. New components should not introduce another accent color without a semantic requirement such as destructive feedback.

## Typography

- Use the system sans stack already defined at the root for fast loading and broad language coverage.
- Display headings: bold, tightly tracked, and compact line height. Reserve the largest scale for hero and manga titles.
- Section headings: `1.35rem–1.8rem`, bold, with a short action link aligned to the opposite edge.
- Body copy: `0.9rem–1.1rem`, muted, with `1.6–1.75` line height.
- Eyebrows and field labels: `0.72rem–0.75rem`, bold, uppercase, and letter-spaced.
- Metadata is visually secondary but should remain at least `0.7rem` and meet contrast requirements.

## Layout and spacing

- Main container: maximum `1360px`, centered, with responsive side gutters.
- Header: sticky, translucent navy, approximately `75px` high, with blur and a subtle bottom divider.
- Hero: minimum `560px` on desktop. Copy occupies the left half; catalog artwork begins around 38% and fills the right side.
- Home sections: use about `6rem` between collections on desktop and `4.4rem` on mobile.
- Card rails: `1.5rem` horizontal gaps on desktop and `1.1rem` on mobile. Include bottom padding so hover elevation and the scrollbar do not collide.
- Card grids: use `2.25rem` row gaps and `1.4rem` column gaps on desktop.

## Component rules

### Hero

- Select artwork from content already visible in the catalog; do not hard-code unrelated promotional art.
- Render the image as decorative and keep meaningful copy in HTML.
- Apply left-to-right and bottom fades to maintain heading contrast.
- Keep one primary action and one quiet secondary action.

### Manga cards

- Use a consistent `2:3` cover ratio.
- Titles are one line by default; metadata sits below in muted text.
- Hover raises the cover by no more than `6px`, strengthens the blue border, and deepens the shadow.
- Progress remains an overlay badge with strong contrast.

### Buttons and links

- Primary buttons use action blue with white text.
- Secondary/ghost buttons use translucent or raised navy surfaces and slate borders.
- Inline collection actions use a lighter blue and gain white on hover.
- Every interactive control must retain the shared blue focus ring.

### Panels and forms

- Use `--surface` for status panels, filters, chapter groups, and suggestions.
- Inputs use a darker inset navy; focus changes the border to blue and adds a subtle outer ring.
- Use `--line` for dividers instead of hard-coded neutral gray.

## Responsive behavior

- Below `980px`, reduce hero artwork dominance and use four-column catalog grids.
- Below `680px`, place hero art across the full background at lower opacity, stack filters, and use three-column grids.
- Below `430px`, use two-column grids.
- Horizontal collection rails remain scrollable on small screens with `145px` cards.
- Preserve readable gutters and do not hide primary content to force desktop density.

## Accessibility and motion

- Maintain WCAG AA contrast for text and controls.
- Decorative hero artwork is `aria-hidden`; cover images retain descriptive alternative text.
- Do not encode state with blue alone; pair color with labels, borders, or position.
- Respect `prefers-reduced-motion`; the project-level rule already reduces transitions and animation.
- Keep tap targets near or above `44px` for primary controls.

## Implementation workflow

1. Add new foundation values to the root tokens rather than scattering colors through component rules.
2. Build shared primitives in `src/components` and compose them inside `src/pages`.
3. Use existing manga query results for art and metadata so featured UI stays synchronized with the catalog.
4. Apply desktop layout first, then explicitly verify `980px`, `680px`, and `430px` breakpoints.
5. Check loading, empty, error, hover, keyboard-focus, and progress states for every component.
6. Run `npm run lint`, `npm test`, and `npm run build` before handing off a visual change.

## Recommended next UI iteration

Add an optional compact ranking/list variant based on the vertical-list reference. Use it for a single discovery module such as “Popular this week,” not for every collection. This adds information density and visual variety without replacing the cover rails that work well for manga browsing.
