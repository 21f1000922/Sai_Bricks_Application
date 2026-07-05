const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const inrInt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** Indian grouping: 1,84,500 */
export function fmtNum(n: number): string {
  return inr.format(n);
}

export function fmtMoney(n: number): string {
  const sign = n < 0 ? "−" : "";
  return `${sign}₹${inr.format(Math.abs(n))}`;
}

export function fmtBricks(n: number): string {
  return inrInt.format(n);
}

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function nowLocalISO(): string {
  const d = new Date();
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function thisMonth(): string {
  return todayStr().slice(0, 7);
}

export function fmtDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr.length === 10 ? dateStr + "T00:00:00" : dateStr);
  return d.toLocaleDateString(locale === "te" ? "te-IN" : "en-IN", {
    day: "numeric",
    month: "short"
  });
}

export function fmtDateFull(dateStr: string, locale: string): string {
  const d = new Date(dateStr.length === 10 ? dateStr + "T00:00:00" : dateStr);
  return d.toLocaleDateString(locale === "te" ? "te-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export function uid(): string {
  return crypto.randomUUID();
}
