// client/src/contexts/AuthContext.jsx
import { createClient } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";

// Supabase 클라이언트 생성
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase env가 설정되지 않았습니다. .env.local의 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY를 확인하세요."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth 컨텍스트
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 초기 유저 + 상태 구독
  useEffect(() => {
    let ignore = false;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (ignore) return;
        setUser(data?.user ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (ignore) return;
        setUser(session?.user ?? null);
      }
    );

    return () => {
      ignore = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signUp = (email, password) =>
    supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signOut = () => supabase.auth.signOut();

  const value = { user, loading, signUp, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
