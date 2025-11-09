// client/src/pages/Auth.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Auth() {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      setBusy(true);
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) throw error;
        alert("로그인되었습니다.");
        navigate("/");
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        alert("회원가입이 완료되었습니다. 메일함에서 인증 메일을 확인하세요.");
        setMode("login");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "요청 처리 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    alert("로그아웃되었습니다.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-sm text-zinc-400">
        인증 상태 확인 중...
      </div>
    );
  }

  if (user) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <header>
          <h1 className="text-xl font-semibold mb-1">내 계정</h1>
          <p className="text-sm text-zinc-400">
            {user.email} 계정으로 로그인되어 있습니다.
          </p>
        </header>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-3">
          <div className="text-sm text-zinc-300">
            앞으로 게시판 글 추천/즐겨찾기, 내 프롬프트 북마크 등의 기능을 붙일
            때 이 계정을 사용할 예정입니다.
          </div>
          <button
            onClick={handleSignOut}
            className="h-9 px-4 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200"
          >
            로그아웃
          </button>
          <button
            onClick={() => navigate("/")}
            className="h-9 px-4 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-sm ml-2"
          >
            홈으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <header className="mb-6">
        <h1 className="text-xl font-semibold mb-1">
          {mode === "login" ? "로그인" : "회원가입"}
        </h1>
        <p className="text-sm text-zinc-400">
          Promptree 계정으로 생성기 히스토리, 게시판 기능을 더 편하게
          사용할 수 있습니다. (현재는 이메일/비밀번호만 지원)
        </p>
      </header>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
        <div className="flex mb-4 gap-2">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 h-9 rounded-xl text-sm border transition
              ${
                mode === "login"
                  ? "border-zinc-100 bg-white text-black"
                  : "border-zinc-800 bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800"
              }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 h-9 rounded-xl text-sm border transition
              ${
                mode === "signup"
                  ? "border-zinc-100 bg-white text-black"
                  : "border-zinc-800 bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800"
              }`}
          >
            회원가입
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-zinc-400">이메일</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-black/60 border border-zinc-800 text-sm outline-none focus:border-zinc-400"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-400">비밀번호</label>
            <input
              type="password"
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-black/60 border border-zinc-800 text-sm outline-none focus:border-zinc-400"
              placeholder="8자 이상 비밀번호"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full h-10 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200 disabled:opacity-60"
          >
            {busy
              ? "처리 중..."
              : mode === "login"
              ? "로그인"
              : "회원가입"}
          </button>
        </form>
      </div>
    </div>
  );
}
