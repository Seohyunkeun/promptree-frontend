import { NavLink, Outlet } from "react-router-dom";

export default function App() {
  const linkBase =
    "px-3 py-2 rounded-xl text-sm font-medium hover:opacity-80 transition";
  const active = "bg-zinc-800";
  const inactive = "bg-zinc-900/50";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top Nav */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-semibold">🌱 Promptree</span>
            <span className="text-xs text-zinc-400">HELLO 🚀 (스모크 테스트)</span>
          </div>
          <nav className="flex items-center gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? active : inactive}`
              }
              end
            >
              홈
            </NavLink>
            <NavLink
              to="/generator"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? active : inactive}`
              }
            >
              생성기
            </NavLink>
            <NavLink
              to="/board"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? active : inactive}`
              }
            >
              게시판
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Page */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>

      {/* Footer / 정책 링크 */}
      <footer className="mx-auto max-w-5xl px-4 pb-12 text-sm text-zinc-400">
        <div className="flex gap-4">
          <a href="/policy" className="hover:underline">이용약관</a>
          <a href="/privacy" className="hover:underline">개인정보처리방침</a>
        </div>
        <div className="mt-2">© {new Date().getFullYear()} Promptree</div>
      </footer>
    </div>
  );
}
