import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDb } from "../data/DataContext";
import { monthSummary, round2 } from "../lib/calc";
import { fmtBricks, fmtMoney, thisMonth } from "../lib/format";
import { download, exportAll } from "../lib/csv";
import { BackBar, Field } from "../components/ui";

export default function Reports() {
  const { t } = useTranslation();
  const db = useDb();
  const [month, setMonth] = useState(thisMonth());
  const m = monthSummary(db, month);
  const net = round2(m.moneyIn - m.moneyOut);

  const doExport = () => {
    for (const f of exportAll(db)) download(f.name, f.csv);
  };

  return (
    <>
      <BackBar to="/more" crumb={t("more.title")} title={t("report.title")} />
      <main className="page">
        <Field label={t("report.month")}>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </Field>

        <div className="grid2">
          <div className="card">
            <small>{t("report.moneyIn")}</small>
            <b className="num good">{fmtMoney(m.moneyIn)}</b>
          </div>
          <div className="card">
            <small>{t("report.moneyOut")}</small>
            <b className="num bad">{fmtMoney(m.moneyOut)}</b>
          </div>
        </div>
        <div className="band">
          <div className="lbl">{t("report.net")}</div>
          <div className="big num">{fmtMoney(net)}</div>
          <div className="split">
            <div>
              <small>{t("report.bricksMade")}</small>
              <b className="num">{fmtBricks(m.bricksMade)}</b>
            </div>
            <div>
              <small>{t("report.bricksSold")}</small>
              <b className="num">{fmtBricks(m.bricksSold)}</b>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 12 }}>
          <div className="calc" style={{ margin: 0, background: "transparent", padding: "2px 0" }}>
            <div className="rw">
              <span>{t("report.salesBilled")}</span>
              <b className="num">{fmtMoney(m.salesAmount)}</b>
            </div>
            <div className="rw">
              <span>{t("report.purchasesPaid")}</span>
              <b className="num">−{fmtMoney(m.purchasesPaid)}</b>
            </div>
            <div className="rw">
              <span>{t("report.leaderPaid")}</span>
              <b className="num">−{fmtMoney(m.leaderPaid)}</b>
            </div>
            <div className="rw">
              <span>{t("report.procurements")}</span>
              <b className="num">−{fmtMoney(m.procurements)}</b>
            </div>
            <div className="rw">
              <span>{t("report.salaries")}</span>
              <b className="num">−{fmtMoney(m.salaries)}</b>
            </div>
            <div className="rw">
              <span>{t("report.loadingPaid")}</span>
              <b className="num">−{fmtMoney(m.loadingCosts)}</b>
            </div>
          </div>
        </div>

        <button className="btn ghost" onClick={doExport}>
          ⬇ {t("report.exportCsv")}
        </button>
      </main>
    </>
  );
}
