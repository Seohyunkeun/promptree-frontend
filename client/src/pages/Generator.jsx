// client/src/pages/Generator.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

/* ─────────────────────────────────────────────
   Promptree 생성기
   - 모바일: [설정 패널] → [입력/결과 카드] → [샘플] → [히스토리]
   - 데스크톱: 좌측 패널 / 우측 메인 2컬럼
   - 전체 가로 스크롤 차단
────────────────────────────────────────────── */

const LS_HISTORY = "pt_gen_history_v4";
const MAX_HISTORY = 30;

const TARGETS = [
  { id: "gemini", label: "Gemini 2.5 Flash Image" },
  { id: "veo", label: "Veo 3.1" },
  { id: "mj", label: "Midjourney (V7)" },
  { id: "sora", label: "OpenAI Sora 2" },
];

const TARGET_META = {
  gemini: {
    subtitle: "정적 이미지 · 묘사 중심 (고퀄 사진/일러스트)",
    placeholder:
      "예) 비 오는 네온 시티 골목에서 우산을 들고 서 있는 소녀, 카메라를 살짝 바라보는 느낌",
  },
  veo: {
    subtitle: "비디오 · 샷 플랜/카메라 동선 (릴스/틱톡용)",
    placeholder:
      "예) 카메라가 골목을 따라 전진하면서 네온 간판과 인물이 번갈아 잡히는 장면",
  },
  mj: {
    subtitle: "/imagine 파라미터 · 스타일 (V7 최적화)",
    placeholder:
      "예) 미래 도시 옥상에서 서 있는 인물, 강한 사이버펑크 무드, 네온, 비 내리는 밤",
  },
  sora: {
    subtitle: "클립 블루프린트 · 8초 무드 영상",
    placeholder:
      "예) 석양 지는 도시를 배경으로 한 인물이 카메라 쪽으로 천천히 걸어오는 장면",
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

const SAMPLE_SET = [
  {
    id: "gemini-neon-city",
    label: "네온 시티 인물샷",
    target: "gemini",
    stage: "시네마틱",
    preset: "사진(일몰)",
    text: "비가 막 그친 네온 간판 골목, 바닥에 물이 고여 간판 불빛이 반사되고, 우산을 든 인물이 카메라를 등지고 서 있다가 살짝 돌아보는 장면.",
    tags: ["네온 조명", "얕은 심도", "시네마틱 구도"],
  },
  {
    id: "gemini-figure-studio",
    label: "피규어 스튜디오 샷",
    target: "gemini",
    stage: "라이팅",
    preset: "제품",
    text: "심플한 그라데이션 배경 위에 하이엔드 피규어 하나가 중앙에 놓여 있고, 위에서 내려오는 부드러운 소프트박스 조명과 얕은 그림자가 살짝 드리워진 장면.",
    tags: ["스튜디오 조명", "부드러운 빛 번짐"],
  },
  {
    id: "mj-fashion-lookbook",
    label: "야외 패션 룩북",
    target: "mj",
    stage: "클래식",
    preset: "사진(정장)",
    text: "석양이 비치는 옥상 위, 서로 다른 수트를 입은 세 명의 인물이 카메라 쪽으로 걸어오며 웃고 있는 패션 화보 컷.",
    tags: ["필름 그레인", "시네마틱 구도"],
  },
  {
    id: "mj-character-portrait",
    label: "사이버 캐릭터 포트레이트",
    target: "mj",
    stage: "프라임",
    preset: "사진(정장)",
    text: "네온이 가득한 미래 도시를 배경으로 서 있는 여성 사이버펑크 캐릭터, 짧은 헤어와 홀로그램 재킷, 상반신 정면 포즈, 강렬한 눈빛.",
    tags: ["네온 조명"],
  },
  {
    id: "veo-emotion-clinic",
    label: "미래형 감정 클리닉",
    target: "veo",
    stage: "시네마틱",
    preset: "사진(일몰)",
    text: "감정을 데이터로 저장하는 미래형 정신과 로비, 투명 캡슐 의자에 앉은 사람들, 벽면엔 감정 그래프가 떠 있는 홀로그램 스크린이 줄지어 있는 장면.",
    tags: ["시네마틱 구도", "아날로그 필름 느낌"],
  },
  {
    id: "sora-slow-walk",
    label: "슬로우 워킹 시네마틱",
    target: "sora",
    stage: "시네마틱",
    preset: "사진(일몰)",
    text: "석양이 지는 도심 거리, 한 인물이 카메라 쪽으로 천천히 걸어오고, 뒤쪽 차량과 사람들은 살짝 블러 처리된 슬로우 모션 느낌.",
    tags: ["필름 그레인", "부드러운 빛 번짐"],
  },
];

const TARGET_USAGE_LABEL = {
  gemini: "Gemini 2.5 Flash Image용 이미지 프롬프트",
  veo: "Veo 3.1용 비디오 프롬프트 (샷 플랜)",
  mj: "Midjourney V7 /imagine 프롬프트",
  sora: "OpenAI Sora 2용 8초 비디오 클립 프롬프트",
};

const COPY_BUTTON_LABEL = {
  gemini: "Gemini 프롬프트 복사",
  veo: "Veo 프롬프트 복사",
  mj: "Midjourney 프롬프트 복사",
  sora: "Sora 프롬프트 복사",
};

const prettyDate = (d = new Date()) =>
  new Intl.DateTimeFormat("ko", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);

const estimateTokens = (t = "") => Math.ceil((t || "").length / 4);

/* ─────────────────────────────
   단계/프리셋 → 스타일 텍스트
────────────────────────────── */

function getStageDescription(stageArg) {
  switch (stageArg) {
    case "라이팅":
      return "high-end studio lighting, soft directional key light, gentle shadows, clean highlights";
    case "클래식":
      return "timeless photography look, natural color balance, soft contrast, realistic tones";
    case "프라임":
      return "ultra detailed, razor-sharp focus, 8k render quality, rich micro-texture, high dynamic range";
    case "시네마틱":
      return "cinematic lighting, deep contrast, film-like color grading, atmospheric depth, subtle bloom";
    default:
      return "";
  }
}

function getPresetDescription(presetArg) {
  switch (presetArg) {
    case "사진(일몰)":
      return "golden hour, warm sunlight, long soft shadows, glowing sky, subtle rim light on the subject";
    case "사진(정장)":
      return "formal outfit, clean background, fashion editorial mood, confident pose, subtle vignetting";
    case "제품":
      return "product photography on seamless background, soft studio light, crisp edges, minimal reflections";
    default:
      return "";
  }
}

function getMidjourneyAspectRatio(presetArg) {
  switch (presetArg) {
    case "사진(정장)":
      return "--ar 3:4";
    case "제품":
      return "--ar 1:1";
    case "사진(일몰)":
    default:
      return "--ar 16:9";
  }
}

function getMidjourneyStylize(stageArg) {
  switch (stageArg) {
    case "라이팅":
      return "--stylize 150";
    case "클래식":
      return "--stylize 100";
    case "프라임":
      return "--stylize 250";
    case "시네마틱":
      return "--stylize 400";
    default:
      return "--stylize 150";
  }
}

export default function Generator() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [stage, setStage] = useState("라이팅");
  const [preset, setPreset] = useState("사진(일몰)");
  const [target, setTarget] = useState(TARGETS[0].id);
  const [input, setInput] = useState("");
  const [tags, setTags] = useState([]);
  const [output, setOutput] = useState("");
  const [history, setHistory] = useState([]);
  const [activeSample, setActiveSample] = useState(null);
  const [activeTab, setActiveTab] = useState("input");
  const [historyOpen, setHistoryOpen] = useState(false);

  const [refImage, setRefImage] = useState(null);
  const [refImagePreview, setRefImagePreview] = useState(null);
  const [refNote, setRefNote] = useState("");
  const [lockAppearance, setLockAppearance] = useState(true);

  const outRef = useRef(null);

  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem(LS_HISTORY) || "[]");
      setHistory(h);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const targetParam = searchParams.get("target");
    const stageParam = searchParams.get("stage");
    const presetParam = searchParams.get("preset");
    const sampleParam = searchParams.get("sample");

    if (targetParam && TARGETS.some((x) => x.id === targetParam)) {
      setTarget(targetParam);
    }
    if (stageParam) setStage(stageParam);
    if (presetParam) setPreset(presetParam);
    if (sampleParam) applySample(sampleParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

  const applyPreset = (name) => setPreset(name);

  const handleRefImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (refImagePreview) URL.revokeObjectURL(refImagePreview);
    setRefImage(file);
    const url = URL.createObjectURL(file);
    setRefImagePreview(url);
  };

  const clearRefImage = () => {
    if (refImagePreview) URL.revokeObjectURL(refImagePreview);
    setRefImage(null);
    setRefImagePreview(null);
  };

  /* ─────────────────────────────
     핵심: 고퀄 롱프롬프트 빌더
  ───────────────────────────── */

  const buildPromptFor = ({
    targetArg,
    stageArg,
    presetArg,
    inputArg,
    tagsArg,
    refImagePresent,
    refNoteArg,
    lockAppearanceArg,
  }) => {
    const user = (inputArg || "").trim();
    const stageDesc = getStageDescription(stageArg);
    const presetDesc = getPresetDescription(presetArg);
    const styleTagsText =
      tagsArg && tagsArg.length ? tagsArg.join(", ") : "";

    const extraPieces = [];
    if (presetDesc) extraPieces.push(presetDesc);
    if (stageDesc) extraPieces.push(stageDesc);
    if (styleTagsText) extraPieces.push(styleTagsText);
    const extras = extraPieces.length ? `, ${extraPieces.join(", ")}` : "";

    const referenceBlock = (() => {
      const hasNote = !!(refNoteArg && refNoteArg.trim());
      if (!refImagePresent && !hasNote) return "";
      const lines = ["REFERENCE:"];

      if (refImagePresent) {
        if (targetArg === "veo" || targetArg === "sora") {
          lines.push(
            "- Use the attached reference image as the main character/style guide for the video."
          );
        } else if (targetArg === "mj") {
          lines.push(
            "- Use the attached reference image together with this prompt (image prompt + text prompt)."
          );
        } else {
          lines.push(
            "- Use the attached reference image as the main visual guide."
          );
        }
      }

      if (lockAppearanceArg) {
        if (targetArg === "veo" || targetArg === "sora") {
          lines.push(
            "- If there is a character in the reference, keep the same character design (face, body shape, hairstyle, colors) throughout the whole clip.",
            "- Animate the character and environment, but do NOT redesign the character unless explicitly requested."
          );
        } else {
          lines.push(
            "- Keep the character's appearance exactly the same as the reference (face, body shape, hairstyle, colors).",
            "- Do NOT change the original design unless it is explicitly requested in the brief."
          );
        }
      } else {
        lines.push(
          "- Use the reference mainly for overall mood, color, and style. Moderate redesign is allowed if it fits the brief."
        );
      }

      if (hasNote) {
        lines.push(
          `- Korean brief about the reference: ${refNoteArg.trim()}`
        );
      }

      return lines.join("\n");
    })();

    /* ── Gemini: 정적 이미지 ── */
    if (targetArg === "gemini") {
      const base =
        user ||
        "cinematic portrait of a character standing in a neon city alley at night, rain on the ground and reflections of signs on wet pavement";

      const sceneLine = `${base}${extras}`;
      const main = [
        sceneLine,
        "highly detailed, photorealistic, 8k resolution, ultra sharp focus, rich micro-texture, realistic skin and materials, subtle film grain, natural color balance",
        "Negative: watermark, logo, text, UI, overexposed highlights, blown-out whites, deformed hands, extra fingers, distorted face, low resolution, compression artifacts",
      ].join("\n");

      return referenceBlock ? [main, referenceBlock].join("\n\n") : main;
    }

    /* ── Veo: 시네마틱 비디오 ── */
    if (targetArg === "veo") {
      const base =
        user ||
        "camera slowly glides through a neon city alley after rain, following a single character walking away from the camera";

      const scene = `${base}${extras}`;

      const main = [
        `High-end cinematic video, about 8–12 seconds at 24fps. Scene: ${scene}.`,
        "",
        "SHOT PLAN:",
        "Shot 01 (2–3s) – Wide establishing shot: show the full environment, city details and overall mood, slow dolly-in or crane movement.",
        "Shot 02 (3–5s) – Medium shot: follow the main subject with a gentle tracking shot, keep the background in soft motion parallax.",
        "Shot 03 (2–4s) – Closer hero shot: focus on the subject's face or upper body, emphasize emotion and lighting, subtle handheld micro-movements.",
        "",
        "CAMERA & LOOK:",
        "35mm–50mm look, smooth motion, no sudden cuts, no fast zooms, no shaky cam.",
        "Cinematic depth of field, soft bokeh in the background, consistent lighting and color from shot to shot.",
        "",
        "RESTRICTIONS:",
        "No text or logos in the scene, no copyrighted character names, no UI elements, no split-screen, no picture-in-picture.",
      ].join("\n");

      return referenceBlock ? [main, referenceBlock].join("\n\n") : main;
    }

    /* ── Midjourney: /imagine ── */
    if (targetArg === "mj") {
      const content =
        user ||
        "cinematic portrait of a stylish character standing in a neon city alley at night, detailed environment, rich lighting";
      const scene = `${content}${extras}`;

      const ar = getMidjourneyAspectRatio(presetArg);
      const stylize = getMidjourneyStylize(stageArg);

      const line = `/imagine ${scene} --v 7 --style raw ${ar} ${stylize}`;

      return referenceBlock ? [line, referenceBlock].join("\n\n") : line;
    }

    /* ── Sora: 8초 무드 클립 ── */
    const base =
      user ||
      "dusk city street, one person walking slowly toward the camera, traffic lights glowing in the background";

    const scene = `${base}${extras}`;

    const main = [
      `8 second cinematic video at 24fps. Scene: ${scene}.`,
      "",
      "CAMERA & MOTION:",
      "Gentle handheld feel with subtle micro-movement, slow forward move toward the subject.",
      "Keep motion smooth and readable, no fast whip pans or sudden cuts.",
      "",
      "LOOK & FEEL:",
      "Filmic color grading, soft film grain, natural but dramatic lighting, clear silhouettes and strong depth.",
      "",
      "RESTRICTIONS:",
      "No on-screen text, no logos, no watermarks, no UI, no split-screen effects.",
    ].join("\n");

    return referenceBlock ? [main, referenceBlock].join("\n\n") : main;
  };

  const buildPrompt = () =>
    buildPromptFor({
      targetArg: target,
      stageArg: stage,
      presetArg: preset,
      inputArg: input,
      tagsArg: tags,
      refImagePresent: !!refImage,
      refNoteArg: refNote,
      lockAppearanceArg: lockAppearance,
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
    const nextPreset = s.preset || preset;
    const nextInput = s.text;
    const nextTags = s.tags || [];

    setActiveSample(sampleId);
    setTarget(nextTarget);
    setStage(nextStage);
    setPreset(nextPreset);
    setInput(nextInput);
    setTags(nextTags);

    const p = buildPromptFor({
      targetArg: nextTarget,
      stageArg: nextStage,
      presetArg: nextPreset,
      inputArg: nextInput,
      tagsArg: nextTags,
      refImagePresent: !!refImage,
      refNoteArg: refNote,
      lockAppearanceArg: lockAppearance,
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
        outRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
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
        outRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
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

  const goToBoardWrite = () => {
    if (!output) {
      alert("먼저 프롬프트를 생성한 뒤 게시글로 보내주세요.");
      return;
    }
    navigate("/board/write", {
      state: { prompt: output, target, stage, preset },
    });
  };

  const clearHistory = () => {
    if (!history.length) return;
    if (!window.confirm("히스토리를 모두 삭제할까요?")) return;
    setHistory([]);
    localStorage.setItem(LS_HISTORY, "[]");
  };

  const clearInput = () => {
    if (!input) return;
    if (!window.confirm("입력 내용을 모두 지울까요?")) return;
    setInput("");
  };

  const clearTags = () => setTags([]);

  const currentTargetLabel =
    TARGETS.find((x) => x.id === target)?.label || "TARGET";
  const currentTargetMeta = TARGET_META[target] || {};
  const inputPlaceholder =
    currentTargetMeta.placeholder ||
    "예) 비 오는 네온 시티 골목, 우산을 든 인물의 클로즈업, 젖은 바닥에 반사된 불빛, 시네마틱 무드";

  const currentUsageLabel =
    TARGET_USAGE_LABEL[target] || "AI 생성용 프롬프트";
  const copyButtonLabel = COPY_BUTTON_LABEL[target] || "프롬프트 복사";

  return (
    <div className="bg-[#06060A] min-h-[calc(100vh-64px)] text-gray-100 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* 헤더 */}
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg sm:text-2xl font-semibold tracking-[-0.03em] text-zinc-50">
              Promptree 생성기
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400">
              AI 이미지/영상용 롱프롬프트를 빠르게 설계하는 작업 공간
            </p>
          </div>
          <button
            className="mt-2 sm:mt-0 self-start sm:self-auto h-9 px-3 rounded-xl border border-zinc-800 bg-zinc-900/70 hover:bg-zinc-800 text-xs"
            onClick={() =>
              alert(
                "사용 가이드\n\n1) 위에서 타깃·단계·프리셋을 고르고\n2) [입력] 탭에서 장면과 참고 이미지를 적은 뒤\n3) [프롬프트 생성] 버튼을 누르세요.\n\n[결과] 탭에서 프롬프트를 복사하거나 게시글로 보낼 수 있습니다."
              )
            }
          >
            도움말
          </button>
        </header>

        {/* 메인: lg부터만 2컬럼 */}
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,260px),minmax(0,1fr)] lg:gap-4">
          {/* 좌측: 설정 패널 */}
          <aside className="space-y-4">
            {/* 타깃 */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-sm p-3 sm:p-4">
              <div className="text-[11px] uppercase tracking-wide text-zinc-400 mb-2">
                타깃
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {TARGETS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTarget(t.id)}
                    className={`h-8 px-3 rounded-full border text-[11px] sm:text-[13px] transition
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

            {/* 단계 */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-sm p-3 sm:p-4">
              <div className="text-[11px] uppercase tracking-wide text-zinc-400 mb-2">
                단계
              </div>
              <div className="flex flex-wrap gap-2">
                {["라이팅", "클래식", "프라임", "시네마틱"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStage(s)}
                    className={`h-8 px-3 rounded-full border text-[11px] sm:text-[13px]
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
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-sm p-3 sm:p-4">
              <div className="text-[11px] uppercase tracking-wide text-zinc-400 mb-2">
                프리셋
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {["사진(일몰)", "사진(정장)", "제품"].map((p) => (
                  <button
                    key={p}
                    onClick={() => applyPreset(p)}
                    className={`h-8 px-3 rounded-full border text-[11px] sm:text-[13px]
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
                프리셋은 추천 조합이고, 실제 문장은 사용자가 편하게 한글로 한 줄
                적는 걸 기준으로 잡았어.
              </p>
            </section>

            {/* 퀵 액션 */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-sm p-3 sm:p-4">
              <div className="text-[11px] uppercase tracking-wide text-zinc-400 mb-2">
                퀵 액션
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={clearInput}
                  className="h-8 px-3 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-[11px] sm:text-xs text-zinc-200 text-left"
                >
                  입력 초기화
                </button>
                <button
                  onClick={clearTags}
                  className="h-8 px-3 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-[11px] sm:text-xs text-zinc-200 text-left"
                >
                  태그 모두 해제
                </button>
              </div>
            </section>
          </aside>

          {/* 우측: 입력/결과 + 샘플 */}
          <section className="space-y-4">
            {/* 입력/결과 카드 */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 backdrop-blur-sm overflow-hidden">
              {/* 탭 헤더 */}
              <div className="px-3 sm:px-4 pt-3 border-b border-zinc-800/80">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex flex-col gap-0.5 text-[11px] text-zinc-400">
                    <span className="text-xs sm:text-sm">
                      {currentTargetLabel}
                    </span>
                    {currentTargetMeta.subtitle && (
                      <span className="text-[11px] text-zinc-500">
                        {currentTargetMeta.subtitle}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-zinc-500 text-right shrink-0">
                    <div>입력 글자수: {charCount}</div>
                    <div>입력 토큰: {inputTokenEstimate}</div>
                    <div>결과 토큰: {outputTokenCount}</div>
                  </div>
                </div>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setActiveTab("input")}
                    className={`h-8 px-3 rounded-full text-xs border transition flex-1 sm:flex-none
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
                    className={`h-8 px-3 rounded-full text-xs border transition flex-1 sm:flex-none
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
              <div className="p-3 sm:p-4 space-y-4">
                {activeTab === "input" ? (
                  <>
                    {/* 참고 이미지 영역 */}
                    <div className="space-y-2">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <h2 className="text-sm font-medium text-zinc-200">
                          참고 이미지 (선택)
                        </h2>
                        <span className="text-[10px] sm:text-[11px] text-zinc-500 text-left sm:text-right">
                          업로드하면 프롬프트에 &quot;참고 이미지 기반&quot;
                          문장이 자동으로 들어가요.
                        </span>
                      </div>
                      <label className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-400 hover:border-zinc-500 hover:bg-zinc-900/60 cursor-pointer">
                        <div className="flex flex-col">
                          <span className="font-medium text-zinc-200 text-xs">
                            이미지 업로드
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            PNG, JPG 등 이미지 / 최대 1개
                          </span>
                        </div>
                        <div className="rounded-lg border border-zinc-700 px-2 py-1 text-[11px]">
                          파일 선택
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleRefImageChange}
                        />
                      </label>
                      {refImagePreview && (
                        <div className="flex items-center gap-3">
                          <img
                            src={refImagePreview}
                            alt="참고 이미지 미리보기"
                            className="w-16 h-16 rounded-lg object-cover border border-zinc-800"
                          />
                          <div className="flex-1 text-[11px] text-zinc-400">
                            <div className="line-clamp-1">
                              {refImage?.name || "선택된 이미지"}
                            </div>
                            <button
                              type="button"
                              onClick={clearRefImage}
                              className="mt-1 text-xs text-zinc-500 hover:text-zinc-200"
                            >
                              이미지 삭제
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-1 gap-2">
                        <label className="flex items-center gap-2 text-xs text-zinc-300">
                          <input
                            type="checkbox"
                            checked={lockAppearance}
                            onChange={(e) =>
                              setLockAppearance(e.target.checked)
                            }
                            className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900"
                          />
                          <span>캐릭터 외형 그대로 유지</span>
                        </label>
                        <span className="text-[10px] sm:text-[11px] text-zinc-500">
                          OFF 시 스타일·분위기만 참고.
                        </span>
                      </div>
                      <textarea
                        value={refNote}
                        onChange={(e) => setRefNote(e.target.value)}
                        rows={2}
                        className="w-full bg-transparent outline-none text-[12px] leading-6 placeholder:text-zinc-600 border border-zinc-800/80 rounded-xl px-3 py-2 max-h-[80px] scrollbar-thin"
                        placeholder="참고 이미지 설명이 있으면 한글로 적어주세요."
                      />
                    </div>

                    {/* 메인 입력 */}
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      rows={6}
                      className="w-full bg-transparent outline-none text-[13px] sm:text-[15px] leading-6 sm:leading-7 placeholder:text-zinc-600 border border-zinc-800/80 rounded-xl px-3 py-2 min-h-[160px] sm:min-h-[200px] max-h-[50vh] scrollbar-thin"
                      placeholder={inputPlaceholder}
                    />

                    {/* 스타일 태그 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-sm font-medium text-zinc-200">
                          스타일 태그 (선택)
                        </h2>
                        <span className="text-[11px] text-zinc-500">
                          선택 {tags.length}개
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-[96px] overflow-y-auto pr-1">
                        {STYLE_TAGS.map((t) => (
                          <button
                            key={t}
                            onClick={() => toggleTag(t)}
                            className={`h-8 px-3 rounded-full border text-[11px] sm:text-[13px] transition
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
                  <>
                    <div className="text-[10px] sm:text-[11px] text-zinc-500">
                      {currentUsageLabel} · 이 텍스트 전체를 복사해서 해당 모델
                      입력 칸에 붙여넣으면 됩니다.
                    </div>
                    <textarea
                      ref={outRef}
                      readOnly
                      value={output}
                      rows={8}
                      className="w-full bg-transparent outline-none text-[12px] sm:text-[13px] leading-6 sm:leading-7 border border-zinc-800/80 rounded-xl px-3 py-2 min-h-[160px] max-h-[50vh] scrollbar-thin whitespace-pre-wrap"
                      placeholder="아직 생성된 프롬프트가 없습니다. [입력] 탭에서 내용을 작성한 뒤 [프롬프트 생성]을 눌러보세요."
                    />
                  </>
                )}

                {/* 액션 버튼 */}
                <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
                  <button
                    onClick={onGenerate}
                    className="h-9 px-4 rounded-xl bg-white text-black font-medium hover:bg-zinc-200 text-sm w-full sm:w-auto"
                  >
                    프롬프트 생성
                  </button>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={onCopy}
                      className="h-9 px-4 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-xs sm:text-sm flex-1 sm:flex-none whitespace-nowrap"
                    >
                      {copyButtonLabel}
                    </button>
                    <button
                      type="button"
                      onClick={goToBoardWrite}
                      className="h-9 px-4 rounded-xl border border-emerald-500/60 bg-emerald-500/10 text-emerald-300 text-xs sm:text-sm flex-1 sm:flex-none whitespace-nowrap"
                    >
                      이 프롬프트로 게시글 쓰기
                    </button>
                  </div>

                  <span className="w-full text-[10px] sm:text-xs text-zinc-500">
                    생성 후 결과 탭에서 프롬프트를 확인·복사하거나 게시판으로
                    보낼 수 있어요.
                  </span>
                </div>
              </div>
            </div>

            {/* 샘플 프롬프트 */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 backdrop-blur-sm p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="text-[11px] uppercase tracking-wide text-zinc-400">
                  샘플 프롬프트
                </div>
                <div className="text-[10px] sm:text-[11px] text-zinc-500">
                  카드 탭: 불러오기 · 버튼: 바로 생성
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {SAMPLE_SET.map((s) => (
                  <div
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => applySample(s.id)}
                    className={`min-w-[180px] max-w-[220px] text-left rounded-xl border text-[12px] sm:text-[13px] p-3 transition cursor-pointer
                      ${
                        activeSample === s.id
                          ? "border-zinc-100 bg-white text-black"
                          : "border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <div className="font-medium line-clamp-1">
                        {s.label}
                      </div>
                      <span className="text-[10px] text-zinc-500 shrink-0">
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

        {/* 히스토리 */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 backdrop-blur-sm">
          <button
            className="w-full px-3 sm:px-4 py-3 flex items-center justify-between text-left"
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
                <div className="px-3 sm:px-4 pb-4 text-sm text-zinc-500">
                  아직 생성된 프롬프트가 없습니다. 위에서 프롬프트를
                  만들어보세요.
                </div>
              ) : (
                <ul className="divide-y divide-zinc-800 max-h-[220px] sm:max-h-[260px] overflow-y-auto">
                  {history.map((h) => (
                    <li
                      key={h.id}
                      className="p-3 sm:p-4 hover:bg-zinc-900/60"
                    >
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <span className="text-xs text-zinc-400">
                          {h.at}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {
                            TARGETS.find((x) => x.id === h.target)?.label
                          }
                        </span>
                      </div>
                      <pre className="whitespace-pre-wrap text-[12px] sm:text-[13px] leading-6 text-zinc-100">
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
    </div>
  );
}
