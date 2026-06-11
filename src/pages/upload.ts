import fs from "fs/promises";
import path from "path";
import type { APIRoute } from "astro";

import { loadConfig } from "@/lib/config";
import {
  getPublicImageUrl,
  getSafeImageName,
  resolveImageUploadPath,
} from "@/lib/images";
import { getTargetPath } from "@/lib/paths";

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.formData();
    const upload = data.get("upload");

    if (!(upload instanceof File)) {
      return uploadError("Image file is required.", 400);
    }

    const filename = getSafeImageName(upload);

    if (!filename) {
      return uploadError("Unsupported image type.", 400);
    }

    const targetPath = getTargetPath();
    const config = await loadConfig();
    const uploadPath = resolveImageUploadPath({
      targetPath,
      uploadDir: config.images.uploadDir,
      filename,
    });

    if (!uploadPath) {
      return uploadError("Invalid image upload path.", 400);
    }

    await fs.mkdir(path.dirname(uploadPath), { recursive: true });
    await fs.writeFile(uploadPath, Buffer.from(await upload.arrayBuffer()));

    return new Response(
      JSON.stringify({
        url: getPublicImageUrl(config.images.publicPath, filename),
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error uploading image:", error);
    return uploadError("Failed to upload image.", 500);
  }
};

function uploadError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({
      error: {
        message,
      },
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}
