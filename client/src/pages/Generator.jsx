// client/src/pages/Generator.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

/* ─────────────────────────────────────────────
   Promptree 생성기
   - 한글 한 줄 입력 → 타깃별 롱프롬프트 자동 설계
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

/** 단계/프리셋/태그 → 영어 스타일 힌트 매핑  -------------------------------- */

const STAGE_HINTS = {
  라이팅: "studio lighting, controlled light setup, clean shadows",
  클래식: "classic balanced composition, natural colors",
  프라임: "high-end prime lens look, crisp detail, shallow depth of field",
  시네마틱: "cinematic framing, film look, dramatic lighting",
};

const PRESET_HINTS = {
  "사진(일몰)": "golden hour sunset lighting, warm tones, long soft shadows",
  "사진(정장)": "formal portrait style, clean background, professional look",
  제품: "product photography, seamless background, soft studio light",
};

const STYLE_HINTS = {
  "시네마틱 구도": "cinematic composition",
  "필름 그레인": "subtle film grain texture",
  "스튜디오 조명": "studio light setup, softbox key light",
  "아날로그 필름 느낌": "analog film look, gentle halation, vintage tone",
  "부드러운 빛 번짐": "soft light bloom, gentle glow",
  "네온 조명": "neon lighting, vibrant color contrast",
  "얕은 심도": "shallow depth of field, strong background blur",
};

