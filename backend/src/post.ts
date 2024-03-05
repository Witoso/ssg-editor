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
        // yaml frontmatter can have unescaped chars like [, > or -.
        // Those escapes can appear in JSON.
        const cleanedFrontmatter = frontmatterContent.replace(
          /\\+([[\]\-_>"'])/g,
          "$1",
        );
        return `---\n${cleanedFrontmatter}\n---`;
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

interface Directory {
  name: string;
  files: Post[];
  children: Directory[];
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

export async function findPostsInDirectory(
  directory: string,
): Promise<Directory> {
  const directoryStructure: Directory = {
    name: basename(directory),
    files: [],
    children: [],
  };

  try {
    const items = await readdir(directory, { withFileTypes: true });

    for (const item of items) {
      const itemPath = join(directory, item.name);
      if (item.isDirectory()) {
        const childDirectory = await findPostsInDirectory(itemPath);
        directoryStructure.children.push(childDirectory);
      } else if (extname(item.name) === ".md") {
        const post = await parsePostFromFile(itemPath);
        directoryStructure.files.push(post);
      }
    }
  } catch (error) {
    console.error("Error reading directory:", error);
  }

  return directoryStructure;
}
