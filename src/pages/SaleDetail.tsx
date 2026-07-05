import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useData, useDb } from "../data/DataContext";
import { round2, saleDue, saleTotal } from "../lib/calc";
import { fmtBricks, fmtDate, fmtDateFull, fmtMoney, todayStr, uid } from "../lib/format";
import type { PayMode, SalePayment } from "../data/types";
import { BackBar, DeleteButton, Field, ModeChips, Sheet } from "../components/ui";

export default function SaleDetail() {
  const { t, i18n } = useTranslation();
  const db = useDb();
  const { addRow, updateRow, removeRow } = useData();
  const nav = useNavigate();
  const { id } = useParams();
  const sale = db.sales.find((s) => s.id === id);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<PayMode>("cash");
  const [receivedById, setReceivedById] = useState("");
  const [date, setDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);

  if (!sale) return <BackBar to="/sales" crumb={t("sale.title")} title="?" />;

  const customer = db.customers.find((c) => c.id === sale.customerId);
  const total = saleTotal(sale);
  const due = saleDue(sale, db.salePayments);
  const payments = db.salePayments
    .filter((p) => p.saleId === sale.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const deliveredBy = db.employees.find((e) => e.id === sale.deliveredById);
  const vehicle = db.vehicles.find((v) => v.id === sale.vehicleId);

  const startPay = () => {
    setEditId(null);
    setAmount("");
    setMode("cash");
    setReceivedById("");
    setDate(todayStr());
    setOpen(true);
  };

  const openEditPay = (p: SalePayment) => {
    setEditId(p.id);
    setAmount(String(p.amount));
    setMode(p.mode);
    setReceivedById(p.receivedById ?? "");
    setDate(p.date);
    setOpen(true);
  };

  const closePay = () => {
    setOpen(false);
    setEditId(null);
    setAmount("");
  };

  const save = async () => {
    if (!Number(amount)) return;
    setSaving(true);
    const row: SalePayment = {
      id: editId ?? uid(),
      saleId: sale.id,
      amount: Number(amount),
      mode,
      receivedById: receivedById || undefined,
      date
    };
    if (editId) await updateRow("salePayments", row);
    else await addRow("salePayments", row);
    setSaving(false);
    closePay();
  };

  const delPay = async () => {
    if (editId) await removeRow("salePayments", editId);
    closePay();
  };

  const delSale = async () => {
    for (const p of db.salePayments.filter((p) => p.saleId === sale.id)) {
      await removeRow("salePayments", p.id);
    }
    await removeRow("sales", sale.id);
    nav("/sales", { replace: true });
  };

  return (
    <>
      <BackBar
        to="/sales"
        crumb={t("sale.title")}
        title={`${customer?.name ?? "?"} · ${fmtDateFull(sale.dateTime, i18n.language)}`}
      />
      <main className="page">
        <div className="calc">
          <div className="rw tot">
            <span>
              {t("sale.totalLine", { qty: fmtBricks(sale.qty), rate: `₹${sale.rate}` })}
            </span>
            <b className="num">{fmtMoney(total)}</b>
          </div>
          <div className="rw due">
            <span>{t("sale.balanceDue")}</span>
            <b className="num">{fmtMoney(due)}</b>
          </div>
          {sale.loadingCost > 0 && (
            <div className="rw">
              <span>
                {t("sale.loadingPayout")}
                {sale.loadingPerson ? ` · ${sale.loadingPerson}` : ""}
              </span>
              <b className="num">
                {fmtMoney(sale.loadingCost)}{" "}
                <span className={sale.loadingPaid ? "good" : "bad"} style={{ fontWeight: 400, fontSize: 11 }}>
                  {sale.loadingPaid ? `· ${t("common.paid")}` : `· ${t("common.pending")}`}
                </span>
              </b>
            </div>
          )}
        </div>

        {sale.loadingCost > 0 && !sale.loadingPaid && (
          <button
            className="btn ghost"
            onClick={() => void updateRow("sales", { ...sale, loadingPaid: true })}
          >
            ✓ {t("sale.markLoaderPaid")}
          </button>
        )}

        <div className="grid2">
          {deliveredBy && (
            <div className="card">
              <small>{t("sale.deliveredBy")}</small>
              <b>{deliveredBy.name}</b>
            </div>
          )}
          {vehicle && (
            <div className="card">
              <small>{t("sale.vehicle")}</small>
              <b>{vehicle.number}</b>
            </div>
          )}
        </div>

        <div className="sec">
          <b>{t("sale.payments")}</b>
        </div>
        {payments.map((p) => {
          const by = db.employees.find((e) => e.id === p.receivedById);
          return (
            <div className="li" key={p.id} style={{ cursor: "pointer" }} onClick={() => openEditPay(p)}>
              <div className="av">₹</div>
              <div className="m">
                {t(`common.${p.mode}`)}
                <small>
                  {fmtDate(p.date, i18n.language)} · {by ? by.name : t("common.owner")}
                </small>
              </div>
              <div className="r num good">+{fmtMoney(p.amount)}</div>
            </div>
          );
        })}

        {due > 0 && (
          <button className="btn" style={{ marginTop: 10 }} onClick={startPay}>
            ＋ {t("sale.addPayment")}
          </button>
        )}
        {due <= 0 && <div className="empty">{t("sale.fullyPaid")} ✓</div>}

        <div className="btn-row" style={{ marginTop: 18 }}>
          <button className="btn ghost" onClick={() => nav(`/sales/${sale.id}/edit`)}>
            {t("sale.editSale")}
          </button>
        </div>
        <DeleteButton onDelete={delSale} />
      </main>

      {open && (
        <Sheet title={editId ? t("common.edit") : t("sale.addPayment")} onClose={closePay}>
          <Field label={t("common.amount")}>
            <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label={t("common.mode")}>
            <ModeChips value={mode} onChange={setMode} />
          </Field>
          <Field label={t("sale.receivedBy")} optional>
            <select value={receivedById} onChange={(e) => setReceivedById(e.target.value)}>
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
          <Field label={t("common.date")}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <div className="calc">
            <div className="rw due">
              <span>{t("sale.balanceDue")}</span>
              <b className="num">{fmtMoney(round2(due - (Number(amount) || 0)))}</b>
            </div>
          </div>
          <button className="btn" disabled={saving || !Number(amount)} onClick={() => void save()}>
            {t("common.save")}
          </button>
          {editId && <DeleteButton onDelete={delPay} />}
        </Sheet>
      )}
    </>
  );
}
