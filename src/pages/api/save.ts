import fs from "fs/promises";
import path from "path";
import type { APIRoute } from "astro";
import { resolveMarkdownFilePath } from "@/lib/paths";
import { errorResponse, jsonResponse } from "@/lib/responses";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const content = await request.json();
    const { filePath, fileContent } = content;
    const { targetPath } = locals;

    if (
      typeof filePath !== "string" ||
      filePath.length < 1 ||
      typeof fileContent !== "string"
    ) {
      return errorResponse("File path and content are required.", 400);
    }

    const resolvedFilePath = resolveMarkdownFilePath(targetPath, filePath);

    if (!resolvedFilePath) {
      return errorResponse("Invalid file path.", 400);
    }

    // Ensure the directory exists
    await fs.mkdir(path.dirname(resolvedFilePath), { recursive: true });

    // Write the content to the file
    // TODO running content through Markdown fixer. (or any CLI?)
    await fs.writeFile(resolvedFilePath, fileContent, "utf-8");

    return jsonResponse({ message: "File saved successfully." });
  } catch (error) {
    console.error("Error saving file:", error);
    return errorResponse("Failed to save file.", 500);
  }
};
