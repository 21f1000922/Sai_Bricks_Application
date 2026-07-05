import { useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useData, useDb } from "../data/DataContext";
import { round2, saleDue, saleTotal } from "../lib/calc";
import { fmtBricks, fmtDate, fmtDateFull, fmtMoney, todayStr, uid } from "../lib/format";
import type { PayMode } from "../data/types";
import { BackBar, Field, ModeChips, Sheet } from "../components/ui";

export default function SaleDetail() {
  const { t, i18n } = useTranslation();
  const db = useDb();
  const { addRow, updateRow } = useData();
  const { id } = useParams();
  const sale = db.sales.find((s) => s.id === id);

  const [open, setOpen] = useState(false);
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

  const save = async () => {
    if (!Number(amount)) return;
    setSaving(true);
    await addRow("salePayments", {
      id: uid(),
      saleId: sale.id,
      amount: Number(amount),
      mode,
      receivedById: receivedById || undefined,
      date
    });
    setSaving(false);
    setAmount("");
    setOpen(false);
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
            <div className="li" key={p.id}>
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
          <button className="btn" style={{ marginTop: 10 }} onClick={() => setOpen(true)}>
            ＋ {t("sale.addPayment")}
          </button>
        )}
        {due <= 0 && <div className="empty">{t("sale.fullyPaid")} ✓</div>}
      </main>

      {open && (
        <Sheet title={t("sale.addPayment")} onClose={() => setOpen(false)}>
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
        </Sheet>
      )}
    </>
  );
}
