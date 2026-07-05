import { describe, expect, it } from "vitest";
import {
  customerDues,
  leaderBalance,
  monthSummary,
  saleDue,
  saleTotal,
  stock,
  thresholdAlerts,
  totalLoadingPending,
  workAmount
} from "./calc";
import { DEFAULT_SETTINGS, type Db, type Sale, type WorkEntry } from "../data/types";

const w = (o: Partial<WorkEntry>): WorkEntry => ({
  id: "w",
  leaderId: "L1",
  type: "manufacturing",
  qty: 0,
  peopleCount: 1,
  rate: 0.9,
  date: "2026-07-01",
  ...o
});

const s = (o: Partial<Sale>): Sale => ({
  id: "s",
  customerId: "C1",
  place: "Kothapet",
  qty: 0,
  rate: 6.5,
  loadingCost: 0,
  loadingPaid: true,
  dateTime: "2026-07-04T10:00:00",
  ...o
});

describe("leader ledger", () => {
  it("balance = earnings − (advances + extra + settlements)", () => {
    const entries = [
      w({ id: "w1", qty: 12500 }), // +11,250
      w({ id: "w2", qty: 14000 }) // +12,600
    ];
    const payments = [
      { id: "p1", leaderId: "L1", kind: "advance" as const, amount: 2000, mode: "cash" as const, date: "2026-07-02" },
      { id: "p2", leaderId: "L1", kind: "extra" as const, amount: 500, mode: "cash" as const, date: "2026-06-30" },
      { id: "p3", leaderId: "L1", kind: "settlement" as const, amount: 15000, mode: "upi" as const, date: "2026-06-28" }
    ];
    const { earned, paid, balance } = leaderBalance("L1", entries, payments);
    expect(earned).toBe(23850);
    expect(paid).toBe(17500);
    expect(balance).toBe(6350);
  });

  it("uses the rate snapshot on each entry, not a global rate", () => {
    expect(workAmount(w({ qty: 1000, rate: 0.9 }))).toBe(900);
    expect(workAmount(w({ qty: 1000, rate: 1.1 }))).toBe(1100);
  });

  it("can go negative when advances exceed earnings", () => {
    const payments = [
      { id: "p", leaderId: "L1", kind: "advance" as const, amount: 5000, mode: "cash" as const, date: "2026-07-01" }
    ];
    expect(leaderBalance("L1", [w({ qty: 1000 })], payments).balance).toBe(-4100);
  });
});

describe("sales", () => {
  it("total = qty × rate; loading cost is NOT charged to the customer", () => {
    // rate already includes loading, so loadingCost must not inflate the bill
    expect(saleTotal(s({ qty: 5000, rate: 6.5, loadingCost: 500 }))).toBe(32500);
  });

  it("due decreases with each partial payment", () => {
    const sale = s({ id: "s1", qty: 5000, rate: 6.5, loadingCost: 500 });
    const pays = [
      { id: "sp1", saleId: "s1", amount: 20000, mode: "cash" as const, date: "2026-07-04" },
      { id: "sp2", saleId: "s1", amount: 8000, mode: "upi" as const, date: "2026-07-10" }
    ];
    expect(saleDue(sale, pays)).toBe(4500);
  });

  it("customer dues sum across that customer's sales only", () => {
    const sales = [
      s({ id: "s1", customerId: "C1", qty: 1000 }), // 6500
      s({ id: "s2", customerId: "C1", qty: 2000 }), // 13000
      s({ id: "s3", customerId: "C2", qty: 500 })
    ];
    const pays = [{ id: "sp", saleId: "s1", amount: 6500, mode: "cash" as const, date: "2026-07-04" }];
    expect(customerDues("C1", sales, pays)).toBe(13000);
  });

  it("tracks loader payouts still pending", () => {
    const sales = [
      s({ id: "a", loadingCost: 500, loadingPaid: true }),
      s({ id: "b", loadingCost: 300, loadingPaid: false }),
      s({ id: "c", loadingCost: 200, loadingPaid: false })
    ];
    expect(totalLoadingPending(sales)).toBe(500);
  });
});

