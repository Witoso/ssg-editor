import * as fs from "node:fs";
import { open } from "node:fs/promises";
import { expect, test } from "vitest";
import { Post, parsePost, parsePostFromFile, savePostToFile } from "./post";

test("post has proper string representation", () => {
  const post = new Post("title: Title", "# Heading 1");
  expect(post.toString()).toBe("---\ntitle: Title\n---\n\n# Heading 1");
});

test("it writes post to a file", async () => {
  const filePath = "/tmp/test-post-read.md";

  const post = new Post("title: Title", "# Heading 1");
  await savePostToFile(post, filePath);

  const exists = fs.existsSync(filePath);
  expect(exists).toBe(true);

  const postInFile = "---\ntitle: Title\n---\n\n# Heading 1";
  const content = fs.readFileSync(filePath, "utf-8");
  expect(content).toBe(postInFile);

  // Clean up
  fs.unlinkSync(filePath);
});

test("it parses a post from a file", async () => {
  const filePath = "/tmp/test-post-write.md";
  const postInFile = "---\ntitle: Title\n---\n\n# Heading 1";

  const filehandle = await open(filePath, "w");
  filehandle.writeFile(postInFile);
  filehandle.close();

  const parsedPost = await parsePostFromFile(filePath);

  expect(parsedPost.frontmatter).toEqual("title: Title");
  expect(parsedPost.content).toEqual("# Heading 1");
});
