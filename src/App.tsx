import { Navigate, Route, Routes, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useData } from "./data/DataContext";
import Dashboard from "./pages/Dashboard";
import Stock from "./pages/Stock";
import Ledgers from "./pages/Ledgers";
import LedgerDetail from "./pages/LedgerDetail";
import Sales from "./pages/Sales";
import NewSale from "./pages/NewSale";
import SaleDetail from "./pages/SaleDetail";
import More from "./pages/More";
import Purchases from "./pages/Purchases";
import Procurements from "./pages/Procurements";
import Employees from "./pages/Employees";
import Masters from "./pages/Masters";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

function Nav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const items = [
    { to: "/", ic: "⌂", label: t("nav.home") },
    { to: "/sales", ic: "₹", label: t("nav.sales") },
    { to: "/ledgers", ic: "👥", label: t("nav.ledgers") },
    { to: "/stock", ic: "🧱", label: t("nav.stock") },
    { to: "/more", ic: "☰", label: t("nav.more") }
  ];
  const isOn = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/");
  return (
    <nav className="nav">
      {items.map((i) => (
        <Link key={i.to} to={i.to} className={isOn(i.to) ? "on" : ""}>
          <span className="ic" aria-hidden>
            {i.ic}
          </span>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

export default function App() {
  const { t } = useTranslation();
  const { db, mode, session, loading, error, reload } = useData();

  if (mode === "cloud" && !session) return <Login />;

  if (loading && !db) {
    return <div className="empty" style={{ paddingTop: 120 }}>{t("app.loading")}</div>;
  }

  if (error && !db) {
    return (
      <div className="page" style={{ paddingTop: 60 }}>
        <div className="alert">
          <span className="dot" />
          <span>{error}</span>
        </div>
        <button className="btn ghost" onClick={() => void reload()}>
          ↻
        </button>
      </div>
    );
  }

  if (!db) return null;

  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/ledgers" element={<Ledgers />} />
        <Route path="/ledgers/:id" element={<LedgerDetail />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/sales/new" element={<NewSale />} />
        <Route path="/sales/:id" element={<SaleDetail />} />
        <Route path="/more" element={<More />} />
        <Route path="/more/purchases" element={<Purchases />} />
        <Route path="/more/procurements" element={<Procurements />} />
        <Route path="/more/employees" element={<Employees />} />
        <Route path="/more/masters" element={<Masters />} />
        <Route path="/more/reports" element={<Reports />} />
        <Route path="/more/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Nav />
    </>
  );
}
