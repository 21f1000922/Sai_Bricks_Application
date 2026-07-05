import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useData, useDb } from "../data/DataContext";
import { BackBar, Field } from "../components/ui";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const db = useDb();
  const { saveSettings, mode, signOut } = useData();
  const s = db.settings;

  const [name, setName] = useState(s.factoryName);
  const [mfg, setMfg] = useState(String(s.mfgRate));
  const [batti, setBatti] = useState(String(s.battiRate));
  const [price, setPrice] = useState(String(s.defaultBrickPrice));
  const [thOwed, setThOwed] = useState(String(s.thresholdOwedToLeader));
  const [thOwes, setThOwes] = useState(String(s.thresholdLeaderOwes));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await saveSettings({
      factoryName: name.trim() || s.factoryName,
      mfgRate: Number(mfg) || s.mfgRate,
      battiRate: Number(batti) || s.battiRate,
      defaultBrickPrice: Number(price) || s.defaultBrickPrice,
      thresholdOwedToLeader: Number(thOwed) || s.thresholdOwedToLeader,
      thresholdLeaderOwes: Number(thOwes) || s.thresholdLeaderOwes
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <>
      <BackBar to="/more" crumb={t("more.title")} title={t("settings.title")} />
      <main className="page">
        {mode === "demo" && (
          <div className="alert">
            <span className="dot" />
            <span>{t("settings.demoNote")}</span>
          </div>
        )}

        <Field label={t("settings.language")}>
          <div className="chips">
            <button
              type="button"
              className={"chip" + (i18n.language === "te" ? " on" : "")}
              onClick={() => void i18n.changeLanguage("te")}
            >
              తెలుగు
            </button>
            <button
              type="button"
              className={"chip" + (i18n.language === "en" ? " on" : "")}
              onClick={() => void i18n.changeLanguage("en")}
            >
              English
            </button>
          </div>
        </Field>

        <Field label={t("settings.factoryName")}>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="grid2" style={{ marginBottom: 0 }}>
          <Field label={t("settings.mfgRate")}>
            <input type="number" step="0.01" inputMode="decimal" value={mfg} onChange={(e) => setMfg(e.target.value)} />
          </Field>
          <Field label={t("settings.battiRate")}>
            <input type="number" step="0.01" inputMode="decimal" value={batti} onChange={(e) => setBatti(e.target.value)} />
          </Field>
        </div>
        <Field label={t("settings.defaultPrice")}>
          <input type="number" step="0.01" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field label={t("settings.thresholdOwed")}>
          <input type="number" inputMode="numeric" value={thOwed} onChange={(e) => setThOwed(e.target.value)} />
        </Field>
        <Field label={t("settings.thresholdOwes")}>
          <input type="number" inputMode="numeric" value={thOwes} onChange={(e) => setThOwes(e.target.value)} />
        </Field>

        <button className="btn" disabled={saving} onClick={() => void save()}>
          {saved ? "✓ " + t("settings.saved") : t("common.save")}
        </button>

        {mode === "cloud" && (
          <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => void signOut()}>
            {t("settings.signOut")}
          </button>
        )}
      </main>
    </>
  );
}
