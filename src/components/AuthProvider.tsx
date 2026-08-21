"use client";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, initAnalytics } from "@/lib/firebase";
import type { MessageKey } from "@/lib/i18n";

type AuthState = {
  user: User | null;
  loading: boolean;
  /** Either a translatable key or, for unexpected failures, raw text. */
  error: { key?: MessageKey; text?: string } | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
});

/** Codes that mean "the user changed their mind" — not worth showing. */
const SILENT = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/user-cancelled",
]);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthState["error"]>(null);

  useEffect(() => {
    void initAnalytics();
    return onAuthStateChanged(
      auth,
      (u) => {
        setUser(u);
        setLoading(false);
      },
      (err) => {
        setError({ text: err.message });
        setLoading(false);
      }
    );
  }, []);

  // Auth failures are reported through `error`, never as a rejected promise —
  // an unhandled rejection here surfaces as a full-page Next.js error overlay.
  const signIn = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      if (!SILENT.has(code)) setError(describe(code, (err as Error).message));
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (err) {
      setError({ text: (err as Error).message });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

function describe(code: string, fallback: string): AuthState["error"] {
  switch (code) {
    case "auth/operation-not-allowed":
      return { key: "auth.notAllowed" };
    case "auth/unauthorized-domain":
      return { key: "auth.unauthorizedDomain" };
    case "auth/popup-blocked":
      return { key: "auth.popupBlocked" };
    case "auth/network-request-failed":
      return { key: "auth.networkFailed" };
    default:
      return { text: fallback };
  }
}

export const useAuth = () => useContext(AuthContext);
