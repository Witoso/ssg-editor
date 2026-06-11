import type { AstroCookies } from "astro";

export type Flash = {
  error?: string;
  success?: string;
  filename?: string;
};

const flashCookieNames: Record<keyof Flash, string> = {
  error: "flash_error",
  success: "flash_success",
  filename: "flash_filename",
};

const cookieOptions = {
  path: "/",
  sameSite: "lax",
  httpOnly: true,
} as const;

export function setFlash(cookies: AstroCookies, flash: Flash): void {
  for (const key of Object.keys(flashCookieNames) as Array<keyof Flash>) {
    const value = flash[key];

    if (value) {
      cookies.set(flashCookieNames[key], value, cookieOptions);
    }
  }
}

export function readFlash(cookies: AstroCookies): Flash {
  const flash: Flash = {
    error: cookies.get(flashCookieNames.error)?.value,
    success: cookies.get(flashCookieNames.success)?.value,
    filename: cookies.get(flashCookieNames.filename)?.value,
  };

  for (const name of Object.values(flashCookieNames)) {
    cookies.delete(name, { path: cookieOptions.path });
  }

  return flash;
}
