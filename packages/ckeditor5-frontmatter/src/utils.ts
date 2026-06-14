import { isWidget } from "ckeditor5";
import type {
  Model,
  ModelDocumentSelection,
  ModelElement,
  ViewDocumentFragment,
  ViewDocumentSelection,
  ViewElement,
  ViewNode,
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

export function getSelectedFrontmatterWidget(
  selection: ViewDocumentSelection,
): ViewElement | null {
  const selectedElement = selection.getSelectedElement();

  if (selectedElement && isFrontmatterWidget(selectedElement)) {
    return selectedElement;
  }

  // The toolbar repository queries this on every selection change, including
  // before the editor is focused, when the view selection has no position yet.
  const position = selection.getFirstPosition();

  if (!position) {
    return null;
  }

  for (const ancestor of position.getAncestors()) {
    if (isFrontmatterWidget(ancestor)) {
      return ancestor as ViewElement;
    }
  }

  return null;
}

function isFrontmatterWidget(node: ViewNode | ViewDocumentFragment): boolean {
  return (
    isWidget(node) && !!(node as ViewElement).getCustomProperty("frontmatter")
  );
}
