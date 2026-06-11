export function getFlashMessage({
  error,
  success,
  filename,
}: {
  error?: string;
  success?: string;
  filename?: string;
}): string | null {
  if (error) {
    switch (error) {
      case "file_exists":
        return `File "${filename}" already exists.`;
      case "invalid_input":
        return "Invalid input provided.";
      case "server_error":
        return "Server error occurred.";
      default:
        return "Something went wrong. Please try again.";
    }
  }

  if (success) {
    return "File created successfully.";
  }

  return null;
}
