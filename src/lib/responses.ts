import fs from "fs/promises";

import { getImageContentType } from "./images";

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}

export async function imageResponse(
  imagePath: string,
): Promise<Response | null> {
  let image: Uint8Array<ArrayBuffer>;

  try {
    image = new Uint8Array(await fs.readFile(imagePath));
  } catch {
    return null;
  }

  return new Response(image, {
    headers: {
      "Content-Type":
        getImageContentType(imagePath) ?? "application/octet-stream",
      "Content-Length": String(image.byteLength),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
