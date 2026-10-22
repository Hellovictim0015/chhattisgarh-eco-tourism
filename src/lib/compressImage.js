// Browser-side: shrinks a photo before upload so it stays small (fast pages) and under
// web server upload limits (nginx allows only 1 MB by default).
// Scales down to at most `maxWidth` px wide and re-encodes as WebP. GIF/SVG, files that
// fail to decode, and cases where the result would be larger are returned unchanged.
export async function compressImage(file, { maxWidth = 1920, quality = 0.82 } = {}) {
  if (!file || !file.type?.startsWith('image/') || /gif|svg/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bitmap.width);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
    return new File([blob], name, { type: 'image/webp', lastModified: Date.now() });
  } catch {
    return file;
  }
}

// Reads a fetch Response as JSON; when the server sent something else (e.g. an HTML error
// page from nginx), returns { success: false, error } with a message a person can act on.
export async function readJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    if (res.status === 413) {
      return { success: false, error: 'The file is too large for the server. Use a smaller image, or raise the upload limit on the server (nginx: client_max_body_size 10M).' };
    }
    return { success: false, error: `Server error (${res.status}). Please try again.` };
  }
}
