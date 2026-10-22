// Creates all tables from schema/schema.sql in the database set by DB_HOST / DB_USER /
// DB_PASSWORD / DB_NAME (read from the environment, or from .env if present).
// Usage: npm run db:setup          Safe to run repeatedly; nothing existing is dropped.
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// Load .env without overriding variables already set (e.g. on the live server)
const envFile = path.join(root, ".env");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = /^\s*([\w.]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
if (!DB_NAME) {
  console.error("DB_NAME is not set. Add DB_HOST, DB_USER, DB_PASSWORD and DB_NAME to .env");
  process.exit(1);
}

const sql = readFileSync(path.join(root, "schema", "schema.sql"), "utf8");
const conn = await mysql.createConnection({ host: DB_HOST, user: DB_USER, password: DB_PASSWORD, multipleStatements: true });
try {
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.changeUser({ database: DB_NAME });
  await conn.query(sql);
  const [tables] = await conn.query("SHOW TABLES");
  console.log(`Database "${DB_NAME}" is ready. ${tables.length} tables:`);
  console.log(tables.map((t) => "  - " + Object.values(t)[0]).join("\n"));
} catch (err) {
  console.error("Schema setup failed:", err.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
