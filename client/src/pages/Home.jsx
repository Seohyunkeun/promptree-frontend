// client/src/pages/Home.jsx
import { Link } from "react-router-dom";

export default function Home() {
  // ✅ 카드 데이터 (이미지 경로 + target 추가)
  const CARDS = [
    {
      tag: "IMAGE",
      title: "Gemini 2.5 Flash Image",
      desc: "정적 이미지 · 묘사 중심",
      img: "/samples/gemini-01.webp",
      to: "/generator",
      target: "gemini",
    },
    {
      tag: "VIDEO",
      title: "Veo 3.1",
      desc: "비디오 · 샷 플랜/카메라 동선",
      img: "/samples/gemini-02.webp",
      to: "/generator",
      target: "veo",
    },
    {
      tag: "IMAGE",
      title: "Midjourney (V7)",
      desc: "/imagine 파라미터 · 스타일",
      img: "/samples/gemini-02.webp", // 임시 동일 이미지
      to: "/generator",
      target: "mj",
    },
    {
      tag: "VIDEO",
      title: "OpenAI Sora 2",
      desc: "클립 블루프린트 · 오디오 싱크",
      img: "/samples/gemini-01.webp", // 임시 동일 이미지
      to: "/generator",
      target: "sora",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* 상단 배지 */}
      <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
        <span className="relative inline-block h-2 w-2">
          <span className="absolute inset-0 rounded-full bg-emerald-400/90" />
        </span>
        설치 없이 바로 시작 · 무료
      </div>

      {/* 히어로 + 우측 카드 리스트 (원래 형태 유지) */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 lg:gap-10">
        {/* 좌측: 타이틀/설명/버튼 */}
        <div className="space-y-6">
          <h1 className="font-extrabold tracking-tight text-white text-[44px] leading-[1.1] sm:text-[52px]">
            프롬프트 만들기,
            <br className="hidden sm:block" />
            쉽고 빠르게.
          </h1>

          <p className="text-zinc-300">
            Gemini / Veo / Midjourney / Sora용 프롬프트를 단숨에 만들고, 결과물과
            팁을 커뮤니티 게시판에서 함께 나눠요.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/generator"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black hover:bg-zinc-200 transition"
            >
              <span>🚀</span> 프롬프트 생성기 열기
            </Link>
            <Link
              to="/board"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition"
            >
              <span>💬</span> 게시판 둘러보기
            </Link>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
            <span>• 무설치·브라우저 기반</span>
            <span>• 로컬 임시저장 & 히스토리</span>
            <span>• 라우팅 지원</span>
          </div>
        </div>

        {/* 우측: 모델 카드 (우측 정렬 유지, 카드 높이 과하게 크지 않게) */}
        <div className="mt-8 lg:mt-0 flex flex-col gap-4">
          {CARDS.map((c, i) => (
            <Link
              // /generator?target=gemini 이런 식으로 이동
              to={`${c.to}?target=${c.target}`}
              key={i}
              className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 hover:bg-zinc-900/60 transition"
            >
              <div className="flex items-center gap-4">
                {/* 썸네일: 작게, 카드 높이 낭비 X */}
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-zinc-800">
                  <img
                    src={c.img}
                    alt={c.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* 텍스트 */}
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                      {c.tag}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/90" />
                  </div>
                  <div className="truncate text-[15px] font-semibold text-white">
                    {c.title}
                  </div>
                  <div className="truncate text-[13px] text-zinc-400">
                    {c.desc}
                  </div>
                </div>
              </div>

              {/* 호버 외곽선 */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-0 ring-emerald-400/0 transition group-hover:ring-1 group-hover:ring-emerald-400/20" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
