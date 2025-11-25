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

// 타깃별 설명/플레이스홀더
const TARGET_META = {
  gemini: {
    subtitle: "정적 이미지 · 묘사 중심",
    placeholder:
      "예) 비 오는 네온 시티 골목, 우산을 든 인물의 클로즈업, 젖은 바닥에 반사된 불빛, 시네마틱 무드",
  },
  veo: {
    subtitle: "비디오 · 샷 플랜/카메라 동선",
    placeholder:
      "예) 카메라가 네온 숲 사이를 천천히 날아가며, 나무에서 흘러나오는 빛과 입자가 흐르는 장면",
  },
  mj: {
    subtitle: "/imagine 파라미터 · 스타일",
    placeholder:
      "예) futuristic cyberpunk city street at night, neon lights, rainy reflections, cinematic, highly detailed",
  },
  sora: {
    subtitle: "클립 블루프린트 · 오디오 싱크",
    placeholder:
      "예) dusk city street, one person walking slowly toward camera, traffic lights in the background, cinematic slow motion",
  },
};

const STYLE_TAGS = [
  "시네마틱 구도",
  "필름 그레인",
  "스튜디오 조명",
  "아날로그 필름 느낌",
  "부드러운 빛 번짐",
  "네온 조명",
  "얕은 심도",
];

