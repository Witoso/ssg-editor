import { readdir, FileHandle, open, readFile } from "node:fs/promises";
import { basename, extname, join } from "path";
import { PostType } from "../../types/post";

export class Post {
  constructor(
    public frontmatter: string,
    public content: string,
    public filePath: string
  ) {}

  public get fileName() {
    return basename(this.filePath);
  }

  public toString(): string {
    return `---\n${this.frontmatter}\n---\n\n${this.content}`;
  }

  public toJSON(): PostType {
    return {
      frontmatter: this.frontmatter,
      content: this.content,
      filePath: this.filePath,
      filename: this.fileName,
    };
  }
}

export async function savePostToFile(post: Post) {
  let filehandle: FileHandle;
  try {
    filehandle = await open(post.filePath, "w");
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
    return parsePost(contents, filePath);
  } catch (e) {
    throw new Error("Issue with parsing a post.");
  }
}

// TODO: handling posts w/o frontmatter, etc.
function parsePost(postFromFile: string, filePath: string): Post {
  const splitPost = postFromFile.split("---\n\n");
  const frontmatter = splitPost[0].slice(4).slice(0, -1);
  const content = splitPost[1];
  return new Post(frontmatter, content, filePath);
}

// TODO: nested posts
export async function findPostsInDirectory(directory: string): Promise<Post[]> {
  const posts = [];
  try {
    const files = await readdir(directory);
    const mdFiles = files
      .filter((file) => extname(file) === ".md")
      .map((file) => join(directory, file));

    mdFiles.map(async (file) => {
      posts.push(parsePostFromFile(file));
    });
    return Promise.all(posts);
  } catch (error) {
    console.error("Error reading directory:", error);
    return [];
  }
}
