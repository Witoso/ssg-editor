import { expect, test } from "vitest";
import { Post, parsePost } from "./content";

test("post has proper string representation", () => {
  const post = new Post("title: Title", "# Heading 1");
  expect(post.toString()).toBe("---\ntitle: Title\n---\n\n# Heading 1");
});

test("it parses a post", () => {
  const postFromFile = "---\ntitle: Title\n---\n\n# Heading 1";
  const parsedPost = parsePost(postFromFile);
  const post = new Post("title: Title", "# Heading 1");
  expect(parsedPost.frontmatter).toEqual(post.frontmatter);
  expect(parsedPost.content).toEqual(post.content);
});
