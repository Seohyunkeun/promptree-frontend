// client/src/pages/Join.jsx
import { Link } from "react-router-dom";

export default function Join() {
  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          회원가입
        </h1>
        <p className="text-sm text-zinc-400 leading-6">
          프롬프트리 정식 계정 시스템은 준비 중입니다.
          <br />
          베타 기간 동안에는 로그인 없이 생성기와 게시판을 이용하실 수 있어요.
        </p>
      </header>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-4">
        <div className="text-sm text-zinc-300">
          계정 기능이 열리면,
          <br />
          · 프롬프트 북마크 / 좋아요 기록
          <br />
          · 내 프롬프트 컬렉션 관리
          <br />
          · 댓글/알림 기능
          <br />
          등을 사용할 수 있게 될 예정입니다.
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link
            to="/generator"
            className="h-9 inline-flex items-center justify-center rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200"
          >
            지금은 로그인 없이 써보기
          </Link>
          <Link
            to="/"
            className="h-9 inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-sm text-zinc-100 hover:bg-zinc-800"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>

      <p className="text-[11px] text-zinc-500 leading-5">
        ※ 정식 오픈 후에는 소셜 로그인(구글/카카오 등) 중심으로 간단하게
        가입할 수 있도록 설계할 예정입니다.
      </p>
    </div>
  );
}
