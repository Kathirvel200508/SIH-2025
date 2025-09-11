import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { LanguageProvider } from "@/shared/language/LanguageContext";
import { UserProvider } from "@/shared/user/UserContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <LanguageProvider>
        <Component {...pageProps} />
      </LanguageProvider>
    </UserProvider>
  );
}
