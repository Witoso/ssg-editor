import { atom } from "nanostores";

export type SaveStatus = "idle" | "saving" | "error";

export const saveStatus = atom<SaveStatus>("idle");
