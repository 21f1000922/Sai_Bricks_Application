import type {
  DamageEntry,
  Db,
  LeaderPayment,
  Purchase,
  Sale,
  SalePayment,
  WorkEntry
} from "../data/types";

export const workAmount = (w: WorkEntry) => round2(w.qty * w.rate);
// Customer total is brick value only — the per-brick rate already includes loading.
// loadingCost is money WE pay the temporary loader (an expense, see monthSummary).
export const saleTotal = (s: Sale) => round2(s.qty * s.rate);
export const purchaseTotal = (p: Purchase) => round2(p.qty * p.unitPrice);

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Positive = owner owes the leader; negative = leader owes the owner. */
export function leaderBalance(
  leaderId: string,
  workEntries: WorkEntry[],
  payments: LeaderPayment[]
) {
  const earned = round2(
    workEntries.filter((w) => w.leaderId === leaderId).reduce((a, w) => a + workAmount(w), 0)
  );
  const paid = round2(
    payments.filter((p) => p.leaderId === leaderId).reduce((a, p) => a + p.amount, 0)
  );
  return { earned, paid, balance: round2(earned - paid) };
}

export function salePaid(saleId: string, payments: SalePayment[]) {
  return round2(payments.filter((p) => p.saleId === saleId).reduce((a, p) => a + p.amount, 0));
}

export function saleDue(sale: Sale, payments: SalePayment[]) {
  return round2(saleTotal(sale) - salePaid(sale.id, payments));
}

export function customerDues(customerId: string, sales: Sale[], payments: SalePayment[]) {
  return round2(
    sales
      .filter((s) => s.customerId === customerId)
      .reduce((a, s) => a + saleDue(s, payments), 0)
  );
}

export function totalCustomerDues(sales: Sale[], payments: SalePayment[]) {
  return round2(sales.reduce((a, s) => a + saleDue(s, payments), 0));
}

/** Loading money still owed to temporary loaders across all sales. */
export function totalLoadingPending(sales: Sale[]) {
  return round2(sales.filter((s) => !s.loadingPaid).reduce((a, s) => a + s.loadingCost, 0));
}

export function purchaseDue(p: Purchase) {
  return round2(purchaseTotal(p) - p.amountPaid);
}

export interface Stock {
  manufactured: number;
  loaded: number;
  sold: number;
  damaged: number;
  raw: number;
  ready: number;
  total: number;
}

/**
 * Approved pipeline math:
 * raw   = manufactured − loaded into batti
 * ready = loaded − sold − damaged
 */
export function stock(
  workEntries: WorkEntry[],
  sales: Sale[],
  damage: DamageEntry[]
): Stock {
  const manufactured = workEntries
    .filter((w) => w.type === "manufacturing")
    .reduce((a, w) => a + w.qty, 0);
  const loaded = workEntries.filter((w) => w.type === "batti").reduce((a, w) => a + w.qty, 0);
  const sold = sales.reduce((a, s) => a + s.qty, 0);
  const damaged = damage.reduce((a, d) => a + d.qty, 0);
  const raw = manufactured - loaded;
  const ready = loaded - sold - damaged;
  return { manufactured, loaded, sold, damaged, raw, ready, total: raw + ready };
}

export type ThresholdAlert = {
  leaderId: string;
  balance: number;
  kind: "owner_owes" | "leader_owes";
  limit: number;
};

export function thresholdAlerts(db: Db): ThresholdAlert[] {
  const out: ThresholdAlert[] = [];
  for (const l of db.leaders.filter((l) => l.active)) {
    const { balance } = leaderBalance(l.id, db.workEntries, db.leaderPayments);
    if (balance >= db.settings.thresholdOwedToLeader * 0.8) {
      out.push({
        leaderId: l.id,
        balance,
        kind: "owner_owes",
        limit: db.settings.thresholdOwedToLeader
      });
    } else if (-balance >= db.settings.thresholdLeaderOwes * 0.8) {
      out.push({
        leaderId: l.id,
        balance,
        kind: "leader_owes",
        limit: db.settings.thresholdLeaderOwes
      });
    }
  }
  return out.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
}

export interface MonthSummary {
  moneyIn: number; // sale payments received
  moneyOut: number; // purchases paid + leader payments + procurements + salaries
  salesAmount: number; // value of sales billed
  bricksSold: number;
  bricksMade: number;
  purchasesPaid: number;
  leaderPaid: number;
  procurements: number;
  salaries: number;
  loadingCosts: number; // paid to temporary vehicle loaders
}

const inMonth = (dateStr: string, month: string) => dateStr.slice(0, 7) === month;

/** month: YYYY-MM */
export function monthSummary(db: Db, month: string): MonthSummary {
  const salesInMonth = db.sales.filter((s) => inMonth(s.dateTime, month));
  const moneyIn = round2(
    db.salePayments.filter((p) => inMonth(p.date, month)).reduce((a, p) => a + p.amount, 0)
  );
  const purchasesPaid = round2(
    db.purchases.filter((p) => inMonth(p.date, month)).reduce((a, p) => a + p.amountPaid, 0)
  );
  const leaderPaid = round2(
    db.leaderPayments.filter((p) => inMonth(p.date, month)).reduce((a, p) => a + p.amount, 0)
  );
  const procurements = round2(
    db.procurements.filter((p) => inMonth(p.date, month)).reduce((a, p) => a + p.totalPrice, 0)
  );
  const salaries = round2(
    db.salaryPayments.filter((p) => inMonth(p.date, month)).reduce((a, p) => a + p.amount, 0)
  );
  // Only loading actually paid this month counts as money out; pending stays out of it.
  const loadingCosts = round2(
    salesInMonth.filter((s) => s.loadingPaid).reduce((a, s) => a + s.loadingCost, 0)
  );
  return {
    moneyIn,
    moneyOut: round2(purchasesPaid + leaderPaid + procurements + salaries + loadingCosts),
    salesAmount: round2(salesInMonth.reduce((a, s) => a + saleTotal(s), 0)),
    bricksSold: salesInMonth.reduce((a, s) => a + s.qty, 0),
    bricksMade: db.workEntries
      .filter((w) => w.type === "manufacturing" && inMonth(w.date, month))
      .reduce((a, w) => a + w.qty, 0),
    purchasesPaid,
    leaderPaid,
    procurements,
    salaries,
    loadingCosts
  };
}
