import type { Db, Settings } from "./types";
import type { CollectionKey, Repo, Row } from "./repo";
import { seedDb } from "./seed";

const KEY = "sai-bricks-db-v1";

/** Demo-mode storage: whole Db as one localStorage document. */
export class LocalRepo implements Repo {
  private read(): Db {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const db = seedDb();
      localStorage.setItem(KEY, JSON.stringify(db));
      return db;
    }
    return JSON.parse(raw) as Db;
  }

  private write(db: Db) {
    localStorage.setItem(KEY, JSON.stringify(db));
  }

  async load(): Promise<Db> {
    return this.read();
  }

  async saveSettings(s: Settings): Promise<void> {
    const db = this.read();
    db.settings = s;
    this.write(db);
  }

  async insert<K extends CollectionKey>(collection: K, row: Row<K>): Promise<void> {
    const db = this.read();
    (db[collection] as Row<K>[]).push(row);
    this.write(db);
  }

  async update<K extends CollectionKey>(collection: K, row: Row<K>): Promise<void> {
    const db = this.read();
    const list = db[collection] as Row<K>[];
    const i = list.findIndex((r) => r.id === row.id);
    if (i >= 0) list[i] = row;
    this.write(db);
  }

  async remove(collection: CollectionKey, id: string): Promise<void> {
    const db = this.read();
    const filtered = (db[collection] as { id: string }[]).filter((r) => r.id !== id);
    (db as unknown as Record<string, unknown>)[collection] = filtered;
    this.write(db);
  }
}
