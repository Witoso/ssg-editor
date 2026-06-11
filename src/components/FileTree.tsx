import { useState } from "react";

import SlIcon from "@shoelace-style/shoelace/dist/react/icon/index.js";
import SlTree from "@shoelace-style/shoelace/dist/react/tree/index.js";
import SlTreeItem from "@shoelace-style/shoelace/dist/react/tree-item/index.js";
import type SlTreeItemElement from "@shoelace-style/shoelace/dist/components/tree-item/tree-item.js";

import { navigate } from "astro:transitions/client";
import { CreateDialog } from "./CreateDialog";

import PlusIcon from "pixelarticons/svg/plus.svg?url";
import FolderIcon from "pixelarticons/svg/folder.svg?url";
import FileIcon from "pixelarticons/svg/file-text.svg?url";

export type FileItem = {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileItem[]; // Only folders will have children
  disabled?: boolean;
};

export function FileTree({
  items,
  activePath,
}: {
  items: FileItem[];
  activePath: string;
}) {
  const [currentFolderPath, setCurrentFolderPath] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // The tree's own selection event covers both mouse and keyboard
  // (arrow keys + Enter), so navigation lives here instead of per-item
  // click handlers.
  const handleSelectionChange = (
    event: CustomEvent<{ selection: SlTreeItemElement[] }>,
  ) => {
    const selected = event.detail.selection[0];

    if (!selected) {
      return;
    }

    // Keyboard (Enter on a focused create row) routes through selection.
    const createIn = selected.dataset.createIn;

    if (createIn !== undefined) {
      openCreateDialog(createIn);
      return;
    }

    const filePath = selected.dataset.path;

    if (filePath && filePath !== activePath) {
      navigate(filePath);
    }
  };

  const openCreateDialog = (folderPath: string) => {
    setCurrentFolderPath(folderPath);
    setIsDialogOpen(true);
  };

  const renderCreateItem = (folderPath: string) => (
    <SlTreeItem
      key={`${folderPath}/create-file`}
      className="create-file-item"
      data-create-in={folderPath}
      // Mouse clicks on create rows don't reliably surface through the
      // tree's selection event, so handle them explicitly.
      onClick={() => openCreateDialog(folderPath)}
    >
      <SlIcon src={PlusIcon} />
      Create a file
    </SlTreeItem>
  );

  const renderTreeItems = (items: FileItem[], parentPath: string = "") => {
    return items.map((item) => {
      const fullPath = parentPath ? `${parentPath}/${item.name}` : item.path;

      if (item.type === "file" && !item.disabled) {
        return (
          <SlTreeItem
            key={fullPath}
            selected={fullPath === activePath}
            data-path={fullPath}
          >
            <SlIcon src={FileIcon} />
            {item.name}
          </SlTreeItem>
        );
      } else if (item.type === "folder") {
        return (
          <SlTreeItem key={fullPath} expanded>
            <SlIcon src={FolderIcon} />
            {item.name}
            {item.children && renderTreeItems(item.children, fullPath)}
            {/* Add "Create a file" entry at the end of each folder */}
            {renderCreateItem(fullPath)}
          </SlTreeItem>
        );
      }
    });
  };

  return (
    <>
      <SlTree
        className="tree-with-icons"
        onSlSelectionChange={handleSelectionChange}
      >
        {renderTreeItems(items)}
        {/* Add "Create a file" entry at the root level */}
        {renderCreateItem("")}
      </SlTree>
      <CreateDialog
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        currentFolderPath={currentFolderPath}
      />
    </>
  );
}
