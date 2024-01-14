import { access, readdir, FileHandle, open, readFile } from "node:fs/promises";
import { basename, extname, join } from "path";
import { PostType } from "../../types/post";

export class Post {
  constructor(
    public content: string,
    public filePath: string,
  ) {
    const frontmatterRegex = /---\n([\s\S]*?)\n---/;
    this.content = content.replace(
      frontmatterRegex,
      (_match, frontmatterContent) => {
        const cleanedFrontmatter =  frontmatterContent.replace(/\\+([[\]\-_>"'])/g, "$1"); // yaml frontmatter can have unescaped chars like [, > or -. Those escapes can appear in JSON.
        return `---\n${cleanedFrontmatter}\n---`
      },
    );
  }

  public get fileName() {
    return basename(this.filePath);
  }

  public toString(): string {
    return this.content;
  }

  public toJSON(): PostType {
    return {
      content: this.content,
      filePath: this.filePath,
      filename: this.fileName,
    };
  }
}

export async function postExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
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

function parsePost(postFromFile: string, filePath: string): Post {
  return new Post(postFromFile, filePath);
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
