export function setFilenameToUrl(filename: string){
    const url = new URL(window.location.href);
    url.searchParams.set("filename", filename);
    window.history.pushState({}, "", url);
}

export function getFilenameFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("filename");
}
