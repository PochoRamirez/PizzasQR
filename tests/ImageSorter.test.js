// ImageSorter.test.js
// Unit tests for sortMenuFiles — Requirements 7.1, 7.2, 7.3

import { describe, it, expect } from 'vitest';
import { sortMenuFiles } from '../modules/ImageSorter.js';

const f = (name) => ({ name });

describe('sortMenuFiles', () => {
  it('returns empty array for empty input', () => {
    expect(sortMenuFiles([])).toEqual([]);
  });

  it('returns same single element for single-element input', () => {
    const input = [f('pizza.jpg')];
    expect(sortMenuFiles(input)).toEqual([f('pizza.jpg')]);
  });

  it('all prefixed files appear before unprefixed files', () => {
    const input = [f('burger.jpg'), f('01_pizza.jpg'), f('appetizer.jpg'), f('02_pasta.jpg')];
    const result = sortMenuFiles(input);
    const prefixedEnd = result.findLastIndex((x) => /^\d+/.test(x.name));
    const unprefixedStart = result.findIndex((x) => !/^\d+/.test(x.name));
    expect(prefixedEnd).toBeLessThan(unprefixedStart);
  });

  it('numeric order is correct (02_ before 10_)', () => {
    const input = [f('10_dessert.jpg'), f('02_pasta.jpg'), f('1_pizza.jpg')];
    const result = sortMenuFiles(input);
    expect(result.map((x) => x.name)).toEqual(['1_pizza.jpg', '02_pasta.jpg', '10_dessert.jpg']);
  });

  it('tie on prefix resolved alphabetically by full filename', () => {
    const input = [f('02_zebra.jpg'), f('02_apple.jpg'), f('02_mango.jpg')];
    const result = sortMenuFiles(input);
    expect(result.map((x) => x.name)).toEqual(['02_apple.jpg', '02_mango.jpg', '02_zebra.jpg']);
  });

  it('does not mutate the input array', () => {
    const input = [f('10_b.jpg'), f('01_a.jpg'), f('unprefixed.jpg')];
    const original = input.map((x) => x.name);
    sortMenuFiles(input);
    expect(input.map((x) => x.name)).toEqual(original);
  });
});

// Feature: pizza-menu-qr, Property 5: Sort ordering
// Validates: Requirements 7.1, 7.2, 7.3

import fc from 'fast-check';

// Arbitrary that generates a DriveFile with either a numeric-prefixed or unprefixed name
const driveFileArb = fc.oneof(
  // Numeric-prefixed: e.g. "01_foo.jpg", "3_bar.png"
  fc.record({
    prefix: fc.integer({ min: 0, max: 99 }),
    rest: fc.stringMatching(/^[a-z]{1,8}\.(jpg|png)$/),
  }).map(({ prefix, rest }) => ({ name: `${prefix}_${rest}` })),
  // Unprefixed: e.g. "burger.jpg", "appetizer.png"
  fc.stringMatching(/^[a-z]{1,8}\.(jpg|png)$/).map((name) => ({ name }))
);

describe('sortMenuFiles — Property 5: Sort ordering (all invariants simultaneously)', () => {
  it('satisfies all four ordering invariants for arbitrary DriveFile[]', () => {
    fc.assert(
      fc.property(fc.array(driveFileArb, { minLength: 0, maxLength: 20 }), (files) => {
        const result = sortMenuFiles(files);

        const hasNumericPrefix = (name) => /^\d+/.test(name);
        const getPrefix = (name) => parseInt(name.match(/^(\d+)/)[1], 10);

        const prefixed = result.filter((f) => hasNumericPrefix(f.name));
        const unprefixed = result.filter((f) => !hasNumericPrefix(f.name));

        // Invariant 1: all prefixed files appear before all unprefixed files
        if (prefixed.length > 0 && unprefixed.length > 0) {
          const lastPrefixedIdx = result.findLastIndex((f) => hasNumericPrefix(f.name));
          const firstUnprefixedIdx = result.findIndex((f) => !hasNumericPrefix(f.name));
          if (lastPrefixedIdx >= firstUnprefixedIdx) return false;
        }

        // Invariant 2: prefixed files are ordered by ascending numeric prefix value
        for (let i = 1; i < prefixed.length; i++) {
          if (getPrefix(prefixed[i - 1].name) > getPrefix(prefixed[i].name)) return false;
        }

        // Invariant 3: among files sharing the same numeric prefix, order is alphabetical by full filename
        for (let i = 1; i < prefixed.length; i++) {
          const pa = getPrefix(prefixed[i - 1].name);
          const pb = getPrefix(prefixed[i].name);
          if (pa === pb && prefixed[i - 1].name.localeCompare(prefixed[i].name) > 0) return false;
        }

        // Invariant 4: unprefixed files are ordered alphabetically by full filename
        for (let i = 1; i < unprefixed.length; i++) {
          if (unprefixed[i - 1].name.localeCompare(unprefixed[i].name) > 0) return false;
        }

        return true;
      })
    );
  });
});

// Feature: pizza-menu-qr, Property 6: Sort determinism
// Validates: Requirements 7.4

describe('sortMenuFiles — Property 6: Sort determinism', () => {
  it('produces identical ordering when called twice on the same input', () => {
    fc.assert(
      fc.property(fc.array(driveFileArb, { minLength: 0, maxLength: 20 }), (files) => {
        const result1 = sortMenuFiles(files);
        const result2 = sortMenuFiles(files);
        return JSON.stringify(result1) === JSON.stringify(result2);
      })
    );
  });
});
