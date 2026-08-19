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

type AuthState = {
  user: User | null;
  loading: boolean;
  error: string;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  error: "",
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
  const [error, setError] = useState("");

  useEffect(() => {
    void initAnalytics();
    return onAuthStateChanged(
      auth,
      (u) => {
        setUser(u);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  }, []);

  // Auth failures are reported through `error`, never as a rejected promise —
  // an unhandled rejection here surfaces as a full-page Next.js error overlay.
  const signIn = async () => {
    setError("");
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
      setError((err as Error).message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

function describe(code: string, fallback: string) {
  switch (code) {
    case "auth/operation-not-allowed":
      return "Firebase 콘솔에서 Google 로그인이 아직 활성화되지 않았습니다.";
    case "auth/unauthorized-domain":
      return "이 도메인은 Firebase 승인 도메인 목록에 없습니다.";
    case "auth/popup-blocked":
      return "브라우저가 로그인 팝업을 차단했습니다. 팝업을 허용해 주세요.";
    case "auth/network-request-failed":
      return "네트워크 오류로 로그인하지 못했습니다.";
    default:
      return fallback;
  }
}

export const useAuth = () => useContext(AuthContext);
