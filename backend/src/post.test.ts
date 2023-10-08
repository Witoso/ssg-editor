import * as fs from "node:fs";
import { afterAll, beforeAll, expect, test } from "vitest";
import {
  Post,
  findPostsInDirectory,
  parsePostFromFile,
  savePostToFile,
} from "./post";

const files = ["test.md", "test2.md", "file.txt"];
const dirPath = "/tmp/static-wyswig-test/";
const postInFile = "---\ntitle: Title\n---\n\n# Heading 1";

beforeAll(() => {
  fs.mkdirSync(dirPath);

  files.map((filename) => {
    const filehandle = fs.openSync(dirPath + filename, "w");
    fs.writeSync(filehandle, postInFile);
    fs.closeSync(filehandle);
  });
});

afterAll(() => {
  fs.rmSync(dirPath, { recursive: true });
});

test("a post has proper string representation", () => {
  const post = new Post("title: Title", "# Heading 1", "/tmp/post.md");
  expect(post.toString()).toBe("---\ntitle: Title\n---\n\n# Heading 1");
});

test("it writes post to a file", async () => {
  const filePath = dirPath + "test-post-write.md";

  const post = new Post("title: Title", "# Heading 1", filePath);
  await savePostToFile(post);

  const exists = fs.existsSync(filePath);
  expect(exists).toBe(true);

  const postInFile = "---\ntitle: Title\n---\n\n# Heading 1";
  const content = fs.readFileSync(filePath, "utf-8");
  expect(content).toBe(postInFile);

  // Clean up
  fs.unlinkSync(filePath);
});

test("it parses a post from a file", async () => {
  const filePath = dirPath + "test.md";

  const parsedPost = await parsePostFromFile(filePath);

  expect(parsedPost.frontmatter).toEqual("title: Title");
  expect(parsedPost.content).toEqual("# Heading 1");
});

test("it lists all posts in a directory", async () => {
  const posts = await findPostsInDirectory(dirPath);

  const markdownFilePaths = posts.map((post) => {
    return post.filePath;
  });

  const markdownFilenames = posts.map((post) => {
    return post.filename;
  });

  expect(markdownFilePaths).toEqual([
    `${dirPath}test.md`,
    `${dirPath}test2.md`,
  ]);

  expect(markdownFilenames).toEqual([`test.md`, `test2.md`]);
});
