import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useData, useDb } from "../data/DataContext";
import { uid } from "../lib/format";
import type { Customer, Employee, GroupType, Leader, Supplier, Vehicle } from "../data/types";
import { Avatar, BackBar, Empty, Field, Sheet } from "../components/ui";

type Tab = "leaders" | "customers" | "employees" | "vehicles" | "suppliers";
const TABS: Tab[] = ["leaders", "customers", "employees", "vehicles", "suppliers"];

type AnyMaster = Leader | Customer | Employee | Vehicle | Supplier;

export default function Masters() {
  const { t } = useTranslation();
  const db = useDb();
  const { addRow, updateRow } = useData();

  const [tab, setTab] = useState<Tab>("leaders");
  const [editing, setEditing] = useState<AnyMaster | "new" | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const rows: AnyMaster[] = db[tab];
  const isNew = editing === "new";

  const openNew = () => {
    setForm(tab === "leaders" ? { groupType: "manufacturing", peopleCount: "1" } : {});
    setEditing("new");
  };

  const openEdit = (r: AnyMaster) => {
    const f: Record<string, string> = {};
    for (const [k, v] of Object.entries(r)) if (v !== undefined) f[k] = String(v);
    setForm(f);
    setEditing(r);
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const label = (r: AnyMaster): { name: string; sub: string } => {
    if ("groupType" in r)
      return {
        name: r.name,
        sub:
          (r.groupType === "manufacturing" ? t("ledger.manufacturing") : t("ledger.batti")) +
          (r.groupType === "manufacturing" ? ` · ${t("ledger.people", { count: r.peopleCount })}` : "")
      };
    if ("designation" in r) return { name: r.name, sub: r.designation };
    if ("place" in r) return { name: r.name, sub: r.place };
    if ("number" in r) return { name: r.number, sub: r.description ?? "" };
    return { name: r.name, sub: "" };
  };

  const buildRow = (id: string, active: boolean): AnyMaster | null => {
    const name = (form.name ?? "").trim();
    switch (tab) {
      case "leaders":
        if (!name) return null;
        return {
          id,
          name,
          groupType: (form.groupType as GroupType) || "manufacturing",
          peopleCount: form.groupType === "batti" ? 1 : Number(form.peopleCount) || 1,
          phone: form.phone?.trim() || undefined,
          active
        };
      case "customers":
        if (!name) return null;
        return { id, name, place: (form.place ?? "").trim(), phone: form.phone?.trim() || undefined, active };
      case "employees":
        if (!name) return null;
        return {
          id,
          name,
          designation: (form.designation ?? "").trim(),
          salary: Number(form.salary) || 0,
          phone: form.phone?.trim() || undefined,
          active
        };
      case "vehicles":
        if (!(form.number ?? "").trim()) return null;
        return { id, number: form.number.trim(), description: form.description?.trim() || undefined, active };
      case "suppliers":
        if (!name) return null;
        return { id, name, phone: form.phone?.trim() || undefined, active };
    }
  };

  const save = async () => {
    const existing = isNew ? null : (editing as AnyMaster);
    const row = buildRow(existing?.id ?? uid(), existing?.active ?? true);
    if (!row) return;
    setSaving(true);
    if (existing) await updateRow(tab, row as never);
    else await addRow(tab, row as never);
    setSaving(false);
    setEditing(null);
  };

  const toggleActive = async (r: AnyMaster) => {
    await updateRow(tab, { ...r, active: !r.active } as never);
  };

  return (
    <>
      <BackBar to="/more" crumb={t("more.title")} title={t("master.title")} />
      <main className="page">
        <div className="chips" style={{ flexWrap: "wrap", marginBottom: 12 }}>
          {TABS.map((k) => (
            <button
              key={k}
              type="button"
              className={"chip" + (tab === k ? " on" : "")}
              style={{ flex: "1 1 30%" }}
              onClick={() => setTab(k)}
            >
              {t(`master.${k}`)}
            </button>
          ))}
        </div>

        {rows.length === 0 && <Empty />}
        {rows.map((r) => {
          const { name, sub } = label(r);
          return (
            <div className="li" key={r.id} style={r.active ? undefined : { opacity: 0.5 }}>
              <Avatar name={name} />
              <div className="m">
                {name} {!r.active && <span className="badge">{t("common.inactive")}</span>}
                <small>{sub}</small>
              </div>
              <div className="r" style={{ display: "flex", gap: 6 }}>
                <button className="chip" style={{ flex: "none", padding: "6px 10px" }} onClick={() => openEdit(r)}>
                  {t("common.edit")}
                </button>
                <button
                  className="chip"
                  style={{ flex: "none", padding: "6px 10px" }}
                  onClick={() => void toggleActive(r)}
                >
                  {r.active ? t("common.deactivate") : t("common.activate")}
                </button>
              </div>
            </div>
          );
        })}
        <p className="mut" style={{ fontSize: 12 }}>
          {t("master.inactiveHint")}
        </p>
      </main>

      <div className="fabwrap">
        <button className="btn" onClick={openNew}>
          ＋ {t("common.add")} — {t(`master.${tab}`)}
        </button>
      </div>

      {editing && (
        <Sheet
          title={`${isNew ? t("common.add") : t("common.edit")} — ${t(`master.${tab}`)}`}
          onClose={() => setEditing(null)}
        >
          {tab === "vehicles" ? (
            <>
              <Field label={t("master.number")}>
                <input value={form.number ?? ""} onChange={set("number")} />
              </Field>
              <Field label={t("master.description")} optional>
                <input value={form.description ?? ""} onChange={set("description")} />
              </Field>
            </>
          ) : (
            <Field label={t("common.name")}>
              <input value={form.name ?? ""} onChange={set("name")} />
            </Field>
          )}

          {tab === "leaders" && (
            <>
              <Field label={t("master.groupType")}>
                <div className="chips">
                  {(["manufacturing", "batti"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={"chip" + ((form.groupType ?? "manufacturing") === g ? " on" : "")}
                      onClick={() => setForm((f) => ({ ...f, groupType: g }))}
                    >
                      {g === "manufacturing" ? t("ledger.manufacturing") : t("ledger.batti")}
                    </button>
                  ))}
                </div>
              </Field>
              {(form.groupType ?? "manufacturing") === "manufacturing" && (
                <Field label={t("ledger.peopleCount")}>
                  <input type="number" inputMode="numeric" value={form.peopleCount ?? "1"} onChange={set("peopleCount")} />
                </Field>
              )}
            </>
          )}

          {tab === "customers" && (
            <Field label={t("common.place")}>
              <input value={form.place ?? ""} onChange={set("place")} />
            </Field>
          )}

          {tab === "employees" && (
            <>
              <Field label={t("emp.designation")}>
                <input value={form.designation ?? ""} onChange={set("designation")} />
              </Field>
              <Field label={t("emp.salary")}>
                <input type="number" inputMode="decimal" value={form.salary ?? ""} onChange={set("salary")} />
              </Field>
            </>
          )}

          {tab !== "vehicles" && (
            <Field label={t("common.phone")} optional>
              <input type="tel" value={form.phone ?? ""} onChange={set("phone")} />
            </Field>
          )}

          <button className="btn" disabled={saving} onClick={() => void save()}>
            {t("common.save")}
          </button>
        </Sheet>
      )}
    </>
  );
}
