import path from "path";
import { describe, expect, test, vi } from "vitest";

import {
  getImageContentType,
  getPublicImageUrl,
  getSafeImageName,
  resolveImageUploadPath,
  resolvePublicImagePath,
  sniffImageContentType,
} from "./images";

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

describe("sniffImageContentType", () => {
  test("detects the allowed image formats from magic bytes", () => {
    expect(sniffImageContentType(new Uint8Array(PNG_MAGIC))).toBe("image/png");
    expect(
      sniffImageContentType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])),
    ).toBe("image/jpeg");
    expect(
      sniffImageContentType(
        new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]),
      ),
    ).toBe("image/gif");
    expect(
      sniffImageContentType(
        new Uint8Array([
          0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42,
          0x50,
        ]),
      ),
    ).toBe("image/webp");
  });

  test("rejects bytes that are not an allowed image format", () => {
    expect(
      sniffImageContentType(new TextEncoder().encode("not an image")),
    ).toBeNull();
    expect(sniffImageContentType(new Uint8Array([]))).toBeNull();
  });
});

describe("images", () => {
  test("creates a safe image filename from the detected content type", () => {
    vi.spyOn(Date, "now").mockReturnValue(123);

    expect(getSafeImageName("My Image 01.PNG", "image/png")).toBe(
      "123-my-image-01.png",
    );
  });

  test("derives the extension from the content type, not the filename", () => {
    vi.spyOn(Date, "now").mockReturnValue(123);

    expect(getSafeImageName("photo.gif", "image/jpeg")).toBe("123-photo.jpg");
  });

  test("rejects unsupported content types", () => {
    expect(getSafeImageName("document.txt", "text/plain")).toBeNull();
  });

  test("resolves upload path inside the target path", () => {
    const targetPath = path.join(path.sep, "tmp", "site");

    expect(
      resolveImageUploadPath({
        targetPath,
        uploadDir: "public/uploads",
        filename: "image.png",
      }),
    ).toBe(path.join(targetPath, "public", "uploads", "image.png"));
  });

  test("rejects upload directories outside the target path", () => {
    const targetPath = path.join(path.sep, "tmp", "site");

    expect(
      resolveImageUploadPath({
        targetPath,
        uploadDir: "../uploads",
        filename: "image.png",
      }),
    ).toBeNull();
  });

  test("builds public image URLs", () => {
    expect(getPublicImageUrl("/uploads/", "image.png")).toBe(
      "/uploads/image.png",
    );
  });

  test("resolves public image URLs to upload files", () => {
    const targetPath = path.join(path.sep, "tmp", "site");

    expect(
      resolvePublicImagePath({
        targetPath,
        uploadDir: "public/uploads",
        publicPath: "/uploads",
        requestPath: "uploads/image.png",
      }),
    ).toBe(path.join(targetPath, "public", "uploads", "image.png"));
  });

  test("rejects public image URLs outside the configured public path", () => {
    const targetPath = path.join(path.sep, "tmp", "site");

    expect(
      resolvePublicImagePath({
        targetPath,
        uploadDir: "public/uploads",
        publicPath: "/uploads",
        requestPath: "assets/image.png",
      }),
    ).toBeNull();
  });

  test("rejects traversal in public image URLs", () => {
    const targetPath = path.join(path.sep, "tmp", "site");

    expect(
      resolvePublicImagePath({
        targetPath,
        uploadDir: "public/uploads",
        publicPath: "/uploads",
        requestPath: "uploads/../secret.png",
      }),
    ).toBeNull();
  });

  test("returns image content types", () => {
    expect(getImageContentType("image.png")).toBe("image/png");
    expect(getImageContentType("document.md")).toBeNull();
  });
});
