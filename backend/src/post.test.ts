import * as fs from "node:fs";
import { afterAll, beforeAll, expect, test } from "vitest";
import {
  Post,
  findPostsInDirectory,
  parsePostFromFile,
  postExists,
  savePostToFile,
} from "./post.js";

const files = ["test.md", "test2.md", "file.txt"];
const dirs = ["dir1/"];
const dirPath = "/tmp/static-wyswig-test/";
const postInFile = "---\ntitle: Title\n---\n\n# Heading 1";

beforeAll(() => {
  fs.mkdirSync(dirPath);

  files.forEach((filename) => {
    const filehandle = fs.openSync(dirPath + filename, "w");
    fs.writeSync(filehandle, postInFile);
    fs.closeSync(filehandle);
  });

  dirs.forEach((dir) => {
    fs.mkdirSync(dirPath + dir);
    files.forEach((filename) => {
      const filehandle = fs.openSync(dirPath + dir + filename, "w");
      fs.writeSync(filehandle, postInFile);
      fs.closeSync(filehandle);
    });
  });
});

afterAll(() => {
  fs.rmSync(dirPath, { recursive: true });
});

test("a post has proper string representation", () => {
  const post = new Post(
    "---\ntitle: Title\n---\n\n# Heading 1",
    "/tmp/post.md",
  );
  expect(post.toString()).toBe("---\ntitle: Title\n---\n\n# Heading 1");
});

test("a post has proper escaping of frontmatter", () => {
  const post = new Post(
    '---\ntitle: Title\narray: \\["one"\\]\n---\n\n# Heading 1',
    "/tmp/post.md",
  );
  expect(post.toString()).toBe(
    '---\ntitle: Title\narray: ["one"]\n---\n\n# Heading 1',
  );
});

test("it writes post to a file", async () => {
  const filePath = dirPath + "test-post-write.md";

  const post = new Post("---\ntitle: Title\n---\n\n# Heading 1", filePath);
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
  expect(parsedPost.content).toBe(postInFile);
});

test("it lists all markdown posts in a directory", async () => {
  const root = await findPostsInDirectory(dirPath);

  expect(root.name).toEqual("static-wyswig-test");

  const rootMarkdownFilePaths = root.files.map((post) => {
    return post.filePath;
  });

  const rootMarkdownFilenames = root.files.map((post) => {
    return post.fileName;
  });

  expect(rootMarkdownFilePaths).toEqual([
    `${dirPath}test.md`,
    `${dirPath}test2.md`,
  ]);
  expect(rootMarkdownFilenames).toEqual([`test.md`, `test2.md`]);

  expect(root.children[0].name).toBe("dir1");

  expect(root.children[0].files).not.toHaveLength(0);
});

test("a post has JSON representation", () => {
  const post = new Post(
    "---\ntitle: Title\n---\n\n# Heading 1",
    "/tmp/post.md",
  );
  const expectedJson = {
    content: "---\ntitle: Title\n---\n\n# Heading 1",
    filePath: "/tmp/post.md", // Adjust based on your class implementation
    filename: "post.md",
  };
  expect(JSON.stringify(post)).toBe(JSON.stringify(expectedJson));
});

test("check if the post exists", async () => {
  const exists = await postExists(`${dirPath}/test.md`);
  expect(exists).toBe(true);

  const doesntExists = await postExists(`${dirPath}/123lalala.md`);
  expect(doesntExists).toBe(false);
});
