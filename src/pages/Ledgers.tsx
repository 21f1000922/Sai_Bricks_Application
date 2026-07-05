import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useData, useDb } from "../data/DataContext";
import { leaderBalance } from "../lib/calc";
import { fmtMoney, todayStr, uid } from "../lib/format";
import type { Leader } from "../data/types";
import { Avatar, BackBar, Empty, Field, Sheet } from "../components/ui";

export default function Ledgers() {
  const { t } = useTranslation();
  const db = useDb();
  const { addRow } = useData();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(params.get("new") === "work");

  const [leaderId, setLeaderId] = useState("");
  const [qty, setQty] = useState("");
  const [people, setPeople] = useState("");
  const [date, setDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);

  const active = db.leaders.filter((l) => l.active);
  const leader = active.find((l) => l.id === leaderId);

  const balances = useMemo(
    () =>
      new Map(
        db.leaders.map((l) => [l.id, leaderBalance(l.id, db.workEntries, db.leaderPayments)])
      ),
    [db.leaders, db.workEntries, db.leaderPayments]
  );

  const close = () => {
    setOpen(false);
    if (params.get("new")) setParams({}, { replace: true });
  };

  const save = async () => {
    if (!leader || !Number(qty)) return;
    setSaving(true);
    const isMfg = leader.groupType === "manufacturing";
    await addRow("workEntries", {
      id: uid(),
      leaderId: leader.id,
      type: leader.groupType,
      qty: Number(qty),
      peopleCount: isMfg ? Number(people) || leader.peopleCount : 1,
      rate: isMfg ? db.settings.mfgRate : db.settings.battiRate,
      date
    });
    setSaving(false);
    setQty("");
    close();
  };

  const section = (type: Leader["groupType"], title: string) => {
    const list = active.filter((l) => l.groupType === type);
    if (list.length === 0) return null;
    return (
      <div key={type}>
        <div className="sec">
          <b>{title}</b>
        </div>
        {list.map((l) => {
          const b = balances.get(l.id)!;
          return (
            <Link to={`/ledgers/${l.id}`} className="li" key={l.id}>
              <Avatar name={l.name} />
              <div className="m">
                {l.name}
                <small>
                  {type === "manufacturing"
                    ? t("ledger.people", { count: l.peopleCount })
                    : t("ledger.batti")}
                </small>
              </div>
              <div className="r num">
                <span className={b.balance > 0 ? "bad" : b.balance < 0 ? "good" : "mut"}>
                  {fmtMoney(Math.abs(b.balance))}
                </span>
                <small>
                  {b.balance > 0
                    ? t("ledger.youOwe")
                    : b.balance < 0
                      ? t("ledger.owesYou")
                      : t("ledger.settled")}
                </small>
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <BackBar to="/" crumb={t("nav.home")} title={t("ledger.title")} />
      <main className="page">
        {active.length === 0 && <Empty />}
        {section("manufacturing", t("ledger.manufacturing"))}
        {section("batti", t("ledger.batti"))}
      </main>

      <div className="fabwrap">
        <button className="btn" onClick={() => setOpen(true)}>
          ＋ {t("ledger.newWorkEntry")}
        </button>
      </div>

      {open && (
        <Sheet title={t("ledger.newWorkEntry")} onClose={close}>
          <Field label={t("ledger.leader")}>
            <select
              value={leaderId}
              onChange={(e) => {
                setLeaderId(e.target.value);
                const l = active.find((x) => x.id === e.target.value);
                if (l && l.groupType === "manufacturing") setPeople(String(l.peopleCount));
              }}
            >
              <option value="">{t("common.select")}</option>
              {active.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} — {l.groupType === "manufacturing" ? t("ledger.manufacturing") : t("ledger.batti")}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("ledger.howMany")}>
            <input type="number" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
          </Field>
          {leader?.groupType === "manufacturing" && (
            <Field label={t("ledger.peopleCount")}>
              <input
                type="number"
                inputMode="numeric"
                value={people}
                onChange={(e) => setPeople(e.target.value)}
              />
            </Field>
          )}
          <Field label={t("common.date")}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          {leader && Number(qty) > 0 && (
            <div className="calc">
              <div className="rw tot">
                <span>
                  {Number(qty).toLocaleString("en-IN")} ×{" "}
                  {leader.groupType === "manufacturing" ? db.settings.mfgRate : db.settings.battiRate}
                </span>
                <b className="num">
                  {fmtMoney(
                    Number(qty) *
                      (leader.groupType === "manufacturing"
                        ? db.settings.mfgRate
                        : db.settings.battiRate)
                  )}
                </b>
              </div>
            </div>
          )}
          <button className="btn" disabled={saving || !leader || !Number(qty)} onClick={() => void save()}>
            {t("common.save")}
          </button>
        </Sheet>
      )}
    </>
  );
}
