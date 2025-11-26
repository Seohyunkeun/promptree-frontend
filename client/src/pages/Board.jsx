// client/src/pages/Board.jsx
// 🔥 서버 기반 커뮤니티 버전
// - 모든 글은 백엔드(SQLite)에 저장되어, 어떤 브라우저에서 접속해도 공용으로 보임

import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

/* API base */
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

// 간단 fetch 래퍼
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

/* 유저 ID (브라우저별) - 좋아요 중복 방지용 */
const USER_KEY = "pt_board_user_id";
const currentUserId = (() => {
  try {
    if (typeof window === "undefined") return "anon";
    let id = localStorage.getItem(USER_KEY);
    if (!id) {
      id = crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
      localStorage.setItem(USER_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
})();

const fmtDate = (ts) => {
  const d = new Date(ts);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const HH = String(d.getHours()).toString().padStart(2, "0");
  const MM = String(d.getMinutes()).toString().padStart(2, "0");
  return `${yy}/${mm}/${dd} ${HH}:${MM}`;
};

/* ─────────────────────────────────────
   Editor
────────────────────────────────────── */

function Editor({ onCancel, onSubmit, isAdmin, initialDraft }) {
  const [category, setCategory] = useState(initialDraft?.category || "일반");
  const [title, setTitle] = useState(initialDraft?.title || "");
  const [author, setAuthor] = useState(initialDraft?.author || "");
  const [pw, setPw] = useState("");
  const [content, setContent] = useState(initialDraft?.content || "");
  const [images, setImages] = useState(initialDraft?.images || []);
  const [videos, setVideos] = useState(initialDraft?.videos || []);

  const fileImgRef = React.useRef(null);
  const fileVidRef = React.useRef(null);

  const CATEGORY_OPTIONS = isAdmin
    ? ["공지", "일반", "프롬프트", "기타"]
    : ["일반", "프롬프트", "기타"];

  useEffect(() => {
    // location state가 바뀌었을 때도 초기값 반영
    if (!initialDraft) return;
    if (initialDraft.category) setCategory(initialDraft.category);
    if (initialDraft.title) setTitle(initialDraft.title);
    if (initialDraft.author) setAuthor(initialDraft.author);
    if (initialDraft.content) setContent(initialDraft.content);
  }, [initialDraft]);

  function handleSubmit() {
    if (!title.trim()) return alert("제목을 입력해 주세요");
    if (!content.trim()) return alert("내용을 입력해 주세요");
    onSubmit({
      category,
      title: title.trim(),
      author: author.trim(),
      pwHash: pw ? pw.trim() : "",
      content: content.trim(),
      images,
      videos,
    });
  }

  function readFiles(fileList, accept = "image") {
    const arr = Array.from(fileList || []);
    arr.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        const item = {
          id:
            crypto.randomUUID?.() ??
            Math.random().toString(36).slice(2),
          name: f.name,
          dataUrl: String(reader.result),
        };
        if (accept === "image") setImages((prev) => [...prev, item]);
        else setVideos((prev) => [...prev, item]);
      };
      reader.readAsDataURL(f);
    });
  }

  const fromGenerator = initialDraft?.fromGenerator;

  return (
    <div className="grid gap-4">
      {/* 생성기에서 넘어온 경우 안내 배너 */}
      {fromGenerator && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100">
          <div className="font-medium mb-1">
            생성기에서 프롬프트를 가져왔어요.
          </div>
          <p className="leading-5">
            제목 앞에 타깃 태그가 자동으로 붙어 있고, 내용에는 방금 만든
            프롬프트가 들어 있습니다. 설명이나 사용 팁을 더 적어줘도 좋아요.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
        <div className="grid gap-4">
          {/* 상단: 말머리 + 제목 */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-zinc-700 bg-[#111117] text-sm text-zinc-100"
            >
              {CATEGORY_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="flex-1 px-3 py-2 rounded-xl border border-zinc-700 bg-[#111117] text-sm text-zinc-100 placeholder:text-zinc-500"
            />
          </div>

          {/* 닉네임/비밀번호 */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="닉네임(선택)"
              className="px-3 py-2 rounded-xl border border-zinc-700 bg-[#111117] text-sm text-zinc-100 placeholder:text-zinc-500"
            />
            <input
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="비밀번호(선택)"
              type="password"
              className="px-3 py-2 rounded-xl border border-zinc-700 bg-[#111117] text-sm text-zinc-100 placeholder:text-zinc-500"
            />
          </div>

          {/* 내용 */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력하세요."
            rows={10}
            className="w-full px-4 py-3 rounded-2xl border border-zinc-700 bg-[#111117] text-sm text-zinc-100 leading-6 placeholder:text-zinc-500"
          />

          {/* 파일 업로드 */}
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileImgRef}
                type="file"
                accept="image/*"
                hidden
                multiple
                onChange={(e) => readFiles(e.target.files, "image")}
              />
              <button
                onClick={() => fileImgRef.current?.click()}
                className="px-3 py-2 rounded-xl border border-zinc-700 bg-[#101018] text-xs text-zinc-200 hover:bg-zinc-900"
              >
                이미지 추가
              </button>
              <input
                ref={fileVidRef}
                type="file"
                accept="video/*"
                hidden
                multiple
                onChange={(e) => readFiles(e.target.files, "video")}
              />
              <button
                onClick={() => fileVidRef.current?.click()}
                className="px-3 py-2 rounded-xl border border-zinc-700 bg-[#101018] text-xs text-zinc-200 hover:bg-zinc-900"
              >
                동영상 추가
              </button>
            </div>

            {(images.length > 0 || videos.length > 0) && (
              <div className="grid gap-3">
                {images.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-zinc-400 mb-1">
                      이미지
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {images.map((img) => (
                        <img
                          key={img.id}
                          src={img.dataUrl}
                          alt={img.name}
                          className="w-full rounded-xl border border-zinc-700"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {videos.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-zinc-400 mb-1">
                      동영상
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {videos.map((v) => (
                        <video
                          key={v.id}
                          src={v.dataUrl}
                          controls
                          className="w-full rounded-xl border border-zinc-700"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={onCancel}
              className="px-3 py-2 rounded-xl border border-zinc-700 bg-[#101018] text-sm text-zinc-200 hover:bg-zinc-900"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded-xl bg-white text-sm font-medium text-black hover:bg-zinc-200"
            >
              등록
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 댓글 폼/리스트 */

function CommentForm({ onAdd }) {
  const [author, setAuthor] = useState("");
  const [pw, setPw] = useState("");
  const [text, setText] = useState("");

  function handleSubmit() {
    if (!text.trim()) return;
    onAdd({
      author: author.trim(),
      pwHash: pw ? pw.trim() : "",
      content: text.trim(),
    });
    setText("");
    setPw("");
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="닉네임(선택)"
          className="px-3 py-2 rounded-xl border border-zinc-700 bg-[#111117] text-[13px] text-zinc-100 placeholder:text-zinc-500"
        />
        <input
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="비밀번호(선택)"
          type="password"
          className="px-3 py-2 rounded-xl border border-zinc-700 bg-[#111117] text-[13px] text-zinc-100 placeholder:text-zinc-500"
        />
        <button
          onClick={handleSubmit}
          className="px-3 py-2 rounded-xl border border-zinc-700 bg-white text-[13px] text-black hover:bg-zinc-200"
        >
          등록
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="댓글 내용을 입력하세요"
        rows={3}
        className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-[#111117] text-[13px] text-zinc-100 placeholder:text-zinc-500"
      />
    </div>
  );
}

function CommentList({ comments, onDelete }) {
  if (!comments?.length)
    return (
      <p className="text-[13px] text-zinc-500">아직 댓글이 없습니다.</p>
    );
  return (
    <ul className="grid gap-2">
      {comments.map((c) => (
        <li
          key={c.id}
          className="p-3 rounded-xl border border-zinc-800 bg-[#101018]"
        >
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-medium text-zinc-100">
              {c.author || "익명"}
            </div>
            <div className="text-[11px] text-zinc-500">
              {fmtDate(c.createdAt)}
            </div>
          </div>
          <div className="mt-1 text-[13px] whitespace-pre-wrap text-zinc-100">
            {c.content}
          </div>
          <div className="mt-2">
            <button
              onClick={() => onDelete(c.id)}
              className="text-[12px] px-2 py-1 rounded-lg border border-red-500/60 text-red-300 hover:bg-red-500/10"
            >
              삭제
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* 목록 테이블 */

function ListTable({ posts, page, pageSize }) {
  const startIndex = (page - 1) * pageSize;
  const slice = posts.slice(startIndex, startIndex + pageSize);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
      <table className="w-full text-[13px]">
        <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400">
          <tr>
            <th className="w-16 py-2 font-medium">번호</th>
            <th className="w-24 font-medium">말머리</th>
            <th className="text-left font-medium">제목</th>
            <th className="w-32 font-medium">글쓴이</th>
            <th className="w-32 font-medium">작성일</th>
            <th className="w-20 font-medium">조회</th>
            <th className="w-20 font-medium">추천</th>
          </tr>
        </thead>
        <tbody className="text-zinc-200">
          {slice.map((p, i) => {
            const no = posts.length - (startIndex + i);
            const commentCnt = p.comments?.length || 0;
            const isNotice = p.category === "공지";
            const badgeClass = isNotice
              ? "bg-amber-500/10 text-amber-300 border-amber-500/60"
              : p.category === "프롬프트"
              ? "bg-violet-500/10 text-violet-300 border-violet-500/40"
              : p.category === "기타"
              ? "bg-sky-500/10 text-sky-300 border-sky-500/40"
              : "bg-zinc-700/20 text-zinc-200 border-zinc-500/40";

            return (
              <tr
                key={p.id}
                className={`border-b border-zinc-800 last:border-0 transition-colors ${
                  isNotice
                    ? "bg-zinc-900/80 hover:bg-zinc-900"
                    : "hover:bg-zinc-900/60"
                }`}
              >
                <td className="text-center py-2 text-zinc-400">{no}</td>
                <td className="text-center">
                  <span
                    className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full border text-[11px] ${badgeClass}`}
                  >
                    {p.category}
                  </span>
                </td>
                <td className="py-2">
                  <Link
                    to={`/board/${p.id}`}
                    className={`hover:underline ${
                      isNotice
                        ? "font-semibold text-amber-100"
                        : "text-zinc-50"
                    }`}
                  >
                    <span className="align-middle">{p.title}</span>
                    {commentCnt ? (
                      <span className="ml-1 text-xs text-zinc-400 align-middle">
                        [{commentCnt}]
                      </span>
                    ) : null}
                    {p.pinned && (
                      <span className="ml-1 text-xs text-amber-300 align-middle">
                        📌
                      </span>
                    )}
                  </Link>
                </td>
                <td className="text-center text-zinc-300">
                  {p.author || "익명"}
                </td>
                <td className="text-center text-zinc-400">
                  {fmtDate(p.createdAt)}
                </td>
                <td className="text-center text-zinc-300">
                  {p.views || 0}
                </td>
                <td className="text-center text-zinc-300">
                  {p.likes || 0}
                </td>
              </tr>
            );
          })}
          {slice.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="py-16 text-center text-zinc-500 text-sm"
              >
                아직 등록된 글이 없어요
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* 상세 페이지 */

function DetailView({ isAdmin, adminPassword }) {
  const { id: paramId } = useParams();
  const location = useLocation();
  const nav = useNavigate();

  const id = React.useMemo(() => {
    if (paramId) return paramId;
    const m = location.pathname.match(/\/board\/([^\/?#]+)/);
    return m ? decodeURIComponent(m[1]) : undefined;
  }, [paramId, location.pathname]);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!id) {
      alert("잘못된 접근입니다.");
      nav("/board", { replace: true });
      return;
    }
    setLoading(true);
    try {
      const data = await api("/api/posts");
      const list = Array.isArray(data) ? data : data.posts || [];
      const found = list.find((p) => p.id === id);
      if (!found) {
        alert("게시글을 찾을 수 없습니다.");
        nav("/board", { replace: true });
        return;
      }
      setPost(found);
    } catch (e) {
      console.error(e);
      alert("게시글을 불러오지 못했습니다.");
      nav("/board", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 text-sm text-zinc-400">
        불러오는 중...
      </div>
    );
  }
  if (!post) return null;

  const alreadyLiked = Array.isArray(post.likedBy)
    ? post.likedBy.includes(currentUserId)
    : false;
  const isNotice = post.category === "공지";

  async function handleLike() {
    try {
      const data = await api(`/api/posts/${post.id}/like`, {
        method: "POST",
        body: JSON.stringify({ userId: currentUserId }),
      });
      setPost(data.post);
    } catch (e) {
      console.error(e);
      alert("좋아요 처리 중 오류가 발생했습니다.");
    }
  }

  async function handlePin() {
    if (!isAdmin) {
      alert("관리자만 글을 고정할 수 있습니다.");
      return;
    }
    try {
      const data = await api(`/api/posts/${post.id}/pin`, {
        method: "POST",
        body: JSON.stringify({ adminPassword }),
      });
      setPost(data.post);
    } catch (e) {
      console.error(e);
      alert("고정 처리 중 오류가 발생했습니다.");
    }
  }

  async function handleDelete() {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await api(`/api/posts/${post.id}`, { method: "DELETE" });
      nav("/board", { replace: true });
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  }

  async function handleAddComment(payload) {
    try {
      const data = await api(`/api/posts/${post.id}/comments`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setPost(data.post);
    } catch (e) {
      console.error(e);
      alert("댓글 등록 중 오류가 발생했습니다.");
    }
  }

  async function handleDeleteComment(cid) {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      const data = await api(
        `/api/posts/${post.id}/comments/${cid}`,
        { method: "DELETE" }
      );
      setPost(data.post);
    } catch (e) {
      console.error(e);
      alert("댓글 삭제 중 오류가 발생했습니다.");
    }
  }

  return (
    <article className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/80">
      <header className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] border ${
                  isNotice
                    ? "bg-amber-500/10 text-amber-300 border-amber-500/60"
                    : "bg-violet-500/10 text-violet-300 border-violet-500/30"
                }`}
              >
                {post.category}
              </span>
              <h1
                className={`text-xl leading-tight ${
                  isNotice
                    ? "font-bold text-amber-100"
                    : "font-semibold text-zinc-50"
                }`}
              >
                {post.title}
              </h1>
            </div>
            <div className="text-[12px] text-zinc-400">
              글쓴이: {post.author || "익명"} · 추천 {post.likes || 0}
            </div>
          </div>
          <div className="text-[11px] text-zinc-500 text-right">
            <div>작성: {fmtDate(post.createdAt)}</div>
            <div>수정: {fmtDate(post.updatedAt)}</div>
          </div>
        </div>
      </header>

      <div className="whitespace-pre-wrap mb-6 text-[14px] leading-7 text-zinc-100">
        {post.content}
      </div>

      {(post.images?.length > 0 || post.videos?.length > 0) && (
        <div className="grid gap-4 mb-6">
          {post.images?.length > 0 && (
            <div>
              <div className="text-[12px] font-medium text-zinc-400 mb-1">
                이미지
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {post.images.map((img) => (
                  <img
                    key={img.id}
                    src={img.dataUrl}
                    alt={img.name}
                    className="w-full rounded-xl border border-zinc-700"
                  />
                ))}
              </div>
            </div>
          )}
          {post.videos?.length > 0 && (
            <div>
              <div className="text-[12px] font-medium text-zinc-400 mb-1">
                동영상
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {post.videos.map((v) => (
                  <video
                    key={v.id}
                    src={v.dataUrl}
                    controls
                    className="w-full rounded-xl border border-zinc-700"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-8 text-[13px]">
        <button
          onClick={handleLike}
          className={`px-3 py-1.5 rounded-xl border text-sm ${
            alreadyLiked
              ? "border-zinc-100 bg-zinc-100/10 text-zinc-50"
              : "border-zinc-700 bg-[#101018] text-zinc-100 hover:bg-zinc-900"
          }`}
        >
          {alreadyLiked ? "👎 취소" : "👍 좋아요"} {post.likes}
        </button>

        {isAdmin && !isNotice && (
          <button
            onClick={handlePin}
            className="px-3 py-1.5 rounded-xl border border-zinc-700 bg-[#101018] text-sm text-zinc-100 hover:bg-zinc-900"
          >
            {post.pinned ? "고정 해제" : "고정"}
          </button>
        )}

        <button
          onClick={() => nav("/board")}
          className="px-3 py-1.5 rounded-xl border border-zinc-700 bg-[#101018] text-sm text-zinc-100 hover:bg-zinc-900"
        >
          목록
        </button>
        <button
          onClick={handleDelete}
          className="px-3 py-1.5 rounded-xl border border-red-500/60 bg-red-500/10 text-sm text-red-300 hover:bg-red-500/20"
        >
          삭제
        </button>
      </div>

      <section className="grid gap-3">
        <h2 className="text-[14px] font-semibold text-zinc-100">
          댓글 ({post.comments?.length || 0})
        </h2>
        <CommentForm onAdd={handleAddComment} />
        <CommentList
          comments={post.comments || []}
          onDelete={handleDeleteComment}
        />
      </section>
    </article>
  );
}

/* 목록 페이지 */

function BoardListPage({
  isAdmin,
  onAdminLogin,
  onAdminLogout,
  adminPassword,
  forceEditor = false,
  initialDraft,
}) {
  const [posts, setPosts] = useState([]);
  const [query, setQuery] = useState("");
  const [onlyPinned, setOnlyPinned] = useState(false);
  const [sortKey, setSortKey] = useState("updated");
  const [pageSize, setPageSize] = useState(30);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const nav = useNavigate();

  async function loadPosts() {
    setLoading(true);
    try {
      const data = await api("/api/posts");
      const list = Array.isArray(data) ? data : data.posts || [];
      setPosts(list);
    } catch (e) {
      console.error(e);
      alert("게시글을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  const ordered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = [...posts];
    if (q) {
      arr = arr.filter((p) =>
        `${p.title}\n${p.category}\n${p.author}`.toLowerCase().includes(q)
      );
    }
    if (onlyPinned) arr = arr.filter((p) => p.pinned);

    arr.sort((a, b) => {
      const pinnedDiff = Number(b.pinned) - Number(a.pinned);
      if (pinnedDiff !== 0) return pinnedDiff;
      if (sortKey === "likes") {
        const likeDiff = (b.likes || 0) - (a.likes || 0);
        if (likeDiff !== 0) return likeDiff;
      }
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

    const notices = arr.filter((p) => p.category === "공지");
    const others = arr.filter((p) => p.category !== "공지");
    return [...notices, ...others];
  }, [posts, query, onlyPinned, sortKey]);

  // 🔥 여기: 성공 후 응답 내용 믿지 말고 무조건 다시 불러오기
  async function handleSubmitNew(payload) {
    try {
      const body = { ...payload };
      if (payload.category === "공지") {
        if (!isAdmin) {
          alert("공지 글은 관리자만 작성할 수 있습니다.");
          return;
        }
        body.adminPassword = adminPassword;
      }

      await api("/api/posts", {
        method: "POST",
        body: JSON.stringify(body),
      });

      await loadPosts();
      setShowEditor(false);

      if (forceEditor) {
        nav("/board");
      }
    } catch (e) {
      console.error(e);
      alert("글 등록 중 오류가 발생했습니다.");
    }
  }

  const isEditorVisible = forceEditor || showEditor;

  const handleCancelEditor = () => {
    if (forceEditor) {
      nav("/board");
    } else {
      setShowEditor(false);
    }
  };

  if (isEditorVisible) {
    return (
      <div className="bg-[#06060A] min-h-[calc(100vh-64px)] text-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6 grid gap-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-50">
              Promptree 게시판
            </h1>
          </div>
          <Editor
            isAdmin={isAdmin}
            onCancel={handleCancelEditor}
            onSubmit={handleSubmitNew}
            initialDraft={initialDraft}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#06060A] min-h-[calc(100vh-64px)] text-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* 상단 바 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value="title+content"
              readOnly
              className="px-2 py-1.5 rounded-xl border border-[#2A2A33] bg-[#101018] text-xs text-zinc-300"
            >
              <option value="title+content">제목+내용</option>
            </select>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="검색어를 입력하세요"
              className="px-3 py-1.5 rounded-xl border border-[#2A2A33] bg-[#101018] text-sm text-zinc-100 w-64 placeholder:text-zinc-500"
            />
            <button
              onClick={() => setPage(1)}
              className="px-3 py-1.5 rounded-xl border border-[#2A2A33] bg-[#101018] text-sm text-zinc-200 hover:bg-zinc-900"
            >
              검색
            </button>
            <button
              onClick={loadPosts}
              className="px-3 py-1.5 rounded-xl border border-[#2A2A33] bg-[#101018] text-xs text-zinc-300 hover:bg-zinc-900"
            >
              새로고침
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs flex items-center gap-1 text-zinc-300">
              <input
                type="checkbox"
                checked={onlyPinned}
                onChange={(e) => setOnlyPinned(e.target.checked)}
                className="accent-zinc-200"
              />
              고정만
            </label>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="px-2 py-1.5 rounded-xl border border-[#2A2A33] bg-[#101018] text-xs text-zinc-300"
            >
              <option value="updated">최신순</option>
              <option value="likes">추천순</option>
            </select>
            <button
              onClick={() => setShowEditor(true)}
              className="h-9 px-4 rounded-xl bg-white text-sm font-medium text-black hover:bg-zinc-200"
            >
              글쓰기
            </button>

            {/* 관리자 로그인/해제 */}
            <button
              type="button"
              onClick={isAdmin ? onAdminLogout : onAdminLogin}
              className="px-2 py-1.5 rounded-xl border border-[#2A2A33] bg-[#101018] text-[11px] text-zinc-400 hover:bg-zinc-900"
            >
              {isAdmin ? "관리자 해제" : "관리자 로그인"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-zinc-400">
            불러오는 중...
          </div>
        ) : (
          <>
            <ListTable posts={ordered} page={page} pageSize={pageSize} />

            {/* 페이지네이션 */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-3 text-sm text-zinc-300">
              <div>총 {ordered.length}개</div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl border border-[#2A2A33] bg-[#101018] disabled:opacity-40 text-zinc-200 hover:bg-zinc-900"
                >
                  이전
                </button>
                <span className="text-zinc-300">{page}</span>
                <button
                  disabled={page * pageSize >= ordered.length}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-xl border border-[#2A2A33] bg-[#101018] disabled:opacity-40 text-zinc-200 hover:bg-zinc-900"
                >
                  다음
                </button>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1.5 rounded-xl border border-[#2A2A33] bg-[#101018] text-xs text-zinc-300"
                >
                  {[30, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}/페이지
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* 메인 Board 컴포넌트 (상세/목록/글쓰기 스위치) */

export default function Board() {
  const location = useLocation();
  const isWrite = location.pathname === "/board/write";
  const matchDetail = !isWrite && /\/board\/[^\/?#]+/.test(location.pathname);

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  // 생성기에서 넘어온 state → 초기 draft로 변환
  const state = location.state || {};
  const targetShortMap = {
    gemini: "Gemini",
    veo: "Veo",
    mj: "Midjourney",
    sora: "Sora",
  };

  let initialDraft = null;
  if (isWrite && state.prompt) {
    const short = targetShortMap[state.target] || state.target || "";
    const titlePrefix = short ? `[${short}] ` : "";
    initialDraft = {
      fromGenerator: true,
      category: "프롬프트",
      title: titlePrefix,
      content: state.prompt,
    };
  }

  async function handleAdminLogin() {
    const pw = window.prompt("관리자 비밀번호를 입력하세요.");
    if (!pw) return;
    try {
      const data = await api("/api/admin/verify", {
        method: "POST",
        body: JSON.stringify({ password: pw }),
      });
      if (data.ok) {
        setIsAdmin(true);
        setAdminPassword(pw);
        alert("관리자 모드가 활성화되었습니다.");
      } else {
        alert("비밀번호가 올바르지 않습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("서버 오류로 관리자 확인에 실패했습니다.");
    }
  }

  function handleAdminLogout() {
    setIsAdmin(false);
    setAdminPassword("");
    alert("관리자 모드가 해제되었습니다.");
  }

  if (matchDetail) {
    return (
      <div className="bg-[#06060A] min-h-[calc(100vh-64px)] text-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6 grid gap-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-50">
              Promptree 게시판
            </h1>
            <p className="text-[12px] text-zinc-500">상세보기</p>
          </div>
          <DetailView isAdmin={isAdmin} adminPassword={adminPassword} />
        </div>
      </div>
    );
  }

  return (
    <BoardListPage
      isAdmin={isAdmin}
      adminPassword={adminPassword}
      onAdminLogin={handleAdminLogin}
      onAdminLogout={handleAdminLogout}
      forceEditor={isWrite}
      initialDraft={initialDraft}
    />
  );
}
