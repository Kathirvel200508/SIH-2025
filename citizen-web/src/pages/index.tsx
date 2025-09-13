


import Head from "next/head";
import { useEffect, useState } from "react";
import styles from "@/styles/Home.module.css";
import { Navbar } from "@/shared/components/Navbar";
import { signInWithGoogle, completeGoogleRedirectIfAny, sendEmailSignInLink, completeEmailLinkIfPresent, isEmailLinkPendingAndNeedsEmail, completeEmailLinkWithEmail, sendOTP, verifyOTP } from "@/lib/firebase";
import { useLanguage } from "@/shared/language/LanguageContext";
import { useUser } from "@/shared/user/UserContext";
import { useFirebaseAuth } from "@/shared/auth/FirebaseAuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || (typeof window !== 'undefined' ? 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 
    'http://localhost:4000' : 
    `${window.location.protocol}//192.168.168.229:4000`) : 
  "http://localhost:4000");

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
  const { user: firebaseUser, loading: firebaseLoading } = useFirebaseAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [needsEmailToComplete, setNeedsEmailToComplete] = useState(false);
  
  // Phone authentication states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  // Priority is now automatically set to 'low' by backend
  const [category, setCategory] = useState<ReportCategory>("sewage");
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [uploading, setUploading] = useState(false);
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [prioritySort, setPrioritySort] = useState<boolean>(false);
  const [priorityFilter, setPriorityFilter] = useState<ReportPriority | 'all'>('all');
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [locationName, setLocationName] = useState<string | undefined>(undefined);
  const [derivedNames, setDerivedNames] = useState<Record<string, string>>({});
  const [resolving, setResolving] = useState<Record<string, boolean>>({});
  const [showForm, setShowForm] = useState(false);

  // Handle Firebase authentication success
  const handleFirebaseAuthSuccess = async (firebaseUser: { uid: string; displayName?: string; phoneNumber?: string }) => {
    try {
      // Create user data for the backend
      const userData = {
        id: firebaseUser.uid,
        username: firebaseUser.displayName || firebaseUser.phoneNumber || firebaseUser.uid,
        role: "citizen" as const
      };
      
      // Set user in context
      setUser(userData);
      
      // DEV: Exchange for backend JWT using demo citizen account so protected routes work
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'user', password: 'user123' }),
        });
        if (res.ok) {
          const data: LoginResponse = await res.json();
          setToken(data.token);
        } else {
          // Fallback to UID if login fails (will 401 on protected routes)
          setToken(firebaseUser.uid);
        }
      } catch {
        setToken(firebaseUser.uid);
      }
      
      setLoginError(null);
    } catch (error) {
      console.error("Error handling Firebase auth success:", error);
      setLoginError("Authentication successful but failed to initialize user session");
    }
  };

  const handleFirebaseAuthError = (error: string) => {
    setLoginError(error);
  };

  // Complete Google redirect (if popup blocked)
  useEffect(() => {
    completeGoogleRedirectIfAny();
  }, []);

  // Complete Email Link sign-in, if present in URL
  useEffect(() => {
    completeEmailLinkIfPresent();
    setNeedsEmailToComplete(isEmailLinkPendingAndNeedsEmail());
  }, []);

  // When Firebase auth state is available, sync it into our UserContext
  useEffect(() => {
    if (!firebaseUser) return;
    // Avoid re-setting if already have token/user
    if (token && user) return;
    const userData = {
      id: firebaseUser.uid,
      username: firebaseUser.displayName || firebaseUser.email || firebaseUser.uid,
      role: "citizen" as const,
    };
    setUser(userData);
    // DEV: Auto-login backend demo citizen to obtain JWT for protected routes
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'user', password: 'user123' }),
        });
        if (res.ok) {
          const data: LoginResponse = await res.json();
          setToken(data.token);
        } else {
          setToken(firebaseUser.uid);
        }
      } catch {
        setToken(firebaseUser.uid);
      }
    })();
    setLoginError(null);
  }, [firebaseUser, token, user, setUser, setToken]);

  // Token and user are now managed by UserContext
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/reports/mine`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data: Report[] = await res.json();
          setMyReports(data);
        }
      } catch {
        // Silently ignore network/CORS errors; UI remains usable
      }
    })();
  }, [token]);

  useEffect(() => {
    const rank: Record<ReportPriority, number> = { high: 0, medium: 1, low: 2 };
    let arr = [...myReports];
    if (priorityFilter !== 'all') {
      arr = arr.filter((r) => r.priority === priorityFilter);
    }
    if (prioritySort) {
      arr.sort((a,b) => {
        const pr = rank[a.priority] - rank[b.priority];
        if (pr !== 0) return pr;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      arr.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    setFilteredReports(arr);
  }, [myReports, prioritySort, priorityFilter]);

  useEffect(() => {
    function onPriorityEvent(e: Event) {
      const ev = e as CustomEvent<any>;
      const detail = ev.detail || {};
      if (detail.toggleSort) setPrioritySort((v) => !v);
      if (detail.filter) setPriorityFilter(detail.filter === 'all' ? 'all' : detail.filter);
    }
    document.addEventListener('citizen_priority_filter', onPriorityEvent as any);
    return () => document.removeEventListener('citizen_priority_filter', onPriorityEvent as any);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    if (!username || !password) {
      setLoginError("Enter username and password");
      return;
    }
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
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    }
  }

  // Phone authentication functions
  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    
    if (!phoneNumber) {
      setLoginError("Enter phone number");
      return;
    }

    try {
      // Format phone number with country code if not present
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      
      const confirmationResult = await sendOTP(formattedPhone);
      setVerificationId(confirmationResult.verificationId);
      setOtpSent(true);
      setLoginError(null);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "Failed to send OTP");
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    
    if (!otp || !verificationId) {
      setLoginError("Enter OTP");
      return;
    }

    try {
      const result = await verifyOTP(verificationId, otp);
      
      // Handle successful phone authentication
      if (result.user) {
        // For the dummy phone number, set username as "byteforge"
        const userData = {
          id: result.user.uid,
          username: phoneNumber === "6383323548" ? "byteforge" : (result.user.displayName || result.user.phoneNumber || result.user.uid),
          role: "citizen" as const
        };
        
        setUser(userData);
        
        // Get backend JWT token
        try {
          const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'user', password: 'user123' }),
          });
          if (res.ok) {
            const data: LoginResponse = await res.json();
            setToken(data.token);
          } else {
            setToken(result.user.uid);
          }
        } catch {
          setToken(result.user.uid);
        }
        
        setLoginError(null);
        // Reset phone auth states
        setOtpSent(false);
        setVerificationId(null);
        setOtp("");
        setPhoneNumber("");
      }
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "Invalid OTP");
    }
  }

  async function uploadFilesIfAny(): Promise<string[] | undefined> {
    if (!token) return undefined;
    setUploading(true);
    try {
      const form = new FormData();
      if (files && files.length > 0) {
        Array.from(files).forEach((f) => form.append("files", f));
      }
      if (voiceBlob) {
        const audioFile = new File([voiceBlob], `voice-${Date.now()}.webm`, { type: voiceBlob.type || 'audio/webm' });
        form.append('files', audioFile);
      }
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

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setVoiceBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
      };
      rec.start();
      setMediaRecorder(rec);
      setRecording(true);
    } catch {
      // ignore
    }
  }

  function stopRecording() {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
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
  }, [myReports, derivedNames]);

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
        body: JSON.stringify({ title, description, category, attachments, location: loc, locationName: locName }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSubmitMsg("Report submitted successfully");
      setTitle("");
      setDescription("");
      setFiles(null);
      setCategory("sewage");
      const mine = await fetch(`${API_BASE}/reports/mine`, { headers: { Authorization: `Bearer ${token}` } });
      if (mine.ok) setMyReports(await mine.json());
      
      // Notify other components that new report was submitted
      window.dispatchEvent(new CustomEvent('reportSubmitted'));
    } catch (err: unknown) {
      setSubmitMsg(err instanceof Error ? err.message : "Failed to submit");
    }
  }

  return (
    <>
      <Head>
        <title>{t("citizenPortal")}</title>
        <meta name="description" content="Citizen web" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      <Navbar />
      <div className={styles.page}>
        <main className={styles.main}>
          <h1>{t("citizenPortal")}</h1>

          {!user ? (
            <>
              <div className={styles.card}>
                <div style={{ textAlign: 'center' }}>
                  <h2>Welcome to Citizen Portal</h2>
                  
                  {/* Authentication Method Toggle */}
                  <div className={styles.authToggle}>
                    <button 
                      type="button"
                      className={authMethod === 'phone' ? 'active' : ''}
                      onClick={() => setAuthMethod('phone')}
                    >
                      📱 Phone
                    </button>
                    <button 
                      type="button"
                      className={authMethod === 'email' ? 'active' : ''}
                      onClick={() => setAuthMethod('email')}
                    >
                      📧 Email
                    </button>
                  </div>

                  {/* Phone Authentication */}
                  {authMethod === 'phone' && (
                    <div>
                      <div style={{ marginBottom: 8, fontWeight: 600 }}>Sign in with Phone Number</div>
                      {!otpSent ? (
                        <form onSubmit={handleSendOTP} className={styles.form}>
                          <input 
                            className={`${styles.input} ${styles.phoneInput}`}
                            type="tel" 
                            placeholder="Enter phone number" 
                            value={phoneNumber} 
                            onChange={(e) => setPhoneNumber(e.target.value)} 
                            required 
                          />
                          <button className={`${styles.button} ${styles.primary}`} type="submit">
                            📱 Send OTP
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleVerifyOTP} className={styles.form}>
                          <input 
                            className={`${styles.input} ${styles.otpInput}`}
                            type="text" 
                            placeholder="Enter OTP" 
                            value={otp} 
                            onChange={(e) => setOtp(e.target.value)} 
                            required 
                          />
                          <button className={`${styles.button} ${styles.success}`} type="submit">
                            ✅ Verify OTP
                          </button>
                          <button 
                            type="button" 
                            className={`${styles.button} ${styles.secondary}`}
                            onClick={() => {
                              setOtpSent(false);
                              setVerificationId(null);
                              setOtp("");
                            }}
                          >
                            🔄 Change Number
                          </button>
                        </form>
                      )}
                      {otpSent && <p style={{ marginTop: 8, fontSize: '14px', color: '#666' }}>OTP sent to {phoneNumber}</p>}
                    </div>
                  )}

                  {/* Email Authentication */}
                  {authMethod === 'email' && (
                    <div>
                      <div style={{ marginBottom: 8, fontWeight: 600 }}>Or continue via email link</div>
                      {!needsEmailToComplete ? (
                        <form onSubmit={async (e) => { e.preventDefault(); try { await sendEmailSignInLink(email); window.localStorage.setItem('emailForSignIn', email); setEmailSent(true); setLoginError(null); } catch (err) { setLoginError(err instanceof Error ? err.message : 'Failed to send email'); } }} className={styles.form}>
                          <input className={styles.input} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                          <button className={`${styles.button} ${styles.info}`} type="submit">📧 Send sign-in link</button>
                        </form>
                      ) : (
                        <form onSubmit={async (e) => { e.preventDefault(); try { await completeEmailLinkWithEmail(email); setLoginError(null); } catch (err) { setLoginError(err instanceof Error ? err.message : 'Failed to complete sign-in'); } }} className={styles.form}>
                          <input className={styles.input} type="email" placeholder="enter your email to complete sign-in" value={email} onChange={(e) => setEmail(e.target.value)} required />
                          <button className={`${styles.button} ${styles.success}`} type="submit">✅ Complete sign-in</button>
                        </form>
                      )}
                      {emailSent && <p style={{ marginTop: 8 }}>Check your inbox and click the sign-in link.</p>}
                    </div>
                  )}

                  {loginError && <p style={{ color: 'crimson', marginTop: 12 }}>{loginError}</p>}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={styles.card}>
                <div id="report-form" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  gap: 12,
                  flexDirection: 'column'
                }}>
                  <p style={{ margin: 0, textAlign: 'center', width: '100%' }}>{t("loggedInMsg")}</p>
                  {!showForm && (
                    <button type="button" className={`${styles.button} ${styles.primary}`} onClick={() => setShowForm(true)}>
                      📝 {t("reportButton")}
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
                    <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                      {!recording ? (
                        <button type="button" className={`${styles.button} ${styles.info}`} onClick={startRecording}>🎤 Record voice note</button>
                      ) : (
                        <button type="button" className={`${styles.button} ${styles.danger}`} onClick={stopRecording}>⏹️ Stop recording</button>
                      )}
                      {voiceBlob && (
                        <audio controls src={URL.createObjectURL(voiceBlob)} />
                      )}
                    </div>
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
                  <button className={`${styles.button} ${styles.success}`} type="submit" disabled={uploading}>
                    {uploading ? "⏳ Uploading..." : `🚀 ${t("submitReport")}`}
                  </button>
                </form>
                )}
                {submitMsg && <p>{submitMsg}</p>}
              </div>

              <div className={styles.card} id="my-reports">
                <h2>{t("myReports")}</h2>
                {(filteredReports.length === 0) ? (
                  <p>{t("noReports")}</p>
                ) : (
                  <div className={`${styles.tableWrap} ${styles.mobileTableCard}`}>
                    {/* Desktop Table */}
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
                        {filteredReports.map((r) => (
                          <tr key={r.id}>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <td>{t(`status_${r.status}` as any)}</td>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <td>{t(r.priority as any)}</td>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
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

                    {/* Mobile Cards */}
                    {filteredReports.map((r) => (
                      <div key={r.id} className={styles.mobileCard}>
                        <div className={styles.mobileCardHeader}>
                          <div className={styles.mobileCardTitle}>{r.title}</div>
                          <div className={styles.mobileCardStatus} style={{
                            backgroundColor: r.status === 'finished' ? '#10b981' : 
                                           r.status === 'in_progress' ? '#f59e0b' : 
                                           r.status === 'accepted' ? '#3b82f6' : '#ef4444',
                            color: 'white'
                          }}>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {t(`status_${r.status}` as any)}
                          </div>
                        </div>
                        <div className={styles.mobileCardContent}>
                          <div className={styles.mobileCardItem}>
                            <div className={styles.mobileCardLabel}>{t("priority")}</div>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <div className={styles.mobileCardValue}>{t(r.priority as any)}</div>
                          </div>
                          <div className={styles.mobileCardItem}>
                            <div className={styles.mobileCardLabel}>{t("categoryHeader")}</div>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <div className={styles.mobileCardValue}>{t((`cat_${(r as any).category || 'other'}`) as any)}</div>
                          </div>
                          <div className={styles.mobileCardItem}>
                            <div className={styles.mobileCardLabel}>{t("location")}</div>
                            <div className={styles.mobileCardValue}>
                              {r.locationName || derivedNames[r.id] || (resolving[r.id] ? t("fetchingLocation") : t("notAvailable"))}
                            </div>
                          </div>
                          <div className={styles.mobileCardItem}>
                            <div className={styles.mobileCardLabel}>{t("created")}</div>
                            <div className={styles.mobileCardValue}>
                              {new Date(r.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          {r.attachments?.length && (
                            <div className={styles.mobileCardAttachments}>
                              <div className={styles.mobileCardLabel}>{t("attachments")}</div>
                              <ul>
                                {r.attachments.map((u) => (
                                  <li key={u}>
                                    <a href={u.startsWith('http') ? u : `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`} target="_blank" rel="noreferrer">
                                      View
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
      
      {/* reCAPTCHA container for phone authentication */}
      <div id="recaptcha-container"></div>
    </>
  );
}
