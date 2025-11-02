// client/src/pages/Board.jsx — robust to "/board/*" routing (id fallback from pathname)
// 글쓰기 화면 가독성만 강화 (나머지 원본 로직/레이아웃 유지)
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
function hashLite(str){ let h=5381; for(const ch of String(str)) h=(h*33)^ch.charCodeAt(0); return (h>>>0).toString(16).padStart(8,"0"); }
const USER_KEY="pt_board_user_id"; const STORAGE_KEY="pt_board_posts_v2";
const currentUserId = (()=>{ try{ let id=localStorage.getItem(USER_KEY); if(!id){ id=safeUUID(); localStorage.setItem(USER_KEY,id);} return id; }catch{ return "anon"; }})();
const fmtDate=(ts)=>{ const d=new Date(ts); const yy=String(d.getFullYear()).slice(2); const mm=String(d.getMonth()+1).padStart(2,"0"); const dd=String(d.getDate()).padStart(2,"0"); const HH=String(d.getHours()).toString().padStart(2,"0"); const MM=String(d.getMinutes()).toString().padStart(2,"0"); return `${yy}/${mm}/${dd} ${HH}:${MM}`; };
const byPinnedThenTime=(a,b)=>(b.pinned - a.pinned) || (b.updatedAt - a.updatedAt);

/* Model & Storage */
function normalizeComment(c){ return { id:String(c?.id??safeUUID()), author:String(c?.author??"프붕이"), pwHash:String(c?.pwHash??""), content:String(c?.content??""), createdAt:Number(c?.createdAt??Date.now()) }; }
function normalizePost(p){ return { id:String(p?.id??safeUUID()), category:["일반","프롬프트","기타"].includes(p?.category)?p.category:"일반", title:String(p?.title??""), content:String(p?.content??""), author:String(p?.author??"프붕이"), pwHash:String(p?.pwHash??""), createdAt:Number(p?.createdAt??Date.now()), updatedAt:Number(p?.updatedAt??Date.now()), likes:Number.isFinite(p?.likes)?p.likes:0, views:Number.isFinite(p?.views)?p.views:0, pinned:Boolean(p?.pinned), likedBy:Array.isArray(p?.likedBy)?p.likedBy:[], comments:Array.isArray(p?.comments)?p.comments.map(normalizeComment):[], images:Array.isArray(p?.images)?p.images:[], videos:Array.isArray(p?.videos)?p.videos:[] }; }
function loadPosts(){ try{ const raw=localStorage.getItem(STORAGE_KEY); if(!raw) return []; const arr=JSON.parse(raw); return Array.isArray(arr)?arr.map(normalizePost):[]; }catch{ return []; } }
function savePosts(arr){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }catch{} }

