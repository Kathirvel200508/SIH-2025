import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLanguage, SupportedLanguage } from "@/shared/language/LanguageContext";
import styles from "@/styles/Home.module.css";

const SUPPORT_EMAIL = "230015.ad@rmkec.ac.in";

export function Navbar() {
  const { t, lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const languages: { code: SupportedLanguage; label: string }[] = [
    { code: "en", label: "English" },
    { code: "ta", label: "Tamil" },
    { code: "te", label: "Telugu" },
    { code: "hi", label: "Hindi" },
    { code: "ml", label: "Malayalam" },
    { code: "kn", label: "Kannada" },
  ];

  return (
    <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #e5e7eb", background: "#0f172a", color: "#f8fafc" }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <Link href="/" style={{ fontWeight: 600, textDecoration: "none", color: "#93c5fd" }}>Civic</Link>
        <Link href="#report-form" style={{ color: "#93c5fd", fontWeight: 600, textDecoration: "none" }}>{t("reportCta")}</Link>
        <Link href="#my-reports" style={{ color: "#c7d2fe", textDecoration: "none" }}>{t("myReports")}</Link>
        <Link href="/leaderboard" style={{ color: "#c7d2fe", textDecoration: "none" }}>{t("leaderboard")}</Link>
      </div>
      <div ref={menuRef} style={{ position: "relative" }}>
        <button aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)} className={styles.button} style={{ padding: "8px 10px", background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155" }}>
          Settings
        </button>
        {open && (
          <div role="menu" style={{ position: "absolute", right: 0, marginTop: 8, background: "#0b1220", color: "#e5e7eb", border: "1px solid #334155", borderRadius: 10, boxShadow: "0 24px 48px rgba(0,0,0,0.45)", minWidth: 260, zIndex: 20, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #1f2937", fontWeight: 700, letterSpacing: 0.2 }}>{t("settings")}</div>
            <div style={{ padding: "10px 14px" }}>
              <div style={{ marginBottom: 8, fontSize: 12, color: "#9ca3af" }}>{t("languages")}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
                {languages.map((l) => (
                  <button key={l.code} onClick={() => setLang(l.code)} style={{ padding: "8px 10px", borderRadius: 8, border: lang === l.code ? "2px solid #60a5fa" : "1px solid #334155", background: lang === l.code ? "#0b2a6b" : "#0f172a", textAlign: "left", color: "#e5e7eb" }}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ borderTop: "1px solid #1f2937" }}>
              <div style={{ padding: "10px 14px" }}>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>{t("helpAbout")}</div>
                <div>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>{t("supportEmail")}: </span>
                  <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "#93c5fd" }}>{SUPPORT_EMAIL}</a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}


