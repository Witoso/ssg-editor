import fs from "fs/promises";
import path from "path";
import type { FileItem } from "@/components/FileTree";

async function getFileItem(
  fullPath: string,
  rootPath: string,
): Promise<FileItem | null> {
  // lstat so symlinks are skipped instead of followed out of the root.
  const stats = await fs.lstat(fullPath);
  const relativePath = path.relative(rootPath, fullPath);
  const name = path.basename(fullPath);

  if (stats.isSymbolicLink()) {
    return null;
  }

  if (stats.isDirectory()) {
    const children = await getFilesInDirectory(fullPath, rootPath);
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

async function getFilesInDirectory(
  directoryPath: string,
  rootPath: string,
): Promise<FileItem[]> {
  const entries = await fs.readdir(directoryPath);

  const items = await Promise.all(
    entries.map((entry) =>
      getFileItem(path.join(directoryPath, entry), rootPath),
    ),
  );

  return items
    .filter((item): item is FileItem => item !== null)
    .sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });
}

export async function getFiles(rootPath: string): Promise<FileItem[]> {
  try {
    await fs.access(rootPath);
  } catch {
    throw new Error(`Path does not exist: ${rootPath}`);
  }

  return getFilesInDirectory(rootPath, rootPath);
}
