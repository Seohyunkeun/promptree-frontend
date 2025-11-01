// client/src/pages/NotFound.jsx
import { Link } from "react-router-dom";

export default function NotFound(){
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-7xl">🧭</div>
        <h1 className="text-2xl font-bold">페이지를 찾을 수 없어요 (404)</h1>
        <p className="text-zinc-400">
          주소가 바뀌었거나 삭제되었을 수 있어요.
        </p>
        <div className="flex gap-2 justify-center">
          <Link to="/" className="px-4 h-10 rounded-xl bg-white text-black font-semibold flex items-center">
            홈으로 가기
          </Link>
          <Link to="/generator" className="px-4 h-10 rounded-xl border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 flex items-center">
            생성기 열기
          </Link>
          <Link to="/board" className="px-4 h-10 rounded-xl border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 flex items-center">
            게시판
          </Link>
        </div>
        <p className="text-xs text-zinc-500">URL: {typeof window !== "undefined" ? window.location.pathname : ""}</p>
      </div>
    </div>
  );
}