const SAMPLE_SET = [
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
  {
    id: "veo-emotion-clinic",
    label: "미래형 감정 클리닉",
    target: "veo",
    stage: "시네마틱",
    preset: "사진(일몰)",
    text: "감정을 데이터로 업로드하는 미래형 정신과 대기실, 환자들이 투명한 캡슐 의자에 앉아 있고, 벽면엔 감정 그래프가 떠 있는 홀로그램 스크린이 줄지어 있음.",
    tags: ["시네마틱 구도", "아날로그 필름 느낌"],
  },
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

export default function Generator() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [stage, setStage] = useState("라이팅");
  const [preset, setPreset] = useState("사진(일몰)");
  const [target, setTarget] = useState(TARGETS[0].id);
  const [input, setInput] = useState(""); // 🔥 여전히 한 칸짜리 메인 입력
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

  /** 🔥 핵심: 한 줄 입력을 타깃별 “얼굴 빵빵한 롱프롬프트”로 바꾸는 엔진 */
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
    const userKo = (inputArg || "").trim();

    // 단계/프리셋/태그를 영어 스타일 힌트로 합치기
    const styleHints = [];

    if (stageArg && STAGE_HINTS[stageArg]) {
      styleHints.push(STAGE_HINTS[stageArg]);
    }
    if (presetArg && PRESET_HINTS[presetArg]) {
      styleHints.push(PRESET_HINTS[presetArg]);
    }
    if (tagsArg && tagsArg.length) {
      styleHints.push(
        tagsArg
          .map((t) => STYLE_HINTS[t] || t)
          .join(", ")
      );
    }

    const styleHintsText = styleHints.length
      ? styleHints.join(", ")
      : "";

    const stageText = stageArg ? ` (${stageArg})` : "";
    const presetText = presetArg ? ` / PRESET: ${presetArg}` : "";

    // 참고 이미지 블록
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

    /** GEMINI – 이미지 한 장용 메타 프롬프트 */
    if (targetArg === "gemini") {
      const sceneLine =
        userKo ||
        "비 오는 네온 시티 골목, 인물 클로즈업, 젖은 바닥 반사, 시네마틱 무드";

      const lines = [
        "TARGET: GOOGLE GEMINI 2.5 FLASH IMAGE",
        `STAGE: ${stageArg || "시네마틱"}${presetText}`,
        "",
        "GUIDE:",
        "- Generate a single high-quality image based on the following Korean scene description.",
        "- Focus on detailed lighting, composition and atmosphere.",
        "- Return only the final prompt content suitable for an image generation model.",
        "",
        `SCENE (KOREAN): ${sceneLine}`,
      ];

      if (styleHintsText) {
        lines.push("", `STYLE (ENGLISH HINTS): ${styleHintsText}`);
      }

      lines.push(
        "",
        "TECHNICAL SUGGESTION:",
        "50mm lens, ISO 200, f1.8, softbox key light, subtle rim light, shallow depth of field, rule of thirds.",
        "",
        "NEGATIVE PROMPT:",
        "watermark, logo, text, overexposed highlights, deformed hands, extra fingers, distorted face"
      );

      const main = lines.join("\n");
      return referenceBlock ? `${main}\n\n${referenceBlock}` : main;
    }

    /** VEO – 6~8초 샷 플랜 */
    if (targetArg === "veo") {
      const sceneLine =
        userKo ||
        "카메라가 네온 숲 사이를 천천히 날아가며, 나무에서 흘러나오는 빛과 입자가 흐르는 장면";
      const lines = [
        "TARGET: GOOGLE VEO 3.1",
        `STAGE: ${stageArg || "시네마틱"}${presetText}`,
        "",
        "GUIDE:",
        "- Generate a detailed ENGLISH video prompt for a 6–8 second cinematic clip at 24fps.",
        "- Include shot plan, camera movement, pacing and key transitions.",
        "- Avoid copyrighted names, logos and explicit or graphic content.",
        "",
        "VIDEO SUMMARY (KOREAN):",
        sceneLine,
      ];

      if (styleHintsText) {
        lines.push("", `STYLE (ENGLISH HINTS): ${styleHintsText}`);
      }

      lines.push(
        "",
        "STRUCTURE:",
        "1) One-sentence logline of the whole clip.",
        "2) 3–5 numbered shots with framing (wide/medium/close), what moves, and camera motion.",
        "3) Lighting and overall mood.",
        "4) How the clip ends by the 8 second mark."
      );

      const main = lines.join("\n");
      return referenceBlock ? `${main}\n\n${referenceBlock}` : main;
    }

    /** MIDJOURNEY – /imagine 한 줄 프롬프트 */
    if (targetArg === "mj") {
      const base =
        userKo ||
        "cinematic portrait, soft rim light, highly detailed illustration";
      const stylePart = styleHintsText ? `, ${styleHintsText}` : "";
      const line = `/imagine prompt: ${base}${stylePart} --ar 3:4 --v 7 --style raw --no text --no watermark`;

      return referenceBlock ? `${line}\n\n${referenceBlock}` : line;
    }

    /** SORA – 8초 비디오 클립 설명 */
    const sceneLineSora =
      userKo ||
      "dusk city street, one person walking slowly toward camera, traffic lights glowing in the background";

    const lines = [
      "TARGET: OPENAI SORA 2",
      `STAGE: ${stageArg || "시네마틱"}${presetText}`,
      "",
      "GUIDE:",
      "- Generate an ENGLISH prompt for an ~8 second cinematic video clip at 24fps.",
      "- Focus on motion, environment storytelling and transitions.",
      "- Avoid copyrighted names, logos and explicit or graphic content.",
      "",
      "VIDEO PROMPT (KOREAN):",
      sceneLineSora,
    ];

    if (styleHintsText) {
      lines.push("", `STYLE (ENGLISH HINTS): ${styleHintsText}`);
    }

    lines.push(
      "",
      "ENDING:",
      "- Briefly describe how the clip should end within 8 seconds."
    );

    const main = lines.join("\n");
    return referenceBlock ? `${main}\n\n${referenceBlock}` : main;
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
    if (!input && !refNote) return;
    if (!window.confirm("입력 내용을 모두 지울까요?")) return;
    setInput("");
    setRefNote("");
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
              AI 이미지/영상용 프롬프트를 빠르게 설계하는 작업 공간
            </p>
          </div>
          <button
            className="mt-2 sm:mt-0 self-start sm:self-auto h-9 px-3 rounded-xl border border-zinc-800 bg-zinc-900/70 hover:bg-zinc-800 text-xs"
            onClick={() =>
              alert(
                "사용 가이드\n\n1) 위에서 타깃·단계·프리셋을 고르고\n2) [입력] 탭에서 장면을 한글로 한 줄만 적어도 되고,\n   길게 적어도 됩니다.\n3) 태그·참고이미지는 선택사항.\n4) [프롬프트 생성]을 누르면 타깃에 맞는 롱프롬프트가 만들어집니다.\n\n[결과] 탭에서 프롬프트를 복사하거나 게시글로 보낼 수 있습니다."
              )
            }
          >
            도움말
          </button>
        </header>

        {/* 메인: lg부터만 2컬럼 */}
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,260px),minmax(0,1fr)] lg:gap-4">
          {/* 모바일에서 제일 위: 설정 패널 */}
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
                프리셋은 추천 조합이고, 실제 장면은 형이 한글로 적는 걸 기준으로
                영어 힌트만 살짝 얹어준다.
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

          {/* 오른쪽: 입력/결과 + 샘플 */}
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
                          문장이 자동으로 들어갑니다.
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

                    {/* 메인 입력 – 딱 한 칸 */}
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

                {/* 액션 버튼 (모바일 최적화) */}
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
                        <span className="text-xs text-zinc-400">{h.at}</span>
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
