// Feature: pizza-menu-qr
// ImageSorter — sorts DriveFile[] by numeric filename prefix, then alphabetically.

function getSortKey(name) {
  const match = name.match(/^(\d+)/);
  return {
    hasPrefix: match !== null,
    numericValue: match ? parseInt(match[1], 10) : 0,
    fullName: name,
  };
}

export function sortMenuFiles(files) {
  return [...files].sort((a, b) => {
    const ka = getSortKey(a.name);
    const kb = getSortKey(b.name);

    if (ka.hasPrefix !== kb.hasPrefix) return ka.hasPrefix ? -1 : 1;

    if (ka.hasPrefix && kb.hasPrefix) {
      if (ka.numericValue !== kb.numericValue) return ka.numericValue - kb.numericValue;
      return ka.fullName.localeCompare(kb.fullName);
    }

    return ka.fullName.localeCompare(kb.fullName);
  });
}
