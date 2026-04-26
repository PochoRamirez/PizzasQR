# Design Document: pizza-menu-qr

## Overview

A fully static web application hosted on GitHub Pages that displays a pizza restaurant's menu to customers who scan a QR code. Menu images live in a public Google Drive folder; the page fetches them client-side at runtime. The business owner updates the menu by swapping images in Google Drive — no code changes or redeployment needed. QR codes are generated via one of three provided tools and printed on physical materials.

### Key Constraints

- **Zero server-side runtime** — everything runs in the browser or as a local script.
- **GitHub Pages** — the deployment target; only static files (HTML, CSS, JS, assets).
- **Google Drive** — image storage; accessed via the public sharing API endpoint.
- **Initial payload ≤ 200 KB** (HTML + CSS + JS, excluding images).
- **First image visible within 3 s on 4G**.

---

## Architecture

The system is built with **vanilla HTML, CSS, and JavaScript — no frameworks or build tools**. All code runs directly in the browser without a compilation step. The only external dependencies are the Google Drive API (called via `fetch`) and, optionally, Google Fonts (loaded via `<link>`). This keeps the initial payload well under the 200 KB budget and eliminates framework upgrade risk.

The system has three distinct concerns that never overlap at runtime:

```
┌─────────────────────────────────────────────────────────────┐
│  CUSTOMER DEVICE (browser)                                  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Menu_Page  (index.html + style.css + app.js)        │  │
│  │                                                      │  │
│  │  config.js ──► Branded_Header                        │  │
│  │                                                      │  │
│  │  DriveClient ──► Google Drive API ──► image URLs     │  │
│  │                                                      │  │
│  │  ImageSorter ──► sorted URL list                     │  │
│  │                                                      │  │
│  │  GalleryRenderer ──► <img loading="lazy"> grid       │  │
│  │                                                      │  │
│  │  RefreshController ──► pull-to-refresh + button      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  GOOGLE DRIVE (external, public folder)                     │
│  01_margherita.jpg, 02_pepperoni.png, …                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  BUSINESS OWNER TOOLS (local / offline)                     │
│  Option A: online QR tool (browser, no install)             │
│  Option B: generate_qr.py  (Python + qrcode library)        │
│  Option C: qr_generator.html (self-contained browser page)  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. Customer scans QR code → browser opens `https://<owner>.github.io/<repo>/`.
2. `index.html` loads `config.js`, `style.css`, `app.js` (total ≤ 200 KB).
3. `app.js` reads `PIZZA_CONFIG` from `config.js` and renders the Branded_Header.
4. `DriveClient` calls the Google Drive API with the configured folder ID to retrieve the file list (name + file ID pairs).
5. `ImageSorter` sorts the list by numeric filename prefix, then alphabetically.
6. `GalleryRenderer` injects `<img>` elements with `loading="lazy"` and the Drive direct-download URL for each file.
7. The browser fetches images on demand as the user scrolls.
8. On refresh (button or pull-to-refresh), steps 4–6 repeat; the old gallery is replaced.

### Google Drive API Strategy

Google Drive's public folder listing is available without authentication via the **Drive API v3 `files.list`** endpoint using an API key (restricted to the HTTP referrer of the GitHub Pages domain):

```
GET https://www.googleapis.com/drive/v3/files
  ?q='<FOLDER_ID>'+in+parents+and+trashed=false
  &fields=files(id,name,mimeType)
  &key=<API_KEY>
```

Individual images are served via the public thumbnail/export URL:

```
https://drive.google.com/uc?export=view&id=<FILE_ID>
```

This URL works for publicly shared files without authentication and is suitable for `<img src>` usage.

> **Design Decision**: Using the Drive API v3 with a browser-restricted API key (rather than scraping a public folder share page) gives a stable, structured JSON response and avoids HTML parsing fragility. The API key is safe to embed in client-side JS because it is restricted to the specific GitHub Pages origin.

