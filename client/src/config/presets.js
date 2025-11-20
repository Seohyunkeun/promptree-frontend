// src/config/presets.js

export const PROMPT_PRESETS = [
  {
    id: "cinematic_gemini",
    label: "시네마틱 씬",
    targetModel: "Gemini 2.5 Flash Image",
    category: "image",
    shortDescription: "영화 스틸컷 느낌의 시네마틱 장면",
    accentColor: "emerald",
    defaultInput: {
      // 한글로 형이 적는 영역
      koConcept: "미래 도시 야경에서 서 있는 주인공",
      style: "cinematic, ultra realistic, detailed",
      camera: "50mm lens, f1.8, shallow depth of field",
      light: "softbox key light, rim light, ambient practicals",
      composition: "rule of thirds, subject centered",
      extra: "movie still, highly detailed, 8k"
    },
    basePrompt: `
A cinematic scene of {{koConcept}},
shot with {{camera}}, {{light}},
composition following {{composition}},
in a style that is {{style}}.
Highly detailed, photorealistic, {{extra}}
    `.trim()
  },
  {
    id: "character_midjourney",
    label: "캐릭터 일러스트",
    targetModel: "Midjourney V7",
    category: "image",
    shortDescription: "캐릭터 위주 일러스트/프로필",
    accentColor: "violet",
    defaultInput: {
      koConcept: "귀여운 별고래 캐릭터가 우주를 떠다니는 장면",
      style: "anime, cute, colorful, clean lineart",
      camera: "portrait shot, upper body",
      light: "soft light, glow, backlight",
      composition: "center composition",
      extra: "simple background, high contrast, HD"
    },
    basePrompt: `
A character illustration of {{koConcept}},
{{camera}}, {{light}},
{{composition}}, in a {{style}} style.
Crisp lineart, vivid colors, {{extra}}
    `.trim()
  },
  {
    id: "logo_minimal",
    label: "로고 & 브랜딩",
    targetModel: "Midjourney V7",
    category: "image",
    shortDescription: "심플한 로고/심볼 작업용",
    accentColor: "amber",
    defaultInput: {
      koConcept: "promptree brand logo, growing tree made of prompts",
      style: "minimal, flat, vector, modern",
      camera: "logo mark only, no mockup",
      light: "flat shading, no shadows",
      composition: "centered logo, negative space",
      extra: "white background, clean, scalable vector look"
    },
    basePrompt: `
A clean logo design for {{koConcept}},
{{composition}}, {{style}},
{{light}}.
Simple, modern, highly legible, {{extra}}
    `.trim()
  },
  {
    id: "video_veo",
    label: "영상 시퀀스",
    targetModel: "Veo 3.1",
    category: "video",
    shortDescription: "짧은 무드 영화 / 뮤직비디오용 시퀀스 설명",
    accentColor: "sky",
    defaultInput: {
      koConcept: "감정을 업로드하는 미래형 정신과 병원",
      style: "cinematic, moody, sci-fi, drama",
      camera: "slow dolly-in, 24mm lens, anamorphic",
      light: "neon signs, soft interior lights, contrasty",
      composition: "wide establishing shots, then close-ups",
      extra: "grain, subtle camera shake, film look"
    },
    basePrompt: `
A cinematic video sequence about {{koConcept}},
shot with {{camera}}, {{light}},
using {{composition}}.
Mood and style: {{style}}.
Add details: {{extra}}
    `.trim()
  }
];

// 간단 헬퍼 (id로 프리셋 찾기)
export function getPresetById(id) {
  return PROMPT_PRESETS.find((p) => p.id === id) || PROMPT_PRESETS[0];
}
