import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useData, useDb } from "../data/DataContext";
import { round2 } from "../lib/calc";
import { fmtMoney, nowLocalISO, todayStr, uid } from "../lib/format";
import type { PayMode } from "../data/types";
import { BackBar, Field, ModeChips } from "../components/ui";

export default function NewSale() {
  const { t } = useTranslation();
  const db = useDb();
  const { addRow, updateRow } = useData();
  const nav = useNavigate();
  const { id: editId } = useParams();
  const editing = editId ? db.sales.find((s) => s.id === editId) : undefined;

  const [customerId, setCustomerId] = useState(editing?.customerId ?? "");
  const [newCustomer, setNewCustomer] = useState("");
  const [place, setPlace] = useState(editing?.place ?? "");
  const [qty, setQty] = useState(editing ? String(editing.qty) : "");
  const [rate, setRate] = useState(
    editing ? String(editing.rate) : String(db.settings.defaultBrickPrice)
  );
  const [loadingPerson, setLoadingPerson] = useState(editing?.loadingPerson ?? "");
  const [loadingCost, setLoadingCost] = useState(editing ? String(editing.loadingCost) : "");
  const [loadingPaid, setLoadingPaid] = useState(editing ? editing.loadingPaid : true);
  const [deliveredById, setDeliveredById] = useState(editing?.deliveredById ?? "");
  const [vehicleId, setVehicleId] = useState(editing?.vehicleId ?? "");
  const [received, setReceived] = useState("");
  const [mode, setMode] = useState<PayMode>("cash");
  const [receivedById, setReceivedById] = useState("");
  const [saving, setSaving] = useState(false);

  const activeCustomers = db.customers.filter((c) => c.active);
  const activeEmployees = db.employees.filter((e) => e.active);
  const activeVehicles = db.vehicles.filter((v) => v.active);

  const nQty = Number(qty) || 0;
  const nRate = Number(rate) || 0;
  const nLoad = Number(loadingCost) || 0;
  const nRecv = Number(received) || 0;
  // Rate already includes loading, so the customer total is brick value only.
  const total = round2(nQty * nRate);
  const due = round2(total - nRecv);

  const isNew = customerId === "__new";
  const valid = nQty > 0 && nRate > 0 && (isNew ? newCustomer.trim() : customerId);

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    let cid = customerId;
    if (isNew) {
      cid = uid();
      await addRow("customers", {
        id: cid,
        name: newCustomer.trim(),
        place: place.trim(),
        active: true
      });
    }
    const resolvedPlace = place.trim() || (activeCustomers.find((c) => c.id === cid)?.place ?? "");

    if (editing) {
      await updateRow("sales", {
        ...editing,
        customerId: cid,
        place: resolvedPlace,
        qty: nQty,
        rate: nRate,
        loadingPerson: loadingPerson.trim() || undefined,
        loadingCost: nLoad,
        loadingPaid: nLoad > 0 ? loadingPaid : true,
        deliveredById: deliveredById || undefined,
        vehicleId: vehicleId || undefined
      });
      setSaving(false);
      nav(`/sales/${editing.id}`, { replace: true });
      return;
    }

    const saleId = uid();
    await addRow("sales", {
      id: saleId,
      customerId: cid,
      place: resolvedPlace,
      qty: nQty,
      rate: nRate,
      loadingPerson: loadingPerson.trim() || undefined,
      loadingCost: nLoad,
      loadingPaid: nLoad > 0 ? loadingPaid : true,
      deliveredById: deliveredById || undefined,
      vehicleId: vehicleId || undefined,
      dateTime: nowLocalISO()
    });
    if (nRecv > 0) {
      await addRow("salePayments", {
        id: uid(),
        saleId,
        amount: nRecv,
        mode,
        receivedById: receivedById || undefined,
        date: todayStr()
      });
    }
    setSaving(false);
    nav(`/sales/${saleId}`, { replace: true });
  };

  return (
    <>
      <BackBar
        to={editing ? `/sales/${editing.id}` : "/sales"}
        crumb={t("sale.title")}
        title={editing ? t("sale.editSale") : t("sale.newSale")}
      />
      <main className="page">
        <Field label={t("sale.customer")}>
          <select
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value);
              const c = activeCustomers.find((x) => x.id === e.target.value);
              if (c) setPlace(c.place);
            }}
          >
            <option value="">{t("common.select")}</option>
            {activeCustomers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.place}
              </option>
            ))}
            <option value="__new">＋ {t("common.add")}…</option>
          </select>
        </Field>
        {isNew && (
          <Field label={t("common.name")}>
            <input value={newCustomer} onChange={(e) => setNewCustomer(e.target.value)} />
          </Field>
        )}
        <Field label={t("common.place")}>
          <input value={place} onChange={(e) => setPlace(e.target.value)} />
        </Field>

        <div className="grid2" style={{ marginBottom: 0 }}>
          <Field label={t("sale.qty")}>
            <input type="number" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
          </Field>
          <Field label={t("sale.rate")}>
            <input type="number" inputMode="decimal" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
          </Field>
        </div>
        <div className="grid2" style={{ marginBottom: 0 }}>
          <Field label={t("sale.loadingPerson")} optional>
            <input value={loadingPerson} onChange={(e) => setLoadingPerson(e.target.value)} />
          </Field>
          <Field label={t("sale.loadingCost")}>
            <input
              type="number"
              inputMode="decimal"
              value={loadingCost}
              onChange={(e) => setLoadingCost(e.target.value)}
            />
          </Field>
        </div>
        <div className="grid2" style={{ marginBottom: 0 }}>
          <Field label={t("sale.deliveredBy")} optional>
            <select value={deliveredById} onChange={(e) => setDeliveredById(e.target.value)}>
              <option value="">{t("common.select")}</option>
              {activeEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("sale.vehicle")} optional>
            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              <option value="">{t("common.select")}</option>
              {activeVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.number}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="calc">
          <div className="rw tot">
            <span>{t("sale.totalLine", { qty: nQty.toLocaleString("en-IN"), rate: `₹${nRate}` })}</span>
            <b className="num">{fmtMoney(total)}</b>
          </div>
          {nLoad > 0 && (
            <div className="rw">
              <span>{t("sale.loadingPayout")}</span>
              <b className="num">{fmtMoney(nLoad)}</b>
            </div>
          )}
        </div>

        {nLoad > 0 && (
          <Field label={t("sale.paidToLoaderQ")}>
            <div className="chips" role="radiogroup">
              <button
                type="button"
                role="radio"
                aria-checked={loadingPaid}
                className={"chip" + (loadingPaid ? " on" : "")}
                onClick={() => setLoadingPaid(true)}
              >
                {t("common.paid")}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={!loadingPaid}
                className={"chip" + (!loadingPaid ? " on" : "")}
                onClick={() => setLoadingPaid(false)}
              >
                {t("common.pending")}
              </button>
            </div>
          </Field>
        )}

        {!editing && (
          <>
            <Field label={t("sale.receivedNow")}>
              <input type="number" inputMode="decimal" value={received} onChange={(e) => setReceived(e.target.value)} />
            </Field>
            {nRecv > 0 && (
              <>
                <Field label={t("common.mode")}>
                  <ModeChips value={mode} onChange={setMode} />
                </Field>
                <Field label={t("sale.receivedBy")} optional>
                  <select value={receivedById} onChange={(e) => setReceivedById(e.target.value)}>
                    <option value="">{t("common.owner")}</option>
                    {activeEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            )}

            <div className="calc">
              <div className="rw due">
                <span>{t("sale.balanceDue")}</span>
                <b className="num">{fmtMoney(due)}</b>
              </div>
            </div>
          </>
        )}

        <button className="btn" disabled={saving || !valid} onClick={() => void save()}>
          {editing ? t("common.save") : t("sale.saveSale")}
        </button>
      </main>
    </>
  );
}
