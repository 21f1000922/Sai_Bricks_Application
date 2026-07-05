import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useData, useDb } from "../data/DataContext";
import { fmtDate, fmtMoney, todayStr, uid } from "../lib/format";
import type { Procurement } from "../data/types";
import { Avatar, BackBar, DeleteButton, Empty, Field, Sheet } from "../components/ui";

export default function Procurements() {
  const { t, i18n } = useTranslation();
  const db = useDb();
  const { addRow, updateRow, removeRow } = useData();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(params.get("new") === "1");
  const [editId, setEditId] = useState<string | null>(null);

  const [item, setItem] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);

  const list = [...db.procurements].sort((a, b) => b.date.localeCompare(a.date));
  const valid = item.trim() && Number(price) > 0;

  const reset = () => {
    setItem("");
    setEmployeeId("");
    setQty("");
    setPrice("");
    setReason("");
    setDate(todayStr());
  };

  const openEdit = (p: Procurement) => {
    setEditId(p.id);
    setItem(p.itemName);
    setEmployeeId(p.employeeId ?? "");
    setQty(p.qty != null ? String(p.qty) : "");
    setPrice(String(p.totalPrice));
    setReason(p.reason);
    setDate(p.date);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setEditId(null);
    reset();
    if (params.get("new")) setParams({}, { replace: true });
  };

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    const row: Procurement = {
      id: editId ?? uid(),
      itemName: item.trim(),
      employeeId: employeeId || undefined,
      qty: Number(qty) || undefined,
      totalPrice: Number(price),
      reason: reason.trim(),
      date
    };
    if (editId) await updateRow("procurements", row);
    else await addRow("procurements", row);
    setSaving(false);
    close();
  };

  const del = async () => {
    if (editId) await removeRow("procurements", editId);
    close();
  };

  return (
    <>
      <BackBar to="/more" crumb={t("more.title")} title={t("proc.title")} />
      <main className="page">
        {list.length === 0 && <Empty />}
        {list.map((p) => {
          const emp = db.employees.find((e) => e.id === p.employeeId);
          return (
            <div className="li" key={p.id} style={{ cursor: "pointer" }} onClick={() => openEdit(p)}>
              <Avatar name={p.itemName} />
              <div className="m">
                {p.itemName}
                <small>
                  {emp ? emp.name : t("common.owner")} · {fmtDate(p.date, i18n.language)}
                  {p.reason ? ` · ${p.reason}` : ""}
                </small>
              </div>
              <div className="r num">{fmtMoney(p.totalPrice)}</div>
            </div>
          );
        })}
      </main>

      <div className="fabwrap">
        <button className="btn" onClick={() => setOpen(true)}>
          ＋ {t("proc.newProc")}
        </button>
      </div>

      {open && (
        <Sheet title={editId ? t("common.edit") : t("proc.newProc")} onClose={close}>
          <Field label={t("proc.item")}>
            <input value={item} onChange={(e) => setItem(e.target.value)} />
          </Field>
          <Field label={t("proc.takenBy")}>
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">{t("common.owner")}</option>
              {db.employees
                .filter((e) => e.active)
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
            </select>
          </Field>
          <div className="grid2" style={{ marginBottom: 0 }}>
            <Field label={t("common.qty")} optional>
              <input type="number" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
            </Field>
            <Field label={t("common.total")}>
              <input type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
            </Field>
          </div>
          <Field label={t("common.reason")}>
            <input value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <Field label={t("common.date")}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <button className="btn" disabled={saving || !valid} onClick={() => void save()}>
            {t("common.save")}
          </button>
          {editId && <DeleteButton onDelete={del} />}
        </Sheet>
      )}
    </>
  );
}
