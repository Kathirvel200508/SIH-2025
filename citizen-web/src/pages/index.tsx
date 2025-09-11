


import Head from "next/head";
import { useEffect, useState } from "react";
import styles from "@/styles/Home.module.css";
import { Navbar } from "@/shared/components/Navbar";
import { useLanguage } from "@/shared/language/LanguageContext";
import { useUser } from "@/shared/user/UserContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

type ReportPriority = "low" | "medium" | "high";
type ReportCategory = "sewage" | "electricity" | "waste" | "roads" | "transport" | "other";

type Report = {
  id: string;
  title: string;
  description: string;
  priority: ReportPriority;
  category: ReportCategory;
  status: "in_progress" | "accepted" | "rejected" | "finished";
  createdAt: string;
  createdByUserId: string;
  attachments?: string[];
  location?: { lat: number; lng: number };
  locationName?: string;
};

type LoginResponse = {
  token: string;
  user: { id: string; username: string; role: "admin" | "citizen" };
};

export default function Home() {
  const { t } = useLanguage();
  const { user, token, setUser, setToken } = useUser();
  const [username, setUsername] = useState("user");
  const [password, setPassword] = useState("user123");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<ReportPriority>("medium");
  const [category, setCategory] = useState<ReportCategory>("sewage");
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [locationName, setLocationName] = useState<string | undefined>(undefined);
  const [derivedNames, setDerivedNames] = useState<Record<string, string>>({});
  const [resolving, setResolving] = useState<Record<string, boolean>>({});
  const [showForm, setShowForm] = useState(false);

  // Token and user are now managed by UserContext

  useEffect(() => {
    if (!token) return;
    (async () => {
      const res = await fetch(`${API_BASE}/reports/mine`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data: Report[] = await res.json();
        setMyReports(data);
      }
    })();
  }, [token]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: LoginResponse = await res.json();
      if (data.user.role !== "citizen") {
        throw new Error("Use a citizen account to submit reports");
      }
      setUser(data.user);
      setToken(data.token);
    } catch (err: any) {
      setLoginError(err.message || "Login failed");
    }
  }

  async function uploadFilesIfAny(): Promise<string[] | undefined> {
    if (!token || !files || files.length === 0) return undefined;
    setUploading(true);
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append("files", f));
      const res = await fetch(`${API_BASE}/uploads`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { urls: string[] };
      return data.urls;
    } finally {
      setUploading(false);
    }
  }

  function getCurrentPosition(): Promise<{ lat: number; lng: number } | undefined> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(undefined);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(undefined),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  }

  async function reverseGeocode(lat: number, lng: number): Promise<string | undefined> {
    try {
      const res = await fetch(`${API_BASE}/geocode/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`);
      if (!res.ok) return undefined;
      const data = await res.json();
      return data.locationName as string | undefined;
    } catch {
      return undefined;
    }
  }

  useEffect(() => {
    // Fill in missing names for existing reports so UI shows a city/area
    (async () => {
      for (const r of myReports) {
        if (!r.locationName && r.location && !derivedNames[r.id]) {
          setResolving((m) => ({ ...m, [r.id]: true }));
          const nm = await reverseGeocode(r.location.lat, r.location.lng);
          if (nm) setDerivedNames((m) => ({ ...m, [r.id]: nm }));
          setResolving((m) => ({ ...m, [r.id]: false }));
        }
      }
    })();
  }, [myReports]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitMsg(null);
    if (!user || !token) {
      setSubmitMsg("Please login first");
      return;
    }
    try {
      const attachments = await uploadFilesIfAny();
      const loc = (await getCurrentPosition()) || location;
      if (loc) setLocation(loc);
      let locName: string | undefined = locationName;
      if (loc && !locName) {
        locName = await reverseGeocode(loc.lat, loc.lng);
        if (locName) setLocationName(locName);
      }
      const res = await fetch(`${API_BASE}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, priority, category, attachments, location: loc, locationName: locName }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSubmitMsg("Report submitted successfully");
      setTitle("");
      setDescription("");
      setPriority("medium");
      setFiles(null);
      setCategory("sewage");
      const mine = await fetch(`${API_BASE}/reports/mine`, { headers: { Authorization: `Bearer ${token}` } });
      if (mine.ok) setMyReports(await mine.json());
    } catch (err: any) {
      setSubmitMsg(err.message || "Failed to submit");
    }
  }

  return (
    <>
      <Head>
        <title>{t("citizenPortal")}</title>
        <meta name="description" content="Citizen web" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <div className={styles.page}>
        <main className={styles.main}>
          <h1>{t("citizenPortal")}</h1>

          {!user ? (
            <div className={styles.card}>
              <form onSubmit={handleLogin} className={styles.form}>
                <h2>{t("login")}</h2>
                <div className={styles.field}>
                  <label className={styles.label}>{t("username")}</label>
                  <input className={styles.input} value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>{t("password")}</label>
                  <input className={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button className={styles.button} type="submit">{t("login")}</button>
                {loginError && <p style={{ color: "crimson" }}>{loginError}</p>}
              </form>
            </div>
          ) : (
            <>
              <div className={styles.card}>
                <div id="report-form" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <p>{t("loggedInMsg")}</p>
                  {!showForm && (
                    <button type="button" className={styles.button} onClick={() => setShowForm(true)}>
                      {t("reportButton")}
                    </button>
                  )}
                </div>
                {showForm && (
                <form onSubmit={handleSubmit} className={styles.form}>
                  <div className={styles.field}>
                    <label className={styles.label}>{t("title")}</label>
                    <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>{t("description")}</label>
                    <textarea className={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} required />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>{t("attachmentsLabel")}</label>
                    <input
                      className={styles.input}
                      type="file"
                      accept="image/*,audio/*"
                      multiple
                      onChange={(e) => {
                        const fl = e.target.files;
                        if (fl && fl.length > 2) {
                          const dt = new DataTransfer();
                          dt.items.add(fl[0]);
                          dt.items.add(fl[1]);
                          e.currentTarget.files = dt.files;
                        }
                        setFiles(e.currentTarget.files);
                      }}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>{t("priority")}</label>
                    <select className={styles.select} value={priority} onChange={(e) => setPriority(e.target.value as ReportPriority)}>
                      <option value="low">{t("low")}</option>
                      <option value="medium">{t("medium")}</option>
                      <option value="high">{t("high")}</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Category</label>
                    <div className={styles.chips}>
                      {([
                        { k: 'sewage', label: 'Sewage' },
                        { k: 'electricity', label: 'Electricity' },
                        { k: 'waste', label: 'Waste' },
                        { k: 'roads', label: 'Roads' },
                        { k: 'transport', label: 'Transport' },
                        { k: 'other', label: 'Other' },
                      ] as { k: ReportCategory, label: string }[]).map((c) => (
                        <button type="button" key={c.k} onClick={() => setCategory(c.k)}
                          className={`${styles.chip} ${category === c.k ? styles.selected : ''}`}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button className={styles.button} type="submit" disabled={uploading}>{uploading ? "Uploading..." : t("submitReport")}</button>
                </form>
                )}
                {submitMsg && <p>{submitMsg}</p>}
              </div>

              <div className={styles.card} id="my-reports">
                <h2>{t("myReports")}</h2>
                {myReports.length === 0 ? (
                  <p>{t("noReports")}</p>
                ) : (
                  <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead className={styles.thead}>
                      <tr>
                        <th>{t("statusHeader")}</th>
                        <th>{t("priority")}</th>
                        <th>{t("categoryHeader")}</th>
                        <th>{t("title")}</th>
                        <th>{t("location")}</th>
                        <th>{t("created")}</th>
                        <th>{t("attachments")}</th>
                      </tr>
                    </thead>
                    <tbody className={styles.tbody}>
                      {myReports.map((r) => (
                        <tr key={r.id}>
                          <td>{t(`status_${r.status}` as any)}</td>
                          <td>{t(r.priority as any)}</td>
                          <td>{t((`cat_${(r as any).category || 'other'}`) as any)}</td>
                          <td>{r.title}</td>
                          <td>{r.locationName || derivedNames[r.id] || (resolving[r.id] ? t("fetchingLocation") : t("notAvailable"))}</td>
                          <td>{new Date(r.createdAt).toLocaleString()}</td>
                          <td>
                            {r.attachments?.length ? (
                              <ul>
                                {r.attachments.map((u) => (
                                  <li key={u}><a href={u.startsWith('http') ? u : `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`} target="_blank" rel="noreferrer">link</a></li>
                                ))}
                              </ul>
                            ) : (
                              <span>-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
