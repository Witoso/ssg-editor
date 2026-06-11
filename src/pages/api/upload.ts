import fs from "fs/promises";
import path from "path";
import type { APIRoute } from "astro";

import {
  getPublicImageUrl,
  getSafeImageName,
  resolveImageUploadPath,
  sniffImageContentType,
} from "@/lib/images";
import { jsonResponse } from "@/lib/responses";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.formData();
    const upload = data.get("upload");

    if (!(upload instanceof File)) {
      return uploadError("Image file is required.", 400);
    }

    const bytes = new Uint8Array(await upload.arrayBuffer());
    const contentType = sniffImageContentType(bytes);
    const filename = contentType
      ? getSafeImageName(upload.name, contentType)
      : null;

    if (!filename) {
      return uploadError("Unsupported image type.", 400);
    }

    const { targetPath, config } = locals;
    const uploadPath = resolveImageUploadPath({
      targetPath,
      uploadDir: config.images.uploadDir,
      filename,
    });

    if (!uploadPath) {
      return uploadError("Invalid image upload path.", 400);
    }

    await fs.mkdir(path.dirname(uploadPath), { recursive: true });
    await fs.writeFile(uploadPath, bytes);

    return jsonResponse(
      { url: getPublicImageUrl(config.images.publicPath, filename) },
      201,
    );
  } catch (error) {
    console.error("Error uploading image:", error);
    return uploadError("Failed to upload image.", 500);
  }
};

// CKEditor's SimpleUploadAdapter expects errors as { error: { message } }.
function uploadError(message: string, status: number): Response {
  return jsonResponse({ error: { message } }, status);
}
