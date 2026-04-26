# Implementation Plan: pizza-menu-qr

## Overview

Build a fully static pizza menu web app hosted on GitHub Pages. Menu images are fetched from a public Google Drive folder at runtime. The implementation is vanilla HTML, CSS, and JavaScript — no frameworks, no build tools. QR code generation is provided via a Python script and a self-contained HTML page.

## Tasks

- [x] 1. Project setup and folder structure
  - Create the `C:\proyectos\PizzasQR` work folder with the following layout:
    ```
    PizzasQR/
    ├── index.html
    ├── style.css
    ├── config.js
    ├── app.js
    ├── modules/
    │   ├── DriveClient.js
    │   ├── ImageSorter.js
    │   ├── GalleryRenderer.js
    │   └── RefreshController.js
    ├── generate_qr.py
    ├── qr_generator.html
    ├── tests/
    │   ├── ImageSorter.test.js
    │   ├── DriveClient.test.js
    │   ├── GalleryRenderer.test.js
    │   ├── RefreshController.test.js
    │   ├── BrandedHeader.test.js
    │   └── test_generate_qr.py
    └── README.md
    ```
  - Initialize a git repository (`git init`) and create a `.gitignore` that excludes `node_modules/`, `*.pyc`, `__pycache__/`, and generated QR PNG files.
  - Create a minimal `package.json` for the test runner (fast-check + vitest or jest) with `"type": "module"`.
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 2. Core HTML structure (`index.html`)
  - [x] 2.1 Create `index.html` with semantic markup and CSP
    - Add `<!DOCTYPE html>`, `<html lang="es">`, `<head>`, `<body>`.
    - Add the CSP `<meta>` tag with these directives:
      ```
      default-src 'self';
      script-src 'self';
      style-src 'self' https://fonts.googleapis.com;
      img-src 'self' https://drive.google.com https://lh3.googleusercontent.com data:;
      connect-src 'self' https://www.googleapis.com https://drive.google.com;
      font-src 'self' https://fonts.gstatic.com;
      object-src 'none';
      base-uri 'self';
      ```
    - Add Google Fonts preconnect and stylesheet `<link>` tags for Playfair Display (600, 700) and Lato (400, 700).
    - Add `<meta name="viewport" content="width=device-width, initial-scale=1">`.
    - Add `<meta name="description">` with a short menu description.
    - _Requirements: 1.1, 5.1, 6.3_

  - [x] 2.2 Add semantic body structure to `index.html`
    - `<header id="branded-header">` — placeholder for BrandedHeader rendering.
    - `<main>` containing:
      - `<div id="loading-spinner" aria-live="polite" aria-label="Loading menu" hidden>` with a CSS-only spinner element inside.
      - `<div id="error-banner" role="alert" hidden>` for error messages.
      - `<p id="empty-state" hidden>` for the "menu unavailable" message.
      - `<section id="gallery" aria-label="Pizza menu">` — the image grid container.
      - `<button id="refresh-btn" aria-label="Refresh menu">` with a refresh icon (Unicode ↻ or SVG inline).
    - Load scripts at the bottom of `<body>` in order: `config.js`, `modules/DriveClient.js`, `modules/ImageSorter.js`, `modules/GalleryRenderer.js`, `modules/RefreshController.js`, `app.js` — all with `type="module"`.
    - _Requirements: 1.3, 1.4, 2.4, 9.1_

