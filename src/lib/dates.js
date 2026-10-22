// Client-side date helpers for the booking UI. Dates travel as "YYYY-MM-DD" strings.

// Local calendar date, `offset` days from today.
export function dayFromToday(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// "YYYY-MM-DD" + n days
export function addDays(day, n) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  return Math.round((new Date(`${checkOut}T00:00:00Z`) - new Date(`${checkIn}T00:00:00Z`)) / 86400000);
}

// "2026-10-21" -> "21 Oct 2026"
export function formatDay(day) {
  if (!day) return '';
  return new Date(`${String(day).slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
}

export const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
