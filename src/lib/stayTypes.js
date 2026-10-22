// Reads the stay type form (multipart): name, code, sort_order, status, image.
// Returns { fields } or { error }. The code is derived from the name when left empty.
export function readStayTypeForm(formData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Name is required" };

  const code = (String(formData.get("code") || "").trim() || name)
    .toUpperCase()
    .replace(/&/g, "AND")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);
  if (!code) return { error: "Code must contain letters or numbers" };

  return {
    fields: {
      name,
      code,
      sort_order: parseInt(formData.get("sort_order"), 10) || 0,
      status: formData.get("status") === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    },
  };
}
