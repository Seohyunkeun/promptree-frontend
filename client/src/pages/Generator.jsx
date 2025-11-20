// client/src/pages/Generator.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

/* ─────────────────────────────────────────────
   Promptree 생성기 (압축 레이아웃 + 타깃 칩 버전)

   - 좌: 타깃(칩) / 단계 / 프리셋 / 퀵 액션
   - 우: [입력] / [결과] 탭
   - 하단: 접히는 히스토리
────────────────────────────────────────────── */

const LS_DRAFT = "pt_gen_draft_v4";
const LS_HISTORY = "pt_gen_history_v4";
const MAX_HISTORY = 30;

const TARGETS = [
  { id: "gemini", label: "Gemini 2.5 Flash Image" },
  { id: "veo", label: "Veo 3.1" },
  { id: "mj", label: "Midjourney (V7)" },
  { id: "sora", label: "OpenAI Sora 2" },
];

const STYLE_TAGS = [
  "시네마틱 구도",
  "필름 그레인",
  "스튜디오 조명",
  "아날로그 필름 느낌",
  "부드러운 빛 번짐",
  "네온 조명",
  "얕은 심도",
];

const SAMPLE_SET = [
  {
    id: "anime-figure",
    label: "피규어 상품컷",
    text: "현대적인 실내 작업실, 컴퓨터 책상 위에 하이엔드 PVC 피규어가 전시되어 있음. 옆에는 피규어 일러스트가 인쇄된 박스와 3D 모델링 화면이 보인다.",
    tags: ["스튜디오 조명", "부드러운 빛 번짐"],
  },
  {
    id: "fashion",
    label: "패션 화보",
    text: "야외 석양 배경에서 인물 세 명이 걷고 있는 패션 화보, 따뜻한 골든 아워, 바람에 휘날리는 의상 디테일.",
    tags: ["시네마틱 구도", "필름 그레인"],
  },
  {
    id: "city-neon",
    label: "네온 시티",
    text: "비가 막 그친 도쿄 골목, 젖은 아스팔트에 네온사인이 반사되고, 우산을 든 인물이 실루엣으로 서 있음.",
    tags: ["네온 조명", "얕은 심도"],
  },
];

const prettyDate = (d = new Date()) =>
  new Intl.DateTimeFormat("ko", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);

const estimateTokens = (t = "") => Math.ceil((t || "").length / 4);

