import { useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useData, useDb } from "../data/DataContext";
import { leaderBalance, workAmount } from "../lib/calc";
import { fmtBricks, fmtDate, fmtMoney, todayStr, uid } from "../lib/format";
import type { LeaderPaymentKind, PayMode } from "../data/types";
import { BackBar, Field, ModeChips, Money, Sheet } from "../components/ui";

export default function LedgerDetail() {
  const { t, i18n } = useTranslation();
  const db = useDb();
  const { addRow } = useData();
  const { id } = useParams();
  const leader = db.leaders.find((l) => l.id === id);

  const [payKind, setPayKind] = useState<LeaderPaymentKind | null>(null);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<PayMode>("cash");
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  if (!leader) return <BackBar to="/ledgers" crumb={t("ledger.title")} title="?" />;

  const { earned, paid, balance } = leaderBalance(leader.id, db.workEntries, db.leaderPayments);
  const limit =
    balance >= 0 ? db.settings.thresholdOwedToLeader : db.settings.thresholdLeaderOwes;
  const pct = Math.min(100, Math.round((Math.abs(balance) / limit) * 100));

  const entries = [
    ...db.workEntries
      .filter((w) => w.leaderId === leader.id)
      .map((w) => ({
        date: w.date,
        node: (
          <div className="li" key={"w" + w.id}>
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
          <div className="li" key={"p" + p.id}>
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

  const save = async () => {
    if (!payKind || !Number(amount)) return;
    setSaving(true);
    await addRow("leaderPayments", {
      id: uid(),
      leaderId: leader.id,
      kind: payKind,
      amount: Number(amount),
      mode,
      date,
      note: note || undefined
    });
    setSaving(false);
    setAmount("");
    setNote("");
    setPayKind(null);
  };

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
          <button className="btn" onClick={() => setPayKind("settlement")}>
            {t("ledger.settleUp")}
          </button>
          <button className="btn ghost" onClick={() => setPayKind("advance")}>
            ＋ {t("ledger.advance")}
          </button>
          <button className="btn ghost" onClick={() => setPayKind("extra")}>
            ＋ {t("ledger.extra")}
          </button>
        </div>

        <div className="sec">
          <b>{t("dash.recent")}</b>
        </div>
        {entries.map((e) => e.node)}
      </main>

      {payKind && (
        <Sheet title={t("ledger.payTo", { name: leader.name })} onClose={() => setPayKind(null)}>
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
        </Sheet>
      )}
    </>
  );
}
