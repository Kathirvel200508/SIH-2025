import Head from "next/head";
import { useEffect, useState } from "react";
import styles from "@/styles/Home.module.css";
import { setAuthCookie, getAuthFromCookie, clearAuthCookie } from "@/utils/cookies";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

type Report = {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  upvotes?: number;
  upvotedBy?: string[];
  status: "in_progress" | "accepted" | "rejected" | "finished";
  category?: "sewage" | "electricity" | "waste" | "roads" | "transport" | "other";
  createdAt: string;
  createdByUserId: string;
  createdByUsername?: string;
  attachments?: string[];
  location?: { lat: number; lng: number };
  locationName?: string;
};

type LoginResponse = {
  token: string;
  user: { id: string; username: string; role: "admin" | "citizen" };
};

export default function Home() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [token, setToken] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  function resolveUsername(r: Report): string {
    if (r.createdByUsername) return r.createdByUsername;
    if (r.createdByUserId === '1') return 'admin';
    if (r.createdByUserId === '2') return 'user';
    return r.createdByUserId;
  }
  const [locationNames, setLocationNames] = useState<Record<string, string>>({});
  const [resolving, setResolving] = useState<Record<string, boolean>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[] | null>(null);
  const [detailReport, setDetailReport] = useState<Report | null>(null);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [mapMode, setMapMode] = useState<"markers" | "heat">("markers");
  const [analyticsCity, setAnalyticsCity] = useState<string>("");
  const [pendingStatus, setPendingStatus] = useState<{ id: string; status: Report["status"] } | null>(null);

  const [filterCategory, setFilterCategory] = useState<Report["category"] | "">("");
  const [filterQ, setFilterQ] = useState<string>("");
  const [prioritySort, setPrioritySort] = useState<boolean>(false);
  const [priorityFilter, setPriorityFilter] = useState<Report["priority"] | "all">('all');

  async function loadReports(tk: string) {
    const params = new URLSearchParams();
    if (filterCategory) params.set('category', filterCategory);
    if (filterQ) params.set('q', filterQ);
    const res = await fetch(`${API_BASE}/reports${params.toString() ? `?${params.toString()}` : ''}`, { headers: { Authorization: `Bearer ${tk}` } });
    if (!res.ok) throw new Error(await res.text());
    const data: Report[] = await res.json();
    const rank: Record<Report["priority"], number> = { high: 0, medium: 1, low: 2 };
    let arr = [...data];
    if (priorityFilter !== 'all') arr = arr.filter((r) => r.priority === priorityFilter);
    if (prioritySort) {
      arr.sort((a,b) => {
        const pr = rank[a.priority] - rank[b.priority];
        if (pr !== 0) return pr;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      arr.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    setReports(arr);
  }

  function normalizeUrl(u: string): string {
    if (!u) return u;
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    if (u.startsWith('/')) return `${API_BASE}${u}`;
    return `${API_BASE}/${u}`;
  }

  async function ensureLocationName(id: string, loc?: { lat: number; lng: number }, existing?: string) {
    if (!loc || existing || locationNames[id]) return;
    try {
      setResolving((m) => ({ ...m, [id]: true }));
      const res = await fetch(`${API_BASE}/geocode/reverse?lat=${encodeURIComponent(loc.lat)}&lng=${encodeURIComponent(loc.lng)}`);
      if (!res.ok) return;
      const data = await res.json();
      const name = data.locationName as string | undefined;
      if (name) setLocationNames((m) => ({ ...m, [id]: name }));
    } catch {}
    finally {
      setResolving((m) => ({ ...m, [id]: false }));
    }
  }

  useEffect(() => {
    // Check for existing authentication in cookies
    const { token: cookieToken, role } = getAuthFromCookie();
    if (cookieToken && role === 'admin') {
      setToken(cookieToken);
    } else {
      // Fallback to localStorage for backward compatibility
      const saved = localStorage.getItem("admin_token");
      if (saved) {
        setToken(saved);
        // Migrate to cookies
        setAuthCookie(saved, 'admin');
        localStorage.removeItem("admin_token");
      }
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setLoadError(null);
        await loadReports(token);
      } catch (err: any) {
        setLoadError(err.message || "Failed to load reports");
      }
    })();
  }, [token, filterCategory, filterQ, prioritySort, priorityFilter]);

  useEffect(() => {
    // Derive missing location names client-side for display
    reports.forEach((r) => ensureLocationName(r.id, r.location, r.locationName));
  }, [reports]);

  // Initialize Leaflet map via CDN when requested
  useEffect(() => {
    if (!showMap) return;
    const mapContainerId = "reports-map";

    function loadScript(src: string): Promise<void> {
      return new Promise((resolve, reject) => {
        const existing = Array.from(document.getElementsByTagName("script")).find((s) => s.src === src);
        if (existing) return resolve();
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Failed to load script: " + src));
        document.body.appendChild(s);
      });
    }

    async function init() {
      try {
        // Load Leaflet JS and Heat plugin from CDN if not present
        await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
        if (mapMode === "heat") {
          await loadScript("https://unpkg.com/leaflet.heat/dist/leaflet-heat.js");
        }
        // @ts-ignore
        const L = (window as any).L;
        if (!L) return;

        // Clean previous map instance if any
        const existing = (window as any)._adminMap as any;
        if (existing) {
          existing.remove();
          (window as any)._adminMap = null;
        }

        const coords = reports.map((r) => r.location).filter(Boolean) as { lat: number; lng: number }[];
        const center = coords.length
          ? [coords.reduce((a, c) => a + c.lat, 0) / coords.length, coords.reduce((a, c) => a + c.lng, 0) / coords.length]
          : [13.0827, 80.2707]; // Chennai default

        const map = L.map(mapContainerId).setView(center as any, coords.length ? 11 : 10);
        (window as any)._adminMap = map;
        const baseUrl = mapMode === "heat"
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
        const attribution = mapMode === "heat"
          ? "&copy; OpenStreetMap contributors &copy; CARTO"
          : "&copy; OpenStreetMap contributors";
        L.tileLayer(baseUrl, { attribution, maxZoom: 19 }).addTo(map);

        if (mapMode === "markers") {
          reports.forEach((r) => {
            if (!r.location) return;
            const lbl = `${r.title} \u2013 ${r.status.replaceAll("_", " ")}`;
            L.marker([r.location.lat, r.location.lng]).addTo(map).bindPopup(lbl);
          });
        } else if (mapMode === "heat" && (L as any).heatLayer) {
          const priorityToWeight: Record<NonNullable<Report["priority"]>, number> = { low: 0.4, medium: 0.7, high: 1.0 };
          const heatPoints = reports
            .filter((r) => r.location)
            .map((r) => [r.location!.lat, r.location!.lng, priorityToWeight[r.priority]]);
          // @ts-ignore
          (L as any).heatLayer(heatPoints, {
            radius: 26,
            blur: 20,
            maxZoom: 19,
            gradient: {
              0.2: '#22c55e',
              0.4: '#84cc16',
              0.6: '#f59e0b',
              0.8: '#ef4444',
              1.0: '#b91c1c',
            },
          }).addTo(map);
          // Also add markers on top for precise points
          reports.forEach((r) => {
            if (!r.location) return;
            const lbl = `${r.title} \u2013 ${r.status.replaceAll("_", " ")}`;
            L.circleMarker([r.location.lat, r.location.lng], {
              radius: 5,
              color: '#60a5fa',
              weight: 1,
              fillColor: '#3b82f6',
              fillOpacity: 0.8,
            }).addTo(map).bindPopup(lbl);
          });
        }
      } catch {
        // ignore init errors
      }
    }

    init();
  }, [showMap, mapMode, reports]);

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
      if (data.user.role !== "admin") {
        throw new Error("Use an admin account to view reports");
      }
      setToken(data.token);
      setAuthCookie(data.token, data.user.role);
    } catch (err: any) {
      setLoginError(err.message || "Login failed");
    }
  }

  async function updateReport(id: string, patch: Partial<Pick<Report, "status" | "priority">>) {
    if (!token) return;
    setSavingId(id);
    try {
      const res = await fetch(`${API_BASE}/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await res.text());
      await loadReports(token);
      // Hide finished from the table locally too
      setReports((prev) => prev.filter((r) => r.id !== id || patch.status !== 'finished'));
    } catch {
      // ignore for brevity
    } finally {
      setSavingId(null);
    }
  }

  function handleLogout() {
    setToken(null);
    clearAuthCookie();
  }

  return (
    <>
      <Head>
        <title>Admin Web</title>
        <meta name="description" content="Admin web running locally" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        {/* Leaflet CSS via CDN */}
        {showMap && (
          <link
            rel="stylesheet"
            href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          />
        )}
      </Head>
      <div className={styles.page}>
        <main className={styles.main}>
          <h1>Admin Portal</h1>

          {!token ? (
            <div className={styles.card}>
              <form onSubmit={handleLogin} className={styles.form}>
                <h2>Login</h2>
                <div className={styles.field}>
                  <label className={styles.label}>Username</label>
                  <input className={styles.input} value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Password</label>
                  <input className={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button className={styles.button} type="submit">Login</button>
                {loginError && <p style={{ color: "crimson" }}>{loginError}</p>}
              </form>
            </div>
          ) : (
            <>
            <div className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0 }}>Reports</h2>
                <button className={`${styles.button} ${styles.secondary}`} onClick={handleLogout}>
                  Logout
                </button>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                <button className={styles.button} onClick={() => setShowMap((v) => !v)}>
                  {showMap ? 'Hide map' : 'Show map'}
                </button>
                <button className={styles.button} onClick={() => setPrioritySort((v)=>!v)} title="Toggle priority sort">🚦</button>
                <select className={styles.select} value={priorityFilter} onChange={(e)=>setPriorityFilter(e.target.value as any)}>
                  <option value="all">All</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                {showMap && (
                  <select className={styles.select} value={mapMode} onChange={(e) => setMapMode(e.target.value as any)}>
                    <option value="markers">Markers</option>
                    <option value="heat">Heatmap</option>
                  </select>
                )}
                <select className={styles.select} value={filterCategory || ''} onChange={(e) => setFilterCategory((e.target.value || '') as any)}>
                  <option value="">All categories</option>
                  <option value="sewage">Sewage</option>
                  <option value="electricity">Electricity</option>
                  <option value="waste">Waste</option>
                  <option value="roads">Roads</option>
                  <option value="transport">Transport</option>
                  <option value="other">Other</option>
                </select>
                <input className={styles.input} placeholder="Search location" value={filterQ} onChange={(e) => setFilterQ(e.target.value)} />
              </div>
              {loadError && <p style={{ color: "crimson" }}>{loadError}</p>}
              {reports.length === 0 ? (
                <p>No reports yet</p>
              ) : (
                <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead className={styles.thead}>
                    <tr>
                      <th>Priority</th>
                      <th>Upvotes</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Title</th>
                      <th>Description</th>
                      <th>Location</th>
                      <th>Attachments</th>
                      <th>Created At</th>
                      <th>User</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tbody}>
                    {reports.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <span style={{ padding: '2px 8px', borderRadius: 999, fontWeight: 600, background: r.priority==='high'?'#fee2e2': r.priority==='medium'?'#fef9c3':'#dcfce7', color: r.priority==='high'?'#991b1b': r.priority==='medium'?'#92400e':'#166534', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ 
                              width: '8px', 
                              height: '8px', 
                              borderRadius: '50%', 
                              backgroundColor: r.priority === 'high' ? '#dc2626' : r.priority === 'medium' ? '#d97706' : '#16a34a',
                              display: 'inline-block'
                            }}></span>
                            {r.priority === 'high' ? 'High' : r.priority === 'medium' ? 'Medium' : 'Low'}
                          </span>
                        </td>
                        <td>
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            fontWeight: 600,
                            color: r.upvotes && r.upvotes > 0 ? '#059669' : '#6b7280'
                          }}>
                            👍 {r.upvotes || 0}
                          </span>
                        </td>
                        <td>{r.category || '-'}</td>
                        <td>
                          <select value={r.status} onChange={(e) => {
                            const val = e.target.value as Report["status"];
                            if (val === 'finished') {
                              setPendingStatus({ id: r.id, status: 'finished' });
                            } else {
                              updateReport(r.id, { status: val });
                            }
                          }} disabled={savingId === r.id}>
                            <option value="in_progress">In Progress</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                            <option value="finished">Finished</option>
                          </select>
                        </td>
                        <td>
                          <button className={`${styles.button} ${styles.secondary}`} onClick={() => setDetailReport(r)}>View</button>
                        </td>
                        <td>{r.description}</td>
                        <td>{r.locationName || locationNames[r.id] || (resolving[r.id] ? 'Fetching location…' : 'Not available')}</td>
                        <td>
                          {r.attachments?.length ? (
                            <button className={styles.button} onClick={() => setPreviewUrls(r.attachments!.map(normalizeUrl))}>View attachments</button>
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                        <td>{new Date(r.createdAt).toLocaleString()}</td>
                        <td>{resolveUsername(r)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
              {showMap && (
                <div id="reports-map" style={{ width: '100%', height: 420, marginTop: 16, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--gray-alpha-200)' }} />
              )}
              {previewUrls && (
                <div className={styles.modalBackdrop} onClick={() => setPreviewUrls(null)}>
                  <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <h3>Attachments</h3>
                    <div className={styles.attachmentsGrid}>
                      {previewUrls.map((u) => (
                        <div key={u} className={styles.attachmentItem}>
                          {u.match(/\.(mp4|webm|ogg)(\?|$)/i) ? (
                            <video src={u} controls style={{ maxWidth: "100%", maxHeight: 320 }} />
                          ) : (
                            <img src={u} alt="attachment" style={{ maxWidth: "100%", maxHeight: 320 }} />
                          )}
                        </div>
                      ))}
                    </div>
                    <button className={styles.button} onClick={() => setPreviewUrls(null)}>Close</button>
                  </div>
                </div>
              )}
              {detailReport && (
                <div className={styles.modalBackdrop} onClick={() => setDetailReport(null)}>
                  <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <h3>Report Details</h3>
                    <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                      <div><strong>Title:</strong> {detailReport.title}</div>
                      <div><strong>Category:</strong> {detailReport.category || '-'} | <strong>Priority:</strong> {detailReport.priority} | <strong>Status:</strong> {detailReport.status.replaceAll('_',' ')}</div>
                      <div><strong>Location:</strong> {detailReport.locationName || 'Not available'}</div>
                      <div><strong>Created:</strong> {new Date(detailReport.createdAt).toLocaleString()} | <strong>User:</strong> {resolveUsername(detailReport)}</div>
                      <div><strong>Description:</strong></div>
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{detailReport.description}</div>
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className={styles.button} onClick={() => setDetailReport(null)}>Close</button>
                    </div>
                  </div>
                </div>
              )}
              {pendingStatus && (
                <div className={styles.modalBackdrop} onClick={() => setPendingStatus(null)}>
                  <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <h3>Confirm status update</h3>
                    <p style={{ marginTop: 8 }}>Do you really want to update the status to <strong>Finished</strong>? This will notify the citizen and remove the report from this list.</p>
                    <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className={`${styles.button} ${styles.secondary}`} onClick={() => setPendingStatus(null)}>Cancel</button>
                      <button className={styles.button} onClick={async () => {
                        const ps = pendingStatus; setPendingStatus(null);
                        if (ps) await updateReport(ps.id, { status: 'finished' });
                      }}>Yes, update</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.card}>
              <h2>Analytics</h2>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                <label className={styles.label}>City</label>
                <select className={styles.select} value={analyticsCity} onChange={(e) => setAnalyticsCity(e.target.value)}>
                  <option value="">All</option>
                  {Array.from(new Set(reports
                    .map((r) => (r.locationName || '').split(',').map((s) => s.trim()).pop() || '')
                    .filter((c) => c))).sort((a,b)=>a.localeCompare(b)).map((city) => (
                      <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              {(() => {
                const cats: Array<NonNullable<Report["category"]>> = ["sewage","electricity","waste","roads","transport","other"];
                const filtered = reports.filter((r) => {
                  if (!analyticsCity) return true;
                  const city = (r.locationName || '').split(',').map((s)=>s.trim()).pop();
                  return city === analyticsCity;
                });
                const counts = cats.map((c) => filtered.filter((r) => (r.category || 'other') === c).length);
                const max = Math.max(1, ...counts);
                const width = 560;
                const height = 260;
                const padding = 32;
                const barW = (width - padding * 2) / cats.length - 8;
                return (
                  <div style={{ overflowX: 'auto' }}>
                    <svg width={width} height={height} role="img" aria-label="Category counts bar chart">
                      {/* axes */}
                      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" />
                      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#cbd5e1" />
                      {counts.map((v, i) => {
                        const x = padding + i * ((width - padding * 2) / cats.length) + 4;
                        const h = Math.round(((height - padding * 2) * v) / max);
                        const y = height - padding - h;
                        return (
                          <g key={cats[i]}>
                            <rect x={x} y={y} width={barW} height={h} fill="#2563eb" rx={6} />
                            <text x={x + barW / 2} y={height - padding + 14} textAnchor="middle" fontSize="11" fill="#64748b">{cats[i]}</text>
                            <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="12" fill="currentColor">{v}</text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              })()}
            </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
