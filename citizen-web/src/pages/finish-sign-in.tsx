import Head from "next/head";
import { useEffect, useState } from "react";
import styles from "@/styles/Home.module.css";
import { completeEmailLinkIfPresent, isEmailLinkPendingAndNeedsEmail, completeEmailLinkWithEmail } from "@/lib/firebase";

export default function FinishSignIn() {
  const [email, setEmail] = useState("");
  const [needsEmail, setNeedsEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const needs = isEmailLinkPendingAndNeedsEmail();
        setNeedsEmail(needs);
        if (!needs) {
          const ok = await completeEmailLinkIfPresent();
          if (!ok) setError("Invalid or expired link. Request a new email link.");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to complete sign-in");
      }
    })();
  }, []);

  return (
    <>
      <Head>
        <title>Finishing sign-in…</title>
      </Head>
      <div className={styles.page}>
        <main className={styles.main}>
          <h1>Finishing sign-in…</h1>
          {needsEmail ? (
            <div className={styles.card}>
              <p>Enter your email to complete sign-in:</p>
              <form onSubmit={async (e) => { e.preventDefault(); try { const ok = await completeEmailLinkWithEmail(email); if (!ok) setError('Invalid or expired link. Request a new email link.'); } catch (err) { setError(err instanceof Error ? err.message : 'Failed to complete sign-in'); } }} className={styles.form}>
                <input className={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <button className={styles.button} type="submit" style={{ width: '100%' }}>Complete sign-in</button>
              </form>
            </div>
          ) : (
            <p>Please wait…</p>
          )}
          {error && <p style={{ color: 'crimson' }}>{error}</p>}
        </main>
      </div>
    </>
  );
}


