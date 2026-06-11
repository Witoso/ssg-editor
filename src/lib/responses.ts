import fs from "fs";

import { getImageContentType } from "./images";

export function imageResponse(imagePath: string): Response | null {
  let image: Uint8Array<ArrayBuffer>;

  try {
    image = new Uint8Array(fs.readFileSync(imagePath));
  } catch {
    return null;
  }

  return new Response(image, {
    headers: {
      "Content-Type":
        getImageContentType(imagePath) ?? "application/octet-stream",
    },
  });
}
