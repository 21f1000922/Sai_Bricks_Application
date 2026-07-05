import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { PayMode } from "../data/types";
import { fmtMoney } from "../lib/format";

export function Field({
  label,
  children,
  optional
}: {
  label: string;
  children: ReactNode;
  optional?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="fld">
      <label>
        {label}
        {optional ? <span className="mut"> · {t("common.optional")}</span> : null}
      </label>
      {children}
    </div>
  );
}

export function ModeChips({ value, onChange }: { value: PayMode; onChange: (m: PayMode) => void }) {
  const { t } = useTranslation();
  const modes: PayMode[] = ["cash", "upi", "other"];
  return (
    <div className="chips" role="radiogroup">
      {modes.map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={value === m}
          className={"chip" + (value === m ? " on" : "")}
          onClick={() => onChange(m)}
        >
          {t(`common.${m}`)}
        </button>
      ))}
    </div>
  );
}

export function Sheet({
  title,
  onClose,
  children
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="sheet-back"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet" role="dialog" aria-label={title}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function Money({ value, signed }: { value: number; signed?: boolean }) {
  const cls = signed ? (value < 0 ? "bad" : "good") : undefined;
  return (
    <span className={cls ? `num ${cls}` : "num"}>
      {signed && value > 0 ? "+" : ""}
      {fmtMoney(value)}
    </span>
  );
}

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return <div className="av">{initials || "•"}</div>;
}

export function BackBar({ to, crumb, title }: { to: string; crumb: string; title: string }) {
  return (
    <div className="backbar">
      <Link to={to}>‹ {crumb}</Link>
      <b>{title}</b>
    </div>
  );
}

export function Empty() {
  const { t } = useTranslation();
  return <div className="empty">{t("common.noEntries")}</div>;
}
