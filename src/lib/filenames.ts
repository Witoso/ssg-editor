// Shared with the create-dialog input `pattern`, so it must stay a plain
// string of HTML pattern syntax.
export const FILENAME_PATTERN = "[a-zA-Z0-9_\\-]+";

const filenameRegExp = new RegExp(`^${FILENAME_PATTERN}$`);

export function isValidFilename(filename: string): boolean {
  return filenameRegExp.test(filename);
}

export function getFolderSegments(folderPath: string): string[] | null {
  const segments = folderPath.split(/[\\/]+/).filter(Boolean);

  if (segments.some((segment) => segment === "." || segment === "..")) {
    return null;
  }

  return segments;
}
