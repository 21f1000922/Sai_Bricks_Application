import { useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useData, useDb } from "../data/DataContext";
import { leaderBalance, workAmount } from "../lib/calc";
import { fmtBricks, fmtDate, fmtMoney, todayStr, uid } from "../lib/format";
import type { LeaderPayment, LeaderPaymentKind, PayMode, WorkEntry } from "../data/types";
import { BackBar, DeleteButton, Field, ModeChips, Money, Sheet } from "../components/ui";

export default function LedgerDetail() {
  const { t, i18n } = useTranslation();
  const db = useDb();
  const { addRow, updateRow, removeRow } = useData();
  const { id } = useParams();
  const leader = db.leaders.find((l) => l.id === id);

  const [payKind, setPayKind] = useState<LeaderPaymentKind | null>(null);
  const [editPayId, setEditPayId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<PayMode>("cash");
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const [editWork, setEditWork] = useState<WorkEntry | null>(null);
  const [workQty, setWorkQty] = useState("");
  const [workPeople, setWorkPeople] = useState("");
  const [workDate, setWorkDate] = useState(todayStr());

  if (!leader) return <BackBar to="/ledgers" crumb={t("ledger.title")} title="?" />;

  const { earned, paid, balance } = leaderBalance(leader.id, db.workEntries, db.leaderPayments);
  const limit =
    balance >= 0 ? db.settings.thresholdOwedToLeader : db.settings.thresholdLeaderOwes;
  const pct = Math.min(100, Math.round((Math.abs(balance) / limit) * 100));

  const startPay = (kind: LeaderPaymentKind) => {
    setEditPayId(null);
    setPayKind(kind);
    setAmount("");
    setMode("cash");
    setDate(todayStr());
    setNote("");
  };

  const openPay = (p: LeaderPayment) => {
    setEditPayId(p.id);
    setPayKind(p.kind);
    setAmount(String(p.amount));
    setMode(p.mode);
    setDate(p.date);
    setNote(p.note ?? "");
  };

  const closePay = () => {
    setPayKind(null);
    setEditPayId(null);
    setAmount("");
    setNote("");
  };

  const save = async () => {
    if (!payKind || !Number(amount)) return;
    setSaving(true);
    const row: LeaderPayment = {
      id: editPayId ?? uid(),
      leaderId: leader.id,
      kind: payKind,
      amount: Number(amount),
      mode,
      date,
      note: note || undefined
    };
    if (editPayId) await updateRow("leaderPayments", row);
    else await addRow("leaderPayments", row);
    setSaving(false);
    closePay();
  };

  const delPay = async () => {
    if (editPayId) await removeRow("leaderPayments", editPayId);
    closePay();
  };

  const openWork = (w: WorkEntry) => {
    setEditWork(w);
    setWorkQty(String(w.qty));
    setWorkPeople(String(w.peopleCount));
    setWorkDate(w.date);
  };

  const saveWork = async () => {
    if (!editWork || !Number(workQty)) return;
    setSaving(true);
    await updateRow("workEntries", {
      ...editWork,
      qty: Number(workQty),
      peopleCount:
        editWork.type === "manufacturing" ? Number(workPeople) || editWork.peopleCount : 1,
      date: workDate
    });
    setSaving(false);
    setEditWork(null);
  };

  const delWork = async () => {
    if (editWork) await removeRow("workEntries", editWork.id);
    setEditWork(null);
  };

  const entries = [
    ...db.workEntries
      .filter((w) => w.leaderId === leader.id)
      .map((w) => ({
        date: w.date,
        node: (
          <div className="li" key={"w" + w.id} style={{ cursor: "pointer" }} onClick={() => openWork(w)}>
            <div className="av">🧱</div>
            <div className="m">
              {w.type === "manufacturing"
                ? t("ledger.made", { qty: fmtBricks(w.qty) })
                : t("ledger.loadedBatti", { qty: fmtBricks(w.qty) })}
              <small>
                {fmtDate(w.date, i18n.language)}
                {w.type === "manufacturing" ? ` · ${t("ledger.people", { count: w.peopleCount })}` : ""} ·{" "}
                {t("ledger.atRate", { rate: w.rate })}
              </small>
            </div>
            <div className="r num good">+{fmtMoney(workAmount(w))}</div>
          </div>
        )
      })),
    ...db.leaderPayments
      .filter((p) => p.leaderId === leader.id)
      .map((p) => ({
        date: p.date,
        node: (
          <div className="li" key={"p" + p.id} style={{ cursor: "pointer" }} onClick={() => openPay(p)}>
            <div className="av">{p.kind === "settlement" ? "✓" : "₹"}</div>
            <div className="m">
              {t(
                p.kind === "advance"
                  ? "ledger.wageAdvance"
                  : p.kind === "extra"
                    ? "ledger.extra"
                    : "ledger.settlement"
              )}
              <small>
                {fmtDate(p.date, i18n.language)} · {t(`common.${p.mode}`)}
                {p.note ? ` · ${p.note}` : ""}
              </small>
            </div>
            <div className="r num bad">−{fmtMoney(p.amount)}</div>
          </div>
        )
      }))
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <BackBar
        to="/ledgers"
        crumb={t("ledger.title")}
        title={`${leader.name} · ${
          leader.groupType === "manufacturing"
            ? `${t("ledger.manufacturing")} (${t("ledger.people", { count: leader.peopleCount })})`
            : t("ledger.batti")
        }`}
      />
      <main className="page">
        <div className="bal">
          <small>
            {balance > 0 ? t("ledger.youOwe") : balance < 0 ? t("ledger.owesYou") : t("ledger.settled")}
          </small>
          <div className={"v num " + (balance > 0 ? "owe" : balance < 0 ? "pos" : "")}>
            {fmtMoney(Math.abs(balance))}
          </div>
          {balance !== 0 && (
            <>
              <div className="meter">
                <i style={{ width: pct + "%" }} />
              </div>
              <div className="meter-lbl num">
                {t("ledger.ofLimit", { value: fmtMoney(Math.abs(balance)), limit: fmtMoney(limit) })}
              </div>
            </>
          )}
        </div>

        <div className="grid2">
          <div className="card">
            <small>{t("ledger.earned")}</small>
            <b className="num good">{fmtMoney(earned)}</b>
          </div>
          <div className="card">
            <small>{t("ledger.paidOut")}</small>
            <b className="num">{fmtMoney(paid)}</b>
          </div>
        </div>

        <div className="btn-row">
          <button className="btn" onClick={() => startPay("settlement")}>
            {t("ledger.settleUp")}
          </button>
          <button className="btn ghost" onClick={() => startPay("advance")}>
            ＋ {t("ledger.advance")}
          </button>
          <button className="btn ghost" onClick={() => startPay("extra")}>
            ＋ {t("ledger.extra")}
          </button>
        </div>

        <div className="sec">
          <b>{t("dash.recent")}</b>
        </div>
        {entries.map((e) => e.node)}
      </main>

      {payKind && (
        <Sheet title={t("ledger.payTo", { name: leader.name })} onClose={closePay}>
          <Field label={t("ledger.kind")}>
            <div className="chips">
              {(["settlement", "advance", "extra"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={"chip" + (payKind === k ? " on" : "")}
                  onClick={() => setPayKind(k)}
                >
                  {t(k === "advance" ? "ledger.advance" : k === "extra" ? "ledger.extra" : "ledger.settlement")}
                </button>
              ))}
            </div>
          </Field>
          <Field label={t("common.amount")}>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Field label={t("common.mode")}>
            <ModeChips value={mode} onChange={setMode} />
          </Field>
          <Field label={t("common.date")}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label={t("common.note")} optional>
            <input value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          {payKind === "settlement" && balance > 0 && (
            <div className="calc">
              <div className="rw">
                <span>{t("ledger.youOwe")}</span>
                <b>
                  <Money value={balance} />
                </b>
              </div>
            </div>
          )}
          <button className="btn" disabled={saving || !Number(amount)} onClick={() => void save()}>
            {t("common.save")}
          </button>
          {editPayId && <DeleteButton onDelete={delPay} />}
        </Sheet>
      )}

      {editWork && (
        <Sheet title={t("common.edit")} onClose={() => setEditWork(null)}>
          <Field label={t("ledger.howMany")}>
            <input
              type="number"
              inputMode="numeric"
              value={workQty}
              onChange={(e) => setWorkQty(e.target.value)}
            />
          </Field>
          {editWork.type === "manufacturing" && (
            <Field label={t("ledger.peopleCount")}>
              <input
                type="number"
                inputMode="numeric"
                value={workPeople}
                onChange={(e) => setWorkPeople(e.target.value)}
              />
            </Field>
          )}
          <Field label={t("common.date")}>
            <input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} />
          </Field>
          {Number(workQty) > 0 && (
            <div className="calc">
              <div className="rw tot">
                <span>
                  {Number(workQty).toLocaleString("en-IN")} × {editWork.rate}
                </span>
                <b className="num">{fmtMoney(Number(workQty) * editWork.rate)}</b>
              </div>
            </div>
          )}
          <button className="btn" disabled={saving || !Number(workQty)} onClick={() => void saveWork()}>
            {t("common.save")}
          </button>
          <DeleteButton onDelete={delWork} />
        </Sheet>
      )}
    </>
  );
}
