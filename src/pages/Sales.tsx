import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDb } from "../data/DataContext";
import { saleDue, saleTotal, totalCustomerDues, totalLoadingPending } from "../lib/calc";
import { fmtBricks, fmtDate, fmtMoney } from "../lib/format";
import { Avatar, BackBar, Empty } from "../components/ui";

export default function Sales() {
  const { t, i18n } = useTranslation();
  const db = useDb();
  const nav = useNavigate();

  const sales = [...db.sales].sort((a, b) => b.dateTime.localeCompare(a.dateTime));
  const dues = totalCustomerDues(db.sales, db.salePayments);
  const loaderPending = totalLoadingPending(db.sales);

  return (
    <>
      <BackBar to="/" crumb={t("nav.home")} title={t("sale.title")} />
      <main className="page">
        <div className="grid2">
          <div className="card">
            <small>{t("sale.dues")}</small>
            <b className="num bad">{fmtMoney(dues)}</b>
          </div>
          <div className="card">
            <small>{t("report.bricksSold")}</small>
            <b className="num">{fmtBricks(db.sales.reduce((a, s) => a + s.qty, 0))}</b>
          </div>
        </div>

        {loaderPending > 0 && (
          <div className="alert">
            <span className="dot" />
            <span>{t("sale.loaderPendingTotal", { amount: fmtMoney(loaderPending) })}</span>
          </div>
        )}

        {sales.length === 0 && <Empty />}
        {sales.map((s) => {
          const c = db.customers.find((x) => x.id === s.customerId);
          const due = saleDue(s, db.salePayments);
          return (
            <Link to={`/sales/${s.id}`} className="li" key={s.id}>
              <Avatar name={c?.name ?? "?"} />
              <div className="m">
                {c?.name}
                <small>
                  {fmtBricks(s.qty)} {t("common.bricks")} · {s.place} ·{" "}
                  {fmtDate(s.dateTime, i18n.language)}
                </small>
              </div>
              <div className="r num">
                {fmtMoney(saleTotal(s))}
                <small className={due > 0 ? "bad" : ""}>
                  {due > 0 ? `${fmtMoney(due)} ${t("common.due")}` : t("sale.fullyPaid")}
                </small>
              </div>
            </Link>
          );
        })}
      </main>
      <div className="fabwrap">
        <button className="btn" onClick={() => nav("/sales/new")}>
          ＋ {t("sale.newSale")}
        </button>
      </div>
    </>
  );
}
