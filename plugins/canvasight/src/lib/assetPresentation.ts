const fileIconByExtension: Record<string, string> = {
  pdf: "file-format-pdf",
  md: "file-format-md", markdown: "file-format-md",
  ppt: "file-format-ppt", pptx: "file-format-ppt", key: "file-format-ppt", odp: "file-format-ppt",
  csv: "file-format-csv", tsv: "file-format-csv",
  xls: "file-format-xls", xlsx: "file-format-xls", numbers: "file-format-xls", ods: "file-format-xls",
  doc: "file-format-doc", docx: "file-format-doc", pages: "file-format-doc", odt: "file-format-doc", rtf: "file-format-doc",
  js: "file-format-code", jsx: "file-format-code", mjs: "file-format-code", cjs: "file-format-code",
  ts: "file-format-code", tsx: "file-format-code", mts: "file-format-code", cts: "file-format-code",
  json: "file-format-code", html: "file-format-code", htm: "file-format-code", css: "file-format-code",
  scss: "file-format-code", sass: "file-format-code", less: "file-format-code", vue: "file-format-code",
  svelte: "file-format-code", astro: "file-format-code", py: "file-format-code", rb: "file-format-code",
  go: "file-format-code", rs: "file-format-code", java: "file-format-code", kt: "file-format-code",
  kts: "file-format-code", swift: "file-format-code", c: "file-format-code", cc: "file-format-code",
  cpp: "file-format-code", cxx: "file-format-code", h: "file-format-code", hpp: "file-format-code",
  cs: "file-format-code", php: "file-format-code", sh: "file-format-code", bash: "file-format-code",
  zsh: "file-format-code", fish: "file-format-code", yaml: "file-format-code", yml: "file-format-code",
  toml: "file-format-code", xml: "file-format-code", sql: "file-format-code", ipynb: "file-format-code"
};

const fileIconByMime: Array<[test: (mime: string) => boolean, icon: string]> = [
  [(mime) => mime === "application/pdf", "file-format-pdf"],
  [(mime) => mime === "text/markdown" || mime === "text/x-markdown", "file-format-md"],
  [(mime) => mime.includes("presentation") || mime.includes("powerpoint"), "file-format-ppt"],
  [(mime) => mime === "text/csv" || mime === "text/tab-separated-values", "file-format-csv"],
  [(mime) => mime.includes("spreadsheet") || mime.includes("excel"), "file-format-xls"],
  [(mime) => mime.includes("msword") || mime.includes("wordprocessingml") || mime === "application/rtf" || mime === "text/rtf" || mime.includes("opendocument.text") || mime.includes("apple.pages"), "file-format-doc"],
  [(mime) => mime.includes("javascript") || mime.includes("typescript") || mime.includes("json") || mime.includes("x-python") || mime.includes("notebook"), "file-format-code"],
  [(mime) => ["text/html", "text/css", "application/xml", "text/xml", "application/yaml", "text/yaml"].includes(mime), "file-format-code"]
];

const videoExtensions = new Set(["mp4", "m4v", "mov", "webm", "ogv", "avi", "mkv"]);

export function assetExtension(name: string): string {
  const extension = name.includes(".") ? name.split(".").pop()?.trim().toLowerCase() : "";
  return extension && extension.length <= 12 ? extension : "";
}

export function isVideoAsset(name: string, mime: string): boolean {
  return mime.toLowerCase().startsWith("video/") || videoExtensions.has(assetExtension(name));
}

export function fileIconName(name: string, mime: string): string {
  const extension = assetExtension(name);
  const normalizedMime = mime.toLowerCase();
  if (extension && fileIconByExtension[extension]) return fileIconByExtension[extension];
  return fileIconByMime.find(([test]) => test(normalizedMime))?.[1] ?? "file-format-unknown";
}
