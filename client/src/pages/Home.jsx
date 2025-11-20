// client/src/pages/Home.jsx
import { Link } from "react-router-dom";

export default function Home() {
  // ✅ 우측 모델 카드 데이터 (이미지 전부 개별 파일로 분리)
  const CARDS = [
    {
      tag: "IMAGE",
      title: "Gemini 2.5 Flash Image",
      desc: "정적 이미지 · 묘사 중심",
      img: "/samples/card-gemini.webp",
      to: "/generator",
      target: "gemini",
    },
    {
      tag: "VIDEO",
      title: "Veo 3.1",
      desc: "비디오 · 샷 플랜/카메라 동선",
      img: "/samples/card-veo.webp",
      to: "/generator",
      target: "veo",
    },
    {
      tag: "IMAGE",
      title: "Midjourney (V7)",
      desc: "/imagine 파라미터 · 스타일",
      img: "/samples/card-mj.webp",
      to: "/generator",
      target: "mj",
    },
    {
      tag: "VIDEO",
      title: "OpenAI Sora 2",
      desc: "클립 블루프린트 · 오디오 싱크",
      img: "/samples/card-sora.webp",
      to: "/generator",
      target: "sora",
    },
  ];

  // ✅ 제미나이 샘플 이미지 카드
  const SAMPLE_CARDS = [
    {
      id: "emotion-clinic",
      tag: "아이디어",
      idea: "감정을 업로드하는 미래형 정신과",
      desc: "한 줄 아이디어 → 영어 롱프롬프트 → Gemini 이미지",
      img: "/samples/hero-emotion-clinic-01.png",
    },
    {
      id: "prompt-forest",
      tag: "아이디어",
      idea: "프롬프트가 자라는 숲",
      desc: "코드와 텍스트가 나무처럼 자라는 컨셉",
      img: "/samples/hero-prompt-forest-01.png",
    },
    {
      id: "star-whale",
      tag: "마스코트",
      idea: "우주를 떠다니는 별고래",
      desc: "프롬프트리 브랜드 캐릭터 컨셉",
      img: "/samples/hero-star-whale-01.png",
    },
  ];

  // ✅ Veo B-roll 샘플 영상
  const BROLL_VIDEO = "/samples/broll-prompt-forest-9x16-01.mp4";

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* 상단 배지 */}
      <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
        <span className="relative inline-block h-2 w-2">
          <span className="absolute inset-0 rounded-full bg-emerald-400/90" />
        </span>
        설치 없이 바로 시작 · 무료
      </div>

      {/* 히어로 + 우측 카드 리스트 */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 lg:gap-10 lg:items-stretch">
        {/* 좌측: 텍스트 + 하단 Veo 데모 카드 */}
        <div className="flex flex-col justify-between gap-6 h-full">
          {/* 타이틀/설명/버튼 */}
          <div className="space-y-6">
            <h1 className="font-extrabold tracking-tight text-white text-[44px] leading-[1.1] sm:text-[52px]">
              프롬프트 만들기,
              <br className="hidden sm:block" />
              쉽고 빠르게.
            </h1>

            <p className="text-zinc-300">
              Gemini / Veo / Midjourney / Sora용 프롬프트를 단숨에 만들고,
              결과물과 팁을 커뮤니티 게시판에서 함께 나눠요.
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

          {/* 왼쪽 아래 Veo 샘플 카드 */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                Veo 3.1 샘플 B-roll
              </span>
              <span className="text-[11px] text-zinc-500">
                한 줄 아이디어 → 쇼츠용 배경 영상
              </span>
            </div>
            <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-2 w-full max-w-xl">
              <div className="rounded-xl overflow-hidden aspect-video bg-black">
                <video
                  src={BROLL_VIDEO}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 우측: 모델 카드 리스트 + 안내 카드 */}
        <div className="mt-8 lg:mt-0 flex flex-col justify-between gap-4 h-full">
          {/* 모델 카드들 */}
          <div className="flex flex-col gap-4">
            {CARDS.map((c, i) => (
              <Link
                to={`${c.to}?target=${c.target}`}
                key={i}
                className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 hover:bg-zinc-900/60 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-zinc-800">
                    <img
                      src={c.img}
                      alt={c.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>

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

                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-0 ring-emerald-400/0 transition group-hover:ring-1 group-hover:ring-emerald-400/20" />
              </Link>
            ))}
          </div>

          {/* 안내 카드 */}
          <div className="hidden lg:block rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-[11px] text-zinc-400">
            <div className="mb-2 flex items-center gap-2 text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="font-medium">프롬프트리 이용 안내</span>
            </div>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>출력되는 프롬프트는 기본적으로 영어 롱프롬프트입니다.</li>
              <li>오른쪽 모델 카드를 클릭하면 해당 타겟으로 생성기가 맞춰집니다.</li>
              <li>작성한 내용과 히스토리는 브라우저(로컬)에만 임시 저장돼요.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 샘플 이미지 갤러리 */}
      <section className="mt-12 border-t border-zinc-900 pt-8">
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              프롬프트리 샘플
            </h2>
            <p className="text-xs text-zinc-400">
              한국어 아이디어 한 줄에서, 이런 이미지까지 나옵니다.
            </p>
          </div>
          <span className="text-[11px] text-zinc-500">
            Gemini 2.5 Flash Image · 내부 테스트 결과
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {SAMPLE_CARDS.map((card) => (
            <article
              key={card.id}
              className="bg-zinc-950/70 border border-zinc-900 rounded-2xl overflow-hidden"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={card.img}
                  alt={card.idea}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-3">
                <p className="text-[10px] font-medium text-emerald-400 mb-1">
                  {card.tag}
                </p>
                <p className="text-xs text-zinc-200 mb-1 line-clamp-2">
                  {card.idea}
                </p>
                <p className="text-[11px] text-zinc-500">{card.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
