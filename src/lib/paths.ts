import path from "path";

export function getTargetPath(): string {
  const targetPath = process.env.TARGET_PATH;

  if (!targetPath) {
    throw new Error(
      "TARGET_PATH is not set. Start the editor with: ssge <path_to_folder>",
    );
  }

  return targetPath;
}

export function resolveTargetFilePath(
  targetPath: string,
  requestedPath: string,
): string | null {
  if (path.isAbsolute(requestedPath)) {
    return null;
  }

  const resolvedTargetPath = path.resolve(targetPath);
  const resolvedFilePath = path.resolve(resolvedTargetPath, requestedPath);
  const relativePath = path.relative(resolvedTargetPath, resolvedFilePath);

  if (relativePath === "") {
    return resolvedTargetPath;
  }

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return null;
  }

  return resolvedFilePath;
}

export function resolveMarkdownFilePath(
  targetPath: string,
  requestedPath: string,
): string | null {
  const resolvedFilePath = resolveTargetFilePath(targetPath, requestedPath);

  if (!resolvedFilePath?.endsWith(".md")) {
    return null;
  }

  return resolvedFilePath;
}
