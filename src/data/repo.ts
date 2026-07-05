import type { Db, Settings } from "./types";

/** All list-shaped collections in the Db (everything except settings). */
export type CollectionKey = Exclude<keyof Db, "settings">;

export type Row<K extends CollectionKey> = Db[K][number];

export const COLLECTIONS: CollectionKey[] = [
  "leaders",
  "customers",
  "employees",
  "vehicles",
  "suppliers",
  "workEntries",
  "leaderPayments",
  "sales",
  "salePayments",
  "purchases",
  "damageEntries",
  "procurements",
  "salaryPayments"
];

/**
 * Storage backend. Two implementations:
 * - LocalRepo: localStorage, used in demo mode (no account needed)
 * - SupabaseRepo: Postgres via Supabase, used when env vars are configured
 */
export interface Repo {
  /** Load the entire database (small data volumes; aggregates are computed client-side). */
  load(): Promise<Db>;
  saveSettings(s: Settings): Promise<void>;
  insert<K extends CollectionKey>(collection: K, row: Row<K>): Promise<void>;
  update<K extends CollectionKey>(collection: K, row: Row<K>): Promise<void>;
  remove(collection: CollectionKey, id: string): Promise<void>;
}
