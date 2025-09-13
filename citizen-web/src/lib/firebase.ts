// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, setPersistence, browserSessionPersistence, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB10-r2lpYSLvf1PoZM0Cg67j5bf7bp9FY",
  authDomain: "sih-civic-ed505.firebaseapp.com",
  projectId: "sih-civic-ed505",
  storageBucket: "sih-civic-ed505.firebasestorage.app",
  messagingSenderId: "284798510634",
  appId: "1:284798510634:web:63eb0fd01cc44d7cdb8553",
  measurementId: "G-TZDYY00LG0"
};

// Initialize Firebase (avoid duplicate initialization in Next.js)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
// Improve DX locally: disable app verification when running on localhost
if (typeof window !== 'undefined') {
  try {
    // Keep auth state for this browser tab (survives navigation/redirect)
    setPersistence(auth, browserSessionPersistence).catch(() => {});
    const isLocalhost = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
    if (isLocalhost) {
      // This should only be used for local development/testing
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error - settings is available at runtime
      auth.settings.appVerificationDisabledForTesting = true;
      isLocalTesting = true;
    }
    auth.useDeviceLanguage();
  } catch {}
}

// Initialize Analytics (only in browser environment)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Export Firebase app
export default app;

// ReCAPTCHA verifier for phone authentication (invisible)
let recaptchaVerifier: RecaptchaVerifier | null = null;
let recaptchaWidgetId: number | null = null;
let isLocalTesting = false;

export const getRecaptchaVerifier = () => {
  if (!recaptchaVerifier && typeof window !== 'undefined') {
    // Expect a visible container with id 'recaptcha-container' in the DOM
    const container = document.getElementById('recaptcha-container');
    if (!container) {
      // If not present, create a visible one at the end of body
      const created = document.createElement('div');
      created.id = 'recaptcha-container';
      created.style.margin = '12px 0';
      document.body.appendChild(created);
    }

    recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'normal',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        recaptchaVerifier = null;
        recaptchaWidgetId = null;
      }
    });
  }
  return recaptchaVerifier;
};

function resetRecaptcha() {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {}
  }
  recaptchaVerifier = null;
  recaptchaWidgetId = null;
  if (typeof window !== 'undefined') {
    const el = document.getElementById('recaptcha-container');
    if (el) el.innerHTML = '';
  }
}

async function ensureRecaptchaReady(): Promise<RecaptchaVerifier> {
  const verifier = getRecaptchaVerifier();
  if (!verifier) throw new Error('reCAPTCHA not initialized');
  if (recaptchaWidgetId == null) {
    try {
      recaptchaWidgetId = await verifier.render();
    } catch (err) {
      // If render fails, reset and try once more
      recaptchaVerifier = null;
      recaptchaWidgetId = null;
      const v2 = getRecaptchaVerifier();
      if (!v2) throw err instanceof Error ? err : new Error('Failed to initialize reCAPTCHA');
      recaptchaWidgetId = await v2.render();
      return v2;
    }
  }
  return verifier;
}

// Phone authentication functions
export const sendOTP = async (phoneNumber: string) => {
  if (isLocalTesting) {
    const testingVerifier = {
      type: 'recaptcha',
      verify: async () => 'test-verification-token'
    } as { type: string; verify: () => Promise<string> };
    // @ts-expect-error - matches ApplicationVerifier at runtime
    return signInWithPhoneNumber(auth, phoneNumber, testingVerifier);
  }

  // Always reset and create a fresh widget to avoid MALFORMED tokens
  resetRecaptcha();
  const appVerifier = await ensureRecaptchaReady();
  // Ensure the widget is rendered (no-op if already rendered)
  await appVerifier.render();

  // Fail fast if Firebase/reCAPTCHA hangs
  const timeoutMs = 20000;
  const withTimeout = <T>(p: Promise<T>) => new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Request timed out. Please retry.')), timeoutMs);
    p.then((v) => { clearTimeout(t); resolve(v); }).catch((e) => { clearTimeout(t); reject(e); });
  });

  return withTimeout(signInWithPhoneNumber(auth, phoneNumber, appVerifier));
};

export const verifyOTP = async (verificationId: string, otp: string) => {
  const credential = PhoneAuthProvider.credential(verificationId, otp);
  return signInWithCredential(auth, credential);
};

// Google Sign-In helpers
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    // Fallback to redirect on popup blockers
    await signInWithRedirect(auth, googleProvider);
  }
}

export async function completeGoogleRedirectIfAny(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await getRedirectResult(auth);
  } catch {}
}

// Email Link (passwordless) helpers
function getEmailActionCodeSettings() {
  const defaultOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const url = `${defaultOrigin}/finish-sign-in`;
  return {
    url,
    handleCodeInApp: true as const,
  };
}

export async function sendEmailSignInLink(email: string): Promise<void> {
  const settings = getEmailActionCodeSettings();
  await sendSignInLinkToEmail(auth, email, settings);
}

export async function completeEmailLinkIfPresent(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const href = window.location.href;
  if (!isSignInWithEmailLink(auth, href)) return false;
  const email = window.localStorage.getItem('emailForSignIn') || '';
  if (!email) return false;
  try {
    await signInWithEmailLink(auth, email, href);
    try { window.localStorage.removeItem('emailForSignIn'); } catch {}
    try {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      // Navigate to home to ensure UI shows authenticated state
      if (window.location.pathname !== '/') {
        window.location.assign('/');
      }
    } catch {}
    return true;
  } catch {
    return false;
  }
}

export function isEmailLinkPendingAndNeedsEmail(): boolean {
  if (typeof window === 'undefined') return false;
  const href = window.location.href;
  if (!isSignInWithEmailLink(auth, href)) return false;
  const email = window.localStorage.getItem('emailForSignIn') || '';
  return !email;
}

export async function completeEmailLinkWithEmail(email: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const href = window.location.href;
  if (!isSignInWithEmailLink(auth, href)) return false;
  await signInWithEmailLink(auth, email, href);
  try { window.localStorage.removeItem('emailForSignIn'); } catch {}
  try {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    if (window.location.pathname !== '/') window.location.assign('/');
  } catch {}
  return true;
}
