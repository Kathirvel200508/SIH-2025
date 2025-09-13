import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLanguage, SupportedLanguage } from "@/shared/language/LanguageContext";
import styles from "@/styles/Home.module.css";
import { useUser } from "@/shared/user/UserContext";

const SUPPORT_EMAIL = "230015.ad@rmkec.ac.in";

export function Navbar() {
  const { t, lang, setLang } = useLanguage();
  const { isLoggedIn, logout } = useUser();
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
    { code: "nagpuri", label: "Nagpuri" },
    { code: "santali", label: "Santali" },
  ];

  return (
    <nav style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "space-between", 
      padding: "12px 16px", 
      borderBottom: "1px solid #e5e7eb", 
      background: "#0f172a", 
      color: "#f8fafc",
      position: "sticky",
      top: 0,
      zIndex: 50
    }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center", flex: 1, minWidth: 0 }}>
        <Link href="/" style={{ fontWeight: 600, textDecoration: "none", color: "#93c5fd", fontSize: "18px", whiteSpace: "nowrap" }}>Civic</Link>
        <div style={{ 
          display: "flex", 
          gap: 12, 
          alignItems: "center", 
          overflow: "hidden",
          flex: 1,
          justifyContent: "flex-end"
        }} className="navLinks">
          <Link href="#report-form" style={{ 
            color: "#93c5fd", 
            fontWeight: 600, 
            textDecoration: "none", 
            fontSize: "14px",
            whiteSpace: "nowrap",
            display: "none"
          }} className="navLink">{t("reportCta")}</Link>
          <Link href="#my-reports" style={{ 
            color: "#c7d2fe", 
            textDecoration: "none", 
            fontSize: "14px",
            whiteSpace: "nowrap",
            display: "none"
          }} className="navLink">{t("myReports")}</Link>
          {isLoggedIn && (
            <>
              <Link href="/community" style={{ 
                color: "#c7d2fe", 
                textDecoration: "none", 
                fontSize: "14px",
                whiteSpace: "nowrap"
              }}>Community</Link>
              <Link href="/leaderboard" style={{ 
                color: "#c7d2fe", 
                textDecoration: "none", 
                fontSize: "14px",
                whiteSpace: "nowrap"
              }}>{t("leaderboard")}</Link>
            </>
          )}
        </div>
      </div>
      <div ref={menuRef} style={{ position: "relative", marginLeft: "12px" }}>
        <button 
          aria-haspopup="menu" 
          aria-expanded={open} 
          onClick={() => setOpen((v) => !v)} 
          className={`${styles.button} settingsButton`}
          style={{ 
            padding: "8px 12px", 
            background: "#1e293b", 
            color: "#e2e8f0", 
            border: "1px solid #334155",
            fontSize: "14px",
            minHeight: "36px",
            borderRadius: "6px"
          }}
        >
          <span style={{ display: "none" }}>Settings</span>
          <span style={{ fontSize: "16px" }}>⚙️</span>
        </button>
        {open && (
          <div role="menu" style={{ 
            position: "absolute", 
            right: 0, 
            marginTop: 8, 
            background: "#0b1220", 
            color: "#e5e7eb", 
            border: "1px solid #334155", 
            borderRadius: 10, 
            boxShadow: "0 24px 48px rgba(0,0,0,0.45)", 
            minWidth: 280, 
            maxWidth: "90vw",
            zIndex: 20, 
            overflow: "hidden" 
          }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #1f2937", fontWeight: 700, letterSpacing: 0.2, fontSize: "14px" }}>{t("settings")}</div>
            <div style={{ padding: "12px 16px" }}>
              <div style={{ marginBottom: 8, fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>{t("languages")}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                {languages.map((l) => (
                  <button 
                    key={l.code} 
                    onClick={() => setLang(l.code)} 
                    style={{ 
                      padding: "8px 12px", 
                      borderRadius: 8, 
                      border: lang === l.code ? "2px solid #60a5fa" : "1px solid #334155", 
                      background: lang === l.code ? "#0b2a6b" : "#0f172a", 
                      textAlign: "left", 
                      color: "#e5e7eb",
                      fontSize: "13px",
                      fontWeight: "500",
                      transition: "all 0.2s ease",
                      minHeight: "36px"
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            {isLoggedIn && (
              <div style={{ borderTop: "1px solid #1f2937" }}>
                <button 
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  style={{ 
                    width: "100%", 
                    padding: "12px 16px", 
                    background: "transparent", 
                    border: "none", 
                    color: "#ef4444", 
                    textAlign: "left", 
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "background-color 0.2s ease"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#1f2937"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  Logout
                </button>
              </div>
            )}
            <div style={{ borderTop: "1px solid #1f2937" }}>
              <div style={{ padding: "12px 16px" }}>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6, fontWeight: 500 }}>{t("helpAbout")}</div>
                <div>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>{t("supportEmail")}: </span>
                  <a 
                    href={`mailto:${SUPPORT_EMAIL}`} 
                    style={{ 
                      color: "#93c5fd", 
                      fontSize: "12px",
                      wordBreak: "break-all"
                    }}
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}


