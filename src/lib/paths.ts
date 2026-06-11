import path from "path";

export function getTargetPath(): string {
  return process.env.TARGET_PATH || path.join(process.cwd(), "demo");
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
