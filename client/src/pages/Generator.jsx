// client/src/pages/Generator.jsx
// Targets: Gemini 2.5 Flash Image / Veo 3.1 / Midjourney (V7) / OpenAI Sora 2
// UX+: 타깃별 프리셋 버튼 + 툴팁 추가, 나머지 로직/스타일/히스토리 유지

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const LS_DRAFT_KEY   = "pt_gen_draft_prime_help_inline_v3";
const LS_HISTORY_KEY = "pt_gen_history_prime_help_inline_v3";
const MAX_HISTORY    = 30;

const estimateTokens = (t = "") => Math.ceil((t || "").length / 4);

async function copyToClipboard(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const ta=document.createElement("textarea"); ta.value=text;
    document.body.appendChild(ta); ta.select(); document.execCommand("copy");
    document.body.removeChild(ta); return true;
  }
}

const STYLE_TAGS = [
  { label: "시네마틱 구도", value: "cinematic composition" },
  { label: "필름 그레인", value: "film grain" },
  { label: "스튜디오 조명", value: "studio lighting" },
  { label: "아날로그 필름 느낌", value: "analog film look" },
  { label: "부드러운 빛 번짐", value: "soft halation" },
  { label: "네온 조명", value: "neon lights" },
  { label: "안개 연출", value: "volumetric fog" }
];

const LINT_RULES = [
  { pat: /\b(really|very|maybe|perhaps|kind of|sort of|a bit|somewhat)\b/gi, rep: "" },
  { pat: /느낌 있게|감성 있게/gi, rep: "cohesive mood" },
  { pat: /색감 좋게|색감이 좋게|색감 예쁘게/gi, rep: "well color graded" }
];

function lintText(text){
  let out=text, warns=[];
  for(const r of LINT_RULES){
    if(r.warn&&r.pat.test(out)) warns.push({message:r.warn});
    if(typeof r.rep!=="undefined") out=out.replace(r.pat,r.rep);
  }
  out=out.replace(/\s{2,}/g," ").trim();
  return {out,warns};
}
function qualityString(level){
  switch(level){
    case "draft": return "";
    case "standard": return "balanced detail, coherent composition";
    case "high": return "intricate details, refined textures, consistent lighting";
    case "cinematic": return "cinematic lighting, dramatic depth, filmic color grading";
    default: return "";
  }
}

/* ── 프리셋 정의 ───────────────────────────────────────────── */
const PRESETS = {
  gemini: [
    { name: "사진(인물)", hint: "인물/포트레이트", apply: base => base + ", shallow depth of field, 85mm lens, soft key light" },
    { name: "제품샷", hint: "제품/전신", apply: base => base + ", studio seamless background, softbox lighting, product hero shot" },
    { name: "풍경", hint: "자연/건물", apply: base => base + ", wide angle 24mm, golden hour, atmospheric haze" }
  ],
  veo31: [
    { name: "시네틱", hint: "5~8초, 느린 카메라", apply: b => b + "\n(camera: slow dolly-in, fps 24, duration 6s)" },
    { name: "제품광고", hint: "제품 클로즈업", apply: b => b + "\n(camera: macro push-in on product; glossy reflections; duration 6s)" },
    { name: "여행씬", hint: "파노라마", apply: b => b + "\n(camera: wide establishing → gentle pan right, natural handheld sway, duration 7s)" }
  ],
  midjourney: [
    { name: "사진", hint: "리얼 포토", apply: b => `${b} --ar 16:9 --style raw --v 7` },
    { name: "애니", hint: "일러/툰", apply: b => `${b} anime style --ar 16:9 --style raw --v 7` },
    { name: "제품샷", hint: "e-commerce", apply: b => `${b} studio product shot, soft light --ar 1:1 --style raw --v 7` }
  ],
  sora2: [
    { name: "시네틱", hint: "영화 질감", apply: b => b + "\n[AUDIO] subtle ambient; [CAMERA] wide→push-in; [DUR] 6-8s" },
    { name: "제품", hint: "클린 모션", apply: b => b + "\n[VISUAL] glossy surface; [CAMERA] macro glide; [DUR] 6s" },
    { name: "여행", hint: "도시/자연", apply: b => b + "\n[VISUAL] street ambience; [CAMERA] slow pan; [DUR] 8s" }
  ]
};