---

## Components and Interfaces

### `config.js` — Business Owner Configuration

A single JS file the owner edits. Exposes one global object:

```js
const PIZZA_CONFIG = {
  folderID: "1AbCdEfGhIjKlMnOpQrStUvWxYz",  // Google Drive folder ID
  apiKey:   "AIzaSy...",                      // Drive API key (origin-restricted)
  placeName: "Mario's Pizzeria",              // Displayed in Branded_Header
  logoURL:   "",                              // Optional: https:// URL to logo image; "" = no logo
};
```

No other file needs to be modified to rebrand or point to a different folder.

**Security notes for `config.js`:**
- `apiKey` is a low-privilege, read-only Drive API key restricted to the GitHub Pages HTTP referrer. It is acceptable to commit to the repository (see the Security section for details). Actual secrets (OAuth tokens, service account keys) must **never** be committed.
- `placeName` must be injected into the DOM using `textContent`, not `innerHTML`, to prevent XSS.
- `logoURL` must be validated as a valid `https://` URL before being set as an `<img src>`. Any value that does not start with `https://` must be ignored and treated as if the field were empty.

---

### `DriveClient` — Google Drive File Listing

**Interface:**

```js
// Returns Promise<DriveFile[]>
// Throws DriveError on network failure or API error
async function fetchMenuFiles(folderID, apiKey)
```

**Behavior:**
- Calls Drive API v3 `files.list` with `mimeType` filter for `image/jpeg`, `image/png`, `image/webp`.
- Returns an array of `DriveFile` objects.
- On HTTP error or network failure, throws a `DriveError` with a human-readable message.

---

### `ImageSorter` — Filename-Based Ordering

**Interface:**

```js
// Pure function — returns a new sorted array, does not mutate input
function sortMenuFiles(files: DriveFile[]): DriveFile[]
```

**Sorting Rules (applied in order):**
1. Extract leading numeric prefix from filename (e.g., `"01"` from `"01_margherita.jpg"`).
2. Files with a numeric prefix sort before files without one, in ascending numeric order.
3. Ties on numeric prefix → alphabetical by full filename.
4. Files without a numeric prefix → alphabetical by full filename, after all prefixed files.

---

### `GalleryRenderer` — DOM Image Grid

**Interface:**

```js
// Clears the gallery container and renders img elements
function renderGallery(files: DriveFile[], containerEl: HTMLElement): void

// Shows/hides the loading spinner
function setLoading(visible: boolean): void

// Shows an error banner with the given message
function showError(message: string): void

// Shows the "menu unavailable" empty-state message
function showEmptyState(): void
```

**Behavior:**
- Each image is rendered as `<img src="https://drive.google.com/uc?export=view&id=<id>" loading="lazy" alt="<name>">`.
- Images are wrapped in a `<figure>` inside a CSS Grid container.
- On image `onerror`, the `<figure>` is hidden (requirement 1.5).

---

### `RefreshController` — Manual Refresh

**Interface:**

```js
// Wires up the refresh button and pull-to-refresh gesture
function initRefresh(onRefresh: () => Promise<void>): void
```

**Behavior:**
- Refresh button: `click` event calls `onRefresh`.
- Pull-to-refresh: tracks `touchstart`/`touchmove`/`touchend`; triggers `onRefresh` when downward drag exceeds 80 px from the top of the page.
- While `onRefresh` is in progress: button is `disabled`, spinner is shown.
- On `onRefresh` rejection: error banner is shown, previous gallery is restored.

---

### `BrandedHeader` — Header Rendering

Rendered once at startup from `PIZZA_CONFIG`. If `logoURL` is non-empty, an `<img>` is injected alongside the place name `<h1>`. No JS interface needed beyond the initial render call in `app.js`.

