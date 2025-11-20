// client/src/pages/Board.jsx — robust to "/board/*" routing (id fallback from pathname)
// 글쓰기 화면 가독성 + 전체 다크 UI 통일 (초록 제거, 화이트 톤 정리)
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";

/* Utils */
function safeUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
function hashLite(str) {
  let h = 5381;
  for (const ch of String(str)) h = (h * 33) ^ ch.charCodeAt(0);
  return (h >>> 0).toString(16).padStart(8, "0");
}
const USER_KEY = "pt_board_user_id";
const STORAGE_KEY = "pt_board_posts_v2";
const currentUserId = (() => {
  try {
    let id = localStorage.getItem(USER_KEY);
    if (!id) {
      id = safeUUID();
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
const byPinnedThenTime = (a, b) =>
  (b.pinned - a.pinned) || (b.updatedAt - a.updatedAt);

/* Model & Storage */
function normalizeComment(c) {
  return {
    id: String(c?.id ?? safeUUID()),
    author: String(c?.author ?? ""),
    pwHash: String(c?.pwHash ?? ""),
    content: String(c?.content ?? ""),
    createdAt: Number(c?.createdAt ?? Date.now()),
  };
}
function normalizePost(p) {
  return {
    id: String(p?.id ?? safeUUID()),
    category: ["일반", "프롬프트", "기타"].includes(p?.category)
      ? p.category
      : "일반",
    title: String(p?.title ?? ""),
    content: String(p?.content ?? ""),
    author: String(p?.author ?? ""),
    pwHash: String(p?.pwHash ?? ""),
    createdAt: Number(p?.createdAt ?? Date.now()),
    updatedAt: Number(p?.updatedAt ?? Date.now()),
    likes: Number.isFinite(p?.likes) ? p.likes : 0,
    views: Number.isFinite(p?.views) ? p.views : 0,
    pinned: Boolean(p?.pinned),
    likedBy: Array.isArray(p?.likedBy) ? p.likedBy : [],
    comments: Array.isArray(p?.comments)
      ? p.comments.map(normalizeComment)
      : [],
    images: Array.isArray(p?.images) ? p.images : [],
    videos: Array.isArray(p?.videos) ? p.videos : [],
  };
}
function loadPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map(normalizePost) : [];
  } catch {
    return [];
  }
}
function savePosts(arr) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {}
}

/* Editor (가독성 + 다크톤) */
function Editor({ mode = "new", draft = {}, onCancel, onSubmit }) {
  const [category, setCategory] = useState(draft.category || "일반");
  const [title, setTitle] = useState(draft.title || "");
  const [author, setAuthor] = useState(draft.author || "");
  const [pw, setPw] = useState("");
  const [content, setContent] = useState(draft.content || "");
  const [images, setImages] = useState(draft.images || []);
  const [videos, setVideos] = useState(draft.videos || []);

  const fileImgRef = useRef(null);
  const fileVidRef = useRef(null);

  function handleSubmit() {
    if (!title.trim()) return alert("제목을 입력해 주세요");
    if (!content.trim()) return alert("내용을 입력해 주세요");
    const payload = {
      category,
      title: title.trim(),
      content: content.trim(),
      author: author.trim(),
      pwHash: pw ? hashLite(pw.trim()) : "",
      images,
      videos,
    };
    onSubmit(payload);
  }

  function readFiles(fileList, accept = "image") {
    const arr = Array.from(fileList || []);
    arr.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        const item = {
          id: safeUUID(),
          name: f.name,
          dataUrl: String(reader.result),
        };
        if (accept === "image") setImages((prev) => [...prev, item]);
        else setVideos((prev) => [...prev, item]);
      };
      reader.readAsDataURL(f);
    });
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
        <div className="grid gap-4">
          {/* 상단: 말머리 + 제목 */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-zinc-700 bg-[#111117] text-sm text-zinc-100"
            >
              {["일반", "프롬프트", "기타"].map((v) => (
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
              className="px-3 py-2 rounded-xl border border-zinc-700 bg-[#111117] text-sm text-zinc-100 placeholder:text-zinc-500"
              type="password"
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

/* Detail (다크톤 카드) */
function DetailView({
  posts,
  setPosts,
  onLikeToggle,
  onDeletePost,
  onPin,
  onAddComment,
  onDeleteComment,
}) {
  const { id: paramId } = useParams();
  const location = useLocation();
  const nav = useNavigate();

  const fallbackId = React.useMemo(() => {
    const p = location?.pathname || "";
    const m = p.match(/\/board\/([^\/?#]+)/);
    return m ? decodeURIComponent(m[1]) : undefined;
  }, [location?.pathname]);

  const id = paramId || fallbackId;

  const post = posts.find((p) => p.id === id);
  useEffect(() => {
    if (!post) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, views: (p.views || 0) + 1 } : p
      )
    );
    // eslint-disable-next-line
  }, [id]);

  if (!post) {
    nav("/board", { replace: true });
    return null;
  }
  const alreadyLiked = post.likedBy.includes(currentUserId);
  function handleDelete() {
    if (onDeletePost(post.id)) nav("/board", { replace: true });
  }

  return (
    <article className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/80">
      <header className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 text-[11px] border border-violet-500/30">
                {post.category}
              </span>
              <h1 className="text-xl font-semibold leading-tight text-zinc-50">
                {post.title}
              </h1>
            </div>
            <div className="text-[12px] text-zinc-400">
              글쓴이: {post.author || "익명"} · 조회 {post.views || 0} · 추천{" "}
              {post.likes || 0}
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

      {(post.images.length > 0 || post.videos.length > 0) && (
        <div className="grid gap-4 mb-6">
          {post.images.length > 0 && (
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
          {post.videos.length > 0 && (
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
          onClick={() => onLikeToggle(post.id)}
          className={`px-3 py-1.5 rounded-xl border text-sm ${
            alreadyLiked
              ? "border-zinc-100 bg-zinc-100/10 text-zinc-50"
              : "border-zinc-700 bg-[#101018] text-zinc-100 hover:bg-zinc-900"
          }`}
        >
          {alreadyLiked ? "👎 취소" : "👍 좋아요"} {post.likes}
        </button>
        <button
          onClick={() => onPin(post.id)}
          className="px-3 py-1.5 rounded-xl border border-zinc-700 bg-[#101018] text-sm text-zinc-100 hover:bg-zinc-900"
        >
          {post.pinned ? "고정 해제" : "고정"}
        </button>
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
        <CommentForm onAdd={(payload) => onAddComment(post.id, payload)} />
        <CommentList
          comments={post.comments}
          onDelete={(cid) => onDeleteComment(post.id, cid)}
        />
      </section>
    </article>
  );
}

/* 댓글 폼/리스트도 다크톤 */
function CommentForm({ onAdd }) {
  const [author, setAuthor] = useState("");
  const [pw, setPw] = useState("");
  const [text, setText] = useState("");
  function handleSubmit() {
    if (!text.trim()) return;
    onAdd({
      author: author.trim(),
      pwHash: pw ? hashLite(pw.trim()) : "",
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
      <p className="text-[13px] text-zinc-500">
        아직 댓글이 없습니다.
      </p>
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

/* 목록 테이블 (다크톤 / hover 효과) */
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
            const badgeClass =
              p.category === "프롬프트"
                ? "bg-violet-500/10 text-violet-300 border-violet-500/40"
                : p.category === "기타"
                ? "bg-sky-500/10 text-sky-300 border-sky-500/40"
                : "bg-zinc-700/20 text-zinc-200 border-zinc-500/40";
            return (
              <tr
                key={p.id}
                className="border-b border-zinc-800 last:border-0 hover:bg-zinc-900/60 transition-colors"
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
                    className="hover:underline text-zinc-50"
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

/* Main */
export default function Board() {
  const [posts, setPosts] = useState(() => loadPosts());
  const [showEditor, setShowEditor] = useState(false);
  const [query, setQuery] = useState("");
  const [onlyPinned, setOnlyPinned] = useState(false);
  const [sortKey, setSortKey] = useState("updated");
  const [pageSize, setPageSize] = useState(30);
  const [page, setPage] = useState(1);

  useEffect(() => {
    savePosts(posts);
  }, [posts]);
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setPosts(loadPosts());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const ordered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = [...posts];
    if (q)
      arr = arr.filter((p) =>
        `${p.title}\n${p.category}\n${p.author}`
          .toLowerCase()
          .includes(q)
      );
    if (onlyPinned) arr = arr.filter((p) => p.pinned);
    if (sortKey === "updated") {
      arr.sort(byPinnedThenTime);
    } else if (sortKey === "likes") {
      arr.sort(
        (a, b) =>
          b.pinned - a.pinned ||
          (b.likes || 0) - (a.likes || 0) ||
          (b.updatedAt - a.updatedAt)
      );
    }
    return arr;
  }, [posts, query, onlyPinned, sortKey]);

  function submitNew(payload) {
    const post = normalizePost({
      ...payload,
      id: safeUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      likedBy: [],
    });
    setPosts((prev) => [post, ...prev]);
    setShowEditor(false);
  }
  function tryDelete(id) {
    const ok = confirm("정말 삭제하시겠습니까?");
    if (!ok) return false;
    setPosts((prev) => prev.filter((p) => p.id !== id));
    return true;
  }
  function toggleLike(id) {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const liked = p.likedBy.includes(currentUserId);
        const likedBy = liked
          ? p.likedBy.filter((x) => x !== currentUserId)
          : [...p.likedBy, currentUserId];
        const likes = liked ? Math.max(0, (p.likes || 0) - 1) : (p.likes || 0) + 1;
        return { ...p, likedBy, likes, updatedAt: Date.now() };
      })
    );
  }
  function togglePin(id) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, pinned: !p.pinned, updatedAt: Date.now() } : p
      )
    );
  }
  function addComment(postId, payload) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [...(p.comments || []), normalizeComment(payload)],
              updatedAt: Date.now(),
            }
          : p
      )
    );
  }
  function deleteComment(postId, commentId) {
    setPosts((prev) =>
      prev.map((x) => {
        if (x.id !== postId) return x;
        return {
          ...x,
          comments: x.comments.filter((cc) => cc.id !== commentId),
          updatedAt: Date.now(),
        };
      })
    );
  }

  const location = useLocation();
  const matchDetail = /\/board\/[^\/?#]+/.test(location.pathname);
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
          <DetailView
            posts={ordered}
            setPosts={setPosts}
            onLikeToggle={toggleLike}
            onDeletePost={tryDelete}
            onPin={togglePin}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
          />
        </div>
      </div>
    );
  }

  if (showEditor) {
    return (
      <div className="bg-[#06060A] min-h-[calc(100vh-64px)] text-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6 grid gap-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-50">
              Promptree 게시판
            </h1>
          </div>
          <Editor mode="new" onCancel={() => setShowEditor(false)} onSubmit={submitNew} />
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
          </div>
        </div>

        {/* 목록 */}
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
      </div>
    </div>
  );
}
