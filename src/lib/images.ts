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

const imageMagicBytes = new Map<string, number[]>([
  ["image/gif", [0x47, 0x49, 0x46, 0x38]],
  ["image/jpeg", [0xff, 0xd8, 0xff]],
  ["image/png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  ["image/webp", [0x52, 0x49, 0x46, 0x46]],
]);

export function sniffImageContentType(bytes: Uint8Array): string | null {
  for (const [contentType, magic] of imageMagicBytes) {
    if (!magic.every((byte, index) => bytes[index] === byte)) {
      continue;
    }

    // WebP is a RIFF container; the format tag sits after the chunk size.
    if (contentType === "image/webp") {
      const tag = String.fromCharCode(...bytes.slice(8, 12));
      if (tag !== "WEBP") {
        continue;
      }
    }

    return contentType;
  }

  return null;
}

export function getSafeImageName(
  filename: string,
  contentType: string,
): string | null {
  const extension = allowedImageTypes.get(contentType);

  if (!extension) {
    return null;
  }

  const basename = path
    .basename(filename, path.extname(filename))
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