**DOM injection rules:**
- `placeName` → set via `element.textContent = PIZZA_CONFIG.placeName` (never `innerHTML`).
- `logoURL` → validated with a simple check (`/^https:\/\//i.test(logoURL)`) before being assigned to `img.src`. An invalid or empty value skips the logo entirely.

---

### QR Generator Tools

#### Option B — `generate_qr.py`

```
python generate_qr.py --url <MENU_PAGE_URL> [--logo <LOGO_PATH>] [--output qr.png]
```

- Uses the `qrcode[pil]` library.
- Output: PNG, 1000×1000 px minimum, error correction level H (required for logo overlay).
- Logo is centered and scaled to ≤30% of QR code area.

#### Option C — `qr_generator.html`

- Self-contained single HTML file; uses the `qrcode.js` CDN library (bundled inline for offline use).
- Input: URL text field + optional logo file picker.
- Output: canvas rendered QR code, downloadable as PNG via `<a download>`.
- Minimum canvas size: 1000×1000 px.
- **Security:** The URL input must be validated (e.g., `new URL(input)` inside a try/catch, accepting only `http:` and `https:` schemes) before the QR code is generated. Invalid input shows an error message and no QR code is produced. Bundling `qrcode.js` inline eliminates the CDN supply-chain risk that would exist if the library were loaded from a remote URL at runtime.

---

## UI / Visual Design

### Design Philosophy
Warm, appetizing, and simple. The page should feel like a real restaurant menu — inviting and easy to read on a phone screen in a dimly lit restaurant.

### Color Palette
All colors are defined as CSS custom properties in `style.css` so they can be changed in one place:

```css
:root {
  --color-bg:         #FDF6EC;   /* warm cream — page background */
  --color-surface:    #FFFFFF;   /* white — image card background */
  --color-primary:    #C0392B;   /* deep red — header, buttons, accents */
  --color-primary-hover: #A93226; /* darker red — button hover state */
  --color-text:       #2C2C2C;   /* near-black — body text */
  --color-text-muted: #7F8C8D;   /* grey — captions, secondary text */
  --color-border:     #E8D5B7;   /* warm tan — card borders, dividers */
  --color-error:      #E74C3C;   /* red — error banners */
  --color-success:    #27AE60;   /* green — (reserved for future use) */
}
```

### Typography
Loaded from Google Fonts (two requests, both served over HTTPS):

| Role | Font | Weight | Size |
|---|---|---|---|
| Pizza place name (h1) | Playfair Display | 700 | 2rem (mobile) / 2.5rem (desktop) |
| Section headings (h2) | Playfair Display | 600 | 1.25rem |
| Body / captions | Lato | 400 | 1rem |
| Buttons / labels | Lato | 700 | 0.9rem |

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Lato:wght@400;700&display=swap" rel="stylesheet">
```

> These font requests must be added to the CSP `style-src` and `font-src` directives (update `connect-src` to include `https://fonts.googleapis.com` and `font-src` to include `https://fonts.gstatic.com`).

### Layout

**Mobile (< 768px):** Single column. Images fill the full card width. Header stacks logo above place name.

**Tablet / Desktop (≥ 768px):** Two-column CSS Grid. Cards have a subtle box shadow and rounded corners (8px radius).

**Image cards:**
- Rounded corners: `border-radius: 8px`
- Subtle shadow: `box-shadow: 0 2px 8px rgba(0,0,0,0.08)`
- Image fills card width, `object-fit: cover`, fixed aspect ratio 4:3
- Card border: `1px solid var(--color-border)`

**Header:**
- Background: `var(--color-primary)` (deep red)
- Text: `#FFFFFF`
- Logo (if provided): max height 48px, vertically centered with place name
- Bottom border/shadow to separate from content

**Refresh button:**
- Positioned top-right of the gallery section
- Background: `var(--color-primary)`, white icon/text
- Hover: `var(--color-primary-hover)`
- Disabled state: 50% opacity, `cursor: not-allowed`

