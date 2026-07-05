import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { Session } from "@supabase/supabase-js";
import type { Db, Settings } from "./types";
import type { CollectionKey, Repo, Row } from "./repo";
import { LocalRepo } from "./localRepo";
import { SupabaseRepo } from "./supabaseRepo";
import { supabase } from "./supabase";

interface DataApi {
  db: Db | null;
  mode: "demo" | "cloud";
  session: Session | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  addRow: <K extends CollectionKey>(k: K, row: Row<K>) => Promise<void>;
  updateRow: <K extends CollectionKey>(k: K, row: Row<K>) => Promise<void>;
  removeRow: (k: CollectionKey, id: string) => Promise<void>;
  saveSettings: (s: Settings) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<DataApi | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const mode: "demo" | "cloud" = supabase ? "cloud" : "demo";
  const repo: Repo = useMemo(
    () => (supabase ? new SupabaseRepo(supabase) : new LocalRepo()),
    []
  );
  const [db, setDb] = useState<Db | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(mode === "demo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDb(await repo.load());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    if (!authReady) return;
    if (mode === "cloud" && !session) {
      setDb(null);
      setLoading(false);
      return;
    }
    void reload();
  }, [authReady, session, mode, reload]);

  const addRow = useCallback(
    async <K extends CollectionKey>(k: K, row: Row<K>) => {
      await repo.insert(k, row);
      setDb((d) => (d ? { ...d, [k]: [...d[k], row] } : d));
    },
    [repo]
  );

  const updateRow = useCallback(
    async <K extends CollectionKey>(k: K, row: Row<K>) => {
      await repo.update(k, row);
      setDb((d) =>
        d ? { ...d, [k]: (d[k] as Row<K>[]).map((r) => (r.id === row.id ? row : r)) } : d
      );
    },
    [repo]
  );

  const removeRow = useCallback(
    async (k: CollectionKey, id: string) => {
      await repo.remove(k, id);
      setDb((d) =>
        d ? { ...d, [k]: (d[k] as { id: string }[]).filter((r) => r.id !== id) } : d
      );
    },
    [repo]
  );

  const saveSettings = useCallback(
    async (s: Settings) => {
      await repo.saveSettings(s);
      setDb((d) => (d ? { ...d, settings: s } : d));
    },
    [repo]
  );

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
  }, []);

  const api: DataApi = {
    db,
    mode,
    session,
    loading,
    error,
    reload,
    addRow,
    updateRow,
    removeRow,
    saveSettings,
    signOut
  };
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useData(): DataApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useData outside DataProvider");
  return v;
}

/** Convenience: throws if db not loaded — use inside pages behind the loading gate. */
export function useDb(): Db {
  const { db } = useData();
  if (!db) throw new Error("db not loaded");
  return db;
}