- [x] 3. CSS styling (`style.css`)
  - [x] 3.1 Define CSS custom properties and base styles
    - Declare all color variables in `:root`:
      `--color-bg: #FDF6EC`, `--color-surface: #FFFFFF`, `--color-primary: #C0392B`,
      `--color-primary-hover: #A93226`, `--color-text: #2C2C2C`, `--color-text-muted: #7F8C8D`,
      `--color-border: #E8D5B7`, `--color-error: #E74C3C`, `--color-success: #27AE60`.
    - Set `body` background to `var(--color-bg)`, color to `var(--color-text)`, font-family to `'Lato', sans-serif`.
    - Apply `box-sizing: border-box` globally.
    - _Requirements: 3.1_

  - [x] 3.2 Style the Branded_Header
    - `header#branded-header`: background `var(--color-primary)`, color `#fff`, padding, bottom shadow.
    - `h1` inside header: font-family `'Playfair Display', serif`, weight 700, size `2rem` (mobile) / `2.5rem` (desktop via media query).
    - Logo `<img>` inside header: `max-height: 48px`, `vertical-align: middle`.
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 3.3 Style the image gallery grid and cards
    - `#gallery`: CSS Grid, `grid-template-columns: 1fr` on mobile; `repeat(2, 1fr)` at `min-width: 768px`.
    - `figure` (card): `border-radius: 8px`, `box-shadow: 0 2px 8px rgba(0,0,0,0.08)`, `border: 1px solid var(--color-border)`, `background: var(--color-surface)`, `overflow: hidden`, `margin: 0`.
    - `figure img`: `width: 100%`, `aspect-ratio: 4/3`, `object-fit: cover`, `display: block`.
    - _Requirements: 1.2, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.4 Style the refresh button, loading spinner, error banner, and empty state
    - `#refresh-btn`: positioned top-right of gallery section, background `var(--color-primary)`, color `#fff`, border-radius, hover state `var(--color-primary-hover)`, disabled state `opacity: 0.5; cursor: not-allowed`.
    - `#loading-spinner`: centered, CSS-only `@keyframes` spin animation, color `var(--color-primary)`.
    - `#error-banner`: background tint of `var(--color-error)`, visible text, `border-radius`.
    - `#empty-state`: centered, color `var(--color-text-muted)`, font-size `1.1rem`.
    - _Requirements: 1.3, 1.4, 2.4, 9.1, 9.3_

- [x] 4. Configuration file (`config.js`)
  - Create `config.js` that declares and exports the `PIZZA_CONFIG` global object:
    ```js
    const PIZZA_CONFIG = {
      folderID:  "REPLACE_WITH_YOUR_FOLDER_ID",
      apiKey:    "REPLACE_WITH_YOUR_API_KEY",
      placeName: "Mario's Pizzeria",
      logoURL:   "",
    };
    ```
  - Add inline comments explaining each field and where to find the values.
  - Add a comment warning that OAuth tokens and service account keys must never be placed here.
  - _Requirements: 2.1, 8.4_

- [x] 5. `DriveClient` module (`modules/DriveClient.js`)
  - [x] 5.1 Implement `DriveError` class and `fetchMenuFiles` function
    - Define `class DriveError extends Error` with an optional `cause` property.
    - Implement `async function fetchMenuFiles(folderID, apiKey)`:
      - Build the Drive API v3 URL with `q='<folderID>'+in+parents+and+trashed=false`, `fields=files(id,name,mimeType)`, and `key=<apiKey>`.
      - Filter the response to only include `mimeType` values: `image/jpeg`, `image/png`, `image/webp`.
      - On HTTP status ≥ 400 or network failure, throw `new DriveError(...)` with a human-readable message.
      - Return `DriveFile[]`.
    - Export both `DriveError` and `fetchMenuFiles`.
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x]* 5.2 Write unit tests for `DriveClient`
    - Mock `fetch` to return a successful response with mixed MIME types; assert only image types are returned.
    - Mock `fetch` to return HTTP 403; assert `DriveError` is thrown.
    - Mock `fetch` to reject (network failure); assert `DriveError` is thrown.
    - Verify the constructed URL contains the correct `folderID`, `apiKey`, and `fields` parameters.
    - _Requirements: 2.1, 2.3, 2.4_

  - [x]* 5.3 Write property test for MIME type filter (Property 2)
    - **Property 2: MIME type filter passes exactly the supported image formats**
    - Use `fc.array(fc.record({ id: fc.string(), name: fc.string(), mimeType: fc.oneof(fc.constant('image/jpeg'), fc.constant('image/png'), fc.constant('image/webp'), fc.constant('application/pdf'), fc.constant('video/mp4'), fc.string()) }))` to generate arbitrary file lists.
    - Assert that the filtered result contains only entries with `mimeType` in `['image/jpeg', 'image/png', 'image/webp']`.
    - Tag: `// Feature: pizza-menu-qr, Property 2: MIME type filter`
    - **Validates: Requirements 2.3**

