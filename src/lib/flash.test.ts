import { describe, expect, test } from "vitest";
import type { AstroCookies } from "astro";

import { readFlash, setFlash } from "./flash";

type CookieRecord = { value: string; options?: Record<string, unknown> };

function fakeCookies() {
  const jar = new Map<string, CookieRecord>();
  const deleted: Array<{ name: string; options?: Record<string, unknown> }> =
    [];

  const cookies = {
    get(name: string) {
      return jar.has(name) ? { value: jar.get(name)!.value } : undefined;
    },
    set(name: string, value: string, options?: Record<string, unknown>) {
      jar.set(name, { value, options });
    },
    delete(name: string, options?: Record<string, unknown>) {
      jar.delete(name);
      deleted.push({ name, options });
    },
  };

  return { cookies: cookies as unknown as AstroCookies, jar, deleted };
}

describe("flash", () => {
  test("stores flash values as scoped, http-only, lax cookies", () => {
    const { cookies, jar } = fakeCookies();

    setFlash(cookies, { error: "file_exists", filename: "post" });

    expect(jar.get("flash_error")).toEqual({
      value: "file_exists",
      options: { path: "/", sameSite: "lax", httpOnly: true },
    });
    expect(jar.get("flash_filename")).toEqual({
      value: "post",
      options: { path: "/", sameSite: "lax", httpOnly: true },
    });
    expect(jar.has("flash_success")).toBe(false);
  });

  test("reads and clears the flash in one call", () => {
    const { cookies, jar } = fakeCookies();

    setFlash(cookies, { success: "file_created", filename: "post" });

    expect(readFlash(cookies)).toEqual({
      error: undefined,
      success: "file_created",
      filename: "post",
    });
    expect(jar.size).toBe(0);
  });

  test("returns empty flash when no cookies are set", () => {
    const { cookies } = fakeCookies();

    expect(readFlash(cookies)).toEqual({
      error: undefined,
      success: undefined,
      filename: undefined,
    });
  });
});
