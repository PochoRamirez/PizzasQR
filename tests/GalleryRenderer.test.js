import { describe, it, expect, beforeEach } from 'vitest';
import {
  renderGallery,
  setLoading,
  showError,
  showEmptyState,
} from '../modules/GalleryRenderer.js';

beforeEach(() => {
  document.body.innerHTML = `
    <div id="gallery"></div>
    <div id="loading-spinner" hidden></div>
    <div id="error-banner" hidden></div>
    <div id="empty-state" hidden></div>
  `;
});

describe('renderGallery', () => {
  it('creates the correct number of <figure> elements', () => {
    const files = [
      { id: 'a1', name: 'pizza1.jpg' },
      { id: 'b2', name: 'pizza2.jpg' },
      { id: 'c3', name: 'pizza3.jpg' },
    ];
    const container = document.getElementById('gallery');
    renderGallery(files, container);
    expect(container.querySelectorAll('figure')).toHaveLength(3);
  });

  it('each <img> has loading="lazy" and the correct src URL', () => {
    const files = [
      { id: 'abc123', name: 'margherita.jpg' },
      { id: 'def456', name: 'pepperoni.jpg' },
    ];
    const container = document.getElementById('gallery');
    renderGallery(files, container);

    const imgs = container.querySelectorAll('img');
    expect(imgs).toHaveLength(2);

    imgs.forEach((img, i) => {
      expect(img.getAttribute('loading')).toBe('lazy');
      expect(img.src).toBe(
        `https://www.googleapis.com/drive/v3/files/${files[i].id}?alt=media&key=undefined`
      );
    });
  });

  it('onerror on an <img> hides its parent <figure>', () => {
    const files = [{ id: 'x1', name: 'broken.jpg' }];
    const container = document.getElementById('gallery');
    renderGallery(files, container);

    const figure = container.querySelector('figure');
    const img = figure.querySelector('img');

    expect(figure.hidden).toBe(false);
    img.onerror();
    expect(figure.hidden).toBe(true);
  });

  it('clears previous content before rendering', () => {
    const container = document.getElementById('gallery');
    container.innerHTML = '<p>old content</p>';
    renderGallery([{ id: 'z1', name: 'new.jpg' }], container);
    expect(container.querySelector('p')).toBeNull();
    expect(container.querySelectorAll('figure')).toHaveLength(1);
  });
});

describe('setLoading', () => {
  it('setLoading(true) removes hidden from spinner', () => {
    const spinner = document.getElementById('loading-spinner');
    expect(spinner.hidden).toBe(true);
    setLoading(true);
    expect(spinner.hidden).toBe(false);
  });

  it('setLoading(false) adds hidden back to spinner', () => {
    const spinner = document.getElementById('loading-spinner');
    spinner.hidden = false;
    setLoading(false);
    expect(spinner.hidden).toBe(true);
  });
});

describe('showError', () => {
  it('sets the error message text and makes the banner visible', () => {
    const banner = document.getElementById('error-banner');
    expect(banner.hasAttribute('hidden')).toBe(true);

    showError('Something went wrong');

    expect(banner.textContent).toBe('Something went wrong');
    expect(banner.hasAttribute('hidden')).toBe(false);
  });
});

describe('showEmptyState', () => {
  it('makes the empty-state element visible', () => {
    const emptyState = document.getElementById('empty-state');
    expect(emptyState.hasAttribute('hidden')).toBe(true);

    showEmptyState();

    expect(emptyState.hasAttribute('hidden')).toBe(false);
  });
});

// Feature: pizza-menu-qr, Property 1: Failed images hidden
import fc from 'fast-check';

describe('Property 1: Failed images are hidden, remaining images stay visible', () => {
  // **Validates: Requirements 1.5**
  it('visible <figure> count equals total minus failed', () => {
    const driveFileArb = fc.record({
      id: fc.hexaString({ minLength: 1, maxLength: 16 }),
      name: fc.string({ minLength: 1, maxLength: 32 }),
    });

    fc.assert(
      fc.property(
        fc.array(driveFileArb, { minLength: 0, maxLength: 20 }),
        fc.func(fc.boolean()),
        (files, shouldFail) => {
          document.body.innerHTML = `
            <div id="gallery"></div>
            <div id="loading-spinner" hidden></div>
            <div id="error-banner" hidden></div>
            <div id="empty-state" hidden></div>
          `;
          const container = document.getElementById('gallery');
          renderGallery(files, container);

          const figures = Array.from(container.querySelectorAll('figure'));
          const imgs = Array.from(container.querySelectorAll('img'));

          // Determine which indices fail using the generated function
          const failedIndices = files
            .map((_, i) => i)
            .filter((i) => shouldFail(i));

          // Fire onerror on the failing images
          failedIndices.forEach((i) => imgs[i].onerror());

          const visibleCount = figures.filter((f) => !f.hidden).length;
          return visibleCount === files.length - failedIndices.length;
        }
      )
    );
  });
});

// Feature: pizza-menu-qr, Property 4: Lazy loading
describe('Property 4: All rendered images use lazy loading', () => {
  // **Validates: Requirements 6.2**
  it('every <img> in the gallery has loading="lazy"', () => {
    const driveFileArb = fc.record({
      id: fc.hexaString({ minLength: 1, maxLength: 16 }),
      name: fc.string({ minLength: 1, maxLength: 32 }),
    });

    fc.assert(
      fc.property(
        fc.array(driveFileArb, { minLength: 1 }),
        (files) => {
          document.body.innerHTML = `
            <div id="gallery"></div>
            <div id="loading-spinner" hidden></div>
            <div id="error-banner" hidden></div>
            <div id="empty-state" hidden></div>
          `;
          const container = document.getElementById('gallery');
          renderGallery(files, container);

          const imgs = Array.from(container.querySelectorAll('img'));
          return imgs.length === files.length &&
            imgs.every((img) => img.getAttribute('loading') === 'lazy');
        }
      )
    );
  });
});
