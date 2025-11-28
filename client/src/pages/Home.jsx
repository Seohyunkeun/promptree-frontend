// client/src/pages/Home.jsx
import { Link, useNavigate } from "react-router-dom";

const MODEL_CARDS = [
  {
    id: "gemini",
    tag: "IMAGE",
    title: "Gemini 2.5 Flash Image",
    desc: "정적 이미지 · 묘사 중심",
    img: "/samples/card-gemini.webp",
    target: "gemini",
    stage: "시네마틱",
    preset: "사진(일몰)",
  },
  {
    id: "veo",
    tag: "VIDEO",
    title: "Veo 3.1",
    desc: "비디오 · 샷 플랜/카메라 동선",
    img: "/samples/card-veo.webp",
    target: "veo",
    stage: "시네마틱",
    preset: "사진(일몰)",
  },
  {
    id: "mj",
    tag: "IMAGE",
    title: "Midjourney (V7)",
    desc: "/imagine · 스타일 시트",
    img: "/samples/card-mj.webp",
    target: "mj",
    stage: "프라임",
    preset: "사진(정장)",
  },
  {
    id: "sora",
    tag: "VIDEO",
    title: "OpenAI Sora 2",
    desc: "8초 시네마틱 클립",
    img: "/samples/card-sora.webp",
    target: "sora",
    stage: "시네마틱",
    preset: "사진(일몰)",
  },
];

// 메인 하단 샘플 (이미지는 형이 쓰고 있는 카드 이미지 재활용)
const SAMPLE_CARDS = [
  {
    id: "sample-gemini-neon",
    title: "네온 골목 인물샷 (이미지)",
    target: "gemini",
    sampleId: "gemini-neon-city",
    img: "/samples/card-gemini.webp",
    desc: "비 오는 네온 골목, 시네마틱 인물샷",
  },
  {
    id: "sample-veo-clinic",
    title: "미래형 감정 클리닉 (영상)",
    target: "veo",
    sampleId: "veo-emotion-clinic",
    img: "/samples/card-veo.webp",
    desc: "감정을 업로드하는 SF 클리닉 샷 플랜",
  },
  {
    id: "sample-mj-fashion",
    title: "옥상 패션 룩북 (이미지)",
    target: "mj",
    sampleId: "mj-fashion-lookbook",
    img: "/samples/card-mj.webp",
    desc: "골든 아워 룩북 스타일",
  },
];

