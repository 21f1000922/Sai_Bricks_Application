import type { SupabaseClient } from "@supabase/supabase-js";
import type { Db, Settings } from "./types";
import type { CollectionKey, Repo, Row } from "./repo";
import { COLLECTIONS } from "./repo";

const TABLE: Record<CollectionKey, string> = {
  leaders: "leaders",
  customers: "customers",
  employees: "employees",
  vehicles: "vehicles",
  suppliers: "suppliers",
  workEntries: "work_entries",
  leaderPayments: "leader_payments",
  sales: "sales",
  salePayments: "sale_payments",
  purchases: "purchases",
  damageEntries: "damage_entries",
  procurements: "procurements",
  salaryPayments: "salary_payments"
};

const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

function rowToDb(row: Record<string, unknown>, factoryId: string): Record<string, unknown> {
  const out: Record<string, unknown> = { factory_id: factoryId };
  for (const [k, v] of Object.entries(row)) {
    out[toSnake(k)] = v === undefined ? null : v;
  }
  return out;
}

function rowFromDb(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (k === "factory_id" || k === "created_at") continue;
    out[toCamel(k)] = v === null ? undefined : v;
  }
  return out;
}

/**
 * Cloud storage. One `factories` row per factory holds the settings; every
 * other table carries factory_id and is guarded by RLS (see supabase/schema.sql).
 */
export class SupabaseRepo implements Repo {
  private factoryId: string | null = null;

  constructor(private client: SupabaseClient) {}

  private async ensureFactory(): Promise<{ id: string; settings: Settings }> {
    // bootstrap_factory() (SECURITY DEFINER) creates the factory + owner
    // membership on first login, or returns the existing factory id. This
    // avoids the insert-RLS chicken-and-egg (no membership before the row exists).
    const { data: fid, error: bErr } = await this.client.rpc("bootstrap_factory");
    if (bErr) throw bErr;
    this.factoryId = fid as string;
    const { data: f, error } = await this.client
      .from("factories")
      .select("*")
      .eq("id", fid)
      .single();
    if (error) throw error;
    return {
      id: f.id,
      settings: {
        factoryName: f.name,
        mfgRate: Number(f.mfg_rate),
        battiRate: Number(f.batti_rate),
        defaultBrickPrice: Number(f.default_brick_price),
        thresholdOwedToLeader: Number(f.threshold_owed_to_leader),
        thresholdLeaderOwes: Number(f.threshold_leader_owes)
      }
    };
  }

  async load(): Promise<Db> {
    const { settings } = await this.ensureFactory();
    const db = { settings } as Db;
    await Promise.all(
      COLLECTIONS.map(async (key) => {
        const { data, error } = await this.client.from(TABLE[key]).select("*");
        if (error) throw error;
        (db as unknown as Record<string, unknown>)[key] = (data ?? []).map(rowFromDb);
      })
    );
    return db;
  }

  async saveSettings(s: Settings): Promise<void> {
    if (!this.factoryId) await this.ensureFactory();
    const { error } = await this.client
      .from("factories")
      .update({
        name: s.factoryName,
        mfg_rate: s.mfgRate,
        batti_rate: s.battiRate,
        default_brick_price: s.defaultBrickPrice,
        threshold_owed_to_leader: s.thresholdOwedToLeader,
        threshold_leader_owes: s.thresholdLeaderOwes
      })
      .eq("id", this.factoryId);
    if (error) throw error;
  }

  async insert<K extends CollectionKey>(collection: K, row: Row<K>): Promise<void> {
    if (!this.factoryId) await this.ensureFactory();
    const { error } = await this.client
      .from(TABLE[collection])
      .insert(rowToDb(row as unknown as Record<string, unknown>, this.factoryId!));
    if (error) throw error;
  }

  async update<K extends CollectionKey>(collection: K, row: Row<K>): Promise<void> {
    if (!this.factoryId) await this.ensureFactory();
    const { error } = await this.client
      .from(TABLE[collection])
      .update(rowToDb(row as unknown as Record<string, unknown>, this.factoryId!))
      .eq("id", row.id);
    if (error) throw error;
  }

  async remove(collection: CollectionKey, id: string): Promise<void> {
    const { error } = await this.client.from(TABLE[collection]).delete().eq("id", id);
    if (error) throw error;
  }
}
