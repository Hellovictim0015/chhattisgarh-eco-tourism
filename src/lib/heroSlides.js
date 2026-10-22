// Reads the hero slide form (multipart): title, highlight, subtitle, sort_order, status.
// Returns { fields } or { error }.
export function readHeroSlideForm(formData) {
  const text = (key, max) => String(formData.get(key) || "").trim().slice(0, max);
  const fields = {
    title: text("title", 150),
    highlight: text("highlight", 60) || null,
    subtitle: text("subtitle", 255) || null,
    sort_order: parseInt(formData.get("sort_order"), 10) || 0,
    status: formData.get("status") === "INACTIVE" ? "INACTIVE" : "ACTIVE",
  };
  if (!fields.title) return { error: "Heading is required" };
  if (fields.highlight && !fields.title.toLowerCase().includes(fields.highlight.toLowerCase())) {
    return { error: "The highlighted words must be part of the heading" };
  }
  return { fields };
}
