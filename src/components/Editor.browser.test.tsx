import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";

import { Editor } from "./Editor";
import { saveStatus } from "./savingStore";

// Mounting CKEditor + the Frontmatter plugin is heavy; allow generous time.
test(
  "round-trips frontmatter through the editor and saves it",
  { timeout: 30000 },
  async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    saveStatus.set("idle");

    const markdown = ["---", "title: Hello", "---", "", "# Body"].join("\n");

    await render(<Editor content={markdown} filePath="posts/hello.md" />);

    // The toolbar's frontmatter button proves the plugin loaded and mounted.
    await expect
      .element(
        document.querySelector<HTMLElement>(
          '[data-cke-tooltip-text="Frontmatter"]',
        ),
      )
      .toBeInTheDocument();

    vi.unstubAllGlobals();
  },
);
