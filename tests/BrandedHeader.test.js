// BrandedHeader.test.js
// Unit tests for renderBrandedHeader and isSafeLogoURL
// Validates: Requirements 8.1, 8.2, 8.4

import { describe, it, expect, beforeEach } from 'vitest';
import { renderBrandedHeader, isSafeLogoURL } from '../modules/BrandedHeader.js';

// ── isSafeLogoURL ──────────────────────────────────────────────────────────

describe('isSafeLogoURL', () => {
  it('returns true for a valid https:// URL', () => {
    expect(isSafeLogoURL('https://example.com/logo.png')).toBe(true);
  });

  it('returns false for an http:// URL', () => {
    expect(isSafeLogoURL('http://example.com/logo.png')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isSafeLogoURL('')).toBe(false);
  });

  it('returns false for a javascript: URI', () => {
    expect(isSafeLogoURL('javascript:alert(1)')).toBe(false);
  });

  it('returns false for a relative path', () => {
    expect(isSafeLogoURL('/images/logo.png')).toBe(false);
  });
});

// ── renderBrandedHeader ────────────────────────────────────────────────────

describe('renderBrandedHeader', () => {
  beforeEach(() => {
    // Reset the DOM before each test
    document.body.innerHTML = '<div id="branded-header"></div>';
  });

  it('renders <h1> with placeName from config (Req 8.1)', () => {
    renderBrandedHeader({ placeName: 'Mario\'s Pizza', logoURL: '' });
    const h1 = document.querySelector('#branded-header h1');
    expect(h1).not.toBeNull();
    expect(h1.textContent).toBe("Mario's Pizza");
  });

  it('renders logo <img> when logoURL is a valid https:// URL (Req 8.2)', () => {
    renderBrandedHeader({ placeName: 'Mario\'s Pizza', logoURL: 'https://example.com/logo.png' });
    const img = document.querySelector('#branded-header img');
    expect(img).not.toBeNull();
    expect(img.src).toBe('https://example.com/logo.png');
  });

  it('does NOT render logo <img> when logoURL is empty (Req 8.2)', () => {
    renderBrandedHeader({ placeName: 'Mario\'s Pizza', logoURL: '' });
    const img = document.querySelector('#branded-header img');
    expect(img).toBeNull();
  });

  it('does NOT render logo <img> when logoURL starts with http:// (Req 8.2)', () => {
    renderBrandedHeader({ placeName: 'Mario\'s Pizza', logoURL: 'http://example.com/logo.png' });
    const img = document.querySelector('#branded-header img');
    expect(img).toBeNull();
  });

  it('does NOT render logo <img> when logoURL is a javascript: URI (Req 8.2)', () => {
    renderBrandedHeader({ placeName: 'Mario\'s Pizza', logoURL: 'javascript:alert(1)' });
    const img = document.querySelector('#branded-header img');
    expect(img).toBeNull();
  });

  it('uses fallback name "Pizza Menu" when config is undefined (Req 8.4)', () => {
    renderBrandedHeader(undefined);
    const h1 = document.querySelector('#branded-header h1');
    expect(h1).not.toBeNull();
    expect(h1.textContent).toBe('Pizza Menu');
  });

  it('uses fallback name "Pizza Menu" when config is null (Req 8.4)', () => {
    renderBrandedHeader(null);
    const h1 = document.querySelector('#branded-header h1');
    expect(h1).not.toBeNull();
    expect(h1.textContent).toBe('Pizza Menu');
  });
});

// ── Property-Based Tests ───────────────────────────────────────────────────

import { describe as describeFC, it as itFC } from 'vitest';
import * as fc from 'fast-check';

// Feature: pizza-menu-qr, Property 7: Branded header place name
// Validates: Requirements 8.1
describeFC('renderBrandedHeader – property tests', () => {
  itFC('Property 7: <h1> always contains the configured place name', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (placeName) => {
        document.body.innerHTML = '<div id="branded-header"></div>';
        renderBrandedHeader({ placeName, logoURL: '' });
        const h1 = document.querySelector('#branded-header h1');
        return h1 !== null && h1.textContent === placeName;
      })
    );
  });
});
