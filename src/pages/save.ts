import fs from "fs/promises";
import path from "path";
import type { APIRoute } from "astro";
import { resolveMarkdownFilePath } from "@/lib/paths";

export const POST: APIRoute = async ({ request }) => {
  try {
    const content = await request.json();
    const { filePath, fileContent } = content;
    const rootPath = process.cwd();
    const targetPath = process.env.TARGET_PATH || path.join(rootPath, "demo");

    if (
      typeof filePath !== "string" ||
      filePath.length < 1 ||
      typeof fileContent !== "string"
    ) {
      return new Response(
        JSON.stringify({ error: "File path and content are required." }),
        { status: 400 },
      );
    }

    const resolvedFilePath = resolveMarkdownFilePath(targetPath, filePath);

    if (!resolvedFilePath) {
      return new Response(JSON.stringify({ error: "Invalid file path." }), {
        status: 400,
      });
    }

    // Ensure the directory exists
    await fs.mkdir(path.dirname(resolvedFilePath), { recursive: true });

    // Write the content to the file
    // TODO running content through Markdown fixer. (or any CLI?)
    await fs.writeFile(resolvedFilePath, fileContent, "utf-8");

    return new Response(
      JSON.stringify({ message: "File saved successfully." }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error saving file:", error);
    return new Response(JSON.stringify({ error: "Failed to save file." }), {
      status: 500,
    });
  }
};