/* Editor (가독성 강화) */
function Editor({ mode="new", draft={}, onCancel, onSubmit }){
  const [category,setCategory]=useState(draft.category||"일반");
  const [title,setTitle]=useState(draft.title||"");
  const [author,setAuthor]=useState(draft.author||"프붕이");
  const [pw,setPw]=useState("");
  const [content,setContent]=useState(draft.content||"");
  const [images,setImages]=useState(draft.images||[]);
  const [videos,setVideos]=useState(draft.videos||[]);

  const fileImgRef=useRef(null);
  const fileVidRef=useRef(null);

  function handleSubmit(){
    if(!title.trim()) return alert("제목을 입력해 주세요");
    if(!content.trim()) return alert("내용을 입력해 주세요");
    const payload={
      category,title:title.trim(),content:content.trim(),
      author:author.trim()||"프붕이", pwHash: pw ? hashLite(pw.trim()) : "",
      images, videos
    };
    onSubmit(payload);
  }

  function readFiles(fileList, accept="image"){
    const arr = Array.from(fileList||[]);
    arr.forEach(f=>{
      const reader=new FileReader();
      reader.onload=()=> {
        const item={ id:safeUUID(), name:f.name, dataUrl:String(reader.result) };
        if(accept==="image") setImages(prev=>[...prev,item]); else setVideos(prev=>[...prev,item]);
      };
      reader.readAsDataURL(f);
    });
  }

  return (
    <div className="grid gap-3">
      <div className="rounded-xl border border-[#2A2A33] bg-white text-black p-4">
        <div className="grid gap-3">
          <div className="flex gap-2">
            <select value={category} onChange={(e)=>setCategory(e.target.value)} className="px-3 py-2 rounded-lg border bg-white">
              {["일반","프롬프트","기타"].map(v=><option key={v} value={v}>{v}</option>)}
            </select>
            <input
              value={title}
              onChange={(e)=>setTitle(e.target.value)}
              placeholder="제목"
              className="flex-1 px-3 py-2 rounded-lg border bg-white"
            />
          </div>

          <div className="flex gap-2">
            <input value={author} onChange={(e)=>setAuthor(e.target.value)} placeholder="닉네임(기본: 프붕이)" className="px-3 py-2 rounded-lg border bg-white" />
            <input value={pw} onChange={(e)=>setPw(e.target.value)} placeholder="비밀번호(선택)" className="px-3 py-2 rounded-lg border bg-white" type="password" />
          </div>

          <textarea
            value={content}
            onChange={(e)=>setContent(e.target.value)}
            placeholder="내용을 입력하세요."
            rows={10}
            className="w-full px-4 py-3 rounded-lg border bg-white"
          />

          {/* 파일 업로드 */}
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <input ref={fileImgRef} type="file" accept="image/*" hidden multiple onChange={(e)=>readFiles(e.target.files,"image")} />
              <button onClick={()=>fileImgRef.current?.click()} className="px-3 py-2 rounded-lg border">이미지 추가</button>
              <input ref={fileVidRef} type="file" accept="video/*" hidden multiple onChange={(e)=>readFiles(e.target.files,"video")} />
              <button onClick={()=>fileVidRef.current?.click()} className="px-3 py-2 rounded-lg border">동영상 추가</button>
            </div>

            {(images.length>0 || videos.length>0) && (
              <div className="grid gap-2">
                {images.length>0 && (
                  <div>
                    <div className="text-sm font-medium mb-1">이미지</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {images.map(img=>(
                        <img key={img.id} src={img.dataUrl} alt={img.name} className="w-full rounded border" />
                      ))}
                    </div>
                  </div>
                )}
                {videos.length>0 && (
                  <div>
                    <div className="text-sm font-medium mb-1">동영상</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {videos.map(v=>(
                        <video key={v.id} src={v.dataUrl} controls className="w-full rounded border" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={onCancel} className="px-3 py-2 rounded-lg border">취소</button>
            <button onClick={handleSubmit} className="px-4 py-2 rounded-lg border bg-black text-white">등록</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Detail (원본 유지 + 라우팅 보강) */
function DetailView({ posts, setPosts, onLikeToggle, onDeletePost, onPin, onAddComment, onDeleteComment }){
  const { id: paramId } = useParams();
  const location = useLocation();
  const nav = useNavigate();

  const fallbackId = React.useMemo(()=>{
    const p = location?.pathname || "";
    const m = p.match(/\/board\/([^\/?#]+)/);
    return m ? decodeURIComponent(m[1]) : undefined;
  }, [location?.pathname]);

  const id = paramId || fallbackId;

  const post = posts.find(p=>p.id===id);
  useEffect(()=>{
    if(!post) return;
    setPosts(prev=>prev.map(p=>p.id===post.id ? {...p, views:(p.views||0)+1} : p));
    // eslint-disable-next-line
  }, [id]);

  if(!post){ nav("/board",{replace:true}); return null; }
  const alreadyLiked = post.likedBy.includes(currentUserId);
  function handleDelete(){ if(onDeletePost(post.id)) nav("/board",{replace:true}); }

  return (
    <article className="p-6 rounded-xl border bg-white">
      <header className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-violet-100 text-violet-700 text-[12px]">{post.category}</span>
              <h1 className="text-xl font-bold leading-tight">{post.title}</h1>
            </div>
            <div className="text-[12px] text-gray-600">글쓴이: {post.author||"프붕이"} • 조회 {post.views||0} • 추천 {post.likes||0}</div>
          </div>
          <div className="text-[12px] opacity-60 text-right">
            <div>작성: {fmtDate(post.createdAt)}</div>
            <div>수정: {fmtDate(post.updatedAt)}</div>
          </div>
        </div>
      </header>

      <div className="whitespace-pre-wrap mb-6 text-[14px]">{post.content}</div>

      <div className="flex items-center gap-2 mb-8 text-[13px]">
        <button onClick={()=>onLikeToggle(post.id)} className={`px-3 py-1.5 rounded-lg border ${alreadyLiked?"bg-gray-100":""}`}>{alreadyLiked?"👎 취소":"👍 좋아요"} {post.likes}</button>
        <button onClick={()=>onPin(post.id)} className="px-3 py-1.5 rounded-lg border">{post.pinned?"고정 해제":"고정"}</button>
        <button onClick={()=>nav("/board")} className="px-3 py-1.5 rounded-lg border">목록</button>
        <button onClick={handleDelete} className="px-3 py-1.5 rounded-lg border text-red-600">삭제</button>
      </div>

      {(post.images.length>0 || post.videos.length>0) && (
        <div className="grid gap-4 mb-6">
          {post.images.length>0 && (
            <div>
              <div className="text-[13px] font-medium">이미지</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {post.images.map(img=>(
                  <img key={img.id} src={img.dataUrl} alt={img.name} className="w-full rounded border"/>
                ))}
              </div>
            </div>
          )}
          {post.videos.length>0 && (
            <div>
              <div className="text-[13px] font-medium">동영상</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {post.videos.map(v=>(
                  <video key={v.id} src={v.dataUrl} controls className="w-full rounded border"/>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <section className="grid gap-3">
        <h2 className="text-[14px] font-semibold">댓글 ({post.comments?.length||0})</h2>
        <CommentForm onAdd={(payload)=>onAddComment(post.id, payload)} />
        <CommentList comments={post.comments} onDelete={(cid)=>onDeleteComment(post.id, cid)} />
      </section>
    </article>
  );
}
function CommentForm({ onAdd }){
  const [author,setAuthor]=useState("프붕이");
  const [pw,setPw]=useState("");
  const [text,setText]=useState("");
  function handleSubmit(){
    if(!text.trim()) return;
    onAdd({ author:author.trim()||"프붕이", pwHash: pw?hashLite(pw.trim()):"", content:text.trim() });
    setText(""); setPw("");
  }
  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <input value={author} onChange={(e)=>setAuthor(e.target.value)} placeholder="닉네임" className="px-3 py-2 rounded-lg border text-[13px]" />
        <input value={pw} onChange={(e)=>setPw(e.target.value)} placeholder="비밀번호(선택)" type="password" className="px-3 py-2 rounded-lg border text-[13px]" />
        <button onClick={handleSubmit} className="px-3 py-2 rounded-lg border text-[13px]">등록</button>
      </div>
      <textarea value={text} onChange={(e)=>setText(e.target.value)} placeholder="댓글 내용" rows={3} className="w-full px-3 py-2 rounded-lg border text-[13px]" />
    </div>
  );
}
function CommentList({ comments, onDelete }){
  if(!comments?.length) return <p className="text-[13px] opacity-60">아직 댓글이 없습니다.</p>;
  return (
    <ul className="grid gap-2">
      {comments.map(c=>(
        <li key={c.id} className="p-3 rounded-lg border bg-white">
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-medium">{c.author||"프붕이"}</div>
            <div className="text-[12px] opacity-60">{fmtDate(c.createdAt)}</div>
          </div>
          <div className="mt-1 text-[13px] whitespace-pre-wrap">{c.content}</div>
          <div className="mt-2">
            <button onClick={()=>onDelete(c.id)} className="text-[12px] px-2 py-1 rounded border text-red-600">삭제</button>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* List (원본 유지) */
function ListTable({ posts, page, pageSize }){
  const startIndex=(page-1)*pageSize; const slice=posts.slice(startIndex,startIndex+pageSize);
  return (
    <div className="rounded-xl border bg-white">
      <table className="w-full text-[13px]">
        <thead className="bg-gray-50 border-b text-gray-700">
          <tr>
            <th className="w-16 py-2">번호</th>
            <th className="w-24">말머리</th>
            <th className="text-left">제목</th>
            <th className="w-32">글쓴이</th>
            <th className="w-32">작성일</th>
            <th className="w-20">조회</th>
            <th className="w-20">추천</th>
          </tr>
        </thead>
        <tbody>
          {slice.map((p,i)=>{
            const no = posts.length - (startIndex + i);
            const commentCnt = p.comments?.length || 0;
            return (
              <tr key={p.id} className="border-b last:border-0">
                <td className="text-center py-2">{no}</td>
                <td className="text-center">
                  <span className="px-2 py-0.5 rounded bg-gray-100">{p.category}</span>
                </td>
                <td className="py-2">
                  <Link to={`/board/${p.id}`} className="hover:underline text-black">
                    {p.title}{commentCnt ? ` [${commentCnt}]` : ""}
                  </Link>
                </td>
                <td className="text-center">{p.author || "프붕이"}</td>
                <td className="text-center">{fmtDate(p.createdAt)}</td>
                <td className="text-center">{p.views || 0}</td>
                <td className="text-center">{p.likes || 0}</td>
              </tr>
            );
          })}
          {slice.length===0 && (
            <tr><td colSpan={7} className="py-16 text-center text-gray-500">아직 등록된 글이 없어요</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* Main (원본 유지) */
export default function Board(){
  const [posts,setPosts]=useState(()=>loadPosts());
  const [showEditor,setShowEditor]=useState(false);
  const [query,setQuery]=useState("");
  const [onlyPinned,setOnlyPinned]=useState(false);
  const [sortKey,setSortKey]=useState("updated");
  const [pageSize,setPageSize]=useState(30);
  const [page,setPage]=useState(1);

  useEffect(()=>{ savePosts(posts); },[posts]);
  useEffect(()=>{ const onStorage=(e)=>{ if(e.key===STORAGE_KEY) setPosts(loadPosts()); }; window.addEventListener("storage", onStorage); return ()=>window.removeEventListener("storage", onStorage); },[]);

  const ordered=useMemo(()=>{
    const q=query.trim().toLowerCase(); let arr=[...posts];
    if(q) arr=arr.filter(p=>`${p.title}\n${p.category}\n${p.author}`.toLowerCase().includes(q));
    if(onlyPinned) arr=arr.filter(p=>p.pinned);
    if(sortKey==="updated") arr.sort(byPinnedThenTime);
    return arr;
  },[posts,query,onlyPinned,sortKey]);

  function submitNew(payload){
    const post=normalizePost({ ...payload, id:safeUUID(), createdAt:Date.now(), updatedAt:Date.now(), likedBy:[] });
    setPosts(prev=>[post, ...prev]);
    setShowEditor(false);
  }
  function tryDelete(id){
    const ok=confirm("정말 삭제하시겠습니까?");
    if(!ok) return false;
    setPosts(prev=>prev.filter(p=>p.id!==id));
    return true;
  }
  function toggleLike(id){
    setPosts(prev=>prev.map(p=>{
      if(p.id!==id) return p;
      const liked = p.likedBy.includes(currentUserId);
      const likedBy = liked ? p.likedBy.filter(x=>x!==currentUserId) : [...p.likedBy, currentUserId];
      const likes = liked ? Math.max(0,(p.likes||0)-1) : (p.likes||0)+1;
      return { ...p, likedBy, likes, updatedAt:Date.now() };
    }));
  }
  function togglePin(id){ setPosts(prev=>prev.map(p=>p.id===id?{...p,pinned:!p.pinned,updatedAt:Date.now()}:p)); }
  function addComment(postId,payload){
    setPosts(prev=>prev.map(p=>p.id===postId?{
      ...p,
      comments:[...(p.comments||[]), normalizeComment(payload)],
      updatedAt:Date.now()
    }:p));
  }
  function deleteComment(postId,commentId){
    setPosts(prev=>prev.map(x=>{
      if(x.id!==postId) return x;
      return { ...x, comments:x.comments.filter(cc=>cc.id!==commentId), updatedAt:Date.now() };
    }));
  }

  const location = useLocation();
  const matchDetail = /\/board\/[^\/?#]+/.test(location.pathname);
  if(matchDetail){
    return (
      <div className="bg-[#1a1a1f] min-h-[calc(100vh-64px)] text-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6 grid gap-4">
          <div>
            <h1 className="text-xl font-bold">Promptree 게시판</h1>
            <p className="text-[12px] opacity-70">상세보기</p>
          </div>
          <DetailView
            posts={ordered} setPosts={setPosts}
            onLikeToggle={toggleLike} onDeletePost={tryDelete} onPin={togglePin}
            onAddComment={addComment} onDeleteComment={deleteComment}
          />
        </div>
      </div>
    );
  }

  if(showEditor){
    return (
      <div className="bg-[#1a1a1f] min-h-[calc(100vh-64px)] text-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6 grid gap-4">
          <div><h1 className="text-xl font-bold">Promptree 게시판</h1></div>
          <Editor mode="new" onCancel={()=>setShowEditor(false)} onSubmit={submitNew} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1f] min-h-[calc(100vh-64px)] text-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* 상단 바 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <select value="title+content" readOnly className="px-2 py-1.5 rounded border border-[#2A2A33] bg-[#1A1A20] text-gray-200">
              <option value="title+content">제목+내용</option>
            </select>
            <input
              value={query}
              onChange={(e)=>{ setQuery(e.target.value); setPage(1); }}
              placeholder="검색어를 입력하세요"
              className="px-3 py-1.5 rounded border border-[#2A2A33] bg-[#1A1A20] text-gray-200 w-64 placeholder:text-gray-500"
            />
            <button onClick={()=>setPage(1)} className="px-3 py-1.5 rounded border border-[#2A2A33] bg-[#1A1A20]">검색</button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm flex items-center gap-1">
              <input type="checkbox" checked={onlyPinned} onChange={(e)=>setOnlyPinned(e.target.checked)} />
              고정만
            </label>
            <select value={sortKey} onChange={(e)=>setSortKey(e.target.value)} className="px-2 py-1.5 rounded border border-[#2A2A33] bg-[#1A1A20]">
              <option value="updated">최신순</option>
            </select>
            <button onClick={()=>setShowEditor(true)} className="h-9 px-3 rounded bg-white text-black text-sm">글쓰기</button>
          </div>
        </div>

        {/* 목록 */}
        <ListTable posts={ordered} page={page} pageSize={pageSize} />

        {/* 페이지네이션 */}
        <div className="flex items-center justify-between mt-3 text-sm">
          <div>총 {ordered.length}개</div>
          <div className="flex items-center gap-2">
            <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-1.5 rounded border border-[#2A2A33] bg-[#1A1A20] disabled:opacity-40">이전</button>
            <span>{page}</span>
            <button disabled={page*pageSize>=ordered.length} onClick={()=>setPage(p=>p+1)} className="px-3 py-1.5 rounded border border-[#2A2A33] bg-[#1A1A20] disabled:opacity-40">다음</button>
            <select value={pageSize} onChange={(e)=>{ setPageSize(Number(e.target.value)); setPage(1); }} className="px-2 py-1.5 rounded border border-[#2A2A33] bg-[#1A1A20]">
              {[30,50,100].map(n=><option key={n} value={n}>{n}/페이지</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
