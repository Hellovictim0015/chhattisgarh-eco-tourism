import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

// Uploaded files live in <project root>/uploads and are served by src/app/uploads/[...path]/route.js
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Saves an uploaded image from FormData and returns its public URL (/uploads/...).
// Returns null when no file was sent; throws a user-facing Error for bad files.
export async function saveImage(file) {
  if (!file || typeof file === "string" || file.size === 0) return null;
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("Only JPG, PNG, WEBP, GIF or AVIF images are allowed");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Image must be 5 MB or smaller");

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

// Deletes a file previously returned by saveImage. Ignores anything outside /uploads and missing files.
export async function deleteUpload(url) {
  if (!url || !url.startsWith("/uploads/")) return;
  const filePath = path.join(UPLOAD_DIR, path.basename(url));
  await unlink(filePath).catch(() => {});
}