describe("stock pipeline", () => {
  it("raw = made − loaded; ready = loaded − sold − damaged", () => {
    const entries = [
      w({ id: "w1", qty: 642000 }),
      w({ id: "w2", type: "batti", qty: 600000, rate: 0.52 })
    ];
    const sales = [s({ qty: 478000 })];
    const damage = [{ id: "d1", qty: 3500, date: "2026-06-28" }];
    const st = stock(entries, sales, damage);
    expect(st.raw).toBe(42000);
    expect(st.ready).toBe(118500);
    expect(st.total).toBe(160500);
  });
});

describe("threshold alerts", () => {
  const base: Db = {
    settings: DEFAULT_SETTINGS,
    leaders: [
      { id: "L1", name: "Ramesh", groupType: "manufacturing", peopleCount: 6, active: true }
    ],
    customers: [],
    employees: [],
    vehicles: [],
    suppliers: [],
    workEntries: [],
    leaderPayments: [],
    sales: [],
    salePayments: [],
    purchases: [],
    damageEntries: [],
    procurements: [],
    salaryPayments: []
  };

  it("warns when owner owes ≥80% of the limit", () => {
    const db = { ...base, workEntries: [w({ qty: 24000 })] }; // owes 21,600 ≥ 20,000
    const alerts = thresholdAlerts(db);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].kind).toBe("owner_owes");
  });

  it("warns when leader owes ≥80% of the limit", () => {
    const db = {
      ...base,
      leaderPayments: [
        { id: "p", leaderId: "L1", kind: "advance" as const, amount: 9000, mode: "cash" as const, date: "2026-07-01" }
      ]
    };
    const alerts = thresholdAlerts(db);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].kind).toBe("leader_owes");
  });

  it("stays quiet inside the safe band", () => {
    const db = { ...base, workEntries: [w({ qty: 10000 })] }; // owes 9,000
    expect(thresholdAlerts(db)).toHaveLength(0);
  });
});

describe("month summary", () => {
  it("splits money in and out by month", () => {
    const db: Db = {
      settings: DEFAULT_SETTINGS,
      leaders: [],
      customers: [],
      employees: [],
      vehicles: [],
      suppliers: [],
      workEntries: [w({ qty: 10000, date: "2026-07-01" }), w({ qty: 9999, date: "2026-06-01" })],
      leaderPayments: [
        { id: "p1", leaderId: "L1", kind: "advance", amount: 2000, mode: "cash", date: "2026-07-02" }
      ],
      sales: [s({ id: "s1", qty: 5000, loadingCost: 500 })],
      salePayments: [
        { id: "sp1", saleId: "s1", amount: 20000, mode: "cash", date: "2026-07-04" },
        { id: "sp2", saleId: "s1", amount: 5000, mode: "cash", date: "2026-08-01" }
      ],
      purchases: [
        { id: "pu1", itemName: "Coal", unit: "tons", qty: 2, unitPrice: 9000, amountPaid: 10000, mode: "cash", date: "2026-07-03" }
      ],
      damageEntries: [],
      procurements: [
        { id: "pr1", itemName: "Diesel", totalPrice: 1500, reason: "tractor", date: "2026-07-02" }
      ],
      salaryPayments: [
        { id: "sa1", employeeId: "E1", amount: 12000, month: "2026-06", mode: "cash", date: "2026-07-05" }
      ]
    };
    const m = monthSummary(db, "2026-07");
    expect(m.moneyIn).toBe(20000);
    // money out now includes the ₹500 paid to the vehicle loader
    expect(m.moneyOut).toBe(2000 + 10000 + 1500 + 12000 + 500);
    expect(m.loadingCosts).toBe(500);
    expect(m.salesAmount).toBe(32500); // qty × rate only, loading excluded
    expect(m.bricksMade).toBe(10000);
    expect(m.bricksSold).toBe(5000);
  });

  it("excludes pending loader payouts from money-out", () => {
    const db: Db = {
      settings: DEFAULT_SETTINGS,
      leaders: [],
      customers: [],
      employees: [],
      vehicles: [],
      suppliers: [],
      workEntries: [],
      leaderPayments: [],
      sales: [s({ id: "s1", qty: 1000, loadingCost: 500, loadingPaid: false })],
      salePayments: [],
      purchases: [],
      damageEntries: [],
      procurements: [],
      salaryPayments: []
    };
    const m = monthSummary(db, "2026-07");
    expect(m.loadingCosts).toBe(0);
    expect(m.moneyOut).toBe(0);
  });
});
