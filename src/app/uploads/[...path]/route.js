import { readFile } from "fs/promises";
import path from "path";

// Uploaded files live in <project root>/uploads (not /public), because Next.js only
// serves files that existed in /public at build time. This route streams them at /uploads/*.
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const MIME_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

export async function GET(req, { params }) {
  const { path: segments } = await params;
  const filePath = path.join(UPLOAD_DIR, ...segments);

  // Block path traversal (e.g. /uploads/../.env)
  if (!filePath.startsWith(UPLOAD_DIR + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    return new Response(data, {
      headers: {
        "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
