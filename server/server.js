// server/server.js
// Promptree 게시판 전용 Express + SQLite 서버

const express = require("express");
const cors = require("cors");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { nanoid } = require("nanoid");

const app = express();
const PORT = process.env.PORT || 4000;

// ==== CORS / JSON ====
app.use(
  cors({
    origin: true,
    credentials: false,
  })
);
app.use(express.json({ limit: "5mb" }));

// ==== DB 세팅 ====
const dbPath = path.join(__dirname, "board.db");
const db = new sqlite3.Database(dbPath);

// 테이블 생성
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      author TEXT,
      pwHash TEXT,
      content TEXT NOT NULL,
      images TEXT,           -- JSON 배열
      videos TEXT,           -- JSON 배열
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      likedBy TEXT,          -- JSON 배열(userId)
      pinned INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      postId TEXT NOT NULL,
      author TEXT,
      pwHash TEXT,
      content TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE
    )
  `);
});

// 공통: posts + comments 합쳐서 리턴
function getPostWithComments(id, cb) {
  db.get(`SELECT * FROM posts WHERE id = ?`, [id], (err, post) => {
    if (err) return cb(err);
    if (!post) return cb(null, null);

    db.all(
      `SELECT * FROM comments WHERE postId = ? ORDER BY createdAt ASC`,
      [id],
      (err2, comments) => {
        if (err2) return cb(err2);

        const parseJson = (str, fallback) => {
          if (!str) return fallback;
          try {
            return JSON.parse(str);
          } catch {
            return fallback;
          }
        };

        const full = {
          ...post,
          images: parseJson(post.images, []),
          videos: parseJson(post.videos, []),
          likedBy: parseJson(post.likedBy, []),
          pinned: !!post.pinned,
          comments: comments || [],
        };
        cb(null, full);
      }
    );
  });
}

// ==== 관리자 비밀번호 ====
// Render 대시보드에는 ADMIN_PASSWORD 로 넣어두고,
// 예전 BOARD_ADMIN_PW 도 있으면 함께 지원.
const RAW_ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || process.env.BOARD_ADMIN_PW || "promptree-admin";
const ADMIN_PASSWORD = RAW_ADMIN_PASSWORD.trim();

// 관리자 비밀번호 검증
app.post("/api/admin/verify", (req, res) => {
  try {
    const { password } = req.body || {};
    const input = (password || "").trim();

    console.log("[ADMIN_VERIFY] ENV exists:", !!ADMIN_PASSWORD);
    console.log("[ADMIN_VERIFY] input length:", input.length);

    if (!ADMIN_PASSWORD) {
      return res.status(500).json({
        ok: false,
        message: "ADMIN_PASSWORD is not configured on the server.",
      });
    }

    if (!input) {
      return res.status(401).json({
        ok: false,
        message: "비밀번호를 입력해주세요.",
      });
    }

    if (input === ADMIN_PASSWORD) {
      return res.json({ ok: true });
    }

    return res.status(401).json({
      ok: false,
      message: "비밀번호가 올바르지 않습니다.",
    });
  } catch (err) {
    console.error("[ADMIN_VERIFY] error:", err);
    return res.status(500).json({
      ok: false,
      message: "서버 내부 오류로 관리자 확인에 실패했습니다.",
    });
  }
});

// ==== 게시글 목록 ====
app.get("/api/posts", (req, res) => {
  db.all(`SELECT * FROM posts ORDER BY createdAt DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB_ERROR" });

    const parseJson = (str, fallback) => {
      if (!str) return fallback;
      try {
        return JSON.parse(str);
      } catch {
        return fallback;
      }
    };

    const posts = rows.map((p) => ({
      ...p,
      images: parseJson(p.images, []),
      videos: parseJson(p.videos, []),
      likedBy: parseJson(p.likedBy, []),
      pinned: !!p.pinned,
    }));

    res.json(posts);
  });
});

// ==== 게시글 생성 ====
app.post("/api/posts", (req, res) => {
  const {
    category,
    title,
    author,
    pwHash,
    content,
    images = [],
    videos = [],
    adminPassword,
  } = req.body || {};

  if (!title || !content) {
    return res.status(400).json({ error: "TITLE_AND_CONTENT_REQUIRED" });
  }

  // 공지면 관리자만
  if (category === "공지" && (adminPassword || "").trim() !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "ADMIN_REQUIRED" });
  }

  const id = nanoid();
  const now = Date.now();

  db.run(
    `
    INSERT INTO posts (
      id, category, title, author, pwHash, content,
      images, videos, createdAt, updatedAt, views, likes, likedBy, pinned
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `,
    [
      id,
      category || "일반",
      title,
      author || "익명",
      pwHash || "",
      content,
      JSON.stringify(images || []),
      JSON.stringify(videos || []),
      now,
      now,
      0,
      0,
      JSON.stringify([]),
      0,
    ],
    (err) => {
      if (err) return res.status(500).json({ error: "DB_INSERT_ERROR" });

      getPostWithComments(id, (err2, post) => {
        if (err2) return res.status(500).json({ error: "DB_ERROR" });
        res.status(201).json({ post });
      });
    }
  );
});

// ==== 단일 게시글 조회 ====
app.get("/api/posts/:id", (req, res) => {
  const { id } = req.params;
  getPostWithComments(id, (err, post) => {
    if (err) return res.status(500).json({ error: "DB_ERROR" });
    if (!post) return res.status(404).json({ error: "NOT_FOUND" });
    res.json({ post });
  });
});