/* ── 타깃별 포맷터 ─────────────────────────────────────────── */
function formatByTarget(base, target) {
  if (target === "gemini") {
    return [
      "[TARGET] Gemini 2.5 Flash Image",
      "[PROMPT]",
      base,
      "",
      "[STYLE & CAMERA]",
      "- subject: clear focal subject; avoid ambiguity",
      "- composition: rule of thirds or centered as appropriate",
      "- lighting: natural or studio; specify time-of-day if relevant",
      "- color: well color graded; avoid oversaturation",
      "- lens: 35mm–85mm for portraits; otherwise specify",
      "",
      "[PARAMETERS]",
      "- aspect_ratio: 1:1 or 16:9",
      "- negative: watermarks, text artifacts, extra fingers, distorted anatomy",
      "- output: single still image"
    ].join("\n");
  }

  if (target === "veo31") {
    return [
      "[TARGET] Veo 3.1",
      "[SHOT PLAN]",
      "1) duration: 5–8s, fps: 24",
      "2) camera: start wide → slow dolly-in (or pan), medium motion",
      "3) subject action: natural motion; avoid jitter",
      "4) scene beats: intro → main action → settle",
      "",
      "[PROMPT]",
      base,
      "",
      "[QUALITY & SAFETY]",
      "- cinematic lighting and depth; avoid flicker and warping",
      "- no copyrighted logos/watermarks; no NSFW/violent content",
      "- output: single clip (mp4 or mov)"
    ].join("\n");
  }

  if (target === "midjourney") {
    return ["/imagine prompt:", base].join(" ");
  }

  if (target === "sora2") {
    return [
      "[TARGET] OpenAI Sora 2",
      "[SHOT BLUEPRINT]",
      "- length: 6–10s, fps 24",
      "- camera: medium-wide → gentle push-in; avoid whip pans",
      "- motion: physically plausible; conserve momentum; no teleporting",
      "",
      "[VISUAL PROMPT]",
      base,
      "",
      "[AUDIO & SYNC]",
      "- ambient: match scene (rain/city/forest/interior AC)",
      "- sync: actions roughly aligned; no hard desync",
      "",
      "[QUALITY & SAFETY]",
      "- high realism, no logos/watermarks",
      "- avoid gore/NSFW; respect privacy/likeness",
      "- output: one clip, landscape 16:9"
    ].join("\n");
  }

  return base;
}

