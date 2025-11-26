// client/src/pages/Home.jsx
import { Link } from "react-router-dom";

export default function Home() {
  // ✅ 우측 모델 카드 데이터 (+ stage, preset 추가)
  const CARDS = [
    {
      tag: "IMAGE",
      title: "Gemini 2.5 Flash Image",
      desc: "정적 이미지 · 묘사 중심",
      img: "/samples/card-gemini.webp",
      to: "/generator",
      target: "gemini",
      stage: "시네마틱",
      preset: "사진(일몰)",
    },
    {
      tag: "VIDEO",
      title: "Veo 3.1",
      desc: "비디오 · 샷 플랜/카메라 동선",
      img: "/samples/card-veo.webp",
      to: "/generator",
      target: "veo",
      stage: "시네마틱",
      preset: "사진(일몰)",
    },
    {
      tag: "IMAGE",
      title: "Midjourney (V7)",
      desc: "/imagine 파라미터 · 스타일",
      img: "/samples/card-mj.webp",
      to: "/generator",
      target: "mj",
      stage: "프라임",
      preset: "사진(정장)",
    },
    {
      tag: "VIDEO",
      title: "OpenAI Sora 2",
      desc: "클립 블루프린트 · 오디오 싱크",
      img: "/samples/card-sora.webp",
      to: "/generator",
      target: "sora",
      stage: "시네마틱",
      preset: "사진(일몰)",
    },
  ];

  // ✅ 홈 하단 샘플 갤러리 – 형이 만든 4개 이미지 버전
  const SAMPLE_CARDS = [
    {
      id: "yakuza-cartoon",
      tag: "캐릭터 샷",
      idea: "이레즈미 야쿠자 콘셉트의 코믹 캐릭터 일러스트",
      desc: "캐릭터 외형 유지 + 타투·의상·배경만 바꾸는 스타일 프롬프트",
      img: "/samples/sample-yakuza-cartoon.jpg",
      target: "mj",
    },
    {
      id: "gangster-duo",
      tag: "팝 컬쳐 패러디",
      idea: "갱스터 콘셉트의 코믹 2인 조합 일러스트",
      desc: "선글라스·골드체인·스트리트 배경으로 캐릭터 무드만 바꾸기",
      img: "/samples/sample-gangster-duo.jpg",
      target: "mj",
    },
    {
      id: "truck-pixel-base",
      tag: "픽셀 아트",
      idea: "트럭 생존 베이스 + 캠핑 파티 도트 일러스트",
      desc: "여러 캐릭터를 한 화면에 배치하는 대형 픽셀 신 프롬프트",
      img: "/samples/sample-truck-pixel-base.jpg",
      target: "veo",
    },
    {
      id: "witch-balcony-pixel",
      tag: "픽셀 아트",
      idea: "마녀의 발코니 + 네온 시티 + 별고래 픽셀 일러스트",
      desc: "배경과 분위기를 세밀하게 지정하는 힐링 감성 픽셀 프롬프트",
      img: "/samples/sample-witch-balcony-pixel.jpg",
      target: "gemini",
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
                key={i}
                to={`${c.to}?target=${c.target}&stage=${encodeURIComponent(
                  c.stage
                )}&preset=${encodeURIComponent(c.preset)}`}
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
              <li>
                오른쪽 모델 카드를 클릭하면 해당 타겟과 단계가 자동으로
                맞춰집니다.
              </li>
              <li>작성한 내용과 히스토리는 브라우저(로컬)에만 임시 저장돼요.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 샘플 이미지 갤러리 – 형이 만든 4컷 */}
      <section className="mt-12 border-t border-zinc-900 pt-8">
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              지금까지 만든 샘플들
            </h2>
            <p className="text-xs text-zinc-400">
              프롬프트리에서 바로 뽑아낸 이미지 스타일 예시입니다.
            </p>
          </div>
          <span className="text-[11px] text-zinc-500">
            Gemini / Veo / Midjourney 믹스 샘플
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {SAMPLE_CARDS.map((card) => (
            <Link
              key={card.id}
              to={`/generator?target=${card.target}`}
              className="bg-zinc-950/70 border border-zinc-900 rounded-2xl overflow-hidden hover:border-zinc-700 hover:bg-zinc-900/70 transition group"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={card.img}
                  alt={card.idea}
                  loading="lazy"
                  className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform"
                />
              </div>
              <div className="p-3">
                <p className="text-[10px] font-medium text-emerald-400 mb-1">
                  {card.tag}
                </p>
                <p className="text-xs text-zinc-200 mb-1 line-clamp-2">
                  {card.idea}
                </p>
                <p className="text-[11px] text-zinc-500 line-clamp-2">
                  {card.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
