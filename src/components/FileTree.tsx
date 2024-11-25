import { useState } from "react";

import SlIcon from "@shoelace-style/shoelace/dist/react/icon/index.js";
import SlTree from "@shoelace-style/shoelace/dist/react/tree/index.js";
import SlTreeItem from "@shoelace-style/shoelace/dist/react/tree-item/index.js";

import { navigate } from "astro:transitions/client";
import { CreateDialog } from "./CreateDialog";

import PlusIcon from "pixelarticons/svg/plus.svg?url";
import FolderIcon from "pixelarticons/svg/folder.svg?url";
import FileIcon from "pixelarticons/svg/file-alt.svg?url";

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
  rootPath,
}: {
  items: FileItem[];
  activePath: string;
  rootPath: string;
}) {
  const [currentFolderPath, setCurrentFolderPath] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleFileItemClick = (fullPath: string) => {
    navigate(fullPath);
  };

  const handleCreateFileClick = (folderPath: string) => {
    setCurrentFolderPath(folderPath);
    setIsDialogOpen(true);
  };

  const renderTreeItems = (items: FileItem[], parentPath: string = "") => {
    return items.map((item) => {
      const fullPath = parentPath ? `${parentPath}/${item.name}` : item.path;

      if (item.type === "file" && !item.disabled) {
        return (
          <SlTreeItem
            key={fullPath}
            disabled={item.disabled}
            selected={fullPath === activePath}
            onClick={() => handleFileItemClick(fullPath)}
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
            <SlTreeItem
              key={`${fullPath}/create-file`}
              onClick={() => handleCreateFileClick(fullPath)}
            >
              <SlIcon src={PlusIcon} />
              <em>Create a file</em>
            </SlTreeItem>
          </SlTreeItem>
        );
      }
    });
  };

  return (
    <>
      <SlTree className="tree-with-icons">
        {renderTreeItems(items)}
        {/* Add "Create a file" entry at the root level */}
        <SlTreeItem
          key="root-create-file"
          onClick={() => handleCreateFileClick("")}
        >
          <SlIcon src={PlusIcon} />
          <em>Create a file</em>
        </SlTreeItem>
      </SlTree>
      <CreateDialog
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        currentFolderPath={currentFolderPath}
      />
    </>
  );
}
