import path from "path";
import { describe, expect, test, vi } from "vitest";

import {
  getImageContentType,
  getPublicImageUrl,
  getSafeImageName,
  resolveImageUploadPath,
  resolvePublicImagePath,
} from "./images";

describe("images", () => {
  test("creates a safe image filename", () => {
    vi.spyOn(Date, "now").mockReturnValue(123);

    expect(
      getSafeImageName(new File(["x"], "My Image 01.PNG", { type: "image/png" })),
    ).toBe("123-my-image-01.png");
  });

  test("rejects non-image files", () => {
    expect(
      getSafeImageName(new File(["x"], "document.txt", { type: "text/plain" })),
    ).toBeNull();
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
    expect(getPublicImageUrl("/uploads/", "image.png")).toBe("/uploads/image.png");
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
