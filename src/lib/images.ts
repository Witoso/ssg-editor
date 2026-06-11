import path from "path";

import { normalizePublicPath } from "./config";
import { resolveTargetFilePath } from "./paths";

export const allowedImageTypes = new Map([
  ["image/gif", ".gif"],
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

const imageContentTypes = new Map(
  [...allowedImageTypes.entries()].map(([type, extension]) => [
    extension,
    type,
  ]),
);

export function getImageExtension(file: File): string | null {
  if (allowedImageTypes.has(file.type)) {
    return allowedImageTypes.get(file.type)!;
  }

  const extension = path.extname(file.name).toLowerCase();
  return [...allowedImageTypes.values()].includes(extension) ? extension : null;
}

export function getSafeImageName(file: File): string | null {
  const extension = getImageExtension(file);

  if (!extension) {
    return null;
  }

  const basename = path
    .basename(file.name, path.extname(file.name))
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const safeBasename = basename || "image";

  return `${Date.now()}-${safeBasename}${extension}`;
}

export function resolveImageUploadPath({
  targetPath,
  uploadDir,
  filename,
}: {
  targetPath: string;
  uploadDir: string;
  filename: string;
}): string | null {
  const uploadPath = path.join(uploadDir, filename);
  return resolveTargetFilePath(targetPath, uploadPath);
}

export function resolvePublicImagePath({
  targetPath,
  uploadDir,
  publicPath,
  requestPath,
}: {
  targetPath: string;
  uploadDir: string;
  publicPath: string;
  requestPath: string;
}): string | null {
  const normalizedPublicPath = normalizePublicPath(publicPath);
  const normalizedRequestPath = `/${requestPath.replace(/^\/+/g, "")}`;

  if (!normalizedRequestPath.startsWith(`${normalizedPublicPath}/`)) {
    return null;
  }

  const relativeImagePath = normalizedRequestPath.slice(
    normalizedPublicPath.length + 1,
  );

  if (!getImageContentType(relativeImagePath)) {
    return null;
  }

  const resolvedUploadDir = resolveTargetFilePath(targetPath, uploadDir);
  const resolvedImagePath = resolveTargetFilePath(
    targetPath,
    path.join(uploadDir, relativeImagePath),
  );

  if (!resolvedUploadDir || !resolvedImagePath) {
    return null;
  }

  const relativeToUploadDir = path.relative(
    resolvedUploadDir,
    resolvedImagePath,
  );

  if (
    relativeToUploadDir === "" ||
    relativeToUploadDir.startsWith("..") ||
    path.isAbsolute(relativeToUploadDir)
  ) {
    return null;
  }

  return resolvedImagePath;
}

export function getPublicImageUrl(
  publicPath: string,
  filename: string,
): string {
  return `${publicPath.replace(/\/+$/g, "")}/${filename}`;
}

export function getImageContentType(filePath: string): string | null {
  return imageContentTypes.get(path.extname(filePath).toLowerCase()) ?? null;
}
