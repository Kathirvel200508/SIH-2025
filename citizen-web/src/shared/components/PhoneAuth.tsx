import React, { useState, useEffect } from "react";
import { sendOTP, getRecaptchaVerifier } from "@/lib/firebase";
import { ConfirmationResult } from "firebase/auth";
import styles from "@/styles/Home.module.css";

interface PhoneAuthProps {
  onSuccess: (user: { uid: string; displayName?: string; phoneNumber?: string }) => void;
  onError: (error: string) => void;
  mode: 'login' | 'register';
  onModeChange: (mode: 'login' | 'register') => void;
}

export function PhoneAuth({ onSuccess, onError, mode, onModeChange }: PhoneAuthProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Format phone number for India only: always returns +91XXXXXXXXXX using last 10 digits
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const lastTen = cleaned.slice(-10);
    return `+91${lastTen}`;
  };

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Initialize visible reCAPTCHA (normal)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        getRecaptchaVerifier();
      } catch (error) {
        console.error('reCAPTCHA initialization error:', error);
      }
    }
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      onError("Enter a valid 10-digit Indian phone number");
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      console.log('Sending OTP to:', formattedPhone);
      
      // Ensure reCAPTCHA is available and rendered (invisible)
      try {
        getRecaptchaVerifier();
      } catch {}
      
      const result = await sendOTP(formattedPhone);
      console.log('OTP sent successfully:', result);
      setConfirmationResult(result);
      setStep('otp');
      setCountdown(60); // 60 seconds countdown
    } catch (error: unknown) {
      console.error("Error sending OTP:", error);
      let errorMessage = "Failed to send OTP. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('reCAPTCHA')) {
          errorMessage = "reCAPTCHA verification failed. Please refresh the page and try again.";
        } else if (error.message.includes('invalid-phone-number')) {
          errorMessage = "Invalid phone number format. Please enter a valid phone number.";
        } else if (error.message.includes('too-many-requests')) {
          errorMessage = "Too many requests. Please wait a few minutes before trying again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      onError("Please enter a valid 6-digit OTP");
      return;
    }

    if (!confirmationResult) {
      onError("No verification in progress");
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      onSuccess({
        ...result.user,
        displayName: mode === 'register' ? name : (result.user.displayName || undefined),
        phoneNumber: result.user.phoneNumber || undefined
      });
    } catch (error: unknown) {
      console.error("Error verifying OTP:", error);
      onError(error instanceof Error ? error.message : "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const result = await sendOTP(formattedPhone);
      setConfirmationResult(result);
      setCountdown(60);
    } catch (error: unknown) {
      onError(error instanceof Error ? error.message : "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('phone');
    setOtp('');
    setConfirmationResult(null);
  };

  return (
    <div className={styles.card}>
      {/* Visible reCAPTCHA container */}
      <div id="recaptcha-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }} />
      
      {step === 'phone' ? (
        <form onSubmit={handleSendOTP} className={styles.form}>
          <h2>{mode === 'login' ? 'Login' : 'Register'} with Phone Number</h2>
          
          {mode === 'register' && (
            <div className={styles.field}>
              <label className={styles.label}>Full Name</label>
              <input
                className={styles.input}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Phone Number</label>
            <input
              className={`${styles.input} ${styles.phoneNumberInput}`}
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="10-digit Indian number (e.g., 9876543210)"
              required
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              India only (+91). We&apos;ll send you a 6-digit verification code
            </small>
          </div>

          <button 
            className={styles.button} 
            type="submit" 
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Sending...' : `Send OTP`}
          </button>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#2563eb', 
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {mode === 'login' ? "Don't have an account? Register" : "Already have an account? Login"}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className={styles.form}>
          <h2>Verify Phone Number</h2>
          
          <div className={styles.field}>
            <label className={styles.label}>Enter 6-digit OTP</label>
            <input
              className={`${styles.input} ${styles.otpInput}`}
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              required
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              OTP sent to {phoneNumber}
            </small>
          </div>

          <button 
            className={styles.button} 
            type="submit" 
            disabled={loading || otp.length !== 6}
            style={{ width: '100%' }}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={countdown > 0}
              className={`${styles.resendButton} ${countdown > 0 ? 'disabled' : ''}`}
            >
              {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <button
              type="button"
              onClick={handleBack}
              className={styles.backButton}
            >
              ← Change phone number
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