- [x] 6. `ImageSorter` module (`modules/ImageSorter.js`)
  - [x] 6.1 Implement `sortMenuFiles` pure function
    - Implement `function sortMenuFiles(files)` that returns a new sorted array without mutating the input.
    - Extract the leading numeric prefix from each filename using a regex (e.g., `/^(\d+)/`).
    - Apply sorting rules in order:
      1. Files with a numeric prefix before files without one.
      2. Ascending numeric order of prefix value.
      3. Ties on prefix → alphabetical by full filename.
      4. No prefix → alphabetical by full filename.
    - Export `sortMenuFiles`.
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x]* 6.2 Write unit tests for `ImageSorter`
    - Test: all prefixed files appear before unprefixed files.
    - Test: numeric order is correct (e.g., `02_` before `10_`).
    - Test: tie on prefix resolved alphabetically by full filename.
    - Test: empty array returns empty array.
    - Test: single-element array returns same element.
    - Test: input array is not mutated.
    - _Requirements: 7.1, 7.2, 7.3_

  - [x]* 6.3 Write property test for sort ordering (Property 5)
    - **Property 5: Sort ordering satisfies all three ordering rules simultaneously**
    - Generate arbitrary `DriveFile[]` with a mix of numeric-prefixed and unprefixed filenames using `fc.array(driveFileArb)`.
    - Assert all four ordering invariants hold on the result.
    - Tag: `// Feature: pizza-menu-qr, Property 5: Sort ordering`
    - **Validates: Requirements 7.1, 7.2, 7.3**

  - [x]* 6.4 Write property test for sort determinism (Property 6)
    - **Property 6: Sort is deterministic**
    - For any input array, assert `sortMenuFiles(files)` called twice produces identical ordering.
    - Tag: `// Feature: pizza-menu-qr, Property 6: Sort determinism`
    - **Validates: Requirements 7.4**

- [x] 7. `GalleryRenderer` module (`modules/GalleryRenderer.js`)
  - [x] 7.1 Implement `renderGallery`, `setLoading`, `showError`, `showEmptyState`
    - `renderGallery(files, containerEl)`: clear `containerEl`, then for each file inject:
      ```html
      <figure>
        <img src="https://drive.google.com/uc?export=view&id=<id>"
             loading="lazy"
             alt="<name>">
      </figure>
      ```
      Set `img.alt` via attribute assignment (not innerHTML). On `img.onerror`, set `figure.hidden = true`.
    - `setLoading(visible)`: toggle `hidden` on `#loading-spinner`.
    - `showError(message)`: set `#error-banner` text content and remove `hidden`.
    - `showEmptyState()`: remove `hidden` from `#empty-state`.
    - Export all four functions.
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.2_

  - [x]* 7.2 Write unit tests for `GalleryRenderer`
    - Mock DOM; verify `renderGallery` creates the correct number of `<figure>` elements.
    - Verify each `<img>` has `loading="lazy"` and the correct `src` URL.
    - Verify `onerror` on an `<img>` hides its parent `<figure>`.
    - Verify `setLoading(true)` removes `hidden` from spinner; `setLoading(false)` adds it back.
    - Verify `showError` sets text and makes banner visible.
    - Verify `showEmptyState` makes empty-state element visible.
    - _Requirements: 1.3, 1.4, 1.5_

  - [x]* 7.3 Write property test for failed images hidden (Property 1)
    - **Property 1: Failed images are hidden, remaining images stay visible**
    - Generate `fc.array(driveFileArb)` and a random subset to mark as failed.
    - Render the gallery, fire `onerror` on the failing images, then assert visible `<figure>` count equals `total - failed`.
    - Tag: `// Feature: pizza-menu-qr, Property 1: Failed images hidden`
    - **Validates: Requirements 1.5**

  - [x]* 7.4 Write property test for lazy loading (Property 4)
    - **Property 4: All rendered images use lazy loading**
    - For any non-empty `fc.array(driveFileArb, { minLength: 1 })`, assert every `<img>` in the rendered gallery has `loading="lazy"`.
    - Tag: `// Feature: pizza-menu-qr, Property 4: Lazy loading`
    - **Validates: Requirements 6.2**

