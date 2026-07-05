import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BackBar } from "../components/ui";

export default function More() {
  const { t } = useTranslation();
  const items = [
    { to: "/more/purchases", ic: "🛒", label: t("purchase.title") },
    { to: "/more/procurements", ic: "🧾", label: t("proc.title") },
    { to: "/more/employees", ic: "🧑‍💼", label: t("emp.title") },
    { to: "/more/masters", ic: "🗂️", label: t("master.title") },
    { to: "/more/history", ic: "🕘", label: t("history.title") },
    { to: "/more/reports", ic: "📊", label: t("report.title") },
    { to: "/more/settings", ic: "⚙️", label: t("settings.title") }
  ];
  return (
    <>
      <BackBar to="/" crumb={t("nav.home")} title={t("more.title")} />
      <main className="page">
        {items.map((i) => (
          <Link to={i.to} className="menu-item" key={i.to}>
            <span className="ic" aria-hidden>
              {i.ic}
            </span>
            {i.label}
          </Link>
        ))}
      </main>
    </>
  );
}
