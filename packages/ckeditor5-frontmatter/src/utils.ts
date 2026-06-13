import type {
  Model,
  ModelDocumentSelection,
  ModelElement,
  ViewDocumentFragment,
  ViewElement,
  ViewUpcastWriter,
} from "ckeditor5";

export function isFrontmatterEnd(selection: ModelDocumentSelection): boolean {
  const range = selection.getFirstRange();
  const positionBefore = selection.getFirstPosition();

  if (!positionBefore || !range) {
    return false;
  }

  const nodeBefore = positionBefore.nodeBefore;

  if (
    selection.isCollapsed &&
    range.start.isAtEnd &&
    range.end.isAtEnd &&
    nodeBefore?.is("element", "softBreak")
  ) {
    return true;
  } else {
    return false;
  }
}

export function removeSoftBreakBeforeSelection(
  selection: ModelDocumentSelection,
  model: Model,
): void {
  const position = selection.getFirstPosition();
  const nodeBefore = position?.nodeBefore;

  if (nodeBefore?.is("element", "softBreak")) {
    model.change((writer) => {
      writer.remove(nodeBefore);
    });
  }
}

export function inFrontmatter(selection: ModelDocumentSelection): boolean {
  const firstPosition = selection.getFirstPosition();
  if (firstPosition?.findAncestor("frontmatter")) {
    return true;
  } else {
    return false;
  }
}

export function rawTextToViewDocumentFragment(
  writer: ViewUpcastWriter,
  text: string,
): ViewDocumentFragment {
  const fragment = writer.createDocumentFragment();
  const textLines = text.split("\n");

  const items = textLines.reduce(
    (nodes, line, lineIndex) => {
      nodes.push(line);

      if (lineIndex < textLines.length - 1) {
        nodes.push(writer.createElement("br"));
      }

      return nodes;
    },
    [] as Array<string | ViewElement>,
  );

  writer.appendChild(items, fragment);

  return fragment;
}

export function findFrontmatterContainer(
  selection: ModelDocumentSelection,
): ModelElement | null {
  return selection.getFirstPosition()!.findAncestor("frontmatterContainer");
}
