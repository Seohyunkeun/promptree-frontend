// client/src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";

export default function Login() {
  const nav = useNavigate();
  const { signInWithPassword, signUpWithPassword, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setPending(true);
    try {
      if (mode === "login") {
        await signInWithPassword(email, pw);
      } else {
        await signUpWithPassword(email, pw);
      }
      nav("/", { replace: true });
    } catch (e) {
      setErr(e?.message || "오류가 발생했습니다.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-zinc-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">{mode === "login" ? "로그인" : "회원가입"}</h1>
          <Link to="/" className="text-sm text-zinc-400 hover:text-zinc-200">홈으로</Link>
        </div>

        <div className="flex gap-1 mb-4">
          <button
            onClick={()=>setMode("login")}
            className={`h-8 px-3 rounded-full border ${mode==="login"?"bg-white text-black border-zinc-200":"bg-zinc-900 border-zinc-700 text-zinc-200"}`}
          >
            로그인
          </button>
          <button
            onClick={()=>setMode("register")}
            className={`h-8 px-3 rounded-full border ${mode==="register"?"bg-white text-black border-zinc-200":"bg-zinc-900 border-zinc-700 text-zinc-200"}`}
          >
            회원가입
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-3">
          <input
            type="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            placeholder="이메일"
            className="h-10 px-3 rounded-lg border border-zinc-700 bg-black/40 outline-none"
            required
          />
          <input
            type="password"
            value={pw}
            onChange={(e)=>setPw(e.target.value)}
            placeholder="비밀번호"
            className="h-10 px-3 rounded-lg border border-zinc-700 bg-black/40 outline-none"
            required
          />
          <button
            type="submit"
            disabled={pending}
            className="h-10 rounded-lg bg-white text-black font-medium hover:bg-zinc-200 disabled:opacity-60"
          >
            {pending ? "처리 중..." : (mode === "login" ? "로그인" : "회원가입")}
          </button>
        </form>

        {err && <p className="mt-3 text-sm text-red-400">{err}</p>}

        <div className="mt-4">
          <button
            onClick={async ()=>{ try{ await signInWithGoogle(); } catch(e){ setErr(e?.message||"구글 로그인 실패"); } }}
            className="w-full h-10 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
          >
            Google로 계속하기
          </button>
        </div>

        <p className="mt-4 text-xs text-zinc-400">
          처음 오셨나요? 빠르게 가입하고 게시판에서 작업물을 공유해보세요.
        </p>
      </div>
    </div>
  );
}
