import db from "@/lib/db";

// The `users` table is not identical everywhere: the local DB has `is_active` + `profile_image`,
// the live DB has a `status` column instead and no `profile_image`, and required columns / role
// values may differ. These helpers read the real columns once and build queries that work on both.

let columnsPromise = null;

// Map of column name -> { type, nullable, hasDefault, autoIncrement, enumValues }
export function getUserColumns() {
  if (!columnsPromise) {
    columnsPromise = db
      .query("SHOW COLUMNS FROM users")
      .then(([rows]) => {
        const cols = new Map();
        for (const r of rows) {
          const enumMatch = /^enum\((.*)\)$/i.exec(r.Type);
          cols.set(r.Field, {
            type: r.Type.toLowerCase(),
            nullable: r.Null === "YES",
            hasDefault: r.Default !== null || /auto_increment|default_generated/i.test(r.Extra || ""),
            autoIncrement: /auto_increment/i.test(r.Extra || ""),
            enumValues: enumMatch ? enumMatch[1].split(",").map((v) => v.trim().replace(/^'|'$/g, "")) : null,
          });
        }
        return cols;
      })
      .catch((err) => {
        columnsPromise = null; // retry on the next request
        throw err;
      });
  }
  return columnsPromise;
}

// Picks the value to use for an enum column: the first preferred value it allows, else its first value.
function pickEnum(col, preferred) {
  if (!col?.enumValues) return preferred[0];
  return preferred.find((p) => col.enumValues.includes(p)) ?? col.enumValues[0];
}

// The role a newly registered (non-admin) user gets.
export async function defaultUserRole() {
  const cols = await getUserColumns();
  const role = cols.get("role");
  if (!role?.enumValues) return "USER";
  return pickEnum(role, ["USER", "BUYER", "CUSTOMER", "SELLER", "OWNER", ...role.enumValues.filter((v) => v !== "ADMIN")]);
}

// INSERTs a new user with OTP-only signup data, filling any other required column safely.
export async function insertUser({ name, email, phone }) {
  const cols = await getUserColumns();
  const role = await defaultUserRole();
  const row = { name, email, phone };
  if (cols.has("role")) row.role = role;
  if (cols.has("is_active")) row.is_active = 1;
  if (cols.has("status")) row.status = pickEnum(cols.get("status"), ["ACTIVE", "active", "1"]);

  // Any other NOT NULL column without a default (e.g. `password` on some DBs) gets an empty value.
  // OTP users never log in with a password, and an empty string never matches a bcrypt hash.
  for (const [field, col] of cols) {
    if (field in row || col.nullable || col.hasDefault || col.autoIncrement) continue;
    if (col.enumValues) row[field] = col.enumValues[0];
    else if (/int|decimal|float|double/.test(col.type)) row[field] = 0;
    else if (/date|time/.test(col.type)) row[field] = new Date();
    else row[field] = "";
  }

  const fields = Object.keys(row);
  const [result] = await db.query(
    `INSERT INTO users (${fields.map((f) => `\`${f}\``).join(", ")}) VALUES (${fields.map(() => "?").join(", ")})`,
    fields.map((f) => row[f])
  );
  return { id: result.insertId, role };
}

// true unless the account is switched off (via is_active = 0 or a non-ACTIVE status)
export function isUserActive(user) {
  if ("is_active" in user && user.is_active !== null) return Number(user.is_active) !== 0;
  if ("status" in user && user.status) return String(user.status).toUpperCase() === "ACTIVE";
  return true;
}

// SELECT list exposing `profile_image` and `is_active` on every schema
export async function userSelectColumns(alias = "") {
  const cols = await getUserColumns();
  const p = alias ? `${alias}.` : "";
  const parts = [`${p}id`, `${p}name`, `${p}email`, `${p}phone`, `${p}role`, `${p}created_at`];
  parts.push(cols.has("profile_image") ? `${p}profile_image` : "NULL AS profile_image");
  if (cols.has("is_active")) parts.push(`${p}is_active`);
  else if (cols.has("status")) parts.push(`(UPPER(${p}status) = 'ACTIVE') AS is_active`);
  else parts.push("1 AS is_active");
  return parts.join(", ");
}

// Activates / deactivates a user on whichever column the schema has. Returns affected row count.
export async function setUserActive(id, active) {
  const cols = await getUserColumns();
  if (cols.has("is_active")) {
    const [r] = await db.query("UPDATE users SET is_active = ? WHERE id = ?", [active ? 1 : 0, id]);
    return r.affectedRows;
  }
  if (cols.has("status")) {
    const status = cols.get("status");
    const value = active ? pickEnum(status, ["ACTIVE", "active"]) : pickEnum(status, ["INACTIVE", "inactive", "BLOCKED", "SUSPENDED", "DISABLED"]);
    const [r] = await db.query("UPDATE users SET status = ? WHERE id = ?", [value, id]);
    return r.affectedRows;
  }
  return 0;
}
