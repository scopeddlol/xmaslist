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
            claimed_by   TEXT,
            claimed_at   TEXT,
            position     INTEGER NOT NULL DEFAULT 0,
            created_at   TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_items_list ON items(list_id, position);
    `);

    return db;
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
