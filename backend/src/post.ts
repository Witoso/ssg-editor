import { open, readFile } from "node:fs/promises";

export class Post {
  frontmatter: string;
  content: string;

  constructor(frontmatter: string, content: string) {
    this.frontmatter = frontmatter;
    this.content = content;
  }

  public toString = () => {
    return `---\n${this.frontmatter}\n---\n\n${this.content}`;
  };
}

export async function savePostToFile(post: Post, filePath: string) {
  let filehandle;
  try {
    filehandle = await open(filePath, "w");
    filehandle.writeFile(post.toString());
  } catch (e) {
    throw new Error("Issue with creating a post.");
  } finally {
    await filehandle?.close();
  }
}

export async function parsePostFromFile(filePath: string): Promise<Post> {
  try {
    const contents = await readFile(filePath, { encoding: "utf-8" });
    return parsePost(contents);
  } catch (e) {
    throw new Error("Issue with parsing a post.");
  }
}

// TODO: handling posts w/o frontmatter, etc.
function parsePost(postFromFile: string): Post {
  const splitPost = postFromFile.split("---\n\n");
  const frontmatter = splitPost[0].slice(4).slice(0, -1);
  const content = splitPost[1];
  return new Post(frontmatter, content);
}