// 타깃/단계/프리셋까지 포함한 샘플 세트
const SAMPLE_SET = [
  // GEMINI
  {
    id: "gemini-neon-city",
    label: "네온 시티 인물샷",
    target: "gemini",
    stage: "시네마틱",
    preset: "사진(일몰)",
    text: "비가 막 그친 도쿄 네온 골목, 젖은 바닥에 간판 불빛이 반사되고, 우산을 든 인물이 실루엣으로 서 있음. 카메라는 허리 위 클로즈업, 시네마틱 무드.",
    tags: ["네온 조명", "얕은 심도", "시네마틱 구도"],
  },
  {
    id: "gemini-figure-studio",
    label: "피규어 스튜디오 샷",
    target: "gemini",
    stage: "라이팅",
    preset: "제품",
    text: "심플한 흰 배경 위에 하이엔드 PVC 피규어 하나가 중앙에 세워져 있고, 부드러운 상단 소프트 라이트와 약한 그림자가 드리워져 있는 제품 촬영.",
    tags: ["스튜디오 조명", "부드러운 빛 번짐"],
  },
  // MJ
  {
    id: "mj-fashion-lookbook",
    label: "야외 패션 룩북",
    target: "mj",
    stage: "클래식",
    preset: "사진(정장)",
    text: "석양빛이 비치는 옥상 위, 서로 다른 스타일의 수트를 입은 인물 세 명이 걸어가며 웃고 있는 패션 화보. 바람에 휘날리는 옷감 디테일, 따뜻한 골든 아워 톤.",
    tags: ["필름 그레인", "시네마틱 구도"],
  },
  {
    id: "mj-character-portrait",
    label: "캐릭터 인물 일러스트",
    target: "mj",
    stage: "프라임",
    preset: "사진(정장)",
    text: "미래 도시 네온 배경 앞에 서 있는 여성 사이버펑크 캐릭터, 짧은 헤어와 홀로그램 재킷, 정면 상반신 포즈, 강렬한 눈빛과 대비 높은 색감.",
    tags: ["네온 조명"],
  },
  // VEO
  {
    id: "veo-emotion-clinic",
    label: "미래형 감정 클리닉",
    target: "veo",
    stage: "시네마틱",
    preset: "사진(일몰)",
    text: "감정을 데이터로 업로드하는 미래형 정신과 대기실, 환자들이 투명한 캡슐 의자에 앉아 있고, 벽면엔 감정 그래프가 떠 있는 홀로그램 스크린이 줄지어 있음.",
    tags: ["시네마틱 구도", "아날로그 필름 느낌"],
  },
  // SORA
  {
    id: "sora-slow-walk",
    label: "슬로우 워킹 시네마틱",
    target: "sora",
    stage: "시네마틱",
    preset: "사진(일몰)",
    text: "석양이 지는 도심 거리, 한 인물이 카메라 쪽으로 천천히 걸어오며 주변 차와 사람들은 살짝 흐릿하게 움직이는 슬로우 모션 느낌.",
    tags: ["필름 그레인", "부드러운 빛 번짐"],
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
      applyPreset(presetParam);
    }

    if (sampleParam) {
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

  // 🔥 공통 프롬프트 빌더: 결과는 "프롬프트만" 나오게 정리
  const buildPromptFor = ({ targetArg, stageArg, inputArg, tagsArg }) => {
    const user = (inputArg || "").trim();
    const stageText = stageArg ? `, ${stageArg}` : "";
    const styleTagsText =
      tagsArg && tagsArg.length ? `, ${tagsArg.join(", ")}` : "";

    if (targetArg === "gemini") {
      // Gemini 2.5: 포토리얼 이미지 프롬프트만
      const base =
        user ||
        "cinematic portrait, neon city alley, reflections on wet ground";
      return [
        `${base}${stageText}, photorealistic, highly detailed, 50mm lens, ISO 200, f1.8, softbox key light, rim light, subtle fill, ambient practical lights, shallow depth of field, rule of thirds${styleTagsText}`,
        "Negative: watermark, logo, text, overexposed highlights, deformed hands, extra fingers, distorted face",
      ].join("\n");
    }

    if (targetArg === "veo") {
      // Veo 3.1: 비디오 샷 플랜만 (메타 라벨 제거)
      const base =
        user ||
        "camera slowly flying through a neon forest, particles of light drifting in the air";
      return [
        `Cinematic 6–8 second video at 24fps${stageText}. Scene: ${base}${styleTagsText}.`,
        "Shot 01 (2s): wide establishing shot with a slow dolly-in through the environment.",
        "Shot 02 (4–6s): medium hero shot with a gentle pan that follows the main subject.",
        "Keep motion smooth and coherent lighting. No trademarks, no nudity, no graphic or violent content.",
      ].join("\n");
    }

    if (targetArg === "mj") {
      // Midjourney V7: /imagine 한 줄 프롬프트
      const content =
        user || "cinematic portrait, soft rim light, highly detailed";
      return `/imagine ${content}${styleTagsText} --ar 3:4 --v 7 --style raw`;
    }

    // Sora 2: 8초 시네마틱 비디오 설명만
    const base =
      user ||
      "dusk city street, one person walking slowly toward camera, traffic lights glowing in the background";
    return [
      `8 second cinematic video at 24fps${stageText}. Scene: ${base}${styleTagsText}.`,
      "Camera: gentle handheld sway with a 35mm look, smooth forward movement toward the subject.",
      "No excessive shake, no text overlay, no logos, no heavy compression artifacts.",
    ].join("\n");
  };

  // 현재 상태 기반
  const buildPrompt = () =>
    buildPromptFor({
      targetArg: target,
      stageArg: stage,
      inputArg: input,
      tagsArg: tags,
    });

  const applySample = (sampleId) => {
    const s = SAMPLE_SET.find((x) => x.id === sampleId);
    if (!s) return;
    setActiveSample(sampleId);
    if (s.target) setTarget(s.target);
    if (s.stage) setStage(s.stage);
    if (s.preset) setPreset(s.preset);
    setInput(s.text);
    setTags(s.tags || []);
    setActiveTab("input");
  };

  const applySampleAndGenerate = (sampleId) => {
    const s = SAMPLE_SET.find((x) => x.id === sampleId);
    if (!s) return;

    const nextTarget = s.target || target;
    const nextStage = s.stage || stage;
    const nextInput = s.text;
    const nextTags = s.tags || [];

    setActiveSample(sampleId);
    setTarget(nextTarget);
    setStage(nextStage);
    if (s.preset) setPreset(s.preset);
    setInput(nextInput);
    setTags(nextTags);

    const p = buildPromptFor({
      targetArg: nextTarget,
      stageArg: nextStage,
      inputArg: nextInput,
      tagsArg: nextTags,
    });
    setOutput(p);
    const rec = {
      id: Date.now(),
      target: nextTarget,
      text: p,
      at: prettyDate(),
    };
    const nextHistory = [rec, ...history].slice(0, MAX_HISTORY);
    setHistory(nextHistory);
    localStorage.setItem(LS_HISTORY, JSON.stringify(nextHistory));
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

  const onGenerate = () => {
    const p = buildPrompt();
    setOutput(p);
    const rec = { id: Date.now(), target, text: p, at: prettyDate() };
    const next = [rec, ...history].slice(0, MAX_HISTORY);
    localStorage.setItem(LS_HISTORY, JSON.stringify(next));
    setHistory(next);
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
  const currentTargetMeta = TARGET_META[target] || {};
  const inputPlaceholder =
    currentTargetMeta.placeholder ||
    "예) 비 오는 네온 시티 골목, 우산을 든 인물의 클로즈업, 젖은 바닥에 반사된 불빛, 시네마틱 무드";

  return (
    // 🔥 컨테이너
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
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
              "사용 가이드\n\n1) 왼쪽에서 타깃·프리셋·단계를 고르고\n2) [입력] 탭에 장면을 적은 뒤\n3) [프롬프트 생성] 버튼을 누르세요.\n\n[결과] 탭에서 깔끔한 프롬프트를 확인하고 복사할 수 있습니다."
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
          {/* 타깃 선택 */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-sm p-3">
            <div className="text-xs uppercase tracking-wide text-zinc-400 mb-2">
              타깃
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
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
            <p className="text-[11px] text-zinc-500">
              {currentTargetMeta.subtitle ||
                "타깃에 따라 프롬프트 포맷이 자동으로 바뀝니다."}
            </p>
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
                <div className="flex flex-col gap-0.5 text-xs text-zinc-400">
                  <span>{currentTargetLabel}</span>
                  {currentTargetMeta.subtitle && (
                    <span className="text-[11px] text-zinc-500">
                      {currentTargetMeta.subtitle}
                    </span>
                  )}
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
                    placeholder={inputPlaceholder}
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
              <div className="text-[11px] text-zinc-500">
                카드 클릭: 불러오기 · 버튼: 바로 사용
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {SAMPLE_SET.map((s) => (
                <div
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => applySample(s.id)}
                  className={`min-w-[180px] max-w-[220px] text-left rounded-xl border text-[13px] p-3 transition cursor-pointer
                    ${
                      activeSample === s.id
                        ? "border-zinc-100 bg-white text-black"
                        : "border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200"
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium line-clamp-1">{s.label}</div>
                    <span className="text-[10px] text-zinc-500">
                      {
                        TARGETS.find((t) => t.id === s.target)?.label.split(
                          " "
                        )[0]
                      }
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-300 leading-5 line-clamp-3 mb-2">
                    {s.text}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {s.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-[10px] text-zinc-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        applySample(s.id);
                      }}
                      className="flex-1 h-7 rounded-lg border border-zinc-700 bg-zinc-900/80 text-[11px] hover:bg-zinc-800"
                    >
                      불러오기
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        applySampleAndGenerate(s.id);
                      }}
                      className="flex-1 h-7 rounded-lg bg-white text-black text-[11px] hover:bg-zinc-200"
                    >
                      바로 생성
                    </button>
                  </div>
                </div>
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
