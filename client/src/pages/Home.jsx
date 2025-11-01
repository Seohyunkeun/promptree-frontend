// client/src/pages/Home.jsx
// 목적: Promptree의 핵심(생성기/게시판)을 5초 안에 이해시키고 바로 유도
// 의존성: react-router-dom (Link), Tailwind v4
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="space-y-12">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-[#0d0d13] to-[#0b0b0f] p-8 md:p-12">
        {/* 배경 장식 */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full blur-3xl opacity-30"
             style={{background: "radial-gradient(60% 60% at 50% 50%, #7c3aed33, #11111100)"}} />
        <div className="pointer-events-none absolute -bottom-28 -left-28 h-96 w-96 rounded-full blur-3xl opacity-30"
             style={{background: "radial-gradient(60% 60% at 50% 50%, #22d3ee33, #11111100)"}} />

        <div className="relative z-10 grid gap-6 md:grid-cols-2 items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/50 px-3 py-1 text-xs text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              이번 주 런칭 준비 중
            </p>
            <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight">
              프롬프트 만들기, <span className="text-white">쉽고 빠르게.</span>
            </h1>
            <p className="mt-3 text-zinc-400">
              Gemini / Veo / Midjourney / Sora용 프롬프트를 단숨에.  
              커뮤니티 게시판에서 팁과 결과물도 함께 공유해요.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/generator"
                className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-5 py-3 font-semibold shadow hover:bg-zinc-200 transition"
              >
                🚀 프롬프트 생성기 열기
              </Link>
              <Link
                to="/board"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-5 py-3 hover:bg-zinc-800 transition"
              >
                💬 게시판 둘러보기
              </Link>
            </div>

            <div className="mt-4 flex items-center gap-3 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1">
                <Dot /> 무설치·브라우저 기반
              </span>
              <span className="inline-flex items-center gap-1">
                <Dot /> 로컬 임시저장 & 히스토리
              </span>
              <span className="inline-flex items-center gap-1">
                <Dot /> 라우팅 지원
              </span>
            </div>
          </div>

          {/* 미니 미리보기 카드 */}
          <div className="grid gap-3">
            <PreviewCard
              title="Gemini 2.5 Flash Image"
              subtitle="정적 이미지 · 묘사 중심"
              badge="IMAGE"
              gradient="from-emerald-400/20"
            />
            <PreviewCard
              title="Veo 3.1"
              subtitle="비디오 · 샷 플랜/카메라 동선"
              badge="VIDEO"
              gradient="from-indigo-400/20"
            />
            <PreviewCard
              title="Midjourney (V7)"
              subtitle="/imagine 파라미터 · 스타일"
              badge="IMAGE"
              gradient="from-fuchsia-400/20"
            />
            <PreviewCard
              title="OpenAI Sora 2"
              subtitle="클립 블루프린트 · 오디오 싱크"
              badge="VIDEO"
              gradient="from-cyan-400/20"
            />
          </div>
        </div>
      </section>

      {/* 기능 하이라이트 */}
      <section className="grid gap-4 md:grid-cols-3">
        <Feature
          icon="🧩"
          title="타깃별 최적 포맷"
          desc="모델 특성에 맞춘 프롬프트 골격(Gemini/Veo/MJ/Sora)로 실패를 줄입니다."
        />
        <Feature
          icon="📝"
          title="히스토리 & 복원"
          desc="로컬스토리지 기반으로 최근 작업 불러오기/비교/복사에 최적화."
        />
        <Feature
          icon="🛡️"
          title="안전 가이드"
          desc="워터마크·저작권·NSFW 등 금칙 가이드를 템플릿에 기본 포함."
        />
      </section>

      {/* CTA 섹션 */}
      <section className="rounded-3xl border border-zinc-800 p-8 bg-gradient-to-r from-[#101018] to-[#0b0b0f]">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] items-center">
          <div>
            <h2 className="text-2xl font-bold">지금 바로 만들어 보고, 게시판에 결과도 공유해요.</h2>
            <p className="mt-2 text-zinc-400">초안 → 프라임 → 시네마틱까지 단계별로 품질을 올려보세요.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/generator" className="rounded-xl bg-white text-black px-5 py-3 font-semibold shadow hover:bg-zinc-200 transition">
              생성기 시작하기
            </Link>
            <Link to="/board" className="rounded-xl border border-zinc-700 bg-zinc-900/60 px-5 py-3 hover:bg-zinc-800 transition">
              게시판 글쓰기
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ (간단) */}
      <section className="grid gap-3">
        <h3 className="text-lg font-semibold">자주 묻는 질문</h3>
        <Faq q="결과물은 어디에 저장되나요?" a="브라우저 로컬스토리지에 저장됩니다. 히스토리에서 다시 불러올 수 있어요." />
        <Faq q="도메인 연결은 끝났나요?" a="네. promptree.kr에서 접근 가능하며 SPA 라우팅도 설정되어 있어요." />
        <Faq q="바로 배포되나요?" a="Git push 시 Vercel이 자동 빌드/배포합니다." />
      </section>
    </div>
  );
}

/* ─── 작은 컴포넌트들 ─── */

function Dot() {
  return <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-500" />;
}

function Feature({ icon, title, desc }) {
  return (
    <div className="rounded-2xl border border-zinc-800 p-5 bg-zinc-900/30">
      <div className="text-2xl">{icon}</div>
      <h4 className="mt-2 font-semibold">{title}</h4>
      <p className="mt-1 text-sm text-zinc-400">{desc}</p>
    </div>
  );
}

function PreviewCard({ title, subtitle, badge, gradient }) {
  return (
    <div className="rounded-2xl border border-zinc-800 p-4 bg-zinc-900/50">
      <div className="flex items-center justify-between">
        <div className="text-xs px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-300 bg-zinc-950/70">
          {badge}
        </div>
        <div className={`h-6 w-6 rounded-full bg-gradient-to-br ${gradient} to-transparent`} />
      </div>
      <div className="mt-3">
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-zinc-400">{subtitle}</div>
      </div>
    </div>
  );
}

function Faq({ q, a }) {
  return (
    <details className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <summary className="cursor-pointer select-none">{q}</summary>
      <p className="mt-2 text-sm text-zinc-400">{a}</p>
    </details>
  );
}
