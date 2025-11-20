// server/server.js
// Promptree 커뮤니티 백엔드 (Express + SQLite)
// - /api/posts                     목록 조회
// - /api/posts (POST)             새 글 작성
// - /api/posts/:id/like           좋아요 토글
// - /api/posts/:id/comments       댓글 추가
// - /api/posts/:id/comments/:cid  댓글 삭제
// - /api/posts/:id/pin            고정/공지 관련 (관리자 비번 필요)
// - /api/posts/:id (DELETE)       글 삭제
// - /api/admin/verify             관리자 비번 확인

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const crypto = require("crypto");
const { getPosts, savePosts } = require("./db");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// CORS - 개발/운영 둘 다 열어두기 (필요하면 나중에 도메인 제한)
app.use(
  cors({
    origin: "*",
  })
);

app.use(
  express.json({
    limit: "2mb",
  })
);

/* helpers */

function safeUUID() {
  if (crypto.randomUUID) return crypto.randomUUID();
  // fallback
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

// 관리자 비번: 당장은 하드코딩으로 고정
const ADMIN_PASSWORD = "wnrdma44#";
const ADMIN_PASSWORD_HASH = hashLite(ADMIN_PASSWORD);

function isAdminPasswordValid(input) {
  if (!input) return false;
  return hashLite(String(input).trim()) === ADMIN_PASSWORD_HASH;
}

function sortPosts(posts) {
  return [...(posts || [])].sort(
    (a, b) =>
      Number(b.pinned) - Number(a.pinned) ||
      Number(b.updatedAt) - Number(a.updatedAt)
  );
}

/* routes */

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

/**
 * GET /api/posts
 * 전체 게시글 목록 (comments 포함, 정렬까지)
 */
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await getPosts();
    res.json({ posts: sortPosts(posts) });
  } catch (err) {
    console.error("GET /api/posts error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

/**
 * POST /api/posts
 * 새 글 작성
 * body: { category, title, content, author, pwHash, images, videos, adminPassword? }
 */
app.post("/api/posts", async (req, res) => {
  try {
    const {
      category,
      title,
      content,
      author,
      pwHash,
      images,
      videos,
      adminPassword,
    } = req.body || {};

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "title_required" });
    }
    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: "content_required" });
    }

    let cat = category || "일반";
    let pinned = false;

    if (cat === "공지") {
      if (!isAdminPasswordValid(adminPassword)) {
        return res.status(403).json({ error: "forbidden_notice" });
      }
      pinned = true;
    }

    const now = Date.now();
    const newPost = {
      id: safeUUID(),
      category: cat,
      title: String(title).trim(),
      content: String(content).trim(),
      author: (author || "").toString().trim(),
      pwHash: pwHash ? String(pwHash) : "",
      createdAt: now,
      updatedAt: now,
      likes: 0,
      views: 0,
      pinned,
      likedBy: [],
      comments: [],
      images: Array.isArray(images) ? images : [],
      videos: Array.isArray(videos) ? videos : [],
    };

    const posts = await getPosts();
    const next = [newPost, ...posts];
    await savePosts(next);

    res.json({ post: newPost, posts: sortPosts(next) });
  } catch (err) {
    console.error("POST /api/posts error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

/**
 * POST /api/posts/:id/like
 * body: { userId }
 */
app.post("/api/posts/:id/like", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId_required" });

    const posts = await getPosts();
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) return res.status(404).json({ error: "not_found" });

    const post = posts[idx];
    const likedBy = Array.isArray(post.likedBy) ? [...post.likedBy] : [];
    const already = likedBy.includes(userId);
    let likes = Number(post.likes) || 0;

    if (already) {
      // 좋아요 취소
      const nextLikedBy = likedBy.filter((x) => x !== userId);
      likes = Math.max(0, likes - 1);
      posts[idx] = {
        ...post,
        likedBy: nextLikedBy,
        likes,
        updatedAt: Date.now(),
      };
    } else {
      likedBy.push(userId);
      likes += 1;
      posts[idx] = {
        ...post,
        likedBy,
        likes,
        updatedAt: Date.now(),
      };
    }

    await savePosts(posts);
    res.json({ post: posts[idx], posts: sortPosts(posts) });
  } catch (err) {
    console.error("POST /api/posts/:id/like error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

/**
 * POST /api/posts/:id/comments
 * body: { author, pwHash, content }
 */
app.post("/api/posts/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { author, pwHash, content } = req.body || {};

    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: "content_required" });
    }

    const posts = await getPosts();
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) return res.status(404).json({ error: "not_found" });

    const post = posts[idx];
    const comments = Array.isArray(post.comments) ? [...post.comments] : [];
    const now = Date.now();
    const newComment = {
      id: safeUUID(),
      author: (author || "").toString().trim(),
      pwHash: pwHash ? String(pwHash) : "",
      content: String(content).trim(),
      createdAt: now,
    };

    comments.push(newComment);

    posts[idx] = {
      ...post,
      comments,
      updatedAt: now,
    };

    await savePosts(posts);
    res.json({
      post: posts[idx],
      comments,
      posts: sortPosts(posts),
    });
  } catch (err) {
    console.error("POST /api/posts/:id/comments error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

/**
 * DELETE /api/posts/:id/comments/:cid
 * (지금은 비밀번호 검증 없이 누구나 삭제 가능 — 기존 로컬 버전과 동일)
 */
app.delete("/api/posts/:id/comments/:cid", async (req, res) => {
  try {
    const { id, cid } = req.params;

    const posts = await getPosts();
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) return res.status(404).json({ error: "not_found" });

    const post = posts[idx];
    const comments = Array.isArray(post.comments) ? [...post.comments] : [];
    const nextComments = comments.filter((c) => c.id !== cid);

    posts[idx] = {
      ...post,
      comments: nextComments,
      updatedAt: Date.now(),
    };

    await savePosts(posts);
    res.json({
      post: posts[idx],
      comments: nextComments,
      posts: sortPosts(posts),
    });
  } catch (err) {
    console.error("DELETE /api/posts/:id/comments/:cid error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

/**
 * POST /api/posts/:id/pin
 * body: { adminPassword }
 * - 공지는 항상 pinned 유지
 * - 일반 글은 관리자만 고정/해제 가능
 */
app.post("/api/posts/:id/pin", async (req, res) => {
  try {
    const { id } = req.params;
    const { adminPassword } = req.body || {};

    if (!isAdminPasswordValid(adminPassword)) {
      return res.status(403).json({ error: "forbidden" });
    }

    const posts = await getPosts();
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) return res.status(404).json({ error: "not_found" });

    const post = posts[idx];

    let pinned = !!post.pinned;
    if (post.category === "공지") {
      // 공지는 항상 고정
      pinned = true;
    } else {
      pinned = !pinned;
    }

    posts[idx] = {
      ...post,
      pinned,
      updatedAt: Date.now(),
    };

    await savePosts(posts);
    res.json({ post: posts[idx], posts: sortPosts(posts) });
  } catch (err) {
    console.error("POST /api/posts/:id/pin error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

/**
 * DELETE /api/posts/:id
 * (지금은 누구나 삭제 가능 — 기존 프론트 동작과 동일)
 */
app.delete("/api/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const posts = await getPosts();
    const before = posts.length;
    const next = posts.filter((p) => p.id !== id);

    if (next.length === before) {
      return res.status(404).json({ error: "not_found" });
    }

    await savePosts(next);
    res.json({ ok: true, posts: sortPosts(next) });
  } catch (err) {
    console.error("DELETE /api/posts/:id error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

/**
 * POST /api/admin/verify
 * body: { password }
 * 관리자 로그인 확인용
 * - 항상 200으로 응답해서 프론트에서 에러/성공을 깔끔하게 분기
 */
app.post("/api/admin/verify", (req, res) => {
  const { password } = req.body || {};

  // 서버에 비번이 아예 안 잡혀있을 때
  if (!ADMIN_PASSWORD) {
    console.error("ADMIN_PASSWORD 가 .env 에 설정되어 있지 않음");
    return res.status(200).json({
      ok: false,
      message: "서버 설정이 잘못되었습니다. ADMIN_PASSWORD 를 설정하세요.",
    });
  }

  const ok = password && isAdminPasswordValid(password);

  return res.status(200).json({ ok });
});

app.listen(PORT, () => {
  console.log(`🚀 Promptree backend running on http://localhost:${PORT}`);
});
