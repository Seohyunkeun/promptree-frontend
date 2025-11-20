// client/src/pages/NotFound.jsx
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="inline-flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-2 text-xs text-zinc-400">
          <span className="mr-1 text-red-400">404</span>
          요청하신 페이지를 찾을 수 없습니다.
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          길을 잃은 것 같아요
        </h1>
        <p className="text-sm text-zinc-400">
          주소가 잘못되었거나, 삭제되었거나, 아직 준비 중인 페이지일 수
          있습니다.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <Link
            to="/"
            className="h-9 px-4 rounded-xl bg-white text-sm font-medium text-black hover:bg-zinc-200"
          >
            홈으로 가기
          </Link>
          <Link
            to="/generator"
            className="h-9 px-4 rounded-xl border border-zinc-800 bg-[#101018] text-sm text-zinc-100 hover:bg-zinc-900"
          >
            프롬프트 생성기
          </Link>
          <Link
            to="/board"
            className="h-9 px-4 rounded-xl border border-zinc-800 bg-[#101018] text-sm text-zinc-100 hover:bg-zinc-900"
          >
            게시판으로
          </Link>
        </div>
      </div>
    </div>
  );
}