export default function Home() {
  const navigate = useNavigate();

  const goGenerator = (options) => {
    const params = new URLSearchParams();
    if (options.target) params.set("target", options.target);
    if (options.stage) params.set("stage", options.stage);
    if (options.preset) params.set("preset", options.preset);
    if (options.sample) params.set("sample", options.sample);
    navigate(`/generator?${params.toString()}`);
  };

  return (
    <div className="bg-[#06060A] min-h-[calc(100vh-64px)] text-zinc-50">
      <main className="max-w-6xl mx-auto px-4 py-8 md:py-10 space-y-10">
        {/* 상단: 히어로 + 타깃 카드 */}
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr),minmax(0,1.1fr)] items-start">
          {/* 왼쪽: 히어로 텍스트 */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>한국어 → AI용 영어 프롬프트 작업실</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.04em] leading-snug">
                프롬프트가 자라는 숲,{" "}
                <span className="text-emerald-300">Promptree</span>
              </h1>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                이미지는 Gemini, 영상은 Veo·Sora, 스타일은 Midjourney.
                <br className="hidden sm:block" />
                형은 한국어로 장면만 적으면 되고, 나머지 롱프롬프트 설계는
                여기서 다 합니다.
              </p>
            </div>

            <ul className="space-y-1.5 text-xs sm:text-sm text-zinc-300">
              <li>• 이미지/영상 모델별 포맷에 맞춰 자동으로 구조화된 프롬프트</li>
              <li>• 참고 이미지 + “외형 유지” 옵션으로 캐릭터 일관성 유지</li>
              <li>• 한 번 만든 프롬프트는 히스토리와 게시판에 그대로 저장</li>
            </ul>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  goGenerator({
                    target: "gemini",
                    stage: "시네마틱",
                    preset: "사진(일몰)",
                  })
                }
                className="h-10 px-5 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200"
              >
                바로 프롬프트 만들기
              </button>
              <Link
                to="/board"
                className="h-10 px-4 rounded-xl border border-zinc-700 bg-zinc-900/70 text-sm text-zinc-100 hover:bg-zinc-800 flex items-center"
              >
                커뮤니티 둘러보기
              </Link>
            </div>

            <p className="text-[11px] sm:text-xs text-zinc-500">
              지금은 베타 버전이라, 버그 제보/아이디어는 게시판에 자유롭게
              남겨줘도 됨 🙌
            </p>
          </div>

          {/* 오른쪽: 모델 카드 그리드 */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 backdrop-blur-md p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  Targets
                </p>
                <p className="text-xs text-zinc-500">
                  자주 쓰는 모델부터 골라서 시작
                </p>
              </div>
              <span className="text-[11px] text-zinc-500">
                탭 하면 생성기로 이동
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MODEL_CARDS.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() =>
                    goGenerator({
                      target: card.target,
                      stage: card.stage,
                      preset: card.preset,
                    })
                  }
                  className="group text-left rounded-2xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800/90 transition overflow-hidden flex flex-col"
                >
                  <div className="flex items-center justify-between px-3 pt-3 pb-1">
                    <span className="text-[11px] rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-zinc-300">
                      {card.tag}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      tap to start
                    </span>
                  </div>
                  <div className="px-3 pb-3 flex-1 flex flex-col gap-1.5">
                    <h3 className="text-sm font-semibold group-hover:text-emerald-300">
                      {card.title}
                    </h3>
                    <p className="text-xs text-zinc-400">{card.desc}</p>
                  </div>
                  <div className="relative mt-auto">
                    <div className="aspect-[16/9] w-full overflow-hidden">
                      <img
                        src={card.img}
                        alt={card.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 중간: 한 줄 소개/CTA */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              “한국어 한 줄”을 “실전용 롱프롬프트”로 바꿔주는 곳
            </p>
            <p className="text-xs text-zinc-400">
              인스타 릴스·틱톡·스레드에 올릴 이미지/영상도 전부 여기서 뽑고,
              게시판에 프롬프트를 공유할 수 있어요.
            </p>
          </div>
          <Link
            to="/generator"
            className="inline-flex h-9 px-4 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/80 text-xs sm:text-sm text-zinc-100 hover:bg-zinc-800"
          >
            생성기 전체 옵션 보기 →
          </Link>
        </section>

        {/* 하단: 샘플 프롬프트 섹션 */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">샘플 프롬프트 미리 보기</h2>
              <p className="text-xs text-zinc-500">
                마음에 드는 걸 골라서 바로 생성기에서 수정·재사용 가능
              </p>
            </div>
            <span className="text-[11px] text-zinc-500 hidden sm:inline">
              좌우로 스크롤해서 더 보기
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1">
            {SAMPLE_CARDS.map((s) => (
              <div
                key={s.id}
                className="min-w-[220px] max-w-[260px] rounded-2xl border border-zinc-800 bg-zinc-950/80 overflow-hidden flex flex-col"
              >
                <div className="aspect-[16/9] w-full">
                  <img
                    src={s.img}
                    alt={s.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-3 flex-1 flex flex-col gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">
                      {s.target.toUpperCase()}
                    </p>
                    <h3 className="text-sm font-medium line-clamp-2">
                      {s.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-2">
                    {s.desc}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      goGenerator({
                        target: s.target,
                        sample: s.sampleId,
                      })
                    }
                    className="mt-auto h-8 w-full rounded-xl bg-white text-black text-xs font-medium hover:bg-zinc-200"
                  >
                    이 샘플로 프롬프트 보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
