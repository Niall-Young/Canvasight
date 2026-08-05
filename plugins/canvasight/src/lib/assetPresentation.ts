const fileIconByExtension: Record<string, string> = {
  pdf: "news-paper",
  doc: "notepad", docx: "notepad", pages: "notepad", odt: "notepad", rtf: "notepad", txt: "notepad",
  xls: "analyze-data", xlsx: "analyze-data", numbers: "analyze-data", ods: "analyze-data", csv: "analyze-data", tsv: "analyze-data",
  parquet: "analyze-data", arrow: "analyze-data", feather: "analyze-data", avro: "analyze-data",
  ppt: "file-presentation", pptx: "file-presentation", key: "file-presentation", odp: "file-presentation",
  zip: "archive", rar: "archive", "7z": "archive", tar: "archive", gz: "archive", bz2: "archive", xz: "archive", tgz: "archive",
  mp3: "music", m4a: "music", wav: "music", aac: "music", flac: "music", ogg: "music", opus: "music",
  mp4: "video", m4v: "video", mov: "video", webm: "video", ogv: "video", avi: "video", mkv: "video",
  js: "code-square", jsx: "code-square", ts: "code-square", tsx: "code-square", json: "code-square", ipynb: "code-square",
  html: "code-square", css: "code-square", md: "code-square", py: "code-square", rb: "code-square", go: "code-square",
  rs: "code-square", java: "code-square", swift: "code-square", sh: "code-square", yaml: "code-square", yml: "code-square",
  toml: "code-square", xml: "code-square", sql: "code-square",
  sqlite: "storage", db: "storage",
  ttf: "writing", otf: "writing", woff: "writing", woff2: "writing", eot: "writing",
  obj: "all-gizmos", fbx: "all-gizmos", gltf: "all-gizmos", glb: "all-gizmos", stl: "all-gizmos", dae: "all-gizmos",
  blend: "all-gizmos", usd: "all-gizmos", usdz: "all-gizmos", "3ds": "all-gizmos",
  dmg: "download-simple", pkg: "download-simple", exe: "download-simple", msi: "download-simple", appimage: "download-simple",
  deb: "download-simple", rpm: "download-simple", apk: "download-simple", ipa: "download-simple",
  epub: "book", mobi: "book",
  psd: "image-square", ai: "image-square", fig: "compose-canvas", sketch: "compose-canvas", xd: "compose-canvas"
};

const fileIconByMime: Array<[test: (mime: string) => boolean, icon: string]> = [
  [(mime) => mime === "application/pdf", "news-paper"],
  [(mime) => mime.startsWith("audio/"), "music"],
  [(mime) => mime.startsWith("video/"), "video"],
  [(mime) => mime.startsWith("image/"), "image-square"],
  [(mime) => mime.startsWith("font/") || mime.includes("font-"), "writing"],
  [(mime) => mime.startsWith("model/"), "all-gizmos"],
  [(mime) => mime.includes("presentation") || mime.includes("powerpoint"), "file-presentation"],
  [(mime) => mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("parquet") || mime.includes("arrow") || mime === "text/csv", "analyze-data"],
  [(mime) => mime.includes("zip") || mime.includes("compressed") || mime.includes("archive") || mime.includes("tar"), "archive"],
  [(mime) => mime.includes("installer") || mime.includes("msdownload") || mime.includes("android.package"), "download-simple"],
  [(mime) => mime.includes("word") || mime.includes("document") || mime === "application/rtf", "notepad"],
  [(mime) => mime.startsWith("text/") || mime.includes("json") || mime.includes("javascript") || mime.includes("xml") || mime.includes("yaml") || mime.includes("notebook"), "code-square"],
  [(mime) => mime.includes("sqlite") || mime.includes("database"), "storage"],
  [(mime) => mime.includes("epub") || mime.includes("ebook"), "book"]
];

export function assetExtension(name: string): string {
  const extension = name.includes(".") ? name.split(".").pop()?.trim().toLowerCase() : "";
  return extension && extension.length <= 12 ? extension : "";
}

export function isVideoAsset(name: string, mime: string): boolean {
  return mime.toLowerCase().startsWith("video/") || fileIconByExtension[assetExtension(name)] === "video";
}

export function fileIconName(name: string, mime: string): string {
  const extension = assetExtension(name);
  const normalizedMime = mime.toLowerCase();
  if (extension && fileIconByExtension[extension]) return fileIconByExtension[extension];
  return fileIconByMime.find(([test]) => test(normalizedMime))?.[1] ?? "notepad";
}
