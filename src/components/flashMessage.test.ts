import { expect, test } from "vitest";

import { getFlashMessage } from "./flashMessage";

test("returns the success message when a file was created", () => {
  expect(getFlashMessage({ success: "file_created", filename: "post" })).toBe(
    "File created successfully.",
  );
});

test("returns the file-exists message with the filename", () => {
  expect(getFlashMessage({ error: "file_exists", filename: "post" })).toBe(
    'File "post" already exists.',
  );
});

test("returns the invalid-input message", () => {
  expect(getFlashMessage({ error: "invalid_input" })).toBe(
    "Invalid input provided.",
  );
});

test("returns the server-error message", () => {
  expect(getFlashMessage({ error: "server_error" })).toBe(
    "Server error occurred.",
  );
});

test("returns a generic error message for unknown error codes", () => {
  expect(getFlashMessage({ error: "mystery_code" })).toBe(
    "Something went wrong. Please try again.",
  );
});

test("returns null when there is no flash to show", () => {
  expect(getFlashMessage({})).toBeNull();
});
