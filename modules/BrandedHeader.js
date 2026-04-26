// BrandedHeader.js — branded header rendering helpers

/**
 * Returns true only if the URL uses the https: protocol.
 * @param {string} url
 * @returns {boolean}
 */
export function isSafeLogoURL(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Renders the branded header into the #branded-header element.
 * Reads from the global PIZZA_CONFIG if available.
 * @param {object|undefined} config - optional config override (defaults to global PIZZA_CONFIG)
 */
export function renderBrandedHeader(config) {
  const header = document.getElementById('branded-header');
  // Allow an explicit config argument so the function is testable without globals
  const cfg = config !== undefined ? config : (typeof PIZZA_CONFIG !== 'undefined' ? PIZZA_CONFIG : undefined);

  let placeName;
  if (cfg === undefined || cfg === null) {
    console.error('PIZZA_CONFIG is not defined. Using fallback place name.');
    placeName = 'Pizza Menu';
  } else {
    placeName = cfg.placeName || 'Pizza Menu';
  }

  if (cfg !== undefined && cfg !== null && isSafeLogoURL(cfg.logoURL)) {
    const img = document.createElement('img');
    img.src = cfg.logoURL;
    img.alt = placeName;
    img.style.maxHeight = '120px';
    header.appendChild(img);
  }

  const h1 = document.createElement('h1');
  h1.textContent = placeName;
  header.appendChild(h1);
}
