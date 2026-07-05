import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useData, useDb } from "../data/DataContext";
import { fmtDate, fmtMoney, thisMonth, todayStr, uid } from "../lib/format";
import type { Employee, PayMode, SalaryPayment } from "../data/types";
import { Avatar, BackBar, DeleteButton, Empty, Field, ModeChips, Sheet } from "../components/ui";

export default function Employees() {
  const { t, i18n } = useTranslation();
  const db = useDb();
  const { addRow, updateRow, removeRow } = useData();

  const [paying, setPaying] = useState<Employee | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(thisMonth());
  const [mode, setMode] = useState<PayMode>("cash");
  const [date, setDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);

  const active = db.employees.filter((e) => e.active);
  const log = [...db.salaryPayments].sort((a, b) => b.date.localeCompare(a.date));

  const startPay = (e: Employee) => {
    setEditId(null);
    setPaying(e);
    setAmount(String(e.salary));
    setMonth(thisMonth());
    setMode("cash");
    setDate(todayStr());
  };

  const openEdit = (p: SalaryPayment) => {
    const emp = db.employees.find((e) => e.id === p.employeeId);
    if (!emp) return;
    setEditId(p.id);
    setPaying(emp);
    setAmount(String(p.amount));
    setMonth(p.month);
    setMode(p.mode);
    setDate(p.date);
  };

  const close = () => {
    setPaying(null);
    setEditId(null);
    setAmount("");
  };

  const save = async () => {
    if (!paying || !Number(amount)) return;
    setSaving(true);
    const row: SalaryPayment = {
      id: editId ?? uid(),
      employeeId: paying.id,
      amount: Number(amount),
      month,
      mode,
      date
    };
    if (editId) await updateRow("salaryPayments", row);
    else await addRow("salaryPayments", row);
    setSaving(false);
    close();
  };

  const del = async () => {
    if (editId) await removeRow("salaryPayments", editId);
    close();
  };

  return (
    <>
      <BackBar to="/more" crumb={t("more.title")} title={t("emp.title")} />
      <main className="page">
        {active.length === 0 && <Empty />}
        {active.map((e) => (
          <div className="li" key={e.id}>
            <Avatar name={e.name} />
            <div className="m">
              {e.name}
              <small>
                {e.designation} · {t("emp.salary")} {fmtMoney(e.salary)}
              </small>
            </div>
            <div className="r">
              <button
                className="chip on"
                style={{ flex: "none", padding: "6px 12px" }}
                onClick={() => startPay(e)}
              >
                {t("emp.pay")}
              </button>
            </div>
          </div>
        ))}

        <div className="sec">
          <b>{t("emp.salaryLog")}</b>
        </div>
        {log.length === 0 && <Empty />}
        {log.map((p) => {
          const emp = db.employees.find((e) => e.id === p.employeeId);
          return (
            <div className="li" key={p.id} style={{ cursor: "pointer" }} onClick={() => openEdit(p)}>
              <div className="av">₹</div>
              <div className="m">
                {emp?.name}
                <small>
                  {t("emp.forMonth")} {p.month} · {fmtDate(p.date, i18n.language)} ·{" "}
                  {t(`common.${p.mode}`)}
                </small>
              </div>
              <div className="r num">{fmtMoney(p.amount)}</div>
            </div>
          );
        })}
      </main>

      {paying && (
        <Sheet
          title={`${editId ? t("common.edit") : t("emp.pay")} — ${paying.name}`}
          onClose={close}
        >
          <Field label={t("common.amount")}>
            <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label={t("emp.forMonth")}>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </Field>
          <Field label={t("common.mode")}>
            <ModeChips value={mode} onChange={setMode} />
          </Field>
          <Field label={t("common.date")}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <button className="btn" disabled={saving || !Number(amount)} onClick={() => void save()}>
            {t("common.save")}
          </button>
          {editId && <DeleteButton onDelete={del} />}
        </Sheet>
      )}
    </>
  );
}
