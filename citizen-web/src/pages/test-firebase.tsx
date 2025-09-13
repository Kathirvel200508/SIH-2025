
import React, { useState } from "react";
import { sendOTP, getRecaptchaVerifier } from "@/lib/firebase";
import styles from "@/styles/Home.module.css";

export default function TestFirebase() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleTest = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    
    try {
      console.log("Testing Firebase Phone Auth...");
      
      // Check reCAPTCHA
      const recaptcha = getRecaptchaVerifier();
      console.log("reCAPTCHA verifier:", recaptcha);
      
      if (!recaptcha) {
        throw new Error("reCAPTCHA not initialized");
      }
      
      // Format phone number
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      console.log("Sending OTP to:", formattedPhone);
      
      // Send OTP
      const result = await sendOTP(formattedPhone);
      console.log("OTP sent successfully:", result);
      setMessage("OTP sent successfully! Check your phone.");
      
    } catch (error: unknown) {
      console.error("Test error:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Firebase Phone Auth Test</h1>
      
      <div id="recaptcha-container" style={{ 
        marginBottom: "20px", 
        display: "flex", 
        justifyContent: "center" 
      }}></div>
      
      <div className={styles.field}>
        <label className={styles.label}>Phone Number</label>
        <input
          className={styles.input}
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter phone number (e.g., 9876543210)"
        />
      </div>
      
      <button 
        className={styles.button} 
        onClick={handleTest} 
        disabled={loading || !phoneNumber.trim()}
        style={{ width: "100%" }}
      >
        {loading ? "Testing..." : "Test Send OTP"}
      </button>
      
      {message && (
        <div style={{ 
          marginTop: "16px", 
          padding: "12px", 
          background: "#d1fae5", 
          color: "#065f46", 
          borderRadius: "8px" 
        }}>
          ✅ {message}
        </div>
      )}
      
      {error && (
        <div style={{ 
          marginTop: "16px", 
          padding: "12px", 
          background: "#fee2e2", 
          color: "#991b1b", 
          borderRadius: "8px" 
        }}>
          ❌ {error}
        </div>
      )}
      
      <div style={{ marginTop: "20px", fontSize: "14px", color: "#666" }}>
        <h3>Debugging Steps:</h3>
        <ol>
          <li>Make sure Firebase Phone Auth is enabled in Firebase Console</li>
          <li>Add your domain to authorized domains in Firebase Console</li>
          <li>Check browser console for detailed error messages</li>
          <li>Ensure reCAPTCHA loads properly (you should see a checkbox)</li>
          <li>Try with a valid Indian phone number (+91XXXXXXXXXX)</li>
        </ol>
      </div>
    </div>
  );
}


