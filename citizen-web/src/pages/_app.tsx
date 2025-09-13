import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { LanguageProvider } from "@/shared/language/LanguageContext";
import { UserProvider } from "@/shared/user/UserContext";
import { FirebaseAuthProvider } from "@/shared/auth/FirebaseAuthContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <FirebaseAuthProvider>
      <UserProvider>
        <LanguageProvider>
          <Component {...pageProps} />
        </LanguageProvider>
      </UserProvider>
    </FirebaseAuthProvider>
  );
}
