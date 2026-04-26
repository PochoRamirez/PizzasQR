// RefreshController.test.js
// Requirements: 9.1, 9.2, 9.3, 9.4

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';

// Mock GalleryRenderer before importing RefreshController
vi.mock('../modules/GalleryRenderer.js', () => ({
  setLoading: vi.fn(),
  showError: vi.fn(),
}));

import { setLoading, showError } from '../modules/GalleryRenderer.js';
import { initRefresh } from '../modules/RefreshController.js';

function setupDOM() {
  document.body.innerHTML = `
    <button id="refresh-btn">Refresh</button>
    <div id="loading-spinner" hidden></div>
    <div id="error-banner" hidden></div>
  `;
}

/**
 * Capture touch handlers registered on document by initRefresh.
 * jsdom's Touch/TouchEvent constructors are not available, so we intercept
 * addEventListener calls and invoke the handlers directly with synthetic data.
 */
function captureTouchHandlers() {
  const handlers = {};
  const original = document.addEventListener.bind(document);
  const spy = vi.spyOn(document, 'addEventListener').mockImplementation((type, handler, opts) => {
    if (['touchstart', 'touchmove', 'touchend'].includes(type)) {
      handlers[type] = handler;
    }
    original(type, handler, opts);
  });
  return { handlers, spy };
}

beforeEach(() => {
  setupDOM();
  vi.clearAllMocks();
  // Reset scrollY to 0 so touchstart is captured
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
});

describe('RefreshController — button click', () => {
  it('calls onRefresh once when the button is clicked (Req 9.1)', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    initRefresh(onRefresh);

    document.getElementById('refresh-btn').click();
    await vi.waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
  });
});

describe('RefreshController — pull-to-refresh gesture', () => {
  it('calls onRefresh when drag distance > 80 px (Req 9.2)', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { handlers } = captureTouchHandlers();
    initRefresh(onRefresh);

    // Simulate touchstart at y=100, touchmove to y=200 (delta=100 > 80), touchend
    handlers['touchstart']({ touches: [{ clientY: 100 }] });
    handlers['touchmove']({ touches: [{ clientY: 200 }] });
    handlers['touchend']();

    await vi.waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
  });

  it('does NOT call onRefresh when drag distance <= 80 px (Req 9.2)', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { handlers } = captureTouchHandlers();
    initRefresh(onRefresh);

    // Simulate touchstart at y=100, touchmove to y=160 (delta=60 <= 80), touchend
    handlers['touchstart']({ touches: [{ clientY: 100 }] });
    handlers['touchmove']({ touches: [{ clientY: 160 }] });
    handlers['touchend']();

    await new Promise((r) => setTimeout(r, 20));
    expect(onRefresh).not.toHaveBeenCalled();
  });
});

describe('RefreshController — loading state', () => {
  it('disables the button while onRefresh is pending (Req 9.3)', async () => {
    let resolveRefresh;
    const onRefresh = vi.fn(
      () => new Promise((res) => { resolveRefresh = res; })
    );
    initRefresh(onRefresh);

    const btn = document.getElementById('refresh-btn');
    btn.click();

    // Button should be disabled immediately after click
    expect(btn.disabled).toBe(true);

    resolveRefresh();
    await vi.waitFor(() => expect(btn.disabled).toBe(false));
  });

  it('re-enables the button after onRefresh resolves (Req 9.3)', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    initRefresh(onRefresh);

    const btn = document.getElementById('refresh-btn');
    btn.click();

    await vi.waitFor(() => expect(btn.disabled).toBe(false));
  });
});

describe('RefreshController — error handling', () => {
  it('calls showError when onRefresh rejects (Req 9.4)', async () => {
    const onRefresh = vi.fn().mockRejectedValue(new Error('Network failure'));
    initRefresh(onRefresh);

    document.getElementById('refresh-btn').click();

    await vi.waitFor(() => expect(showError).toHaveBeenCalledWith('Network failure'));
  });

  it('calls showError with fallback message when error has no message (Req 9.4)', async () => {
    const onRefresh = vi.fn().mockRejectedValue({});
    initRefresh(onRefresh);

    document.getElementById('refresh-btn').click();

    await vi.waitFor(() =>
      expect(showError).toHaveBeenCalledWith(
        'Could not refresh the menu. Please try again.'
      )
    );
  });
});

// Feature: pizza-menu-qr, Property 8: Refresh failure restores gallery
// Validates: Requirements 9.4

// driveFileArb: arbitrary DriveFile objects
const driveFileArb = fc.record({
  id: fc.hexaString({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 40 }),
  mimeType: fc.constantFrom('image/jpeg', 'image/png', 'image/webp'),
});

describe('RefreshController — Property 8: Refresh failure restores gallery', () => {
  it('gallery is preserved and showError is called after a failed refresh', async () => {
    // Use the real renderGallery to set up the initial DOM state
    const { renderGallery } = await vi.importActual('../modules/GalleryRenderer.js');

    await fc.assert(
      fc.asyncProperty(
        fc.array(driveFileArb, { minLength: 1 }),
        async (initialFiles) => {
          // Set up DOM with gallery container and required elements
          document.body.innerHTML = `
            <button id="refresh-btn">Refresh</button>
            <div id="loading-spinner" hidden></div>
            <div id="error-banner" hidden></div>
            <section id="gallery"></section>
          `;
          vi.clearAllMocks();

          const galleryEl = document.getElementById('gallery');

          // Render the initial gallery using the real renderGallery
          renderGallery(initialFiles, galleryEl);

          // Verify initial state: correct number of figures
          const initialFigures = galleryEl.querySelectorAll('figure');
          if (initialFigures.length !== initialFiles.length) return false;

          // Set up a failing onRefresh — capture the rejection so we can await it
          let rejectRefresh;
          const onRefresh = vi.fn(
            () => new Promise((_, rej) => { rejectRefresh = rej; })
          );
          initRefresh(onRefresh);

          // Trigger the refresh button click
          document.getElementById('refresh-btn').click();

          // Reject the promise and flush all pending microtasks/macrotasks
          rejectRefresh(new Error('Network failure'));
          await new Promise((r) => setTimeout(r, 10));

          // Assert: showError was called (error banner path was triggered)
          expect(showError).toHaveBeenCalled();

          // Assert: gallery still contains the original figures (renderGallery was NOT called again)
          const figuresAfter = galleryEl.querySelectorAll('figure');
          if (figuresAfter.length !== initialFiles.length) return false;

          // Assert: each original file's img src is still present
          const srcsAfter = Array.from(figuresAfter).map(
            (fig) => fig.querySelector('img').src
          );
          for (const file of initialFiles) {
            const expectedSrc = `https://drive.google.com/uc?export=view&id=${file.id}`;
            if (!srcsAfter.includes(expectedSrc)) return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  }, 30000); // 30s timeout for 100 property-based runs
});
