import { describe, it, expect, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { fetchMenuFiles, DriveError } from '../modules/DriveClient.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchMenuFiles', () => {
  it('returns only image/* files when response contains mixed MIME types', async () => {
    const files = [
      { id: '1', name: 'pizza.jpg', mimeType: 'image/jpeg' },
      { id: '2', name: 'menu.pdf', mimeType: 'application/pdf' },
      { id: '3', name: 'logo.png', mimeType: 'image/png' },
      { id: '4', name: 'notes.txt', mimeType: 'text/plain' },
      { id: '5', name: 'hero.webp', mimeType: 'image/webp' },
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ files }),
    }));

    const result = await fetchMenuFiles('folder123', 'key456');

    expect(result).toHaveLength(3);
    expect(result.map((f) => f.mimeType)).toEqual(['image/jpeg', 'image/png', 'image/webp']);
  });

  it('throws DriveError on HTTP 403', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 403,
      json: async () => ({}),
    }));

    await expect(fetchMenuFiles('folder123', 'key456')).rejects.toMatchObject({
      name: 'DriveError',
      message: 'Failed to load menu: HTTP 403',
    });
  });

  it('throws DriveError on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network error')));

    await expect(fetchMenuFiles('folder123', 'key456')).rejects.toMatchObject({
      name: 'DriveError',
      message: 'Failed to load menu: network error',
    });
  });

  it('constructs URL with correct folderID, apiKey, and fields parameters', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ files: [] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await fetchMenuFiles('myFolder', 'myKey');

    const calledUrl = mockFetch.mock.calls[0][0];
    const url = new URL(calledUrl);
    expect(url.searchParams.get('key')).toBe('myKey');
    expect(url.searchParams.get('fields')).toBe('files(id,name,mimeType)');
    expect(url.searchParams.get('q')).toContain('myFolder');
  });
});

// Feature: pizza-menu-qr, Property 2: MIME type filter
describe('Property 2: MIME type filter passes exactly the supported image formats', () => {
  // Validates: Requirements 2.3
  it('filtered result contains only image/jpeg, image/png, or image/webp entries', async () => {
    const supportedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.string(),
            name: fc.string(),
            mimeType: fc.oneof(
              fc.constant('image/jpeg'),
              fc.constant('image/png'),
              fc.constant('image/webp'),
              fc.constant('application/pdf'),
              fc.constant('video/mp4'),
              fc.string(),
            ),
          }),
        ),
        async (files) => {
          vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            status: 200,
            json: async () => ({ files }),
          }));

          const result = await fetchMenuFiles('folder123', 'key456');

          return result.every((file) => supportedMimeTypes.includes(file.mimeType));
        },
      ),
    );
  });
});
