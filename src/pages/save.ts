import fs from "fs/promises";
import path from "path";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const content = await request.json();
    const { filePath, fileContent } = content;

    if (!filePath || !fileContent) {
      return new Response(
        JSON.stringify({ error: "File path and content are required." }),
        { status: 400 },
      );
    }

    // Ensure the directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Write the content to the file
    // TODO running content through Markdown fixer. (or any CLI?)
    await fs.writeFile(filePath, fileContent, "utf-8");

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
