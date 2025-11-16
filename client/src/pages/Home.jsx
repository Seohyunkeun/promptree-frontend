// client/src/pages/Home.jsx
import { Link } from "react-router-dom";
import { useMemo, useRef } from "react";

/* ─────────────────────────────────────────────
  1) 로컬 샘플 파일명만 바꿔서 쓰면 됨.
     /public/samples/ 폴더에 이미지를 넣어두세요.
     파일이 없어도 자동으로 그라디언트 폴백 표시.
───────────────────────────────────────────── */
const LOCAL_SAMPLES = [
  { file: "gemini-01.jpg",     model: "Gemini",     caption: "네온 시티 · 인물",     to: "/board" },
  { file: "veo-01.jpg",        model: "Veo",        caption: "제품 · 하이키",         to: "/board" },
  { file: "midjourney-01.jpg", model: "Midjourney", caption: "시네마틱 골목",         to: "/board" },
  { file: "sora-01.jpg",       model: "Sora",       caption: "캐릭터 포스터",         to: "/board" },
  { file: "gemini-02.jpg",     model: "Gemini",     caption: "룩북",                 to: "/board" },
  { file: "veo-02.jpg",        model: "Veo",        caption: "푸드 톱뷰",            to: "/board" },
  { file: "midjourney-02.jpg", model: "Midjourney", caption: "무드 포스터",           to: "/board" },
  { file: "sora-02.jpg",       model: "Sora",       caption: "리플렉션 제품",         to: "/board" },
];

const MODEL_BADGE = {
  Gemini:      "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/30",
  Veo:         "bg-sky-500/20 text-sky-200 ring-1 ring-sky-500/30",
  Midjourney:  "bg-fuchsia-500/20 text-fuchsia-200 ring-1 ring-fuchsia-500/30",
  Sora:        "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-500/30",
};

/* 폴백: 이미지 로드 실패 시 보여줄 그라디언트 */
const FALLBACK_BG =
  "bg-[radial-gradient(60%_50%_at_30%_20%,rgba(99,102,241,0.25),transparent),radial-gradient(45%_40%_at_80%_10%,rgba(16,185,129,0.18),transparent)]";

/* 경로 도우미 */
const pathOf = (file) => (file ? `/samples/${file}` : "");

/* ───────────────────────────────────────────── */

export default function Home() {
  const cards = useMemo(() => LOCAL_SAMPLES, []);

  return (
    <div className="min-h-[calc(100vh-6rem)]">
      {/* ===== Hero (좌 텍스트 / 우 카드, 우측 정렬) ===== */}
      <section className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_40%_at_20%_10%,rgba(88,88,255,.10),transparent),radial-gradient(40%_35%_at_80%_10%,rgba(0,200,200,.08),transparent)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:py-10">
          <div className="rounded-2xl border border-zinc-800 bg-[#0b0b0f]/70 p-5 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
              {/* 왼쪽 카피 */}
              <div className="flex flex-col">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-[11px] text-zinc-400">
                  <span className="inline-block size-1.5 rounded-full bg-emerald-400" />
                  설치 없이 바로 시작 · 무료
                </div>
                <h1 className="text-[34px] font-extrabold tracking-tight sm:text-[46px] leading-[1.08] text-white">
                  프롬프트 만들기,
                  <span className="block mt-1">쉽고 빠르게.</span>
                </h1>
                <p className="mt-4 max-w-xl text-[15px] text-zinc-300">
                  Gemini / Veo / Midjourney / Sora용 프롬프트를 단숨에 만들고,
                  결과물과 팁을 커뮤니티 게시판에서 함께 나눠요.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    to="/generator"
                    className="group inline-flex items-center gap-2 rounded-xl bg-white px-4.5 py-2.5 font-medium text-black transition hover:shadow-[0_0_0_3px_rgba(255,255,255,0.25)]"
                  >
                    <span className="transition group-hover:-translate-y-0.5">🚀</span>
                    프롬프트 생성기 열기
                  </Link>
                  <Link
                    to="/board"
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/70 px-4.5 py-2.5 font-medium text-zinc-200 hover:bg-zinc-800/70"
                  >
                    💬 게시판 둘러보기
                  </Link>
                </div>
                <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-zinc-400">
                  <li>• 무설치 · 브라우저 기반</li>
                  <li>• 로컬 임시저장 & 히스토리</li>
                  <li>• 라우팅 지원</li>
                </ul>
              </div>

              {/* 오른쪽 카드(우측 정렬) */}
              <div className="w-full max-w-[420px] justify-self-end ml-auto">
                <div className="space-y-2">
                  <TargetCardCompact label="IMAGE" title="Gemini 2.5 Flash Image" desc="정적 이미지 · 묘사 중심"   dot="bg-emerald-500" />
                  <TargetCardCompact label="VIDEO" title="Veo 3.1"               desc="비디오 · 샷 플랜/카메라 동선" dot="bg-sky-500" />
                  <TargetCardCompact label="IMAGE" title="Midjourney (V7)"        desc="/imagine 파라미터 · 스타일" dot="bg-fuchsia-500" />
                  <TargetCardCompact label="VIDEO" title="OpenAI Sora 2"          desc="클립 블루프린트 · 오디오 싱크" dot="bg-indigo-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 프롬프트 샘플 ===== */}
      <section className="relative border-t border-zinc-850/60">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:py-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-white sm:text-base">프롬프트 샘플</h2>
            <Link to="/board" className="text-sm text-zinc-300 hover:text-white">더 보기 →</Link>
          </div>
          <GalleryRow cards={cards} />
        </div>
      </section>
    </div>
  );
}

