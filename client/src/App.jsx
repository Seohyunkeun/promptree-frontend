// client/src/App.jsx
import { Link, NavLink, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Generator from "./pages/Generator";
import Board from "./pages/Board";
import Policy from "./pages/Policy";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

export default function App() {
  const year = new Date().getFullYear();

  const navLinkBase =
    "px-3 py-2 rounded-xl text-sm font-medium transition-colors";
  const navLinkInactive = "text-zinc-400 hover:text-zinc-100";
  const navLinkActive = "text-zinc-50 bg-zinc-900";

  return (
    <div className="min-h-screen bg-[#050509] text-zinc-100 flex flex-col">
      {/* 상단 네비게이션 */}
      <header className="fixed inset-x-0 top-0 z-30 border-b border-zinc-900 bg-[#050509]/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* 로고 */}
          <Link to="/" className="flex items-center gap-2">
            <div className="relative h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-emerald-400" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Promptree
            </span>
          </Link>

          {/* 네비 링크 */}
          <nav className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${navLinkBase} ${
                  isActive ? navLinkActive : navLinkInactive
                } hidden sm:inline-flex`
              }
            >
              홈
            </NavLink>
            <NavLink
              to="/generator"
              className={({ isActive }) =>
                `${navLinkBase} ${
                  isActive ? navLinkActive : navLinkInactive
                }`
              }
            >
              생성기
            </NavLink>
            <NavLink
              to="/board"
              className={({ isActive }) =>
                `${navLinkBase} ${
                  isActive ? navLinkActive : navLinkInactive
                }`
              }
            >
              게시판
            </NavLink>
          </nav>

          {/* 우측 액션 (나중에 로그인 붙이면 여기) */}
          <div className="flex items-center gap-2">
            <button className="hidden sm:inline-flex h-8 px-3 rounded-xl border border-zinc-800 text-[11px] text-zinc-300 hover:bg-zinc-900">
              로그인/회원가입(준비중)
            </button>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 pt-16 pb-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/generator" element={<Generator />} />
          {/* /board 와 /board/:id 모두 Board가 처리 */}
          <Route path="/board/*" element={<Board />} />
          <Route path="/policy" element={<Policy />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-zinc-900 bg-[#050509]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[11px] text-zinc-500">
          <div className="flex flex-wrap items-center gap-2">
            <span>© {year} Promptree.</span>
            <span className="hidden sm:inline-block">·</span>
            <span className="text-zinc-500">
              프롬프트가 자라는 숲, Promptree.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/policy"
              className="hover:text-zinc-300 underline-offset-4 hover:underline"
            >
              이용약관
            </Link>
            <Link
              to="/privacy"
              className="hover:text-zinc-300 underline-offset-4 hover:underline"
            >
              개인정보 처리방침
            </Link>
            <a
              href="mailto:sidh0318@naver.com"
              className="hover:text-zinc-300 underline-offset-4 hover:underline"
            >
              문의: sidh0318@naver.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
