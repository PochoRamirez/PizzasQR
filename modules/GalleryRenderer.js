// Feature: pizza-menu-qr
// GalleryRenderer — DOM rendering helpers for the pizza menu gallery.

export function renderGallery(files, containerEl) {
  containerEl.innerHTML = '';
  for (const file of files) {
    const figure = document.createElement('figure');
    const img = document.createElement('img');
    img.src = `https://lh3.googleusercontent.com/d/${file.id}`;
    img.setAttribute('loading', 'lazy');
    img.setAttribute('alt', file.name);
    img.onerror = () => { figure.hidden = true; };
    figure.appendChild(img);
    containerEl.appendChild(figure);
  }
}

export function setLoading(visible) {
  const spinner = document.getElementById('loading-spinner');
  spinner.hidden = !visible;
}

export function showError(message) {
  const banner = document.getElementById('error-banner');
  banner.textContent = message;
  banner.removeAttribute('hidden');
}

export function showEmptyState() {
  const emptyState = document.getElementById('empty-state');
  emptyState.removeAttribute('hidden');
}
