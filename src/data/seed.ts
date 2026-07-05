import type { Db } from "./types";
import { DEFAULT_SETTINGS } from "./types";

/** Sample data for demo mode — invented names and numbers for training/trial. */
export function seedDb(): Db {
  return {
    settings: { ...DEFAULT_SETTINGS },
    leaders: [
      { id: "L1", name: "Ramesh", groupType: "manufacturing", peopleCount: 6, active: true },
      { id: "L2", name: "Suresh", groupType: "manufacturing", peopleCount: 4, active: true },
      { id: "L3", name: "Yellaiah", groupType: "batti", peopleCount: 1, active: true }
    ],
    customers: [
      { id: "C1", name: "Lakshmi Constructions", place: "Kothapet", phone: "9800000001", active: true },
      { id: "C2", name: "Venkat Rao", place: "Uppal", phone: "9800000002", active: true }
    ],
    employees: [
      { id: "E1", name: "Anil", designation: "Manager", salary: 15000, phone: "9800000011", active: true },
      { id: "E2", name: "Bhaskar", designation: "Manager", salary: 14000, phone: "9800000012", active: true },
      { id: "E3", name: "Chandu", designation: "Manager", salary: 14000, phone: "9800000013", active: true }
    ],
    vehicles: [
      { id: "V1", number: "AP 29 T 4437", description: "Tractor", active: true },
      { id: "V2", number: "TS 08 UB 7712", description: "Lorry", active: true }
    ],
    suppliers: [{ id: "SU1", name: "Srinivasa Coal Traders", phone: "9800000021", active: true }],
    workEntries: [
      { id: "W1", leaderId: "L1", type: "manufacturing", qty: 14000, peopleCount: 6, rate: 0.9, date: "2026-06-26" },
      { id: "W2", leaderId: "L1", type: "manufacturing", qty: 12500, peopleCount: 6, rate: 0.9, date: "2026-07-04" },
      { id: "W3", leaderId: "L2", type: "manufacturing", qty: 9000, peopleCount: 4, rate: 0.9, date: "2026-07-03" },
      { id: "W4", leaderId: "L3", type: "batti", qty: 20000, peopleCount: 1, rate: 0.52, date: "2026-07-02" }
    ],
    leaderPayments: [
      { id: "P1", leaderId: "L1", kind: "settlement", amount: 15000, mode: "upi", date: "2026-06-28" },
      { id: "P2", leaderId: "L1", kind: "extra", amount: 500, mode: "cash", date: "2026-06-30", note: "Festival" },
      { id: "P3", leaderId: "L1", kind: "advance", amount: 2000, mode: "cash", date: "2026-07-02" },
      { id: "P4", leaderId: "L3", kind: "advance", amount: 3000, mode: "cash", date: "2026-07-01" }
    ],
    sales: [
      {
        id: "S1",
        customerId: "C1",
        place: "Kothapet",
        qty: 5000,
        rate: 6.5,
        loadingPerson: "Yadaiah",
        loadingCost: 500,
        loadingPaid: false,
        deliveredById: "E1",
        vehicleId: "V1",
        dateTime: "2026-07-04T10:00:00"
      },
      {
        id: "S2",
        customerId: "C2",
        place: "Uppal",
        qty: 3000,
        rate: 6.4,
        loadingCost: 300,
        loadingPaid: true,
        deliveredById: "E2",
        vehicleId: "V2",
        dateTime: "2026-06-20T09:30:00"
      }
    ],
    salePayments: [
      { id: "SP1", saleId: "S1", amount: 20000, mode: "cash", receivedById: "E1", date: "2026-07-04" },
      { id: "SP2", saleId: "S2", amount: 19500, mode: "upi", date: "2026-06-20" }
    ],
    purchases: [
      {
        id: "PU1",
        itemName: "Coal",
        supplierId: "SU1",
        unit: "tons",
        qty: 3,
        unitPrice: 9000,
        amountPaid: 20000,
        mode: "cash",
        date: "2026-07-01"
      }
    ],
    damageEntries: [{ id: "D1", qty: 1200, date: "2026-06-28", note: "Over-fired batch corner" }],
    procurements: [
      { id: "PR1", itemName: "Diesel", employeeId: "E1", qty: 20, totalPrice: 1900, reason: "Tractor fuel", date: "2026-07-03" }
    ],
    salaryPayments: [
      { id: "SA1", employeeId: "E1", amount: 15000, month: "2026-06", mode: "upi", date: "2026-07-01" }
    ]
  };
}

export function emptyDb(): Db {
  return {
    settings: { ...DEFAULT_SETTINGS },
    leaders: [],
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
}
