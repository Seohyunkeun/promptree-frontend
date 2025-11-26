// server.js
// Promptree 게시판 전용 백엔드 (SQLite)
// -------------------------------------
// 필요한 패키지: express, cors, better-sqlite3
// npm install express cors better-sqlite3

const express = require("express");
const cors = require("cors");
const path = require("path");
const BetterSqlite3 = require("better-sqlite3");

// ===== 설정 =====
const PORT = process.env.PORT || 4000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "promptree-admin"; // 형이 나중에 바꿔

// ===== DB 세팅 =====
const dbPath = path.join(__dirname, "board.db");
const db = new BetterSqlite3(dbPath);

// posts 테이블 생성
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    category TEXT,
    title TEXT,
    author TEXT,
    pwHash TEXT,
    content TEXT,
    images TEXT,
    videos TEXT,
    likes INTEGER DEFAULT 0,
    likedBy TEXT,
    pinned INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    createdAt INTEGER,
    updatedAt INTEGER,
    comments TEXT
  )
`
).run();

// ===== 유틸 =====
function now() {
  return Date.now();
}

function newId() {
  return (
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)) + Date.now()
  );
}

function rowToPost(row) {
  if (!row) return null;
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    author: row.author,
    pwHash: row.pwHash || "",
    content: row.content || "",
    images: row.images ? JSON.parse(row.images) : [],
    videos: row.videos ? JSON.parse(row.videos) : [],
    likes: row.likes || 0,
    likedBy: row.likedBy ? JSON.parse(row.likedBy) : [],
    pinned: !!row.pinned,
    views: row.views || 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    comments: row.comments ? JSON.parse(row.comments) : [],
  };
}

// ===== 앱 기본 세팅 =====
const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" })); // 이미지 dataURL 때문에 사이즈 넉넉하게

// ===== 관리자 비번 확인 =====
app.post("/api/admin/verify", (req, res) => {
  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ ok: false, error: "비밀번호가 없습니다." });
  }
  if (password === ADMIN_PASSWORD) {
    return res.json({ ok: true });
  }
  return res
    .status(401)
    .json({ ok: false, error: "비밀번호가 올바르지 않습니다." });
});

// ===== 게시글 목록 =====
app.get("/api/posts", (req, res) => {
  const rows = db
    .prepare(
      `
      SELECT *
      FROM posts
      ORDER BY pinned DESC, updatedAt DESC
    `
    )
    .all();

  const posts = rows.map(rowToPost);
  res.json({ posts });
});

// ===== 게시글 작성 =====
app.post("/api/posts", (req, res) => {
  try {
    const {
      category = "일반",
      title,
      author = "",
      pwHash = "",
      content = "",
      images = [],
      videos = [],
      adminPassword,
    } = req.body || {};

    if (!title || !content) {
      return res
        .status(400)
        .json({ error: "제목과 내용을 모두 입력해 주세요." });
    }

    // 공지는 관리자만
    if (category === "공지") {
      if (adminPassword !== ADMIN_PASSWORD) {
        return res
          .status(401)
          .json({ error: "공지 글은 관리자만 작성할 수 있습니다." });
      }
    }

    const id = newId();
    const ts = now();

    db.prepare(
      `
      INSERT INTO posts (
        id, category, title, author, pwHash, content,
        images, videos, likes, likedBy, pinned, views,
        createdAt, updatedAt, comments
      ) VALUES (
        @id, @category, @title, @author, @pwHash, @content,
        @images, @videos, 0, @likedBy, @pinned, 0,
        @createdAt, @updatedAt, @comments
      )
    `
    ).run({
      id,
      category,
      title,
      author,
      pwHash,
      content,
      images: JSON.stringify(images || []),
      videos: JSON.stringify(videos || []),
      likedBy: JSON.stringify([]),
      pinned: category === "공지" ? 1 : 0,
      createdAt: ts,
      updatedAt: ts,
      comments: JSON.stringify([]),
    });

    const rows = db
      .prepare("SELECT * FROM posts ORDER BY pinned DESC, updatedAt DESC")
      .all();
    const posts = rows.map(rowToPost);

    res.json({ posts });
  } catch (err) {
    console.error("POST /api/posts error:", err);
    res.status(500).json({ error: "글 등록 중 서버 오류가 발생했습니다." });
  }
});

// ===== 게시글 삭제 (비밀번호/관리자 검증) =====
app.delete("/api/posts/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { pwHash = "", adminPassword } = req.body || {};

    const row = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
    if (!row) {
      return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
    }

    // 1) 관리자 비밀번호로 삭제 (관리자 모드)
    if (adminPassword && adminPassword === ADMIN_PASSWORD) {
      db.prepare("DELETE FROM posts WHERE id = ?").run(id);
    } else {
      // 2) 일반 사용자 비밀번호 검증
      const savedPw = row.pwHash || "";

      // 글에 비밀번호가 설정돼 있으면 반드시 일치해야 삭제
      if (savedPw.length > 0) {
        if (!pwHash || pwHash !== savedPw) {
          return res
            .status(403)
            .json({ error: "비밀번호가 올바르지 않습니다." });
        }
      }
      // 비밀번호가 없던 글이면 그냥 삭제 허용
      db.prepare("DELETE FROM posts WHERE id = ?").run(id);
    }

    const rows = db
      .prepare("SELECT * FROM posts ORDER BY pinned DESC, updatedAt DESC")
      .all();
    const posts = rows.map(rowToPost);
    res.json({ posts });
  } catch (err) {
    console.error("DELETE /api/posts/:id error:", err);
    res.status(500).json({ error: "게시글 삭제 중 서버 오류가 발생했습니다." });
  }
});

// ===== 좋아요 토글 =====
app.post("/api/posts/:id/like", (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body || {};
    if (!userId) {
      return res.status(400).json({ error: "userId가 필요합니다." });
    }

    const row = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
    if (!row) {
      return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
    }

    const likedBy = row.likedBy ? JSON.parse(row.likedBy) : [];
    const idx = likedBy.indexOf(userId);
    let likes = row.likes || 0;

    if (idx === -1) {
      likedBy.push(userId);
      likes += 1;
    } else {
      likedBy.splice(idx, 1);
      likes = Math.max(0, likes - 1);
    }

    db.prepare(
      `
      UPDATE posts
      SET likes = @likes,
          likedBy = @likedBy,
          updatedAt = @updatedAt
      WHERE id = @id
    `
    ).run({
      id,
      likes,
      likedBy: JSON.stringify(likedBy),
      updatedAt: now(),
    });

    const updated = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);

    res.json({ post: rowToPost(updated) });
  } catch (err) {
    console.error("POST /api/posts/:id/like error:", err);
    res.status(500).json({ error: "좋아요 처리 중 서버 오류" });
  }
});

// ===== 고정 토글 =====
app.post("/api/posts/:id/pin", (req, res) => {
  try {
    const { id } = req.params;
    const { adminPassword } = req.body || {};

    if (adminPassword !== ADMIN_PASSWORD) {
      return res
        .status(401)
        .json({ error: "관리자 비밀번호가 올바르지 않습니다." });
    }

    const row = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
    if (!row) {
      return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
    }

    const pinned = row.pinned ? 0 : 1;

    db.prepare(
      `
      UPDATE posts
      SET pinned = @pinned, updatedAt = @updatedAt
      WHERE id = @id
    `
    ).run({
      id,
      pinned,
      updatedAt: now(),
    });

    const updated = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
    res.json({ post: rowToPost(updated) });
  } catch (err) {
    console.error("POST /api/posts/:id/pin error:", err);
    res.status(500).json({ error: "고정 처리 중 서버 오류" });
  }
});

// ===== 댓글 추가 =====
app.post("/api/posts/:id/comments", (req, res) => {
  try {
    const { id } = req.params;
    const { author = "", pwHash = "", content } = req.body || {};

    if (!content) {
      return res.status(400).json({ error: "댓글 내용을 입력해 주세요." });
    }

    const row = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
    if (!row) {
      return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
    }

    const comments = row.comments ? JSON.parse(row.comments) : [];
    const comment = {
      id: newId(),
      author,
      pwHash,
      content,
      createdAt: now(),
    };
    comments.push(comment);

    db.prepare(
      `
      UPDATE posts
      SET comments = @comments,
          updatedAt = @updatedAt
      WHERE id = @id
    `
    ).run({
      id,
      comments: JSON.stringify(comments),
      updatedAt: now(),
    });

    const updated = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
    res.json({ post: rowToPost(updated) });
  } catch (err) {
    console.error("POST /api/posts/:id/comments error:", err);
    res.status(500).json({ error: "댓글 등록 중 서버 오류" });
  }
});

// ===== 댓글 삭제 =====
app.delete("/api/posts/:id/comments/:cid", (req, res) => {
  try {
    const { id, cid } = req.params;

    const row = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
    if (!row) {
      return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
    }

    const comments = row.comments ? JSON.parse(row.comments) : [];
    const next = comments.filter((c) => String(c.id) !== String(cid));

    db.prepare(
      `
      UPDATE posts
      SET comments = @comments,
          updatedAt = @updatedAt
      WHERE id = @id
    `
    ).run({
      id,
      comments: JSON.stringify(next),
      updatedAt: now(),
    });

    const updated = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
    res.json({ post: rowToPost(updated) });
  } catch (err) {
    console.error("DELETE /api/posts/:id/comments/:cid error:", err);
    res.status(500).json({ error: "댓글 삭제 중 서버 오류" });
  }
});

// ===== 조회수 증가 (한 번 호출당 +1) =====
app.post("/api/posts/:id/view", (req, res) => {
  try {
    const { id } = req.params;

    const row = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
    if (!row) {
      return res
        .status(404)
        .json({ error: "게시글을 찾을 수 없습니다." });
    }

    const views = (row.views || 0) + 1;

    db.prepare(
      `
      UPDATE posts
      SET views = @views,
          updatedAt = @updatedAt
      WHERE id = @id
    `
    ).run({
      id,
      views,
      updatedAt: now(),
    });

    const updated = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
    res.json({ post: rowToPost(updated) });
  } catch (err) {
    console.error("POST /api/posts/:id/view error:", err);
    res.status(500).json({ error: "조회수 증가 중 서버 오류" });
  }
});

// ===== 서버 시작 =====
app.listen(PORT, () => {
  console.log(`Promptree board API running on http://localhost:${PORT}`);
});
