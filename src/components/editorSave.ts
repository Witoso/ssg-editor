import { saveStatus } from "./savingStore.js";

export async function saveFile(
  filePath: string,
  fileContent: string,
): Promise<void> {
  let response: Response;

  try {
    response = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath, fileContent }),
    });
  } catch (error) {
    saveStatus.set("error");
    throw error;
  }

  if (!response.ok) {
    saveStatus.set("error");
    throw new Error(`Save failed with status ${response.status}`);
  }

  saveStatus.set("idle");
}
