import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

/** Absolute path to the SQLite file; override with DATABASE_PATH (see Dockerfile). */
const DB_PATH = resolve(/* turbopackIgnore: true */ process.env.DATABASE_PATH ?? "./data/xmaslist.db");

declare global {
    // eslint-disable-next-line no-var
    var __xmasDb: Database.Database | undefined;
}

function open(): Database.Database {
    mkdirSync(dirname(DB_PATH), { recursive: true });

    const db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    db.exec(`
        CREATE TABLE IF NOT EXISTS lists (
            id          TEXT PRIMARY KEY,
            slug        TEXT NOT NULL UNIQUE,
            name        TEXT NOT NULL,
            description TEXT,
            accent      TEXT NOT NULL DEFAULT 'red',
            position    INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS items (
            id           TEXT PRIMARY KEY,
            list_id      TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
            title        TEXT NOT NULL,
            url          TEXT,
            image_url    TEXT,
            price        REAL,
            currency     TEXT NOT NULL DEFAULT 'USD',
            notes        TEXT,
            quantity     INTEGER NOT NULL DEFAULT 1,
            priority     TEXT NOT NULL DEFAULT 'normal',
            position     INTEGER NOT NULL DEFAULT 0,
            created_at   TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_items_list ON items(list_id, position);
    `);

    dropClaimColumns(db);

    return db;
}

/**
 * Gift claiming was removed. Older databases still carry the columns and the
 * names people entered, so drop them and vacuum so the data leaves the file.
 */
function dropClaimColumns(db: Database.Database): void {
    const columns = db.prepare("PRAGMA table_info(items)").all() as { name: string }[];
    const stale = ["claimed_by", "claimed_at"].filter((name) => columns.some((column) => column.name === name));

    if (!stale.length) return;

    // secure_delete zeroes freed pages, so the names do not survive in slack
    // space; the checkpoint then folds the rewritten file out of the WAL.
    db.pragma("secure_delete = ON");
    for (const name of stale) db.exec(`ALTER TABLE items DROP COLUMN ${name}`);
    db.exec("VACUUM");
    db.pragma("wal_checkpoint(TRUNCATE)");
    db.pragma("secure_delete = OFF");
}

export const db: Database.Database = globalThis.__xmasDb ?? (globalThis.__xmasDb = open());

export function newId(): string {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

export function slugify(input: string): string {
    const base =
        input
            .toLowerCase()
            .normalize("NFKD")
            .replace(/[̀-ͯ]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 48) || "list";

    let slug = base;
    let n = 2;
    while (db.prepare("SELECT 1 FROM lists WHERE slug = ?").get(slug)) slug = `${base}-${n++}`;

    return slug;
}