function useToast(){
  const [msg,setMsg]=useState("");
  useEffect(()=>{ if(!msg) return; const t=setTimeout(()=>setMsg(""),1400); return ()=>clearTimeout(t); },[msg]);
  return { msg, show:setMsg };
}
function Toast({message}){
  if(!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur text-white text-sm px-3 py-2 rounded-md shadow-lg">
      {message}
    </div>
  );
}
function Seg({active,children,onClick,title}){
  return (
    <button
      onClick={onClick}
      title={title}
      className={`h-9 px-3 text-sm rounded-full border transition ${
        active?"bg-white text-black border-gray-200 shadow":"bg-gray-900/60 text-gray-200 border-gray-700 hover:bg-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function HelpCard({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-[min(640px,92vw)] rounded-2xl border border-gray-700 bg-gray-900 p-5 text-gray-100 shadow-2xl">
        <div className="flex items-start mb-3">
          <h3 className="text-lg font-semibold">도움말</h3>
        </div>
        <div className="space-y-4 text-sm">
          <section>
            <div className="font-semibold mb-1">단축키</div>
            <ul className="list-disc ml-5 space-y-1 text-gray-300">
              <li><b>Ctrl/Cmd + Enter</b> — 프롬프트 생성</li>
              <li><b>Ctrl/Cmd + Shift + C</b> — 결과 복사</li>
              <li><b>Alt + R</b> — 임시 저장 복원</li>
            </ul>
          </section>
          <section>
            <div className="font-semibold mb-1">타깃 가이드</div>
            <ul className="list-disc ml-5 space-y-1 text-gray-300">
              <li><b>Gemini</b>: 정적 이미지 중심 (묘사·제약을 구체적으로)</li>
              <li><b>Veo</b>: 비디오 중심 (샷 플랜·카메라 동선·길이 명시)</li>
              <li><b>Midjourney</b>: /imagine 프롬프트 + 파라미터</li>
              <li><b>Sora</b>: 샷 설계 + 오디오/싱크 힌트</li>
            </ul>
          </section>
          <div className="flex justify-end">
            <button onClick={onClose} className="h-8 px-3 rounded-md border bg-gray-800 border-gray-700 hover:bg-gray-700 text-sm">닫기</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Generator(){
  const [input, setInput] = useState("");
  const [quality, setQuality] = useState("standard");
  const [target, setTarget] = useState("gemini"); // gemini | veo31 | midjourney | sora2
  const [selectedTags, setSelectedTags] = useState([]);
  const [helpOpen, setHelpOpen] = useState(false);

  const [output, setOutput] = useState("");
  const [warnings, setWarnings] = useState([]);
  const [history, setHistory] = useState(()=>{ try{ return JSON.parse(localStorage.getItem(LS_HISTORY_KEY))||[]; } catch { return []; }});
  const { msg, show } = useToast();
  const refScroll=useRef(null);

  // 단축키
  const handleKey = useCallback((e)=>{
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const mod = isMac ? e.metaKey : e.ctrlKey;
    if (mod && e.key === "Enter") { e.preventDefault(); handleGenerate(); }
    if (mod && e.shiftKey && (e.key === "c" || e.key === "C")) { e.preventDefault(); handleCopy(); }
    if (e.altKey && (e.key === "r" || e.key === "R")) { e.preventDefault(); handleRestoreDraft(); }
  },[]);
  useEffect(()=>{ window.addEventListener("keydown", handleKey); return ()=>window.removeEventListener("keydown", handleKey); },[handleKey]);

  // Draft 저장
  useEffect(()=>{
    const draft={input,quality,selectedTags,target};
    localStorage.setItem(LS_DRAFT_KEY, JSON.stringify(draft));
  },[input,quality,selectedTags,target]);

  const handleRestoreDraft=()=>{
    try{
      const raw=localStorage.getItem(LS_DRAFT_KEY); if(!raw) return show("임시 저장 없음");
      const d=JSON.parse(raw);
      setInput(d.input??""); setQuality(d.quality??"standard");
      setSelectedTags(d.selectedTags??[]); setTarget(d.target??"gemini");
      show("임시 저장 복원 완료");
    } catch { show("복원 실패"); }
  };

  const applyPreset = (key) => {
    const preset = PRESETS[target][key];
    if (!preset) return;
    const seed = input.trim() ? input.trim() : "비 오는 도쿄 골목, 네온사인 반사, 시네마틱 인물 클로즈업";
    setInput(preset.apply(seed));
    show(`프리셋 적용: ${preset.name}`);
  };

  const handleGenerate=()=> {
    const q = qualityString(quality);
    const tagValues = selectedTags.map(l=>STYLE_TAGS.find(t=>t.label===l)?.value).filter(Boolean);
    const tagTxt = tagValues.length ? tagValues.join(", ") : "";
    const merged = [input, tagTxt, q].filter(Boolean).join(", ");
    const { out, warns } = lintText(merged);
    setWarnings(warns);
    const formatted = formatByTarget(out, target);
    setOutput(formatted);

    const item = { id: Date.now(), target, snapshot:{input,quality,selectedTags,target}, text: formatted, createdAt:new Date().toISOString() };
    const next=[item, ...history].slice(0, MAX_HISTORY); setHistory(next);
    try{ localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(next)); }catch{}
    show("프롬프트 생성 완료");
    setTimeout(()=>refScroll.current?.scrollIntoView({behavior:"smooth"}), 50);
  };

  const handleCopy = async()=>{ if(!output) return; await copyToClipboard(output); show("복사 완료"); };
  const handleClearHistory=()=>{ setHistory([]); try{ localStorage.removeItem(LS_HISTORY_KEY); }catch{} show("히스토리 삭제"); };

  const tokenCount = useMemo(()=>estimateTokens(output),[output]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 text-gray-200">
      <div className="mb-4 flex items-end gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">Promptree 생성기</h1>
        <button onClick={()=>setHelpOpen(true)} className="ml-auto h-9 px-3 rounded-full border border-gray-600 bg-gray-900/50 hover:bg-gray-800 text-sm" title="도움말 열기">도움말</button>
      </div>

      {/* 툴바 */}
      <div className="mb-5 rounded-2xl border border-gray-700 bg-gradient-to-b from-gray-800/70 to-gray-900/60 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">단계</span>
            <div className="flex gap-1">
              {["draft","standard","high","cinematic"].map(q=>(
                <Seg key={q} active={quality===q} onClick={()=>setQuality(q)} title={
                  q==="draft"?"라이트":q==="standard"?"클래식":q==="high"?"프라임":"시네마틱"
                }>
                  {q==="draft"?"라이트":q==="standard"?"클래식":q==="high"?"프라임":"시네마틱"}
                </Seg>
              ))}
            </div>
          </div>

          <div className="h-6 w-px bg-gray-700 hidden md:block" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">타깃</span>
            <div className="flex gap-1">
              {[
                ["gemini","Gemini 2.5 Flash Image","정적 이미지 중심"],
                ["veo31","Veo 3.1","비디오 · 샷 플랜"],
                ["midjourney","Midjourney (V7)","/imagine 파라미터"],
                ["sora2","OpenAI Sora 2","비디오 · 오디오/싱크"]
              ].map(([k,label,tip])=>(
                <Seg key={k} active={target===k} onClick={()=>setTarget(k)} title={tip}>{label}</Seg>
              ))}
            </div>
          </div>

          <div className="h-6 w-px bg-gray-700 hidden md:block" />

          {/* 프리셋 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">프리셋</span>
            <div className="flex flex-wrap gap-1">
              {PRESETS[target].map((p, idx)=>(
                <button
                  key={p.name}
                  title={p.hint}
                  onClick={()=>applyPreset(idx)}
                  className="h-9 px-3 text-sm rounded-full border bg-gray-900/60 text-gray-200 border-gray-700 hover:bg-gray-800"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="ml-auto">
            <button onClick={handleRestoreDraft} className="h-9 px-4 rounded-full border border-gray-600 bg-gray-900/50 hover:bg-gray-800 transition text-sm" title="Alt + R">복원</button>
          </div>
        </div>
      </div>

      {/* 입력 */}
      <section className="bg-gray-900/60 rounded-2xl p-4 border border-gray-700 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">입력</h2>
        </div>
        <textarea
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={(e)=>{ const isMac=navigator.platform.toUpperCase().includes("MAC"); const mod=isMac?e.metaKey:e.ctrlKey; if(mod && e.key==="Enter"){ e.preventDefault(); handleGenerate(); } }}
          placeholder="예: 비 오는 도쿄 골목, 네온사인 반사, 인물 클로즈업, 시네마틱"
          className="w-full h-36 bg-black/70 text-gray-100 p-3 text-sm outline-none rounded-lg border border-gray-700 focus:border-gray-500 transition"
        />
      </section>

      {/* 태그 */}
      <section className="bg-gray-900/60 rounded-2xl p-4 border border-gray-700 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">스타일 태그 (선택)</h2>
          <span className="text-[11px] text-gray-400">선택하지 않아도 됩니다</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {STYLE_TAGS.map(tag=>{
            const on=selectedTags.includes(tag.label);
            return (
              <button
                key={tag.label}
                onClick={()=> setSelectedTags(prev => on ? prev.filter(l=>l!==tag.label) : [...prev, tag.label])}
                className={`h-8 px-3 rounded-full border text-sm transition ${on?"bg-white text-black border-gray-200 shadow":"bg-gray-900/60 text-gray-200 border-gray-700 hover:bg-gray-800"}`}
              >
                #{tag.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 액션 */}
      <div className="flex flex-wrap gap-3 mb-1">
        <button onClick={handleGenerate} className="h-10 px-5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white shadow" title="Ctrl/Cmd + Enter">프롬프트 생성</button>
        <button onClick={handleCopy} className="h-10 px-5 rounded-xl border bg-gray-900 border-gray-700 hover:bg-gray-800 text-white" title="Ctrl/Cmd + Shift + C">복사</button>
        <div className="flex items-center gap-1 text-sm text-gray-400" title="토큰은 대략 4자 ≈ 1토큰으로 계산됩니다.">
          <span>토큰 추정:</span><span className="font-mono">{tokenCount}</span>
        </div>
      </div>

      {/* 결과 */}
      <section className="rounded-2xl border border-gray-700 overflow-hidden">
        <div className="px-3 py-2 bg-gray-900/60 flex items-center">
          <div className="font-semibold">
            생성된 프롬프트 — {
              target==="gemini" ? "GEMINI 2.5 FLASH IMAGE" :
              target==="veo31" ? "VEO 3.1" :
              target==="midjourney" ? "MIDJOURNEY (V7)" :
              "OPENAI SORA 2"
            }
          </div>
        </div>
        <textarea readOnly value={output} placeholder="생성 결과가 여기에 표시됩니다." className="w-full h-56 bg-black/70 text-gray-100 p-3 text-sm outline-none resize-none" />
      </section>

      {/* 히스토리 */}
      <section className="mt-6 bg-gray-900/60 rounded-2xl p-4 border border-gray-700">
        <div className="flex items-center mb-3">
          <h2 className="text-lg font-semibold">히스토리 ({history.length})</h2>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400">아직 히스토리가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {history.map(h => (
              <HistoryItem
                key={h.id}
                item={h}
                onLoad={(it)=>{
                  setInput(it.snapshot.input || "");
                  setQuality(it.snapshot.quality || "standard");
                  setSelectedTags(it.snapshot.selectedTags || []);
                  setTarget(it.snapshot.target || it.target || "gemini");
                  setOutput(it.text);
                  show("히스토리 불러옴");
                  setTimeout(()=>refScroll.current?.scrollIntoView({behavior:"smooth"}), 50);
                }}
              />
            ))}
          </div>
        )}
        <div className="mt-3">
          <button onClick={handleClearHistory} className="h-9 px-3 rounded-md border bg-gray-900 border-gray-700 hover:bg-gray-800 text-sm">전체 삭제</button>
        </div>
      </section>

      <div ref={refScroll} className="h-4" />
      <Toast message={msg} />
      <HelpCard open={helpOpen} onClose={()=>setHelpOpen(false)} />
    </div>
  );
}

function HistoryItem({ item, onLoad }) {
  return (
    <div className="rounded-xl border border-gray-700 overflow-hidden">
      <div className="px-3 py-2 bg-gray-900/60 flex items-center gap-2">
        <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleString()}</span>
        <span className="text-xs text-gray-400">타깃: {(item.target||"").toUpperCase()}</span>
        <button onClick={()=>onLoad(item)} className="ml-auto h-8 px-3 rounded-md border bg-gray-900 border-gray-700 hover:bg-gray-800 text-xs">불러오기</button>
      </div>
      <div className="p-3 text-sm whitespace-pre-wrap text-gray-200">{item.text}</div>
    </div>
  );
}
