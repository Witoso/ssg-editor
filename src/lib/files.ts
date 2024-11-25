import fs from "fs";
import path from "path";
import type { FileItem } from "@/components/FileTree";

function getFileItem(fullPath: string, rootPath: string): FileItem | null {
  const stats = fs.statSync(fullPath);
  const relativePath = path.relative(rootPath, fullPath);
  const name = path.basename(fullPath);

  if (stats.isDirectory()) {
    const children = getFilesInDirectory(fullPath, rootPath);
    if (children.length > 0) {
      return {
        name,
        path: `/${relativePath}`, // Use relative path
        type: "folder",
        children,
      };
    } else {
      return null;
    }
  } else if (name.endsWith(".md")) {
    return {
      name,
      path: `/${relativePath}`, // Use relative path
      type: "file",
    };
  } else {
    return null;
  }
}

function getFilesInDirectory(
  directoryPath: string,
  rootPath: string,
): FileItem[] {
  const entries = fs.readdirSync(directoryPath);

  return entries
    .map((entry) => {
      const fullPath = path.join(directoryPath, entry);
      return getFileItem(fullPath, rootPath);
    })
    .filter((item): item is FileItem => item !== null);
}

export function getFiles(rootPath: string): FileItem[] {
  if (!fs.existsSync(rootPath)) {
    throw new Error(`Path does not exist: ${rootPath}`);
  }

  return getFilesInDirectory(rootPath, rootPath);
}
