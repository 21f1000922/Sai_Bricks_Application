import type { Db } from "../data/types";
import { leaderBalance, purchaseTotal, saleDue, saleTotal, workAmount } from "./calc";

function csvEscape(v: unknown): string {
  const s = v === undefined || v === null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: (string | number | undefined)[][]): string {
  // BOM so Excel opens UTF-8 (Telugu names) correctly
  return "﻿" + rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
}

export function download(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportAll(db: Db): { name: string; csv: string }[] {
  const leaderName = (id: string) => db.leaders.find((l) => l.id === id)?.name ?? id;
  const custName = (id: string) => db.customers.find((c) => c.id === id)?.name ?? id;
  const empName = (id?: string) => (id ? db.employees.find((e) => e.id === id)?.name ?? id : "Owner");

  return [
    {
      name: "sales.csv",
      csv: toCsv([
        ["Date", "Customer", "Place", "Qty", "Rate", "Total", "Paid", "Due", "Loading person", "Loading cost", "Loading paid"],
        ...db.sales.map((s) => [
          s.dateTime,
          custName(s.customerId),
          s.place,
          s.qty,
          s.rate,
          saleTotal(s),
          saleTotal(s) - saleDue(s, db.salePayments),
          saleDue(s, db.salePayments),
          s.loadingPerson,
          s.loadingCost,
          s.loadingPaid ? "Yes" : "No"
        ])
      ])
    },
    {
      name: "work-entries.csv",
      csv: toCsv([
        ["Date", "Leader", "Type", "Qty", "People", "Rate", "Amount"],
        ...db.workEntries.map((w) => [
          w.date,
          leaderName(w.leaderId),
          w.type,
          w.qty,
          w.peopleCount,
          w.rate,
          workAmount(w)
        ])
      ])
    },
    {
      name: "leader-payments.csv",
      csv: toCsv([
        ["Date", "Leader", "Kind", "Amount", "Mode", "Note"],
        ...db.leaderPayments.map((p) => [p.date, leaderName(p.leaderId), p.kind, p.amount, p.mode, p.note])
      ])
    },
    {
      name: "leader-balances.csv",
      csv: toCsv([
        ["Leader", "Earned", "Paid", "Balance"],
        ...db.leaders.map((l) => {
          const b = leaderBalance(l.id, db.workEntries, db.leaderPayments);
          return [l.name, b.earned, b.paid, b.balance];
        })
      ])
    },
    {
      name: "purchases.csv",
      csv: toCsv([
        ["Date", "Item", "Supplier", "Qty", "Unit", "Unit price", "Total", "Paid"],
        ...db.purchases.map((p) => [
          p.date,
          p.itemName,
          p.supplierId ? db.suppliers.find((s) => s.id === p.supplierId)?.name : "",
          p.qty,
          p.unit,
          p.unitPrice,
          purchaseTotal(p),
          p.amountPaid
        ])
      ])
    },
    {
      name: "procurements.csv",
      csv: toCsv([
        ["Date", "Item", "Taken by", "Qty", "Total", "Reason"],
        ...db.procurements.map((p) => [p.date, p.itemName, empName(p.employeeId), p.qty, p.totalPrice, p.reason])
      ])
    },
    {
      name: "salaries.csv",
      csv: toCsv([
        ["Date", "Employee", "For month", "Amount", "Mode"],
        ...db.salaryPayments.map((p) => [p.date, empName(p.employeeId), p.month, p.amount, p.mode])
      ])
    },
    {
      name: "damage.csv",
      csv: toCsv([["Date", "Qty", "Note"], ...db.damageEntries.map((d) => [d.date, d.qty, d.note])])
    }
  ];
}
