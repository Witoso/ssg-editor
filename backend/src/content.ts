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

// TODO: handling posts w/o frontmatter, etc.
export function parsePost(postFromFile: string): Post {
  const splitPost = postFromFile.split("---\n\n");
  const frontmatter = splitPost[0].slice(4).slice(0, -1);
  const content = splitPost[1];
  return new Post(frontmatter, content);
}
