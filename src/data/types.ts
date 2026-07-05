export type ID = string;

export type PayMode = "cash" | "upi" | "other";
export type GroupType = "manufacturing" | "batti";
export type LeaderPaymentKind = "advance" | "extra" | "settlement";

export interface Settings {
  factoryName: string;
  mfgRate: number; // ₹ per brick manufactured
  battiRate: number; // ₹ per brick loaded into batti
  defaultBrickPrice: number; // default sale rate per brick
  thresholdOwedToLeader: number; // warn when owner owes leader more than this
  thresholdLeaderOwes: number; // warn when leader owes owner more than this
}

export interface Leader {
  id: ID;
  name: string;
  groupType: GroupType;
  peopleCount: number; // usual head-count; 1 for batti loaders
  phone?: string;
  active: boolean;
}

export interface Customer {
  id: ID;
  name: string;
  place: string;
  phone?: string;
  active: boolean;
}

export interface Employee {
  id: ID;
  name: string;
  designation: string;
  salary: number;
  phone?: string;
  active: boolean;
}

export interface Vehicle {
  id: ID;
  number: string;
  description?: string;
  active: boolean;
}

export interface Supplier {
  id: ID;
  name: string;
  phone?: string;
  active: boolean;
}

export interface WorkEntry {
  id: ID;
  leaderId: ID;
  type: GroupType;
  qty: number;
  peopleCount: number;
  rate: number; // snapshot of rate at entry time
  date: string; // YYYY-MM-DD
  note?: string;
}

export interface LeaderPayment {
  id: ID;
  leaderId: ID;
  kind: LeaderPaymentKind;
  amount: number;
  mode: PayMode;
  date: string;
  note?: string;
}

export interface Sale {
  id: ID;
  customerId: ID;
  place: string;
  qty: number;
  rate: number; // snapshot of brick price
  loadingPerson?: string; // temporary worker, free text
  loadingCost: number;
  loadingPaid: boolean; // have we paid the temporary loader yet?
  deliveredById?: ID; // employee
  vehicleId?: ID;
  dateTime: string; // ISO
  note?: string;
}

export interface SalePayment {
  id: ID;
  saleId: ID;
  amount: number;
  mode: PayMode;
  receivedById?: ID; // employee; empty = owner
  date: string;
}

export interface Purchase {
  id: ID;
  itemName: string;
  supplierId?: ID;
  unit: string; // tons, loads, liters, bags…
  qty: number;
  unitPrice: number;
  amountPaid: number;
  mode: PayMode;
  date: string;
  note?: string;
}

export interface DamageEntry {
  id: ID;
  qty: number;
  date: string;
  note?: string;
}

export interface Procurement {
  id: ID;
  itemName: string;
  employeeId?: ID; // empty = owner
  qty?: number;
  totalPrice: number;
  reason: string;
  date: string;
}

export interface SalaryPayment {
  id: ID;
  employeeId: ID;
  amount: number;
  month: string; // YYYY-MM the payment is for
  mode: PayMode;
  date: string;
  note?: string;
}

export interface Db {
  settings: Settings;
  leaders: Leader[];
  customers: Customer[];
  employees: Employee[];
  vehicles: Vehicle[];
  suppliers: Supplier[];
  workEntries: WorkEntry[];
  leaderPayments: LeaderPayment[];
  sales: Sale[];
  salePayments: SalePayment[];
  purchases: Purchase[];
  damageEntries: DamageEntry[];
  procurements: Procurement[];
  salaryPayments: SalaryPayment[];
}

export const DEFAULT_SETTINGS: Settings = {
  factoryName: "Sai Bricks",
  mfgRate: 0.9,
  battiRate: 0.52,
  defaultBrickPrice: 6.5,
  thresholdOwedToLeader: 25000,
  thresholdLeaderOwes: 10000
};