// ==== 조회수 +1 ====
app.post("/api/posts/:id/view", (req, res) => {
  const { id } = req.params;

  db.run(
    `UPDATE posts SET views = COALESCE(views,0) + 1, updatedAt = ? WHERE id = ?`,
    [Date.now(), id],
    function (err) {
      if (err) return res.status(500).json({ error: "DB_ERROR" });

      getPostWithComments(id, (err2, post) => {
        if (err2) return res.status(500).json({ error: "DB_ERROR" });
        if (!post) return res.status(404).json({ error: "NOT_FOUND" });
        res.json({ post });
      });
    }
  );
});

// ==== 좋아요 토글 ====
app.post("/api/posts/:id/like", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body || {};
  if (!userId) {
    return res.status(400).json({ error: "USER_ID_REQUIRED" });
  }

  db.get(`SELECT likes, likedBy FROM posts WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: "DB_ERROR" });
    if (!row) return res.status(404).json({ error: "NOT_FOUND" });

    let likedBy = [];
    if (row.likedBy) {
      try {
        likedBy = JSON.parse(row.likedBy);
      } catch {
        likedBy = [];
      }
    }

    let likes = row.likes || 0;
    if (likedBy.includes(userId)) {
      likedBy = likedBy.filter((v) => v !== userId);
      likes = Math.max(0, likes - 1);
    } else {
      likedBy.push(userId);
      likes += 1;
    }

    db.run(
      `UPDATE posts SET likes = ?, likedBy = ?, updatedAt = ? WHERE id = ?`,
      [likes, JSON.stringify(likedBy), Date.now(), id],
      function (err2) {
        if (err2) return res.status(500).json({ error: "DB_ERROR" });
        getPostWithComments(id, (err3, post) => {
          if (err3) return res.status(500).json({ error: "DB_ERROR" });
          res.json({ post });
        });
      }
    );
  });
});

// ==== 고정/고정 해제 ====
app.post("/api/posts/:id/pin", (req, res) => {
  const { id } = req.params;
  const { adminPassword } = req.body || {};

  if ((adminPassword || "").trim() !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "ADMIN_REQUIRED" });
  }

  db.get(`SELECT pinned FROM posts WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: "DB_ERROR" });
    if (!row) return res.status(404).json({ error: "NOT_FOUND" });

    const nextPinned = row.pinned ? 0 : 1;

    db.run(
      `UPDATE posts SET pinned = ?, updatedAt = ? WHERE id = ?`,
      [nextPinned, Date.now(), id],
      function (err2) {
        if (err2) return res.status(500).json({ error: "DB_ERROR" });
        getPostWithComments(id, (err3, post) => {
          if (err3) return res.status(500).json({ error: "DB_ERROR" });
          res.json({ post });
        });
      }
    );
  });
});

// ==== 게시글 삭제 ====
app.delete("/api/posts/:id", (req, res) => {
  const { id } = req.params;
  const { pwHash, adminPassword } = req.body || {};

  db.get(`SELECT pwHash FROM posts WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: "DB_ERROR" });
    if (!row) return res.status(404).json({ error: "NOT_FOUND" });

    const isAdmin =
      (adminPassword || "").trim() &&
      (adminPassword || "").trim() === ADMIN_PASSWORD;
    const canDelete =
      isAdmin || (row.pwHash && pwHash && row.pwHash === pwHash);

    if (!canDelete) {
      return res.status(403).json({ error: "INVALID_PASSWORD" });
    }

    db.run(`DELETE FROM posts WHERE id = ?`, [id], function (err2) {
      if (err2) return res.status(500).json({ error: "DB_ERROR" });
      db.run(`DELETE FROM comments WHERE postId = ?`, [id], () => {
        return res.json({ ok: true });
      });
    });
  });
});

// ==== 댓글 추가 ====
app.post("/api/posts/:id/comments", (req, res) => {
  const { id } = req.params;
  const { author, pwHash, content } = req.body || {};

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "CONTENT_REQUIRED" });
  }

  const cid = nanoid();
  const now = Date.now();

  db.run(
    `
    INSERT INTO comments (id, postId, author, pwHash, content, createdAt)
    VALUES (?,?,?,?,?,?)
  `,
    [cid, id, author || "익명", pwHash || "", content.trim(), now],
    (err) => {
      if (err) return res.status(500).json({ error: "DB_ERROR" });

      // updatedAt 갱신
      db.run(
        `UPDATE posts SET updatedAt = ? WHERE id = ?`,
        [now, id],
        () => {
          getPostWithComments(id, (err2, post) => {
            if (err2) return res.status(500).json({ error: "DB_ERROR" });
            res.status(201).json({ post });
          });
        }
      );
    }
  );
});

// ==== 댓글 삭제 (비번체크 없이 간단 버전) ====
app.delete("/api/posts/:id/comments/:cid", (req, res) => {
  const { id, cid } = req.params;

  db.run(
    `DELETE FROM comments WHERE id = ? AND postId = ?`,
    [cid, id],
    function (err) {
      if (err) return res.status(500).json({ error: "DB_ERROR" });

      getPostWithComments(id, (err2, post) => {
        if (err2) return res.status(500).json({ error: "DB_ERROR" });
        res.json({ post });
      });
    }
  );
});

// ==== 서버 시작 ====
app.listen(PORT, () => {
  console.log(`Promptree board server running on http://localhost:${PORT}`);
});