- [x] 8. Checkpoint — core modules complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. `BrandedHeader` rendering (in `app.js` or a dedicated helper)
  - [x] 9.1 Implement `renderBrandedHeader` function
    - Read `PIZZA_CONFIG.placeName` and set it via `element.textContent` (never `innerHTML`) into an `<h1>` inside `#branded-header`.
    - Implement `isSafeLogoURL(url)` using `new URL(url)` in a try/catch, returning `true` only if `parsed.protocol === 'https:'`.
    - If `isSafeLogoURL(PIZZA_CONFIG.logoURL)` is true, create an `<img>` and set `img.src = PIZZA_CONFIG.logoURL`, `img.alt = PIZZA_CONFIG.placeName`, `img.style.maxHeight = '48px'`; prepend it to the header.
    - If `PIZZA_CONFIG` is missing or malformed, log a console error and fall back to `placeName = "Pizza Menu"`.
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x]* 9.2 Write unit tests for `BrandedHeader`
    - Verify `<h1>` text content equals `PIZZA_CONFIG.placeName`.
    - Verify logo `<img>` is present when `logoURL` is a valid `https://` URL.
    - Verify logo `<img>` is absent when `logoURL` is empty.
    - Verify logo `<img>` is absent when `logoURL` starts with `http://` (non-HTTPS).
    - Verify logo `<img>` is absent when `logoURL` is a `javascript:` URI.
    - Verify fallback name "Pizza Menu" is used when `PIZZA_CONFIG` is undefined.
    - _Requirements: 8.1, 8.2, 8.4_

  - [x]* 9.3 Write property test for branded header place name (Property 7)
    - **Property 7: Branded header always contains the configured place name**
    - For any `fc.string({ minLength: 1 })` as `placeName`, render the header and assert the `<h1>` text content contains that string.
    - Tag: `// Feature: pizza-menu-qr, Property 7: Branded header place name`
    - **Validates: Requirements 8.1**

- [x] 10. `RefreshController` module (`modules/RefreshController.js`)
  - [x] 10.1 Implement `initRefresh` with button click and pull-to-refresh
    - `initRefresh(onRefresh)`:
      - Wire `#refresh-btn` `click` event to call `onRefresh()`.
      - Track `touchstart` / `touchmove` / `touchend` on `document`; trigger `onRefresh()` when downward drag from page top exceeds 80 px.
      - While `onRefresh` is in progress: set `#refresh-btn.disabled = true` and call `setLoading(true)`.
      - On resolution: set `#refresh-btn.disabled = false` and call `setLoading(false)`.
      - On rejection: call `showError(...)` with the error message; restore the previous gallery.
    - Export `initRefresh`.
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x]* 10.2 Write unit tests for `RefreshController`
    - Simulate button click; verify `onRefresh` is called once.
    - Simulate touch drag > 80 px from top; verify `onRefresh` is called.
    - Simulate touch drag < 80 px; verify `onRefresh` is NOT called.
    - Verify button is disabled while `onRefresh` is pending.
    - Verify button is re-enabled after `onRefresh` resolves.
    - Verify `showError` is called when `onRefresh` rejects.
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x]* 10.3 Write property test for refresh failure restores gallery (Property 8)
    - **Property 8: Refresh failure preserves the previously loaded gallery**
    - For any `fc.array(driveFileArb, { minLength: 1 })` as the initial gallery, simulate a failed refresh (rejected promise), then assert the gallery still shows the original files and the error banner is visible.
    - Tag: `// Feature: pizza-menu-qr, Property 8: Refresh failure restores gallery`
    - **Validates: Requirements 9.4**

- [x] 11. `app.js` — orchestration and wiring
  - Define error message constants at the top:
    ```js
    const MSG_LOAD_ERROR = "The menu could not be loaded. Please check your connection and try again.";
    const MSG_REFRESH_ERROR = "Could not refresh the menu. Please try again.";
    const MSG_EMPTY = "The menu is currently unavailable.";
    ```
  - Implement `async function loadMenu()`:
    1. Call `setLoading(true)`, clear error banner and empty state.
    2. Call `fetchMenuFiles(PIZZA_CONFIG.folderID, PIZZA_CONFIG.apiKey)`.
    3. Pass result through `sortMenuFiles`.
    4. If empty, call `showEmptyState()`; else call `renderGallery(sorted, galleryEl)`.
    5. On `DriveError`, call `showError(MSG_LOAD_ERROR)`.
    6. Always call `setLoading(false)`.
  - Call `renderBrandedHeader()` once at startup.
  - Call `loadMenu()` once at startup.
  - Call `initRefresh(loadMenu)` to wire the refresh button and pull-to-refresh.
  - _Requirements: 1.1, 1.3, 1.4, 2.4, 8.1, 9.1, 9.2_

