import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useData, useDb } from "../data/DataContext";
import { purchaseDue, purchaseTotal, round2 } from "../lib/calc";
import { fmtDate, fmtMoney, todayStr, uid } from "../lib/format";
import type { PayMode } from "../data/types";
import { Avatar, BackBar, Empty, Field, ModeChips, Sheet } from "../components/ui";

export default function Purchases() {
  const { t, i18n } = useTranslation();
  const db = useDb();
  const { addRow } = useData();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(params.get("new") === "1");

  const [item, setItem] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [newSupplier, setNewSupplier] = useState("");
  const [unit, setUnit] = useState("");
  const [qty, setQty] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [paid, setPaid] = useState("");
  const [mode, setMode] = useState<PayMode>("cash");
  const [date, setDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);

  const list = [...db.purchases].sort((a, b) => b.date.localeCompare(a.date));
  const totalOwed = round2(list.reduce((a, p) => a + purchaseDue(p), 0));
  const isNewSup = supplierId === "__new";
  const total = round2((Number(qty) || 0) * (Number(unitPrice) || 0));
  const valid = item.trim() && Number(qty) > 0 && Number(unitPrice) > 0;

  const close = () => {
    setOpen(false);
    if (params.get("new")) setParams({}, { replace: true });
  };

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    let sid: string | undefined = supplierId || undefined;
    if (isNewSup) {
      sid = uid();
      await addRow("suppliers", { id: sid, name: newSupplier.trim(), active: true });
    }
    await addRow("purchases", {
      id: uid(),
      itemName: item.trim(),
      supplierId: sid === "__new" ? undefined : sid,
      unit: unit.trim(),
      qty: Number(qty),
      unitPrice: Number(unitPrice),
      amountPaid: Number(paid) || 0,
      mode,
      date
    });
    setSaving(false);
    setItem("");
    setQty("");
    setUnitPrice("");
    setPaid("");
    close();
  };

  return (
    <>
      <BackBar to="/more" crumb={t("more.title")} title={t("purchase.title")} />
      <main className="page">
        <div className="grid2">
          <div className="card">
            <small>{t("purchase.weOwe")}</small>
            <b className="num bad">{fmtMoney(totalOwed)}</b>
          </div>
          <div className="card">
            <small>{t("common.total")}</small>
            <b className="num">{fmtMoney(round2(list.reduce((a, p) => a + purchaseTotal(p), 0)))}</b>
          </div>
        </div>

        {list.length === 0 && <Empty />}
        {list.map((p) => {
          const sup = db.suppliers.find((s) => s.id === p.supplierId);
          const due = purchaseDue(p);
          return (
            <div className="li" key={p.id}>
              <Avatar name={p.itemName} />
              <div className="m">
                {p.itemName}
                <small>
                  {p.qty} {p.unit} × {fmtMoney(p.unitPrice)}
                  {sup ? ` · ${sup.name}` : ""} · {fmtDate(p.date, i18n.language)}
                </small>
              </div>
              <div className="r num">
                {fmtMoney(purchaseTotal(p))}
                <small className={due > 0 ? "bad" : ""}>
                  {due > 0 ? `${fmtMoney(due)} ${t("purchase.weOwe")}` : t("sale.fullyPaid")}
                </small>
              </div>
            </div>
          );
        })}
      </main>

      <div className="fabwrap">
        <button className="btn" onClick={() => setOpen(true)}>
          ＋ {t("purchase.newPurchase")}
        </button>
      </div>

      {open && (
        <Sheet title={t("purchase.newPurchase")} onClose={close}>
          <Field label={t("purchase.item")}>
            <input value={item} onChange={(e) => setItem(e.target.value)} />
          </Field>
          <Field label={t("purchase.supplier")} optional>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">{t("common.select")}</option>
              {db.suppliers
                .filter((s) => s.active)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              <option value="__new">＋ {t("common.add")}…</option>
            </select>
          </Field>
          {isNewSup && (
            <Field label={t("common.name")}>
              <input value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} />
            </Field>
          )}
          <div className="grid2" style={{ marginBottom: 0 }}>
            <Field label={t("common.qty")}>
              <input type="number" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
            </Field>
            <Field label={t("purchase.unit")}>
              <input value={unit} onChange={(e) => setUnit(e.target.value)} />
            </Field>
          </div>
          <div className="grid2" style={{ marginBottom: 0 }}>
            <Field label={t("purchase.unitPrice")}>
              <input type="number" inputMode="decimal" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
            </Field>
            <Field label={t("purchase.amountPaid")}>
              <input type="number" inputMode="decimal" value={paid} onChange={(e) => setPaid(e.target.value)} />
            </Field>
          </div>
          <Field label={t("common.mode")}>
            <ModeChips value={mode} onChange={setMode} />
          </Field>
          <Field label={t("common.date")}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <div className="calc">
            <div className="rw tot">
              <span>{t("common.total")}</span>
              <b className="num">{fmtMoney(total)}</b>
            </div>
            <div className="rw due">
              <span>{t("purchase.weOwe")}</span>
              <b className="num">{fmtMoney(round2(total - (Number(paid) || 0)))}</b>
            </div>
          </div>
          <button className="btn" disabled={saving || !valid} onClick={() => void save()}>
            {t("common.save")}
          </button>
        </Sheet>
      )}
    </>
  );
}
