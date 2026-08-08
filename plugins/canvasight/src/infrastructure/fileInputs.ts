import type { AttachmentInput } from "../../shared/types";

function fileExtensionFromMime(mime: string): string {
  const normalized = mime.toLowerCase();
  if (normalized === "image/jpeg") return ".jpg";
  if (normalized === "image/png") return ".png";
  if (normalized === "image/gif") return ".gif";
  if (normalized === "image/webp") return ".webp";
  if (normalized === "image/svg+xml") return ".svg";
  if (normalized === "image/avif") return ".avif";
  return "";
}

function attachmentName(file: File, source: "upload" | "drop" | "paste", index: number): string {
  const existingName = file.name.trim();
  if (existingName) return existingName;
  const extension = fileExtensionFromMime(file.type);
  return source === "paste" ? `pasted-image-${Date.now()}-${index + 1}${extension}` : `attachment-${index + 1}${extension}`;
}

function isImageFile(file: File): boolean {
  return file.type.toLowerCase().startsWith("image/") || /\.(apng|avif|gif|jpe?g|png|svg|webp)$/i.test(file.name);
}

export function clipboardImageFiles(dataTransfer: DataTransfer | null): File[] {
  if (!dataTransfer) return [];
  const itemFiles = Array.from(dataTransfer.items)
    .filter((item) => item.kind === "file" && item.type.toLowerCase().startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file));
  const files = itemFiles.length ? itemFiles : Array.from(dataTransfer.files).filter(isImageFile);
  return files.map((file, index) => {
    const name = attachmentName(file, "paste", index);
    if (name === file.name) return file;
    return new File([file], name, {
      lastModified: file.lastModified || Date.now(),
      type: file.type || "application/octet-stream"
    });
  });
}

export async function filesToInputs(files: FileList | File[], source: "upload" | "drop" | "paste"): Promise<AttachmentInput[]> {
  const inputs: AttachmentInput[] = [];
  for (const [index, file] of Array.from(files).entries()) {
    inputs.push({
      name: attachmentName(file, source, index),
      mime: file.type || "application/octet-stream",
      source,
      bytes: await file.arrayBuffer()
    });
  }
  return inputs;
}
