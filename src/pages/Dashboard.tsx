import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useData, useDb } from "../data/DataContext";
import { saleTotal, stock, thresholdAlerts, totalCustomerDues, workAmount } from "../lib/calc";
import { fmtBricks, fmtMoney, todayStr } from "../lib/format";
import { Avatar, Sheet } from "../components/ui";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const db = useDb();
  const { mode } = useData();
  const nav = useNavigate();
  const [menu, setMenu] = useState(false);

  const st = stock(db.workEntries, db.sales, db.damageEntries);
  const today = todayStr();
  const todaySales = db.sales
    .filter((s) => s.dateTime.slice(0, 10) === today)
    .reduce((a, s) => a + saleTotal(s), 0);
  const dues = totalCustomerDues(db.sales, db.salePayments);
  const alerts = thresholdAlerts(db).slice(0, 2);

  const recent = [
    ...db.sales.map((s) => ({
      key: "s" + s.id,
      date: s.dateTime,
      node: (
        <Link to={`/sales/${s.id}`} className="li" key={"s" + s.id}>
          <Avatar name={db.customers.find((c) => c.id === s.customerId)?.name ?? "?"} />
          <div className="m">
            {db.customers.find((c) => c.id === s.customerId)?.name}
            <small>
              {fmtBricks(s.qty)} {t("common.bricks")} · {s.place}
            </small>
          </div>
          <div className="r num">{fmtMoney(saleTotal(s))}</div>
        </Link>
      )
    })),
    ...db.workEntries.map((w) => ({
      key: "w" + w.id,
      date: w.date,
      node: (
        <div className="li" key={"w" + w.id}>
          <Avatar name={db.leaders.find((l) => l.id === w.leaderId)?.name ?? "?"} />
          <div className="m">
            {db.leaders.find((l) => l.id === w.leaderId)?.name}
            <small>
              {w.type === "manufacturing"
                ? t("ledger.made", { qty: fmtBricks(w.qty) })
                : t("ledger.loadedBatti", { qty: fmtBricks(w.qty) })}
            </small>
          </div>
          <div className="r num good">+{fmtMoney(workAmount(w))}</div>
        </div>
      )
    }))
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const dateStr = new Date().toLocaleDateString(i18n.language === "te" ? "te-IN" : "en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });

  return (
    <>
      <header className="appbar">
        <div className="mark">SB</div>
        <div className="t">
          <b>
            {db.settings.factoryName}
            {mode === "demo" && (
              <>
                {" "}
                <span className="badge">{t("app.demo")}</span>
              </>
            )}
          </b>
          <small>{dateStr}</small>
        </div>
        <button
          className="lang-btn"
          onClick={() => void i18n.changeLanguage(i18n.language === "te" ? "en" : "te")}
        >
          {i18n.language === "te" ? (
            <>
              <b>తె</b> | EN
            </>
          ) : (
            <>
              తె | <b>EN</b>
            </>
          )}
        </button>
      </header>

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

        <div className="grid2">
          <div className="card">
            <small>{t("dash.todaySales")}</small>
            <b className="num">{fmtMoney(todaySales)}</b>
          </div>
          <div className="card">
            <small>{t("dash.customerDues")}</small>
            <b className="num bad">{fmtMoney(dues)}</b>
          </div>
        </div>

        {alerts.map((a) => {
          const leader = db.leaders.find((l) => l.id === a.leaderId);
          return (
            <Link to={`/ledgers/${a.leaderId}`} key={a.leaderId} className="alert">
              <span className="dot" />
              <span>
                {t(a.kind === "owner_owes" ? "dash.alertOwnerOwes" : "dash.alertLeaderOwes", {
                  name: leader?.name,
                  amount: fmtMoney(Math.abs(a.balance)),
                  limit: fmtMoney(a.limit)
                })}
              </span>
            </Link>
          );
        })}

        <div className="sec">
          <b>{t("dash.recent")}</b>
          <Link to="/sales">{t("common.seeAll")} →</Link>
        </div>
        {recent.map((r) => r.node)}
      </main>

      <div className="fabwrap">
        <button className="btn" onClick={() => setMenu(true)}>
          ＋ {t("dash.newEntry")}
        </button>
      </div>

      {menu && (
        <Sheet title={t("dash.newEntry")} onClose={() => setMenu(false)}>
          <button className="btn" style={{ marginBottom: 9 }} onClick={() => nav("/sales/new")}>
            {t("dash.newSale")}
          </button>
          <button className="btn ghost" style={{ marginBottom: 9 }} onClick={() => nav("/ledgers?new=work")}>
            {t("dash.newWork")}
          </button>
          <button className="btn ghost" style={{ marginBottom: 9 }} onClick={() => nav("/more/purchases?new=1")}>
            {t("dash.newPurchase")}
          </button>
          <button className="btn ghost" style={{ marginBottom: 9 }} onClick={() => nav("/more/procurements?new=1")}>
            {t("dash.newProcurement")}
          </button>
          <button className="btn ghost" onClick={() => nav("/stock?new=1")}>
            {t("dash.newDamage")}
          </button>
        </Sheet>
      )}
    </>
  );
}
