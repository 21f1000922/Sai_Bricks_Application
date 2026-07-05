import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDb } from "../data/DataContext";
import { purchaseTotal, saleTotal, workAmount } from "../lib/calc";
import { fmtBricks, fmtDate, fmtMoney } from "../lib/format";
import { BackBar, Empty } from "../components/ui";

type Cat = "sales" | "production" | "wages" | "purchases" | "expenses" | "damage";
const CATS: Cat[] = ["sales", "production", "wages", "purchases", "expenses", "damage"];

interface Item {
  id: string;
  when: string; // sortable date/datetime
  cat: Cat;
  icon: string;
  title: string;
  subtitle: string;
  to?: string;
  amount: number;
  unit: "money" | "bricks";
  dir: "in" | "out" | "neutral";
}

export default function History() {
  const { t, i18n } = useTranslation();
  const db = useDb();
  const [filter, setFilter] = useState<Cat | "all">("all");

  const items = useMemo<Item[]>(() => {
    const customer = (id: string) => db.customers.find((c) => c.id === id)?.name ?? "?";
    const leader = (id: string) => db.leaders.find((l) => l.id === id)?.name ?? "?";
    const employee = (id?: string) =>
      id ? db.employees.find((e) => e.id === id)?.name ?? "?" : t("common.owner");
    const supplier = (id?: string) => (id ? db.suppliers.find((s) => s.id === id)?.name : undefined);

    const out: Item[] = [];

    for (const s of db.sales) {
      out.push({
        id: "sale-" + s.id,
        when: s.dateTime,
        cat: "sales",
        icon: "🧾",
        title: customer(s.customerId),
        subtitle: `${fmtBricks(s.qty)} ${t("common.bricks")} · ${s.place}`,
        to: `/sales/${s.id}`,
        amount: saleTotal(s),
        unit: "money",
        dir: "in"
      });
    }
    for (const p of db.salePayments) {
      const sale = db.sales.find((s) => s.id === p.saleId);
      out.push({
        id: "spay-" + p.id,
        when: p.date,
        cat: "sales",
        icon: "₹",
        title: t("history.paymentReceived"),
        subtitle: sale ? customer(sale.customerId) : t(`common.${p.mode}`),
        to: sale ? `/sales/${sale.id}` : undefined,
        amount: p.amount,
        unit: "money",
        dir: "in"
      });
    }
    for (const w of db.workEntries) {
      out.push({
        id: "work-" + w.id,
        when: w.date,
        cat: "production",
        icon: "🧱",
        title: leader(w.leaderId),
        subtitle:
          w.type === "manufacturing"
            ? t("ledger.made", { qty: fmtBricks(w.qty) })
            : t("ledger.loadedBatti", { qty: fmtBricks(w.qty) }),
        to: `/ledgers/${w.leaderId}`,
        amount: workAmount(w),
        unit: "money",
        dir: "neutral"
      });
    }
    for (const p of db.leaderPayments) {
      out.push({
        id: "lpay-" + p.id,
        when: p.date,
        cat: "wages",
        icon: p.kind === "settlement" ? "✓" : "₹",
        title: leader(p.leaderId),
        subtitle: t(
          p.kind === "advance"
            ? "ledger.wageAdvance"
            : p.kind === "extra"
              ? "ledger.extra"
              : "ledger.settlement"
        ),
        to: `/ledgers/${p.leaderId}`,
        amount: p.amount,
        unit: "money",
        dir: "out"
      });
    }
    for (const p of db.purchases) {
      const sup = supplier(p.supplierId);
      out.push({
        id: "buy-" + p.id,
        when: p.date,
        cat: "purchases",
        icon: "🛒",
        title: p.itemName,
        subtitle: `${p.qty} ${p.unit}${sup ? ` · ${sup}` : ""}`,
        amount: purchaseTotal(p),
        unit: "money",
        dir: "out"
      });
    }
    for (const p of db.procurements) {
      out.push({
        id: "proc-" + p.id,
        when: p.date,
        cat: "expenses",
        icon: "🧾",
        title: p.itemName,
        subtitle: `${employee(p.employeeId)}${p.reason ? ` · ${p.reason}` : ""}`,
        amount: p.totalPrice,
        unit: "money",
        dir: "out"
      });
    }
    for (const p of db.salaryPayments) {
      out.push({
        id: "sal-" + p.id,
        when: p.date,
        cat: "expenses",
        icon: "🧑‍💼",
        title: employee(p.employeeId),
        subtitle: `${t("emp.salary")} · ${p.month}`,
        amount: p.amount,
        unit: "money",
        dir: "out"
      });
    }
    for (const d of db.damageEntries) {
      out.push({
        id: "dmg-" + d.id,
        when: d.date,
        cat: "damage",
        icon: "🧱",
        title: `${fmtBricks(d.qty)} ${t("common.bricks")}`,
        subtitle: d.note ?? t("stock.damaged"),
        amount: d.qty,
        unit: "bricks",
        dir: "out"
      });
    }

    return out.sort((a, b) => b.when.localeCompare(a.when));
  }, [db, t]);

  const shown = filter === "all" ? items : items.filter((i) => i.cat === filter);

  const amountNode = (it: Item) => {
    if (it.unit === "bricks") {
      return (
        <span className="num bad">
          −{fmtBricks(it.amount)}
        </span>
      );
    }
    const cls = it.dir === "in" ? "good" : it.dir === "out" ? "bad" : "";
    const sign = it.dir === "in" ? "+" : it.dir === "out" ? "−" : "";
    return (
      <span className={"num " + cls}>
        {sign}
        {fmtMoney(it.amount)}
      </span>
    );
  };

  return (
    <>
      <BackBar to="/more" crumb={t("more.title")} title={t("history.title")} />
      <main className="page">
        <div className="chips" style={{ flexWrap: "wrap", marginBottom: 12 }}>
          <button
            type="button"
            className={"chip" + (filter === "all" ? " on" : "")}
            style={{ flex: "1 1 28%" }}
            onClick={() => setFilter("all")}
          >
            {t("history.all")}
          </button>
          {CATS.map((c) => (
            <button
              key={c}
              type="button"
              className={"chip" + (filter === c ? " on" : "")}
              style={{ flex: "1 1 28%" }}
              onClick={() => setFilter(c)}
            >
              {t(`history.${c}`)}
            </button>
          ))}
        </div>

        {shown.length === 0 && <Empty />}
        {shown.map((it) => {
          const inner = (
            <>
              <div className="av">{it.icon}</div>
              <div className="m">
                {it.title}
                <small>
                  {it.subtitle} · {fmtDate(it.when, i18n.language)}
                </small>
              </div>
              <div className="r">{amountNode(it)}</div>
            </>
          );
          return it.to ? (
            <Link className="li" to={it.to} key={it.id}>
              {inner}
            </Link>
          ) : (
            <div className="li" key={it.id}>
              {inner}
            </div>
          );
        })}
      </main>
    </>
  );
}
