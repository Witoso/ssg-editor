import { defineMiddleware } from "astro:middleware";

import { loadConfig } from "@/lib/config";
import { resolvePublicImagePath } from "@/lib/images";
import { getTargetPath } from "@/lib/paths";
import { imageResponse } from "@/lib/responses";

// Fail fast at boot instead of erroring on every request.
getTargetPath();

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.targetPath = getTargetPath();
  context.locals.config = await loadConfig();

  // Uploaded images live under the configured public path; serve them here
  // so the page routes only deal with markdown.
  const imagePath = resolvePublicImagePath({
    targetPath: context.locals.targetPath,
    uploadDir: context.locals.config.images.uploadDir,
    publicPath: context.locals.config.images.publicPath,
    requestPath: decodeURIComponent(context.url.pathname),
  });

  if (imagePath) {
    return (
      (await imageResponse(imagePath)) ?? new Response(null, { status: 404 })
    );
  }

  return next();
});