/* ── UI 조각들 ── */
function TargetCardCompact({ label, title, desc, dot = "bg-emerald-500" }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/55 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="mb-1 flex items-center gap-2 text-[10px] text-zinc-400">
        <span className="rounded-full border border-zinc-700 bg-zinc-800 px-1.5 py-[1px] leading-none">{label}</span>
        <span className={`inline-block size-1.5 rounded-full ${dot}`} />
      </div>
      <div className="text-[15px] font-semibold text-white leading-tight">{title}</div>
      <div className="mt-[2px] text-[12px] text-zinc-400">{desc}</div>
    </div>
  );
}

function GalleryRow({ cards }) {
  const ref = useRef(null);
  const slide = (dir = 1) => {
    const el = ref.current;
    if (!el) return;
    const w = Math.min(el.clientWidth, 900);
    el.scrollBy({ left: dir * (w * 0.9), behavior: "smooth" });
  };
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#0b0b0f] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#0b0b0f] to-transparent" />
      <div
        ref={ref}
        className="scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3"
      >
        {cards.map((c, i) => <MiniCard key={i} {...c} />)}
      </div>
      <button
        onClick={() => slide(-1)}
        className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full border border-zinc-700 bg-zinc-900/80 p-2 text-zinc-200 backdrop-blur hover:bg-zinc-800 md:inline-flex"
        aria-label="이전"
      >◀</button>
      <button
        onClick={() => slide(1)}
        className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full border border-zinc-700 bg-zinc-900/80 p-2 text-zinc-200 backdrop-blur hover:bg-zinc-800 md:inline-flex"
        aria-label="다음"
      >▶</button>
    </div>
  );
}

function MiniCard({ file, model = "Gemini", caption = "", to = "#" }) {
  const badge = MODEL_BADGE[model] ?? "bg-zinc-800/60 text-zinc-200 ring-zinc-700/40";
  const src = pathOf(file);

  return (
    <Link
      to={to}
      className="group inline-flex w-[220px] snap-start flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-sm transition hover:border-zinc-700"
    >
      <div className={`relative aspect-[16/10] w-full overflow-hidden ${!src ? FALLBACK_BG : ""}`}>
        {src ? (
          <img
            src={src}
            alt={caption || model}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.remove();
            }}
          />
        ) : null}
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 backdrop-blur ${badge}`}>
          {model}
        </span>
      </div>
      <div className="truncate px-2.5 py-2 text-xs text-zinc-200">{caption}</div>
    </Link>
  );
}
