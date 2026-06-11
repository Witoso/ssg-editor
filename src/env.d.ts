/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    targetPath: string;
    config: import("@/lib/config").SsgEditorConfig;
  }
}