**Loading spinner:**
- Centered on page
- Color: `var(--color-primary)`
- CSS-only animation (no JS, no external library)

### Changing the Theme Later
To retheme the entire page, only the `:root` CSS variables in `style.css` need to be updated. Font choices can be swapped by changing the Google Fonts URL in `index.html` and updating the `font-family` declarations in `style.css`. No JS changes are required for visual updates.

---

## Data Models

### `DriveFile`

```ts
interface DriveFile {
  id:       string;   // Google Drive file ID
  name:     string;   // Original filename, e.g. "01_margherita.jpg"
  mimeType: string;   // "image/jpeg" | "image/png" | "image/webp"
}
```

### `DriveError`

```ts
class DriveError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
  }
}
```

### `PIZZA_CONFIG`

```ts
interface PizzaConfig {
  folderID:  string;   // Google Drive folder ID
  apiKey:    string;   // Drive API v3 browser key
  placeName: string;   // Pizza place display name
  logoURL:   string;   // Logo image URL; empty string = no logo
}
```

### Sorting Key (internal, not persisted)

```ts
interface SortKey {
  hasPrefix:    boolean;
  numericValue: number;   // 0 if no prefix
  fullName:     string;
}
```

---

## Security

### 1. API Key Exposure

The Drive API key is embedded in `config.js` and therefore visible in the browser. This is acceptable because:

- The key is **read-only** — it can only call `files.list` and `files.get` on publicly shared data. It cannot write, delete, or access private files.
- The key is restricted to the **GitHub Pages HTTP referrer** in Google Cloud Console. Any request that does not originate from the configured origin is rejected by Google's API gateway.

