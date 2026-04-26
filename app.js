// Feature: pizza-menu-qr
// app.js — orchestrates startup: branded header, menu load, and refresh wiring.
// PIZZA_CONFIG is a global declared in config.js (loaded as a plain <script> before this module).

import { fetchMenuFiles, DriveError } from './modules/DriveClient.js';
import { sortMenuFiles }              from './modules/ImageSorter.js';
import { renderGallery, setLoading, showError, showEmptyState } from './modules/GalleryRenderer.js';
import { initRefresh }                from './modules/RefreshController.js';
import { renderBrandedHeader, isSafeLogoURL } from './modules/BrandedHeader.js';

const MSG_LOAD_ERROR = 'The menu could not be loaded. Please check your connection and try again.';
const MSG_EMPTY      = 'The menu is currently unavailable.';

// ── Menu loading ───────────────────────────────────────────────────────────

async function loadMenu() {
  document.getElementById('error-banner').hidden = true;
  document.getElementById('empty-state').hidden  = true;
  setLoading(true);

  try {
    const files  = await fetchMenuFiles(PIZZA_CONFIG.folderID, PIZZA_CONFIG.apiKey);
    const sorted = sortMenuFiles(files);
    const galleryEl = document.getElementById('gallery');

    if (sorted.length === 0) {
      showEmptyState();
    } else {
      renderGallery(sorted, galleryEl);
    }
  } catch (err) {
    showError(MSG_LOAD_ERROR);
    console.error(err);
  } finally {
    setLoading(false);
  }
}

// ── Startup ────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  renderBrandedHeader(typeof PIZZA_CONFIG !== 'undefined' ? PIZZA_CONFIG : undefined);
  loadMenu();
  initRefresh(loadMenu);
});