- [x] 12. Checkpoint — full page wiring complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. QR Generator Option B — `generate_qr.py`
  - [x] 13.1 Implement the Python QR generation script
    - Use `argparse` to accept `--url` (required), `--logo` (optional path), `--output` (default `qr.png`).
    - Use the `qrcode[pil]` library with error correction level `H`.
    - Generate a QR code at minimum 1000×1000 px (set `box_size` and `border` accordingly).
    - If `--logo` is provided: open the logo with Pillow, scale it to ≤30% of QR code area, paste it centered on the QR image.
    - Save the output as PNG to `--output`.
    - Print a success message with the output path.
    - Add a `requirements.txt` (or inline comment) listing `qrcode[pil]` and `Pillow`.
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5 (Option B)_

  - [x]* 13.2 Write unit tests for `generate_qr.py`
    - Test: output file is created at the specified path.
    - Test: output image dimensions are ≥ 1000×1000 px.
    - Test: when `--logo` is provided, the output image differs from the no-logo version (logo is embedded).
    - Test: script exits with a non-zero code when `--url` is missing.
    - _Requirements: 4.2, 4.4_

  - [x]* 13.3 Write property test for QR URL round-trip — Python (Property 3)
    - **Property 3: QR code URL round-trip**
    - Use `hypothesis` with `st.from_regex(r'https?://[a-zA-Z0-9._~:/?#\[\]@!$&\'()*+,;=%-]+')` to generate valid URLs.
    - For each URL: generate the QR code, decode it with `pyzbar` or `opencv`, assert decoded string equals input URL.
    - Tag: `# Feature: pizza-menu-qr, Property 3: QR URL round-trip`
    - **Validates: Requirements 4.1**

- [x] 14. QR Generator Option C — `qr_generator.html`
  - [x] 14.1 Implement the self-contained browser QR generator page
    - Create `qr_generator.html` as a single file with no external runtime dependencies.
    - Bundle the `qrcode.js` library source inline inside a `<script>` tag (copy from the npm package or the GitHub release) to eliminate CDN supply-chain risk.
    - UI elements: URL text input, optional logo file `<input type="file">`, "Generate QR" button, canvas for output, download link (`<a download="qr.png">`), error message `<p>`.
    - Validate the URL input using `new URL(input)` in a try/catch; accept only `http:` and `https:` schemes; show an error message and produce no QR code for invalid input.
    - On valid input: render the QR code to a canvas at minimum 1000×1000 px using `QRCode`.
    - If a logo file is selected: draw it centered on the canvas, scaled to ≤30% of canvas area, after QR rendering.
    - Wire the download link to `canvas.toDataURL('image/png')` so the user can save the PNG.
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5 (Option C)_

- [x] 15. GitHub Pages deployment setup
  - Ensure the repository root contains `index.html` (GitHub Pages serves from root of `main` branch by default).
  - Create `.github/workflows/pages.yml` with a minimal GitHub Actions workflow that deploys the `main` branch to GitHub Pages using the `actions/deploy-pages` action (or the simpler branch-based Pages setting).
  - Add a `CNAME` file placeholder (empty or with a comment) for custom domain use in the future.
  - Document the one-time GitHub Pages setup steps in `README.md` (Settings → Pages → Source: Deploy from branch → main → / (root)).
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 16. README documentation
  - Write `README.md` covering:
    - Project overview and purpose.
    - Work folder structure (mirrors task 1 layout).
    - One-time setup: Google Drive folder creation, sharing settings (Viewer), API key creation and HTTP referrer restriction steps.
    - How to configure `config.js` (folderID, apiKey, placeName, logoURL).
    - How to deploy to GitHub Pages (one-time setup + push-to-deploy workflow).
    - How to generate a QR code using each of the three options (A: online tool recommendation, B: `python generate_qr.py --url <URL>`, C: open `qr_generator.html` in browser).
    - How to update the menu (upload/replace images in Google Drive folder, naming convention for ordering).
    - Security notes: what the API key can and cannot do, never commit OAuth tokens.
  - _Requirements: 10.3_

- [x] 17. Final checkpoint — all tests pass, project complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify total initial payload (HTML + CSS + JS) is ≤ 200 KB by checking file sizes.
  - Confirm `index.html`, `style.css`, `config.js`, `app.js`, all modules, `generate_qr.py`, `qr_generator.html`, and `README.md` are present in the work folder.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- Each task references specific requirements for traceability.
- Checkpoints (tasks 8, 12, 17) ensure incremental validation.
- Property tests validate universal correctness properties (Properties 1–8 from the design document).
- Unit tests validate specific examples and edge cases.
- The `qrcode.js` library must be bundled inline in `qr_generator.html` — do not load it from a CDN at runtime.
- All DOM text injection must use `textContent`, never `innerHTML`, to prevent XSS.
- The `logoURL` field must be validated as `https://` before use as an `<img src>`.