**How to set up the HTTP referrer restriction in Google Cloud Console:**
1. Open [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials.
2. Click the API key → under "Application restrictions" select "HTTP referrers (websites)".
3. Add the GitHub Pages origin, e.g. `https://<owner>.github.io/*`.
4. Under "API restrictions" select "Restrict key" and choose "Google Drive API" only.
5. Save. The key will now be rejected for any other origin or API.

The worst-case outcome of key exposure is that someone uses it to list or read files from the same public folder — data that is already publicly accessible. There is no financial or data-integrity risk.

---

### 2. No Secrets in the Repository

`config.js` contains only the low-privilege, origin-restricted API key described above. The following must **never** be committed to the repository:

- OAuth 2.0 client secrets or refresh tokens
- Google service account JSON key files
- Any credential that grants write or administrative access

If a higher-privilege credential is ever needed in the future, it must be stored in a GitHub Actions secret and injected at build time, never hardcoded in source files.

---

### 3. Content Security Policy (CSP)

`index.html` must include the following `<meta>` tag in `<head>` to restrict resource loading to known origins and mitigate XSS and unwanted resource injection:

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self';
               style-src 'self';
               img-src 'self' https://drive.google.com https://lh3.googleusercontent.com data:;
               connect-src 'self' https://www.googleapis.com https://drive.google.com;
               font-src 'self';
               object-src 'none';
               base-uri 'self';">
```

Key points:
- `script-src 'self'` — no inline scripts or external script sources are permitted.
- `connect-src` — only the Drive API and Drive content domains are allowed for `fetch`.
- `img-src` — covers the Drive thumbnail/export URL (`drive.google.com`) and Google's image CDN (`lh3.googleusercontent.com`), plus `data:` for the QR canvas export.
- `object-src 'none'` — disables Flash and other plugin content entirely.

---

### 4. Subresource Integrity (SRI)

`qr_generator.html` (Option C) bundles `qrcode.js` **inline** rather than loading it from a CDN at runtime. This eliminates the need for SRI on that file and removes the supply-chain risk of a compromised CDN serving malicious code.

If a future version of the project loads any library from a CDN (e.g., a CSS framework), the `<script>` or `<link>` tag must include `integrity` and `crossorigin` attributes:

```html
<script src="https://cdn.example.com/lib.min.js"
        integrity="sha384-<base64-hash>"
        crossorigin="anonymous"></script>
```

The hash can be generated with the [SRI Hash Generator](https://www.srihash.org/) or via `openssl dgst -sha384 -binary lib.min.js | openssl base64 -A`.

---

### 5. Input Sanitization

All values from `PIZZA_CONFIG` that are written to the DOM must be sanitized:

| Field | Injection method | Rationale |
|---|---|---|
| `placeName` | `element.textContent = value` | Prevents HTML/script injection via the place name string |
| `logoURL` | Validated as `https://` URL before `img.src = value` | Prevents `javascript:` URIs and mixed-content HTTP images |
| Drive file `name` | `img.alt = file.name` (attribute assignment, not innerHTML) | Prevents attribute injection |

Validation for `logoURL`:

```js
function isSafeLogoURL(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
```

---

### 6. Google Drive Folder Visibility

The Google Drive folder must be shared as **"Anyone with the link can view"** — not "Anyone with the link can edit" or "Anyone with the link can comment". The correct sharing setting:

1. Right-click the folder in Google Drive → Share → "Anyone with the link".
2. Set the role to **Viewer** (not Editor or Commenter).
3. Click "Copy link" and use the folder ID from that URL in `config.js`.

Making the folder editable would allow anyone who discovers the folder ID to upload, modify, or delete menu images. The Drive API key restriction does not protect against direct Drive UI access by someone who has the folder link with edit permissions.

---

### 7. HTTPS Enforcement

GitHub Pages serves all content over HTTPS by default. The application has no mixed-content risk because:

- All Drive API calls use `https://www.googleapis.com`.
- All image URLs use `https://drive.google.com`.
- `logoURL` is validated to require `https://` before use.
- The CSP `img-src` and `connect-src` directives do not include `http:`.

No additional HTTPS configuration is required for the GitHub Pages deployment.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Failed images are hidden, remaining images stay visible

*For any* list of `DriveFile` objects rendered into the gallery, if a random subset of those images triggers an `onerror` event, the number of visible `<figure>` elements in the DOM should equal the total number of files minus the number that failed to load.

**Validates: Requirements 1.5**

---

### Property 2: MIME type filter passes exactly the supported image formats

*For any* list of objects returned by the Drive API, `DriveClient` should include in its result only those entries whose `mimeType` is one of `image/jpeg`, `image/png`, or `image/webp`, and should exclude all entries with any other `mimeType`.

**Validates: Requirements 2.3**

---

### Property 3: QR code URL round-trip

*For any* valid URL string provided as input to the QR generator (Option B Python script or Option C HTML page), decoding the generated QR code image should produce a string identical to the original input URL.

**Validates: Requirements 4.1**

---

### Property 4: All rendered images use lazy loading

*For any* non-empty list of `DriveFile` objects passed to `GalleryRenderer`, every `<img>` element injected into the DOM should have the attribute `loading="lazy"`.

**Validates: Requirements 6.2**

---

### Property 5: Sort ordering satisfies all three ordering rules simultaneously

*For any* list of `DriveFile` objects (with any mix of numeric-prefixed and unprefixed filenames, including ties), `sortMenuFiles` should return a list where:
- All files with a numeric prefix appear before all files without one.
- Files with numeric prefixes are ordered by ascending numeric value of that prefix.
- Among files that share the same numeric prefix, ordering is alphabetical by full filename.
- Among files with no numeric prefix, ordering is alphabetical by full filename.

**Validates: Requirements 7.1, 7.2, 7.3**

---

### Property 6: Sort is deterministic

*For any* list of `DriveFile` objects, calling `sortMenuFiles` on the same input multiple times should always return a list with the same order of elements.

**Validates: Requirements 7.4**

---

### Property 7: Branded header always contains the configured place name

*For any* non-empty string value of `PIZZA_CONFIG.placeName`, the text content of the rendered `Branded_Header` element should contain that string.

**Validates: Requirements 8.1**

---

### Property 8: Refresh failure preserves the previously loaded gallery

*For any* non-empty list of `DriveFile` objects that were successfully loaded before a refresh attempt, if the refresh call throws a `DriveError`, the gallery should still display exactly those previously loaded files and an error banner should be visible in the DOM.

**Validates: Requirements 9.4**

---

## Error Handling

| Scenario | Detection | User-Facing Response | Recovery |
|---|---|---|---|
| Drive API network failure | `fetch` rejects or HTTP status ≥ 400 | Error banner: "The menu could not be loaded. Please check your connection and try again." | Refresh button remains available |
| Drive API returns empty file list | `files.length === 0` after filtering | Empty-state message: "The menu is currently unavailable." | Refresh button remains available |
| Individual image fails to load | `<img onerror>` fires | Image's `<figure>` is hidden silently; no banner | Remaining images continue to display |
| Refresh fails | `onRefresh` promise rejects | Error banner shown; previous gallery restored | Refresh button re-enabled |
| `PIZZA_CONFIG` missing or malformed | Guard check at startup | Console error + fallback placeholder name "Pizza Menu" | Page still renders without branding |

All error messages are defined as constants in `app.js` so they can be updated without hunting through the code.

---

## Testing Strategy

### Unit Tests (example-based)

Focus on specific behaviors and edge cases that are not covered by property tests:

- `DriveClient`: mock `fetch`; verify correct URL construction, correct API key and folder ID are used, `DriveError` is thrown on HTTP 4xx/5xx and network failure.
- `GalleryRenderer`: mock DOM; verify spinner shown/hidden at correct times, empty-state message shown when file list is empty, error banner shown on `DriveError`.
- `BrandedHeader`: verify logo `<img>` is present when `logoURL` is non-empty, absent when empty.
- `RefreshController`: simulate button click and touch events; verify `onRefresh` is called, button is disabled during in-flight request, re-enabled after.
- `generate_qr.py`: verify output file is created, dimensions ≥ 1000×1000, logo is embedded when provided.

### Property-Based Tests

Property-based testing library: **fast-check** (JavaScript/TypeScript) for the browser module; **Hypothesis** (Python) for `generate_qr.py`.

Each property test runs a minimum of **100 iterations**.

Tag format for each test: `// Feature: pizza-menu-qr, Property <N>: <property_text>`

| Property | Library | Generators |
|---|---|---|
| P1 — Failed images hidden | fast-check | `fc.array(driveFileArb)` + random subset marked as failing |
| P2 — MIME type filter | fast-check | `fc.array(fc.record({ mimeType: fc.oneof(...) }))` |
| P3 — QR URL round-trip | Hypothesis | `st.from_regex(r'https?://[^\s]+')` |
| P4 — Lazy loading | fast-check | `fc.array(driveFileArb, { minLength: 1 })` |
| P5 — Sort ordering | fast-check | `fc.array(driveFileArb)` with arbitrary prefix/no-prefix names |
| P6 — Sort determinism | fast-check | `fc.array(driveFileArb)` |
| P7 — Header place name | fast-check | `fc.string({ minLength: 1 })` |
| P8 — Refresh failure restores gallery | fast-check | `fc.array(driveFileArb, { minLength: 1 })` |

### Smoke / Manual Checks

- Responsive layout at 320 px, 768 px, 1280 px, 1920 px viewports.
- First image visible within 3 s on throttled 4G (Lighthouse / WebPageTest).
- Total initial payload ≤ 200 KB (measured with browser DevTools Network tab).
- QR code scannable with iOS and Android native camera apps.
- GitHub Pages deployment reflects changes within 5 minutes of a push.

### Integration Tests

- Drive API call reaches the correct endpoint with the configured folder ID and API key (using a real test folder with known contents).
- Page load with a real Google Drive folder returns the expected images.
