import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useData, useDb } from "../data/DataContext";
import { fmtDate, fmtMoney, thisMonth, todayStr, uid } from "../lib/format";
import type { Employee, PayMode } from "../data/types";
import { Avatar, BackBar, Empty, Field, ModeChips, Sheet } from "../components/ui";

export default function Employees() {
  const { t, i18n } = useTranslation();
  const db = useDb();
  const { addRow } = useData();

  const [paying, setPaying] = useState<Employee | null>(null);
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(thisMonth());
  const [mode, setMode] = useState<PayMode>("cash");
  const [date, setDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);

  const active = db.employees.filter((e) => e.active);
  const log = [...db.salaryPayments].sort((a, b) => b.date.localeCompare(a.date));

  const save = async () => {
    if (!paying || !Number(amount)) return;
    setSaving(true);
    await addRow("salaryPayments", {
      id: uid(),
      employeeId: paying.id,
      amount: Number(amount),
      month,
      mode,
      date
    });
    setSaving(false);
    setAmount("");
    setPaying(null);
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
                onClick={() => {
                  setPaying(e);
                  setAmount(String(e.salary));
                }}
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
            <div className="li" key={p.id}>
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
        <Sheet title={`${t("emp.pay")} — ${paying.name}`} onClose={() => setPaying(null)}>
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
        </Sheet>
      )}
    </>
  );
}
