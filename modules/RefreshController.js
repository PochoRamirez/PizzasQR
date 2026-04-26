// Feature: pizza-menu-qr
// RefreshController — wires the refresh button and pull-to-refresh gesture.

import { setLoading, showError } from './GalleryRenderer.js';

export function initRefresh(onRefresh) {
  const refreshBtn = document.getElementById('refresh-btn');
  let isRefreshing = false;
  let startY = 0;
  let currentY = 0;

  document.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) { startY = e.touches[0].clientY; currentY = startY; }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    currentY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', () => {
    if ((currentY - startY) > 80) doRefresh();
    startY = 0; currentY = 0;
  });

  refreshBtn.addEventListener('click', () => {
    if (!isRefreshing) doRefresh();
  });

  async function doRefresh() {
    isRefreshing = true;
    refreshBtn.disabled = true;
    setLoading(true);
    document.getElementById('error-banner').hidden = true;
    try {
      await onRefresh();
    } catch (err) {
      showError(err.message || 'Could not refresh the menu. Please try again.');
    } finally {
      isRefreshing = false;
      refreshBtn.disabled = false;
      setLoading(false);
    }
  }
}