export default function Generator() {
  const [searchParams] = useSearchParams();

  const [stage, setStage] = useState("라이팅");
  const [preset, setPreset] = useState("사진(일몰)");
  const [target, setTarget] = useState(TARGETS[0].id);
  const [input, setInput] = useState("");
  const [tags, setTags] = useState([]);
  const [output, setOutput] = useState("");
  const [history, setHistory] = useState([]);
  const [activeSample, setActiveSample] = useState(null);
  const [activeTab, setActiveTab] = useState("input"); // "input" | "result"
  const [historyOpen, setHistoryOpen] = useState(false);
  const outRef = useRef(null);

  // draft & history load
  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(LS_DRAFT) || "{}");
      if (draft.input) setInput(draft.input);
      if (draft.target) setTarget(draft.target);
      if (draft.tags) setTags(draft.tags);
    } catch (e) {
      console.error(e);
    }
    try {
      const h = JSON.parse(localStorage.getItem(LS_HISTORY) || "[]");
      setHistory(h);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // URL 쿼리 → 상태 반영 (target / stage / preset / sample)
  useEffect(() => {
    const targetParam = searchParams.get("target");
    const stageParam = searchParams.get("stage");
    const presetParam = searchParams.get("preset");
    const sampleParam = searchParams.get("sample");

    if (targetParam && TARGETS.some((x) => x.id === targetParam)) {
      setTarget(targetParam);
    }

    if (stageParam) {
      setStage(stageParam);
    }

    if (presetParam) {
      // 프리셋 이름이 URL로 들어온 경우
      applyPreset(presetParam);
    }

    if (sampleParam) {
      // 샘플 id가 URL로 들어온 경우
      applySample(sampleParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // draft save
  useEffect(() => {
    localStorage.setItem(
      LS_DRAFT,
      JSON.stringify({ input, target, tags })
    );
  }, [input, target, tags]);

  const charCount = input.length;
  const outputTokenCount = useMemo(() => estimateTokens(output), [output]);
  const inputTokenEstimate = useMemo(
    () => estimateTokens(input),
    [input]
  );

  const toggleTag = (t) => {
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const applyPreset = (name) => {
    setPreset(name);
    if (name === "사진(일몰)") {
      setInput(
        "네온 간판이 있는 도쿄 골목, 노을 반사, 인물 클로즈업, 시네마틱"
      );
    } else if (name === "사진(정장)") {
      setInput(
        "광고 촬영 룩북, 다크 수트, 하이라이트 헤어, 스튜디오 소프트박스"
      );
    } else if (name === "제품") {
      setInput(
        "무선 이어폰 제품컷, 흰 배경, 상단 소프트 라이트, 그림자 살짝"
      );
    }
  };

  const applySample = (sampleId) => {
    const s = SAMPLE_SET.find((x) => x.id === sampleId);
    if (!s) return;
    setActiveSample(sampleId);
    setInput(s.text);
    setTags(s.tags);
    setActiveTab("input");
  };

  const buildPrompt = () => {
    const user = input.trim();
    const style = tags.length ? `\nSTYLE: ${tags.join(", ")}` : "";
    const stageLine = stage ? `STAGE: ${stage}` : "";

    if (target === "gemini") {
      return [
        "TARGET: GOOGLE GEMINI 2.5 FLASH IMAGE",
        stageLine,
        "",
        "GUIDE:",
        "- Photorealistic detail with clear lighting & lens description.",
        "- Avoid trademarks or copyrighted character names.",
        "- Return ENGLISH only.",
        "",
        `CONTENT: ${user || "(describe scene in detail)"}`,
        "LENS: 50mm / ISO 200 / f1.8 (if portrait)",
        "LIGHT: softbox key, rim light, subtle fill, ambient practicals",
        "COMPOSITION: rule of thirds, shallow depth of field",
        "NEGATIVE: watermark, logo, overexposed highlights, deformed hands",
        style,
      ].join("\n");
    }
    if (target === "veo") {
      return [
        "TARGET: GOOGLE VEO 3.1 (VIDEO)",
        stageLine,
        "",
        "BLUEPRINT:",
        "- LENGTH: 6–8 seconds, 24fps",
        "- CAMERA: slow dolly-in and soft pan",
        "- SHOTS: 1–2 cinematic shots, smooth motion",
        "",
        `DESCRIPTION: ${user || "(what should the video show?)"}`,
        "",
        "SHOT PLAN:",
        "  • SHOT 01 — 2s — Wide establishing shot, slow dolly-in",
        "  • SHOT 02 — 4s — Medium hero shot, gentle pan",
        "",
        "QUALITY: cinematic, coherent lighting and motion",
        "SAFETY: no trademark, no nudity, no graphic content.",
        style,
      ].join("\n");
    }
    if (target === "mj") {
      return [
        "/imagine",
        `${user || "cinematic portrait, soft rim light"}, ${tags.join(", ")}`,
        "--ar 3:4 --v 7 --style raw",
      ].join(" ");
    }
    // sora
    return [
      "TARGET: OPENAI SORA 2 (VIDEO)",
      stageLine,
      "",
      "INSTRUCTIONS:",
      "- Describe scene, motion, lighting, and camera as objective facts.",
      "- Maintain physical consistency, no teleporting or impossible cuts.",
      "",
      `DESCRIPTION: ${user || "(scene description)"}`,
      "",
      "TIMING: 8 seconds, 24fps",
      "CAMERA: handheld slight sway, 35mm look",
      "AUDIO: none",
      "NEGATIVE: excessive shake, text overlay, text, heavy compression artifacts",
      style,
    ].join("\n");
  };

  const onGenerate = () => {
    const p = buildPrompt();
    setOutput(p);
    const rec = { id: Date.now(), target, text: p, at: prettyDate() };
    const next = [rec, ...history].slice(0, MAX_HISTORY);
    setHistory(next);
    localStorage.setItem(LS_HISTORY, JSON.stringify(next));
    setActiveTab("result");
    setTimeout(() => {
      if (outRef.current) {
        outRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 0);
  };

  const onCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      alert("프롬프트를 클립보드에 복사했습니다.");
    } catch (e) {
      console.error(e);
      alert("복사에 실패했습니다. 직접 드래그해서 복사해주세요.");
    }
  };

  const clearHistory = () => {
    if (!history.length) return;
    if (!confirm("히스토리를 모두 삭제할까요?")) return;
    setHistory([]);
    localStorage.setItem(LS_HISTORY, "[]");
  };

  const clearInput = () => {
    if (!input) return;
    if (!confirm("입력 내용을 모두 지울까요?")) return;
    setInput("");
  };

  const clearTags = () => setTags([]);

  const currentTargetLabel =
    TARGETS.find((x) => x.id === target)?.label || "TARGET";

  return (
    <div className="space-y-6">
      {/* 상단 헤더 */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">
            Promptree 생성기
          </h1>
          <p className="text-sm text-zinc-400">
            AI 이미지/영상용 프롬프트를 빠르게 설계하는 작업 공간
          </p>
        </div>
        <button
          className="h-9 px-3 rounded-xl border border-zinc-800 bg-zinc-900/70 hover:bg-zinc-800 text-sm"
          onClick={() =>
            alert(
              "사용 가이드\n\n1) 왼쪽에서 타깃·프리셋·단계를 고르고\n2) [입력] 탭에 장면을 적은 뒤\n3) [프롬프트 생성] 버튼을 누르세요.\n\n[결과] 탭에서 타깃에 맞게 포맷팅된 프롬프트를 확인하고 복사할 수 있습니다."
            )
          }
        >
          도움말
        </button>
      </header>

      {/* 메인 2컬럼 레이아웃 */}
      <div className="grid gap-4 lg:grid-cols-[260px,1fr]">
        {/* 좌측: 제어 패널 */}
        <aside className="space-y-4">
          {/* 타깃 선택 (칩 형태, 높이 줄이기) */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-sm p-3">
            <div className="text-xs uppercase tracking-wide text-zinc-400 mb-2">
              타깃
            </div>
            <div className="flex flex-wrap gap-2">
              {TARGETS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTarget(t.id)}
                  className={`h-8 px-3 rounded-full border text-[13px] transition
                    ${
                      target === t.id
                        ? "border-zinc-100 bg-white text-black shadow-sm"
                        : "border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          {/* 단계 탭 */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-sm p-3">
            <div className="text-xs uppercase tracking-wide text-zinc-400 mb-2">
              단계
            </div>
            <div className="flex flex-wrap gap-2">
              {["라이팅", "클래식", "프라임", "시네마틱"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStage(s)}
                  className={`h-8 px-3 rounded-full border text-[13px]
                    ${
                      stage === s
                        ? "border-zinc-100 bg-white text-black"
                        : "border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200"
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          {/* 프리셋 */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-sm p-3">
            <div className="text-xs uppercase tracking-wide text-zinc-400 mb-2">
              프리셋
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {["사진(일몰)", "사진(정장)", "제품"].map((p) => (
                <button
                  key={p}
                  onClick={() => applyPreset(p)}
                  className={`h-8 px-3 rounded-full border text-[13px]
                    ${
                      preset === p
                        ? "border-zinc-100 bg-white text-black"
                        : "border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200"
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-zinc-500 leading-5">
              프리셋을 고른 뒤 내용을 조금만 바꿔도 빠르게 괜찮은 프롬프트를 만들
              수 있어요.
            </p>
          </section>

          {/* 퀵 액션 */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-sm p-3">
            <div className="text-xs uppercase tracking-wide text-zinc-400 mb-2">
              퀵 액션
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={clearInput}
                className="h-8 px-3 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-xs text-zinc-200 text-left"
              >
                입력 초기화
              </button>
              <button
                onClick={clearTags}
                className="h-8 px-3 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-xs text-zinc-200 text-left"
              >
                태그 모두 해제
              </button>
            </div>
          </section>
        </aside>

        {/* 우측: 탭(입력/결과) + 샘플 */}
        <section className="space-y-4">
          {/* 입력/결과 카드 */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 backdrop-blur-sm overflow-hidden">
            {/* 탭 헤더 */}
            <div className="px-4 pt-3 border-b border-zinc-800/80">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 text-xs text-zinc-400">
                  <span>{currentTargetLabel}</span>
                </div>
                <div className="text-[11px] text-zinc-500 text-right">
                  <div>입력 글자수: {charCount}</div>
                  <div>입력 토큰 추정: {inputTokenEstimate}</div>
                  <div>결과 토큰: {outputTokenCount}</div>
                </div>
              </div>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setActiveTab("input")}
                  className={`h-8 px-3 rounded-full text-xs border transition
                    ${
                      activeTab === "input"
                        ? "border-zinc-100 bg-white text-black"
                        : "border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200"
                    }`}
                >
                  입력
                </button>
                <button
                  onClick={() => setActiveTab("result")}
                  className={`h-8 px-3 rounded-full text-xs border transition
                    ${
                      activeTab === "result"
                        ? "border-zinc-100 bg-white text-black"
                        : "border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200"
                    }`}
                >
                  결과
                </button>
              </div>
            </div>

            {/* 탭 내용 */}
            <div className="p-4 space-y-4">
              {activeTab === "input" ? (
                <>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={7}
                    className="w-full bg-transparent outline-none text-[15px] leading-7 placeholder:text-zinc-600 border border-zinc-800/80 rounded-xl px-3 py-2 max-h-[220px] scrollbar-thin"
                    placeholder="예) 비 오는 네온 시티 골목, 우산을 든 인물의 클로즈업, 젖은 바닥에 반사된 불빛, 시네마틱 무드"
                  />
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-sm font-medium text-zinc-200">
                        스타일 태그 (선택)
                      </h2>
                      <span className="text-xs text-zinc-500">
                        선택 {tags.length}개
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-[96px] overflow-y-auto pr-1">
                      {STYLE_TAGS.map((t) => (
                        <button
                          key={t}
                          onClick={() => toggleTag(t)}
                          className={`h-8 px-3 rounded-full border text-[13px] transition
                            ${
                              tags.includes(t)
                                ? "border-zinc-100 bg-white text-black shadow-sm"
                                : "border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200"
                            }`}
                        >
                          #{t}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <textarea
                  ref={outRef}
                  readOnly
                  value={output}
                  rows={10}
                  className="w-full bg-transparent outline-none text-[13px] leading-7 border border-zinc-800/80 rounded-xl px-3 py-2 max-h-[260px] scrollbar-thin whitespace-pre-wrap"
                  placeholder="아직 생성된 프롬프트가 없습니다. [입력] 탭에서 내용을 작성한 뒤 [프롬프트 생성]을 눌러보세요."
                />
              )}

              {/* 액션 버튼 */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={onGenerate}
                  className="h-9 px-4 rounded-xl bg-white text-black font-medium hover:bg-zinc-200 text-sm"
                >
                  프롬프트 생성
                </button>
                <button
                  onClick={onCopy}
                  className="h-9 px-4 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-sm"
                >
                  복사
                </button>
                <span className="text-xs text-zinc-500">
                  생성 후 결과 탭에서 프롬프트를 확인할 수 있어요.
                </span>
              </div>
            </div>
          </div>

          {/* 샘플 프롬프트 갤러리 */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 backdrop-blur-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase tracking-wide text-zinc-400">
                샘플 프롬프트
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {SAMPLE_SET.map((s) => (
                <button
                  key={s.id}
                  onClick={() => applySample(s.id)}
                  className={`min-w-[140px] max-w-[180px] text-left rounded-xl border text-[13px] p-3 transition
                    ${
                      activeSample === s.id
                        ? "border-zinc-100 bg-white text-black"
                        : "border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200"
                    }`}
                >
                  <div className="font-medium mb-1 line-clamp-1">
                    {s.label}
                  </div>
                  <div className="text-[11px] text-zinc-300 leading-5 line-clamp-3">
                    {s.text}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* 하단: 접히는 히스토리 */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 backdrop-blur-sm">
        <button
          className="w-full px-4 py-3 flex items-center justify-between text-left"
          onClick={() => setHistoryOpen((v) => !v)}
        >
          <div>
            <h3 className="text-sm font-medium text-zinc-200">
              히스토리 ({history.length})
            </h3>
            <p className="text-xs text-zinc-500">
              최근 {MAX_HISTORY}개의 생성 결과가 이 브라우저에만 저장됩니다.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {history.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearHistory();
                }}
                className="text-[11px] text-zinc-500 hover:text-zinc-200"
              >
                전체 삭제
              </button>
            )}
            <span className="text-xs text-zinc-400">
              {historyOpen ? "접기 ▲" : "펼치기 ▼"}
            </span>
          </div>
        </button>
        {historyOpen && (
          <>
            {history.length === 0 ? (
              <div className="px-4 pb-4 text-sm text-zinc-500">
                아직 생성된 프롬프트가 없습니다. 위에서 프롬프트를 만들어보세요.
              </div>
            ) : (
              <ul className="divide-y divide-zinc-800 max-h-[260px] overflow-y-auto">
                {history.map((h) => (
                  <li key={h.id} className="p-4 hover:bg-zinc-900/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-400">{h.at}</span>
                      <span className="text-xs text-zinc-400">
                        {TARGETS.find((x) => x.id === h.target)?.label}
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap text-[13px] leading-6 text-zinc-100">
                      {h.text}
                    </pre>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
}
