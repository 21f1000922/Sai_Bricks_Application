import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../data/supabase";
import { Field } from "../components/ui";

export default function Login() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const go = async (mode: "in" | "up") => {
    if (!supabase || !email || !password) return;
    setBusy(true);
    setError(null);
    const { error: err } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    if (err) setError(err.message);
    setBusy(false);
  };

  return (
    <main className="page" style={{ paddingTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          className="lang-btn"
          onClick={() => void i18n.changeLanguage(i18n.language === "te" ? "en" : "te")}
        >
          {i18n.language === "te" ? (
            <>
              <b>తె</b> | EN
            </>
          ) : (
            <>
              తె | <b>EN</b>
            </>
          )}
        </button>
      </div>
      <div style={{ textAlign: "center", marginBottom: 24, marginTop: 28 }}>
        <div className="mark" style={{ width: 56, height: 56, borderRadius: 14, background: "var(--acc)", color: "var(--on-acc)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 22 }}>
          SB
        </div>
        <h2 style={{ margin: "10px 0 2px" }}>{t("app.name")}</h2>
        <p className="mut" style={{ margin: 0, fontSize: 13 }}>{t("login.hint")}</p>
      </div>

      <Field label={t("login.email")}>
        <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label={t("login.password")}>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      {error && (
        <div className="alert">
          <span className="dot" />
          <span>{error}</span>
        </div>
      )}

      <button className="btn" disabled={busy} onClick={() => void go("in")}>
        {t("login.signIn")}
      </button>
      <button className="btn ghost" style={{ marginTop: 10 }} disabled={busy} onClick={() => void go("up")}>
        {t("login.signUp")}
      </button>
    </main>
  );
}
