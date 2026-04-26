// Feature: pizza-menu-qr
// DriveClient — fetches the list of menu image files from a public Google Drive folder.

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export class DriveError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'DriveError';
    this.cause = cause;
  }
}

export async function fetchMenuFiles(folderID, apiKey) {
  const params = new URLSearchParams({
    q: `'${folderID}' in parents and trashed=false`,
    fields: 'files(id,name,mimeType)',
    key: apiKey,
  });

  const url = `https://www.googleapis.com/drive/v3/files?${params}`;

  let response;
  try {
    response = await fetch(url);
  } catch (networkError) {
    throw new DriveError('Failed to load menu: network error', networkError);
  }

  if (response.status >= 400) {
    throw new DriveError(`Failed to load menu: HTTP ${response.status}`);
  }

  const data = await response.json();
  const files = data.files ?? [];
  return files.filter((file) => ALLOWED_MIME_TYPES.has(file.mimeType));
}
