// client/src/pages/BoardWrite.jsx
// ✅ 서버 연동 버전: 글을 SQLite 백엔드에 저장

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// API base (Board.jsx와 동일하게)
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || data?.message || "요청 중 오류가 발생했습니다.";
    throw new Error(msg);
  }
  return data;
}

const CATEGORY_OPTIONS = ["일반", "프롬프트", "기타"];

const targetLabelMap = {
  gemini: "Gemini",
  veo: "Veo",
  mj: "Midjourney",
  sora: "Sora",
};

export default function BoardWrite() {
  const navigate = useNavigate();
  const location = useLocation();

  // 🔥 생성기에서 넘어온 state
  const fromGenerator = location.state || {};
  const initialTitlePrefix = fromGenerator.target
    ? `[${targetLabelMap[fromGenerator.target] || "Prompt"}] `
    : "";
  const initialContentFromGen = fromGenerator.prompt || "";

  const [category, setCategory] = useState("프롬프트");
  const [title, setTitle] = useState(initialTitlePrefix);
  const [author, setAuthor] = useState("");
  const [password, setPassword] = useState("");
  const [content, setContent] = useState(initialContentFromGen);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("제목을 입력해 주세요.");
      return;
    }
    if (!content.trim()) {
      alert("내용을 입력해 주세요.");
      return;
    }

    try {
      await api("/api/posts", {
        method: "POST",
        body: JSON.stringify({
          category,
          title: title.trim(),
          author: author.trim() || "익명",
          pwHash: password.trim() || "",
          content: content.trim(),
          images: [],
          videos: [],
        }),
      });

      alert("게시글이 등록되었습니다.");
      navigate("/board");
    } catch (err) {
      console.error(err);
      alert(err.message || "글 등록 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">게시글 쓰기</h1>
          <p className="text-xs text-zinc-400 mt-1">
            프롬프트, 팁, 결과물을 자유롭게 공유해 주세요.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="h-8 px-3 rounded-lg border border-zinc-700 bg-zinc-900/80 text-xs text-zinc-200 hover:bg-zinc-800"
        >
          ← 돌아가기
        </button>
      </header>

      {/* 생성기에서 넘어왔을 때 안내 배지 */}
      {initialContentFromGen && (
        <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-200">
          <div className="font-medium mb-0.5">
            생성기에서 프롬프트를 가져왔어요.
          </div>
          <div className="text-emerald-100/80">
            제목 앞에 타깃 태그가 자동으로 붙어 있고, 내용에는 생성된
            프롬프트가 들어 있습니다. 설명이나 사용 팁을 더 적어줘도 좋아요.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 카테고리 / 닉네임 / 비번 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">
              말머리
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-9 rounded-lg border border-zinc-700 bg-zinc-900/80 text-xs text-zinc-100 px-2"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">
              닉네임
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full h-9 rounded-lg border border-zinc-700 bg-zinc-900/80 text-xs text-zinc-100 px-2"
              placeholder="닉네임"
            />
          </div>
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">
              비밀번호(선택)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-9 rounded-lg border border-zinc-700 bg-zinc-900/80 text-xs text-zinc-100 px-2"
              placeholder="4자리 이상 권장"
            />
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-[11px] text-zinc-400 mb-1">
            제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-10 rounded-lg border border-zinc-700 bg-zinc-900/80 text-sm text-zinc-100 px-3"
            placeholder="[모델명] 어떤 프롬프트인지 한 줄로"
          />
        </div>

        {/* 내용 */}
        <div>
          <label className="block text-[11px] text-zinc-400 mb-1">
            내용
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950/80 text-sm text-zinc-100 px-3 py-2 leading-6 resize-y"
            placeholder={
              "생성한 프롬프트, 사용 팁, 결과물 설명 등을 자유롭게 적어주세요.\n\n예시)\n- 어떤 모델에 어떻게 넣었는지\n- 참고 이미지 / 캐릭터 설정\n- 잘 나온 포인트 / 아쉬운 점"
            }
          />
        </div>

        {/* 버튼들 */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-[11px] text-zinc-500">
            * 글은 서버(board.db)에 저장됩니다.
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/board")}
              className="h-9 px-4 rounded-xl border border-zinc-700 bg-zinc-900/80 text-xs text-zinc-200 hover:bg-zinc-800"
            >
              취소
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200"
            >
              게시글 등록
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
