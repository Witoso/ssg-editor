import {
  ViewDocumentFragment,
  type DataProcessor,
  type MatcherPattern,
  type ViewElement,
  type ViewNode,
  type ViewText,
} from "ckeditor5";

type FrontmatterParts = {
  frontmatter: string | null;
  body: string;
};

type HtmlKeepingDataProcessor = DataProcessor & {
  keepHtml?: (element: keyof HTMLElementTagNameMap) => void;
};

export default class FrontmatterDataProcessor implements DataProcessor {
  private readonly _markdownProcessor: DataProcessor;

  public constructor(markdownProcessor: DataProcessor) {
    this._markdownProcessor = markdownProcessor;
  }

  public get innerProcessor(): DataProcessor {
    return this._markdownProcessor;
  }

  public get skipComments(): boolean | undefined {
    return this._markdownProcessor.skipComments;
  }

  public set skipComments(value: boolean | undefined) {
    this._markdownProcessor.skipComments = value;
  }

  public toView(data: string): ViewDocumentFragment {
    const { frontmatter, body } = parseFrontmatter(data);

    if (frontmatter === null) {
      return this._markdownProcessor.toView(data);
    }

    return this._markdownProcessor.toView(
      createFrontmatterHtml(frontmatter) + "\n\n" + body,
    );
  }

  public toData(viewFragment: ViewDocumentFragment): string {
    const { frontmatter, body } = extractFrontmatter(viewFragment);
    const markdown = this._markdownProcessor.toData(body);

    if (frontmatter === null) {
      return markdown;
    }

    return (
      `---\n${frontmatter.trim()}\n---` + (markdown ? `\n\n${markdown}` : "")
    );
  }

  public registerRawContentMatcher(pattern: MatcherPattern): void {
    this._markdownProcessor.registerRawContentMatcher(pattern);
  }

  public useFillerType(type: "default" | "marked"): void {
    this._markdownProcessor.useFillerType(type);
  }

  public keepHtml(element: keyof HTMLElementTagNameMap): void {
    const markdownProcessor = this
      ._markdownProcessor as HtmlKeepingDataProcessor;

    markdownProcessor.keepHtml?.(element);
  }
}

function parseFrontmatter(data: string): FrontmatterParts {
  const normalizedData = data.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const lines = normalizedData.split("\n");

  if (lines[0] !== "---") {
    return {
      frontmatter: null,
      body: data,
    };
  }

  const closingLineIndex = lines.findIndex(
    (line, index) => index > 0 && line === "---",
  );

  if (closingLineIndex === -1) {
    return {
      frontmatter: null,
      body: data,
    };
  }

  return {
    frontmatter: lines.slice(1, closingLineIndex).join("\n"),
    body: lines
      .slice(closingLineIndex + 1)
      .join("\n")
      .replace(/^\n/, ""),
  };
}

function createFrontmatterHtml(frontmatter: string): string {
  const content = frontmatter.split("\n").map(escapeHtml).join("<br>");

  return `<section class="frontmatter-container"><div class="frontmatter">${content}</div></section>`;
}

function extractFrontmatter(viewFragment: ViewDocumentFragment): {
  frontmatter: string | null;
  body: ViewDocumentFragment;
} {
  const firstChild = viewFragment.getChild(0);

  if (!isFrontmatterContainer(firstChild)) {
    return {
      frontmatter: null,
      body: viewFragment,
    };
  }

  const frontmatterElement = Array.from(firstChild.getChildren()).find(
    isFrontmatterElement,
  );

  if (!frontmatterElement) {
    return {
      frontmatter: null,
      body: viewFragment,
    };
  }

  return {
    frontmatter: stringifyFrontmatterView(frontmatterElement),
    body: new ViewDocumentFragment(
      viewFragment.document,
      Array.from(viewFragment.getChildren())
        .slice(1)
        .map((child) => child._clone(true)),
    ),
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function unescapeMarkdown(text: string): string {
  return text.replace(/\\([\\[\]\-_>"'`*{}()#+.!|<>])/g, "$1");
}

function stringifyFrontmatterView(element: ViewElement): string {
  return Array.from(element.getChildren())
    .map(stringifyFrontmatterNode)
    .join("");
}

function stringifyFrontmatterNode(node: ViewNode): string {
  if (node.is("$text")) {
    return unescapeMarkdown((node as ViewText).data);
  }

  if (node.is("element", "br")) {
    return "\n";
  }

  if (node.is("element")) {
    return stringifyFrontmatterView(node);
  }

  return "";
}

function isFrontmatterContainer(
  node: ViewNode | undefined,
): node is ViewElement {
  return (
    !!node &&
    node.is("element", "section") &&
    node.hasClass("frontmatter-container")
  );
}

function isFrontmatterElement(node: ViewNode): node is ViewElement {
  return (
    node.is("element", "frontmatter") ||
    (node.is("element", "div") && node.hasClass("frontmatter"))
  );
}
