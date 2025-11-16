// client/src/contexts/AuthProvider.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState(null);
  const user = session?.user ?? null;

  // 최초 세션 로드
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      setInitializing(false);
    })();

    // 상태 변화 구독
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // Actions
  const signInWithPassword = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUpWithPassword = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    // 이메일 확인(Confirm) 설정 시, 메일 인증 필요
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = useMemo(
    () => ({ initializing, session, user, signInWithPassword, signUpWithPassword, signInWithGoogle, signOut }),
    [initializing, session, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
