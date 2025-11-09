import { Outlet, Link, NavLink } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthProvider";

function HeaderBar() {
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-800 bg-[#0b0b0f]/85 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link to="/" className="font-bold text-lg">🌳 Promptree</Link>
        <nav className="flex items-center gap-2 text-sm">
          <NavLink to="/" end className={({isActive}) => `px-3 py-1.5 rounded ${isActive ? "bg-white text-black" : "hover:bg-zinc-800/60"}`}>홈</NavLink>
          <NavLink to="/generator" className={({isActive}) => `px-3 py-1.5 rounded ${isActive ? "bg-white text-black" : "hover:bg-zinc-800/60"}`}>생성기</NavLink>
          <NavLink to="/board" className={({isActive}) => `px-3 py-1.5 rounded ${isActive ? "bg-white text-black" : "hover:bg-zinc-800/60"}`}>게시판</NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-2 text-sm">
          {user ? (
            <>
              <span className="px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700 text-zinc-200">
                {user.user_metadata?.name || user.email}
              </span>
              <button onClick={signOut} className="px-3 py-1.5 rounded border border-zinc-700 hover:bg-zinc-800">로그아웃</button>
            </>
          ) : (
            <NavLink to="/auth"
  className="px-3 py-1.5 rounded border border-zinc-700 hover:bg-zinc-800"
>
  로그인/회원가입</NavLink>
          )}
        </div>
      </div>
    </header>
  );
}

function FooterBar() {
  return (
    <footer className="border-t border-zinc-800 text-xs text-zinc-400">
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center gap-4">
        <span>© 2025 Promptree</span>
        <NavLink to="/policy" className="hover:underline">이용약관</NavLink>
        <NavLink to="/privacy" className="hover:underline">개인정보처리방침</NavLink>
        <a href="/sitemap.xml" className="hover:underline">사이트맵</a>
        <a href="mailto:sidh0318@naver.com" className="hover:underline">문의: sidh0318@naver.com</a>
      </div>
    </footer>
  );
}

function Shell() {
  return (
    <div className="min-h-screen bg-[#0b0b0f] text-gray-200">
      <HeaderBar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
      <FooterBar />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
