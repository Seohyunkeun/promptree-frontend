// client/src/pages/Auth.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

export default function Auth() {
  const { user, refreshSession } = useAuth?.() || {};
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // mode: login | signup | profile(닉네임 수정)
  const initialMode = useMemo(() => {
    if (user && params.get("edit") === "1") return "profile";
    return "login";
  }, [user, params]);
  const [mode, setMode] = useState(initialMode);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    // 로그인되어 있으면 닉네임 프리필
    if (user) {
      setNickname(user.user_metadata?.name || "");
    }
  }, [user]);

  const toast = (t) => {
    setMsg(t);
    setTimeout(() => setMsg(""), 3500);
  };

  async function handleSignup(e) {
    e.preventDefault();
    if (!email || !password || !nickname) {
      toast("이메일/비밀번호/닉네임을 모두 입력해줘.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: nickname }, // ← 닉네임을 user_metadata에 저장
          emailRedirectTo: `${window.location.origin}/auth`, // 이메일 확인 후 돌아올 곳
        },
      });
      if (error) throw error;
      toast("가입 메일을 보냈어. 받은편지함에서 확인하고 로그인해줘!");
      setMode("login");
    } catch (err) {
      toast(err.message || "회원가입 중 오류");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (!email || !password) {
      toast("이메일/비밀번호를 입력해줘.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await refreshSession?.();
      toast("로그인 완료!");
      navigate(-1); // 직전 페이지로
    } catch (err) {
      toast(err.message || "로그인 중 오류");
    } finally {
      setLoading(false);
    }
  }

  // OAuth를 쓰는 경우엔 로그인 후 별도로 닉네임만 업데이트
  async function saveProfile(e) {
    e.preventDefault();
    if (!user) {
      toast("로그인이 필요해.");
      return;
    }
    if (!nickname.trim()) {
      toast("닉네임을 입력해줘.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { name: nickname.trim() } });
      if (error) throw error;
      await refreshSession?.();
      toast("닉네임을 저장했어!");
      navigate(-1);
    } catch (err) {
      toast(err.message || "저장 중 오류");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next) {
    setMsg("");
    setMode(next);
  }

  const FormShell = ({ title, children, footer }) => (
    <div className="max-w-md mx-auto mt-10 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 backdrop-blur">
      <h1 className="mb-5 text-xl font-semibold">{title}</h1>
      {msg && (
        <div className="mb-4 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
          {msg}
        </div>
      )}
      {children}
      {footer}
    </div>
  );

  if (mode === "profile") {
    return (
      <FormShell
        title="프로필 편집"
        footer={
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg border border-zinc-700 px-3 py-2 hover:bg-zinc-800"
            >
              취소
            </button>
            <button
              onClick={saveProfile}
              disabled={loading}
              className="rounded-lg bg-white px-4 py-2 font-medium text-black disabled:opacity-60"
            >
              {loading ? "저장 중…" : "저장"}
            </button>
          </div>
        }
      >
        <label className="mb-2 block text-sm text-zinc-400">닉네임</label>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="표시할 닉네임"
          className="mb-3 w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 outline-none ring-0 focus:border-zinc-600"
        />
        <p className="text-xs text-zinc-500">게시판/헤더에 표시될 이름이야.</p>
      </FormShell>
    );
  }

  if (mode === "signup") {
    return (
      <FormShell
        title="회원가입"
        footer={
          <div className="mt-4 text-sm text-zinc-400">
            이미 계정이 있어?{" "}
            <button
              onClick={() => switchMode("login")}
              className="text-white underline underline-offset-4"
            >
              로그인
            </button>
          </div>
        }
      >
        <form onSubmit={handleSignup}>
          <label className="mb-2 block text-sm text-zinc-400">닉네임</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="예: 프붕이"
            className="mb-3 w-full rounded-lg border border-zinc-800 bg-black px-3 py-2"
          />

          <label className="mb-2 block text-sm text-zinc-400">이메일</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
            className="mb-3 w-full rounded-lg border border-zinc-800 bg-black px-3 py-2"
          />

          <label className="mb-2 block text-sm text-zinc-400">비밀번호</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8자 이상 권장"
            type="password"
            className="mb-4 w-full rounded-lg border border-zinc-800 bg-black px-3 py-2"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white px-4 py-2 font-medium text-black disabled:opacity-60"
          >
            {loading ? "가입 중…" : "회원가입"}
          </button>
        </form>
      </FormShell>
    );
  }

  // login
  return (
    <FormShell
      title="로그인"
      footer={
        <div className="mt-4 text-sm text-zinc-400">
          계정이 없어?{" "}
          <button
            onClick={() => switchMode("signup")}
            className="text-white underline underline-offset-4"
          >
            회원가입
          </button>
        </div>
      }
    >
      <form onSubmit={handleLogin}>
        <label className="mb-2 block text-sm text-zinc-400">이메일</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          type="email"
          className="mb-3 w-full rounded-lg border border-zinc-800 bg-black px-3 py-2"
        />

        <label className="mb-2 block text-sm text-zinc-400">비밀번호</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          type="password"
          className="mb-4 w-full rounded-lg border border-zinc-800 bg-black px-3 py-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-white px-4 py-2 font-medium text-black disabled:opacity-60"
        >
          {loading ? "로그인 중…" : "로그인"}
        </button>
      </form>
    </FormShell>
  );
}
