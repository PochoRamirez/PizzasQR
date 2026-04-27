/**
 * Tests for qr_generator2.html pure logic functions.
 * Functions are extracted here for testability.
 * Feature: qr-generator2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ─── Pure functions (extracted from qr_generator2.html) ──────────────────────

function validateUrl(url) {
  var trimmed = (url || '').trim();
  if (trimmed.length === 0) {
    return { ok: false, error: 'Please enter a URL.' };
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return { ok: false, error: 'URL must start with http:// or https://' };
  }
  return { ok: true, error: null };
}

function isCornerModule(row, col, size) {
  var inTopLeft    = row < 8 && col < 8;
  var inTopRight   = row < 8 && col >= size - 8;
  var inBottomLeft = row >= size - 8 && col < 8;
  return inTopLeft || inTopRight || inBottomLeft;
}

function computeClearZone(canvasSize, fraction) {
  var w = canvasSize * fraction;
  var h = canvasSize * fraction;
  var x = (canvasSize - w) / 2;
  var y = (canvasSize - h) / 2;
  return { x, y, w, h };
}

function computeLogoRect(logoW, logoH, canvasSize, maxFraction) {
  var maxPx = canvasSize * maxFraction;
  var scale = Math.min(maxPx / logoW, maxPx / logoH);
  var w = logoW * scale;
  var h = logoH * scale;
  var x = (canvasSize - w) / 2;
  var y = (canvasSize - h) / 2;
  return { x, y, w, h };
}

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe('validateUrl — unit tests', () => {
  it('rejects empty string', () => {
    const r = validateUrl('');
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it('rejects whitespace-only string', () => {
    const r = validateUrl('   ');
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it('rejects URL without http/https prefix', () => {
    const r = validateUrl('ftp://example.com');
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it('rejects plain domain without scheme', () => {
    const r = validateUrl('example.com');
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it('accepts valid http URL', () => {
    const r = validateUrl('http://example.com');
    expect(r.ok).toBe(true);
    expect(r.error).toBeNull();
  });

  it('accepts valid https URL', () => {
    const r = validateUrl('https://example.com/path?q=1');
    expect(r.ok).toBe(true);
    expect(r.error).toBeNull();
  });

  it('accepts https URL with trailing content', () => {
    const r = validateUrl('https://pizzas.example.com/menu');
    expect(r.ok).toBe(true);
    expect(r.error).toBeNull();
  });
});

describe('isCornerModule — unit tests', () => {
  const size21 = 21;
  const size29 = 29;

  it('top-left corner (0,0) is a corner module', () => {
    expect(isCornerModule(0, 0, size21)).toBe(true);
  });

  it('top-left corner (7,7) is a corner module', () => {
    expect(isCornerModule(7, 7, size21)).toBe(true);
  });

  it('top-right corner (0, size-1) is a corner module', () => {
    expect(isCornerModule(0, size21 - 1, size21)).toBe(true);
  });

  it('top-right corner (7, size-8) is a corner module', () => {
    expect(isCornerModule(7, size21 - 8, size21)).toBe(true);
  });

  it('bottom-left corner (size-1, 0) is a corner module', () => {
    expect(isCornerModule(size21 - 1, 0, size21)).toBe(true);
  });

  it('bottom-left corner (size-8, 7) is a corner module', () => {
    expect(isCornerModule(size21 - 8, 7, size21)).toBe(true);
  });

  it('center module (8,8) is NOT a corner module', () => {
    expect(isCornerModule(8, 8, size21)).toBe(false);
  });

  it('center module (10,10) is NOT a corner module', () => {
    expect(isCornerModule(10, 10, size21)).toBe(false);
  });

  it('works for size 29 top-right', () => {
    expect(isCornerModule(0, size29 - 1, size29)).toBe(true);
    expect(isCornerModule(7, size29 - 8, size29)).toBe(true);
  });

  it('works for size 29 bottom-left', () => {
    expect(isCornerModule(size29 - 1, 0, size29)).toBe(true);
    expect(isCornerModule(size29 - 8, 7, size29)).toBe(true);
  });
});

describe('computeClearZone — unit tests', () => {
  it('canvas 100, fraction 0.30', () => {
    const z = computeClearZone(100, 0.30);
    expect(z.w).toBeCloseTo(30);
    expect(z.h).toBeCloseTo(30);
    expect(z.x).toBeCloseTo(35);
    expect(z.y).toBeCloseTo(35);
  });

  it('canvas 500, fraction 0.30', () => {
    const z = computeClearZone(500, 0.30);
    expect(z.w).toBeCloseTo(150);
    expect(z.h).toBeCloseTo(150);
    expect(z.x).toBeCloseTo(175);
    expect(z.y).toBeCloseTo(175);
  });

  it('canvas 1000, fraction 0.30', () => {
    const z = computeClearZone(1000, 0.30);
    expect(z.w).toBeCloseTo(300);
    expect(z.h).toBeCloseTo(300);
    expect(z.x).toBeCloseTo(350);
    expect(z.y).toBeCloseTo(350);
  });
});

describe('computeLogoRect — unit tests', () => {
  const canvas = 1000;
  const frac = 0.25;

  it('square logo (100x100) fits within 250px and is centered', () => {
    const r = computeLogoRect(100, 100, canvas, frac);
    expect(r.w).toBeLessThanOrEqual(250);
    expect(r.h).toBeLessThanOrEqual(250);
    expect(r.x + r.w / 2).toBeCloseTo(500);
    expect(r.y + r.h / 2).toBeCloseTo(500);
  });

  it('landscape logo (200x100) preserves aspect ratio', () => {
    const r = computeLogoRect(200, 100, canvas, frac);
    expect(r.w / r.h).toBeCloseTo(2, 5);
    expect(r.w).toBeLessThanOrEqual(250);
    expect(r.h).toBeLessThanOrEqual(250);
  });

  it('portrait logo (100x200) preserves aspect ratio', () => {
    const r = computeLogoRect(100, 200, canvas, frac);
    expect(r.w / r.h).toBeCloseTo(0.5, 5);
    expect(r.w).toBeLessThanOrEqual(250);
    expect(r.h).toBeLessThanOrEqual(250);
  });

  it('large logo (2000x2000) is scaled down', () => {
    const r = computeLogoRect(2000, 2000, canvas, frac);
    expect(r.w).toBeCloseTo(250);
    expect(r.h).toBeCloseTo(250);
  });
});

// ─── Property-Based Tests ─────────────────────────────────────────────────────

describe('Property 1: Whitespace URLs rejected', () => {
  // Feature: qr-generator2, Property 1: Whitespace URLs rejected
  // Validates: Requirements 1.2
  it('any whitespace-only string returns ok: false', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r', '\f', '\v')),
        (ws) => {
          const r = validateUrl(ws);
          return r.ok === false && r.error !== null;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 2: Non-HTTP URLs rejected', () => {
  // Feature: qr-generator2, Property 2: Non-HTTP URLs rejected
  // Validates: Requirements 1.3
  it('strings without http:// or https:// prefix return ok: false', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(
          (s) => !/^https?:\/\//i.test(s.trim()) && s.trim().length > 0
        ),
        (s) => {
          const r = validateUrl(s);
          return r.ok === false && r.error !== null;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 3: Valid URLs pass validation', () => {
  // Feature: qr-generator2, Property 3: Valid URLs pass
  // Validates: Requirements 1.4
  it('http:// or https:// + non-empty suffix returns ok: true', () => {
    const scheme = fc.constantFrom('http://', 'https://');
    const suffix = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);
    fc.assert(
      fc.property(
        fc.tuple(scheme, suffix),
        ([prefix, rest]) => {
          const r = validateUrl(prefix + rest);
          return r.ok === true && r.error === null;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 6: Clear zone dimensions are exactly fraction of canvas, centered', () => {
  // Feature: qr-generator2, Property 6
  // Validates: Requirements 4.3
  it('computeClearZone returns w=h=S*f and x=y=(S-w)/2 for any canvas size', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 5000 }),
        (S) => {
          const f = 0.30;
          const z = computeClearZone(S, f);
          const expectedW = S * f;
          const expectedX = (S - expectedW) / 2;
          return (
            Math.abs(z.w - expectedW) < 1e-9 &&
            Math.abs(z.h - expectedW) < 1e-9 &&
            Math.abs(z.x - expectedX) < 1e-9 &&
            Math.abs(z.y - expectedX) < 1e-9
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 7: Logo rect fits within maxFraction of canvas and is centered', () => {
  // Feature: qr-generator2, Property 7
  // Validates: Requirements 4.8
  it('computeLogoRect satisfies size, aspect ratio, and centering constraints', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4000 }),
        fc.integer({ min: 1, max: 4000 }),
        fc.integer({ min: 200, max: 5000 }),
        (logoW, logoH, S) => {
          const f = 0.25;
          const r = computeLogoRect(logoW, logoH, S, f);
          const maxPx = S * f;
          const aspectOk = Math.abs(r.w / r.h - logoW / logoH) < 1e-6;
          const sizeOk = r.w <= maxPx + 1e-9 && r.h <= maxPx + 1e-9;
          const centerX = Math.abs((r.x + r.w / 2) - S / 2) < 1e-9;
          const centerY = Math.abs((r.y + r.h / 2) - S / 2) < 1e-9;
          return aspectOk && sizeOk && centerX && centerY;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 9: Corner detection covers exactly the three finder regions', () => {
  // Feature: qr-generator2, Property 9
  // Validates: Requirements 2.3, 3.3
  it('isCornerModule returns true iff in one of the three 8x8 finder regions', () => {
    // QR sizes: 21 + (version-1)*4, versions 1-40 → sizes 21,25,29,...,177
    const qrSizes = fc.integer({ min: 1, max: 40 }).map(v => 21 + (v - 1) * 4);

    fc.assert(
      fc.property(
        qrSizes,
        fc.integer({ min: 0, max: 176 }),
        fc.integer({ min: 0, max: 176 }),
        (size, row, col) => {
          // Clamp row/col to valid range for this size
          const r = row % size;
          const c = col % size;

          const expected =
            (r < 8 && c < 8) ||
            (r < 8 && c >= size - 8) ||
            (r >= size - 8 && c < 8);

          return isCornerModule(r, c, size) === expected;
        }
      ),
      { numRuns: 200 }
    );
  });
});
