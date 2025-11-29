// server/server.js
// Promptree 게시판 전용 Express + SQLite 서버

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs"); // ✅ 디렉터리 생성용
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
// - 로컬: server/board.db 사용
// - Render: BOARD_DB_PATH=/data/board.db 로 설정해서, 디스크에 저장
const DB_PATH = process.env.BOARD_DB_PATH || path.join(__dirname, "board.db");

// /data 같은 커스텀 경로일 때, 상위 디렉터리가 없으면 만들어 줌
const dbDir = path.dirname(DB_PATH);
try {
  fs.mkdirSync(dbDir, { recursive: true });
} catch (e) {
  console.log("DB dir create skipped:", dbDir, e?.message || "");
}

console.log("📌 Using SQLite DB at:", DB_PATH);
const db = new sqlite3.Database(DB_PATH);

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

// ==== 관리자 비밀번호 (간단 하드코딩) ====
// Render 환경변수: BOARD_ADMIN_PW=wnrdma44#
// 없으면 디폴트 "promptree-admin"
const ADMIN_PASSWORD = process.env.BOARD_ADMIN_PW || "promptree-admin";

// 관리자 비밀번호 검증
app.post("/api/admin/verify", (req, res) => {
  const { password } = req.body || {};
  if (password && password === ADMIN_PASSWORD) {
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false, error: "INVALID_ADMIN_PASSWORD" });
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

  const isAdmin = adminPassword && adminPassword === ADMIN_PASSWORD;

  // 공지면 관리자만
  if (category === "공지" && !isAdmin) {
    return res.status(403).json({ error: "ADMIN_REQUIRED" });
  }

  // 🔥 관리자라면 닉네임은 항상 Promptree🌲
  const finalAuthor = isAdmin
    ? "Promptree🌲"
    : (author && author.trim()) || "익명";

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
      finalAuthor,
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

// ==== 게시글 수정 ====
app.put("/api/posts/:id", (req, res) => {
  const { id } = req.params;
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

  db.get(`SELECT * FROM posts WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: "DB_ERROR" });
    if (!row) return res.status(404).json({ error: "NOT_FOUND" });

    const isAdmin = adminPassword && adminPassword === ADMIN_PASSWORD;

    // 🔐 권한 체크
    if (!isAdmin) {
      // 비관리자: 비밀번호 필요
      if (!row.pwHash || !pwHash || row.pwHash !== pwHash) {
        return res.status(403).json({ error: "INVALID_PASSWORD" });
      }
      // 공지글은 관리자만 수정 가능
      if (row.category === "공지" || category === "공지") {
        return res.status(403).json({ error: "ADMIN_REQUIRED" });
      }
    }

    const now = Date.now();

    const nextCategory = category || row.category || "일반";
    const nextAuthor = isAdmin
      ? "Promptree🌲"
      : (author && author.trim()) || row.author || "익명";
    const nextPwHash =
      typeof pwHash === "string" && pwHash.length > 0 ? pwHash : row.pwHash;

    db.run(
      `
      UPDATE posts
      SET category = ?, title = ?, author = ?, pwHash = ?, content = ?,
          images = ?, videos = ?, updatedAt = ?
      WHERE id = ?
    `,
      [
        nextCategory,
        title,
        nextAuthor,
        nextPwHash || "",
        content,
        JSON.stringify(images || []),
        JSON.stringify(videos || []),
        now,
        id,
      ],
      (err2) => {
        if (err2)
          return res.status(500).json({ error: "DB_UPDATE_ERROR" });

        getPostWithComments(id, (err3, post) => {
          if (err3) return res.status(500).json({ error: "DB_ERROR" });
          res.json({ post });
        });
      }
    );
  });
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

  if (adminPassword !== ADMIN_PASSWORD) {
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

    const isAdmin = adminPassword && adminPassword === ADMIN_PASSWORD;
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
      db.run(`UPDATE posts SET updatedAt = ? WHERE id = ?`, [now, id], () => {
        getPostWithComments(id, (err2, post) => {
          if (err2) return res.status(500).json({ error: "DB_ERROR" });
          res.status(201).json({ post });
        });
      });
    }
  );
});

// ==== 댓글 삭제 (현재는 비번 없이 삭제, 나중에 비번 검증 추가 가능) ====
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
