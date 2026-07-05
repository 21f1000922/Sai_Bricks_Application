import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useData, useDb } from "../data/DataContext";
import { stock } from "../lib/calc";
import { fmtBricks, fmtDate, todayStr, uid } from "../lib/format";
import type { DamageEntry } from "../data/types";
import { BackBar, DeleteButton, Empty, Field, Sheet } from "../components/ui";

export default function Stock() {
  const { t, i18n } = useTranslation();
  const db = useDb();
  const { addRow, updateRow, removeRow } = useData();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(params.get("new") === "1");
  const [editId, setEditId] = useState<string | null>(null);
  const [qty, setQty] = useState("");
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const st = stock(db.workEntries, db.sales, db.damageEntries);
  const damageList = [...db.damageEntries].sort((a, b) => b.date.localeCompare(a.date));

  const openEdit = (d: DamageEntry) => {
    setEditId(d.id);
    setQty(String(d.qty));
    setDate(d.date);
    setNote(d.note ?? "");
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setEditId(null);
    setQty("");
    setNote("");
    setDate(todayStr());
    if (params.get("new")) setParams({}, { replace: true });
  };

  const save = async () => {
    const n = Number(qty);
    if (!n || n <= 0) return;
    setSaving(true);
    const row: DamageEntry = { id: editId ?? uid(), qty: n, date, note: note || undefined };
    if (editId) await updateRow("damageEntries", row);
    else await addRow("damageEntries", row);
    setSaving(false);
    close();
  };

  const del = async () => {
    if (editId) await removeRow("damageEntries", editId);
    close();
  };

  return (
    <>
      <BackBar to="/" crumb={t("nav.home")} title={t("stock.title")} />
      <main className="page">
        <div className="band">
          <div className="lbl">{t("dash.readyToSell")}</div>
          <div className="big num">{fmtBricks(st.ready)}</div>
          <div className="split">
            <div>
              <small>{t("dash.rawWaiting")}</small>
              <b className="num">{fmtBricks(st.raw)}</b>
            </div>
            <div>
              <small>{t("dash.totalOnSite")}</small>
              <b className="num">{fmtBricks(st.total)}</b>
            </div>
          </div>
        </div>

        <div className="sec">
          <b>{t("stock.howItAddsUp")}</b>
        </div>
        <div className="card" style={{ marginBottom: 10 }}>
          <div className="calc" style={{ margin: 0, background: "transparent", padding: "2px 0" }}>
            <div className="rw">
              <span>{t("stock.manufactured")}</span>
              <b className="num">{fmtBricks(st.manufactured)}</b>
            </div>
            <div className="rw">
              <span>{t("stock.loaded")}</span>
              <b className="num">−{fmtBricks(st.loaded)}</b>
            </div>
            <div className="rw tot">
              <span>{t("dash.rawWaiting")}</span>
              <b className="num">{fmtBricks(st.raw)}</b>
            </div>
          </div>
        </div>
        <div className="card" style={{ marginBottom: 10 }}>
          <div className="calc" style={{ margin: 0, background: "transparent", padding: "2px 0" }}>
            <div className="rw">
              <span>{t("stock.loaded")}</span>
              <b className="num">{fmtBricks(st.loaded)}</b>
            </div>
            <div className="rw">
              <span>{t("stock.sold")}</span>
              <b className="num">−{fmtBricks(st.sold)}</b>
            </div>
            <div className="rw">
              <span>{t("stock.damaged")}</span>
              <b className="num">−{fmtBricks(st.damaged)}</b>
            </div>
            <div className="rw tot">
              <span>{t("dash.readyToSell")}</span>
              <b className="num">{fmtBricks(st.ready)}</b>
            </div>
          </div>
        </div>

        <button className="btn ghost" onClick={() => setOpen(true)}>
          ＋ {t("stock.recordDamaged")}
        </button>

        <div className="sec">
          <b>{t("stock.history")}</b>
        </div>
        {damageList.length === 0 && <Empty />}
        {damageList.map((d) => (
          <div className="li" key={d.id} style={{ cursor: "pointer" }} onClick={() => openEdit(d)}>
            <div className="av">🧱</div>
            <div className="m">
              {fmtBricks(d.qty)} {t("common.bricks")}
              <small>
                {fmtDate(d.date, i18n.language)}
                {d.note ? ` · ${d.note}` : ""}
              </small>
            </div>
            <div className="r num bad">−{fmtBricks(d.qty)}</div>
          </div>
        ))}
      </main>

      {open && (
        <Sheet title={editId ? t("common.edit") : t("stock.recordDamaged")} onClose={close}>
          <Field label={t("ledger.howMany")}>
            <input
              type="number"
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </Field>
          <Field label={t("common.date")}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label={t("common.note")} optional>
            <input value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <button className="btn" disabled={saving || !Number(qty)} onClick={() => void save()}>
            {t("common.save")}
          </button>
          {editId && <DeleteButton onDelete={del} />}
        </Sheet>
      )}
    </>
  );
}
