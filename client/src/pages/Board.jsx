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
const fmtDate=(ts)=>{ const d=new Date(ts); const yy=String(d.getFullYear()).slice(2); const mm=String(d.getMonth()+1).padStart(2,"0"); const dd=String(d.getDate()).padStart(2,"0"); const HH=String(d.getHours()).slice(0,2).padStart(2,"0"); const MM=String(d.getMinutes()).toString().padStart(2,"0"); return `${yy}/${mm}/${dd} ${HH}:${MM}`; };
const byPinnedThenTime=(a,b)=>(b.pinned - a.pinned) || (b.updatedAt - a.updatedAt);

/* Model & Storage */
function normalizeComment(c){ return { id:String(c?.id??safeUUID()), author:String(c?.author??"프붕이"), pwHash:String(c?.pwHash??""), content:String(c?.content??""), createdAt:Number(c?.createdAt??Date.now()) }; }
function normalizePost(p){ return { id:String(p?.id??safeUUID()), category:["일반","프롬프트","기타"].includes(p?.category)?p.category:"일반", title:String(p?.title??""), content:String(p?.content??""), author:String(p?.author??"프붕이"), pwHash:String(p?.pwHash??""), createdAt:Number(p?.createdAt??Date.now()), updatedAt:Number(p?.updatedAt??Date.now()), likes:Number.isFinite(p?.likes)?p.likes:0, views:Number.isFinite(p?.views)?p.views:0, pinned:Boolean(p?.pinned), likedBy:Array.isArray(p?.likedBy)?p.likedBy:[], comments:Array.isArray(p?.comments)?p.comments.map(normalizeComment):[], images:Array.isArray(p?.images)?p.images:[], videos:Array.isArray(p?.videos)?p.videos:[] }; }
function loadPosts(){ try{ const raw=localStorage.getItem(STORAGE_KEY); if(!raw) return []; const arr=JSON.parse(raw); return Array.isArray(arr)?arr.map(normalizePost):[]; }catch{ return []; } }
function savePosts(posts){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(posts)); }catch{} }

/* Small UI */
function SegTabs({ value, onChange, tabs }){ return (
  <div className="inline-flex rounded-md border overflow-hidden">
    {tabs.map(t=>(<button key={t} onClick={()=>onChange(t)} className={`px-3 py-1.5 text-[13px] ${value===t?"bg-indigo-600 text-white":"bg-white hover:bg-indigo-50"}`}>{t}</button>))}
  </div>
);}

/* Editor — 글쓰기 입력칸 가독성 강화 부분 */
function Editor({ mode, initial, onCancel, onSubmit }){
  const [nickname, setNickname] = useState(initial?.author ?? "프붕이");
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState(initial?.category ?? "일반");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [images, setImages] = useState(initial?.images ?? []);
  const [videos, setVideos] = useState(initial?.videos ?? []);
  const imgInputRef = useRef(null); const vidInputRef = useRef(null);
  useEffect(()=>{ setNickname(initial?.author ?? "프붕이"); setPassword(""); setCategory(initial?.category ?? "일반"); setTitle(initial?.title ?? ""); setContent(initial?.content ?? ""); setImages(initial?.images ?? []); setVideos(initial?.videos ?? []); }, [initial?.id]);
  const isValid = title.trim() && content.trim() && (mode==="edit" ? true : password.trim());
  async function fileToDataURL(file){ const r=new FileReader(); const p=new Promise((res,rej)=>{ r.onload=()=>res(r.result); r.onerror=rej; }); r.readAsDataURL(file); return await p; }
  async function handleFiles(files, kind){ const items=[]; for(const f of Array.from(files||[])) items.push({ id:safeUUID(), dataUrl: await fileToDataURL(f), name:f.name }); if(kind==="image") setImages(prev=>[...prev,...items]); if(kind==="video") setVideos(prev=>[...prev,...items]); }
  return (
    <div id="editor" className="rounded-xl border bg-white">
      <div className="p-3 border-b">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            value={nickname}
            onChange={e=>setNickname(e.target.value)}
            onFocus={()=>{ if (nickname==="프붕이") setNickname(""); }}
            placeholder=""
            className="px-3 py-2 rounded-lg border text-[13px] bg-white text-zinc-900 placeholder-zinc-500 border-gray-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300/60"
          />
          <input
            type="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            placeholder={mode==="edit"?"비밀번호 변경(선택)":"비밀번호(필수)"}
            className="px-3 py-2 rounded-lg border text-[13px] bg-white text-zinc-900 placeholder-zinc-500 border-gray-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300/60"
          />
        </div>
      </div>
      <div className="px-3 py-2 border-b">
        <div className="flex items-center gap-3 text-[13px]"><span className="text-gray-600">말머리</span><SegTabs value={category} onChange={setCategory} tabs={["일반","프롬프트","기타"]}/></div>
      </div>
      <div className="px-3 py-2 border-b">
        <input
          value={title}
          onChange={e=>setTitle(e.target.value)}
          placeholder="제목을 입력해주세요"
          className="w-full px-3 py-2 rounded-lg border text-[13px] bg-white text-zinc-900 placeholder-zinc-500 border-gray-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300/60"
        />
      </div>
      <div className="px-3 py-2 border-b flex flex-wrap gap-2 text-[13px]">
        <button onClick={()=>imgInputRef.current?.click()} className="px-2 py-1 rounded-lg border hover:bg-indigo-50">이미지</button>
        <button onClick={()=>vidInputRef.current?.click()} className="px-2 py-1 rounded-lg border hover:bg-indigo-50">동영상</button>
        <input type="file" accept="image/*" multiple ref={imgInputRef} className="hidden" onChange={(e)=>handleFiles(e.target.files,"image")}/>
        <input type="file" accept="video/*" multiple ref={vidInputRef} className="hidden" onChange={(e)=>handleFiles(e.target.files,"video")}/>
      </div>
      <div className="p-3">
        <textarea
          value={content}
          onChange={e=>setContent(e.target.value)}
          placeholder="내용을 입력하세요."
          rows={12}
          className="w-full px-3 py-2 rounded-lg border text-[13px] bg-white text-zinc-900 placeholder-zinc-500 border-gray-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300/60"
        />
        {(images.length>0 || videos.length>0) && (
          <div className="mt-3 grid gap-3">
            {images.length>0 && (<div><div className="text-[13px] font-medium mb-1">이미지 ({images.length})</div><div className="grid grid-cols-2 md:grid-cols-4 gap-2">{images.map(i=>(<img key={i.id} src={i.dataUrl} alt={i.name} className="w-full h-28 object-cover rounded border"/>))}</div></div>)}
            {videos.length>0 && (<div><div className="text-[13px] font-medium mb-1">동영상 ({videos.length})</div><div className="grid grid-cols-1 md:grid-cols-2 gap-2">{videos.map(v=>(<video key={v.id} src={v.dataUrl} controls className="w-full rounded border"/>))}</div></div>)}
          </div>
        )}
      </div>
      <div className="px-3 pb-3 flex items-center justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg border text-[13px]">취소</button>
        <button disabled={!isValid} onClick={()=>onSubmit({ author:nickname||"프붕이", password, category, title, content, images, videos })} className={`px-4 py-2 rounded-lg text-white text-[13px] ${isValid?"bg-indigo-600 hover:bg-indigo-700":"bg-gray-400 cursor-not-allowed"}`}>등록</button>
      </div>
    </div>
  );
}

/* Comments (원본 유지) */
function CommentEditor({ onSubmit }){
  const [author,setAuthor]=useState("프붕이"); const [password,setPassword]=useState(""); const [content,setContent]=useState("");
  const isValid=content.trim()&&password.trim();
  return (
    <div className="p-3 rounded-xl border bg-white">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
        <input value={author} onChange={e=>setAuthor(e.target.value)} onFocus={()=>{ if(author==="프붕이") setAuthor(""); }} placeholder="" className="px-3 py-2 rounded-lg border text-[13px]" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="비밀번호(필수)" className="px-3 py-2 rounded-lg border text-[13px]" />
        <button disabled={!isValid} onClick={()=>onSubmit({author:author||"프붕이", password, content})} className={`px-3 py-2 rounded-lg text-white text-[13px] ${isValid?"bg-indigo-600 hover:bg-indigo-700":"bg-gray-400 cursor-not-allowed"}`}>댓글 등록</button>
      </div>
      <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="댓글 내용" rows={3} className="w-full px-3 py-2 rounded-lg border text-[13px]" />
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
          <div className="mt-2"><button onClick={()=>onDelete(c.id)} className="text-[12px] px-2 py-1 rounded border text-red-600">삭제</button></div>
        </li>
      ))}
    </ul>
  );
}

/* Detail (원본 유지) */
function DetailView({ posts, setPosts, onLikeToggle, onDeletePost, onPin, onAddComment, onDeleteComment }){
  const { id: paramId }=useParams();
  const location = useLocation();
  const nav=useNavigate();
  const fallbackId = React.useMemo(()=>{
    const p = location?.pathname || "";
    const m = p.match(/\/board\/([^\/?#]+)/);
    return m ? decodeURIComponent(m[1]) : undefined;
  }, [location?.pathname]);
  const id = paramId || fallbackId;

  const post=posts.find(p=>p.id===id);
  useEffect(()=>{
    if(!post) return;
    setPosts(prev=>prev.map(p=>p.id===post.id?{...p,views:(p.views||0)+1}:p));
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
          {post.images.length>0 && (<div><div className="text-[13px] font-medium">이미지</div><div className="grid grid-cols-2 md:grid-cols-3 gap-2">{post.images.map(img=>(<img key={img.id} src={img.dataUrl} alt={img.name} className="w-full rounded border"/>))}</div></div>)}
          {post.videos.length>0 && (<div><div className="text-[13px] font-medium">동영상</div><div className="grid grid-cols-1 md:grid-cols-2 gap-2">{post.videos.map(v=>(<video key={v.id} src={v.dataUrl} controls className="w-full rounded border"/>))}</div></div>)}
        </div>
      )}
      <section className="grid gap-3">
        <h2 className="text-[14px] font-semibold">댓글 ({post.comments?.length || 0})</h2>
        <CommentEditor onSubmit={(payload)=>onAddComment(post.id, payload)} />
        <CommentList comments={post.comments} onDelete={(cid)=>onDeleteComment(post.id, cid)} />
      </section>
    </article>
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
                <td className="text-center"><span className="px-2 py-0.5 rounded bg-gray-100">{p.category}</span></td>
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
          {slice.length===0 && (<tr><td colSpan={7} className="py-16 text-center text-gray-500">아직 등록된 글이 없어요</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}

/* Main (원본 유지) */
export default function Board(){
  const [posts,setPosts]=useState(()=>loadPosts());
  const [showEditor,setShowEditor]=useState(false);
  const [query,setQuery]=useState(""); const [onlyPinned,setOnlyPinned]=useState(false); const [sortKey,setSortKey]=useState("updated");
  const [pageSize,setPageSize]=useState(30); const [page,setPage]=useState(1);

  useEffect(()=>{ savePosts(posts); },[posts]);
  useEffect(()=>{ const onStorage=(e)=>{ if(e.key===STORAGE_KEY) setPosts(loadPosts()); }; window.addEventListener("storage", onStorage); return ()=>window.removeEventListener("storage", onStorage); },[]);

  const ordered=useMemo(()=>{
    const q=query.trim().toLowerCase(); let arr=[...posts];
    if(q) arr=arr.filter(p=>`${p.title}\n${p.category}\n${p.author}`.toLowerCase().includes(q));
    if(onlyPinned) arr=arr.filter(p=>p.pinned);
    switch (sortKey){ case "created": arr.sort((a,b)=>b.createdAt-a.createdAt); break; case "likes": arr.sort((a,b)=>b.likes-a.likes); break; case "title": arr.sort((a,b)=>a.title.localeCompare(b.title)); break; default: arr.sort(byPinnedThenTime); }
    return arr;
  },[posts,query,onlyPinned,sortKey]);

  const totalPages=Math.max(1, Math.ceil(ordered.length / pageSize));
  useEffect(()=>{ if(page>totalPages) setPage(totalPages); },[totalPages,page]);

  function submitNew({ author, password, category, title, content, images, videos }){
    const pw=(password||"").trim(); if(!pw) return alert("비밀번호는 필수입니다.");
    const now=Date.now();
    setPosts(prev=>[{ id:safeUUID(), category, title:title.trim(), content:content.trim(), author:author||"프붕이", pwHash:hashLite(pw), createdAt:now, updatedAt:now, likes:0, views:0, pinned:false, likedBy:[], comments:[], images:images||[], videos:videos||[] }, ...prev]);
    setShowEditor(false); setPage(1);
  }
  function toggleLike(id){
    setPosts(prev=>prev.map(p=>{
      if(p.id!==id) return p;
      const liked=p.likedBy.includes(currentUserId);
      return liked ? {...p, likes:Math.max(0,p.likes-1), likedBy:p.likedBy.filter(x=>x!==currentUserId), updatedAt:Date.now()}
                   : {...p, likes:p.likes+1, likedBy:[...p.likedBy,currentUserId], updatedAt:Date.now()};
    }));
  }
  function togglePin(id){ setPosts(prev=>prev.map(p=>p.id===id?{...p,pinned:!p.pinned,updatedAt:Date.now()}:p)); }
  function tryDelete(id){
    const p=posts.find(x=>x.id===id); if(!p) return false;
    if(!p.pwHash){ alert("비밀번호가 없는 예전 글은 삭제할 수 없습니다."); return false; }
    if(!confirm("정말 삭제할까요?")) return false;
    const input=prompt("비밀번호를 입력하세요"); if(!input || hashLite(input.trim())!==p.pwHash){ alert("비밀번호가 일치하지 않습니다."); return false; }
    setPosts(prev=>prev.filter(x=>x.id!==id)); return true;
  }
  function addComment(postId,{author,password,content}){
    const pw=(password||"").trim(); if(!pw) return alert("댓글 비밀번호는 필수입니다.");
    const comment={ id:safeUUID(), author:author||"프붕이", pwHash:hashLite(pw), content:content.trim(), createdAt:Date.now() };
    setPosts(prev=>prev.map(p=>p.id===postId?{...p,comments:[...(p.comments||[]),comment],updatedAt:Date.now()}:p));
  }
  function deleteComment(postId,commentId){
    const p=posts.find(x=>x.id===postId); const c=p?.comments?.find(x=>x.id===commentId); if(!p||!c) return;
    const input=prompt("댓글 비밀번호를 입력하세요"); if(!input || hashLite(input.trim())!==c.pwHash) return alert("비밀번호가 일치하지 않습니다.");
    setPosts(prev=>prev.map(x=>x.id===postId?{...x,comments:x.comments.filter(cc=>cc.id!==commentId),updatedAt:Date.now()}:x));
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
            <input value={query} onChange={(e)=>{ setQuery(e.target.value); setPage(1); }} placeholder="검색어를 입력하세요" className="px-3 py-1.5 rounded border border-[#2A2A33] bg-[#1A1A20] text-gray-200 w-64 placeholder:text-gray-500" />
            <button onClick={()=>setPage(1)} className="px-3 py-1.5 rounded border border-[#2A2A33] hover:bg-[#202027]">검색</button>
            <label className="ml-3 flex items-center gap-1 text-gray-300">
              <input type="checkbox" checked={onlyPinned} onChange={e=>setOnlyPinned(e.target.checked)} /> 고정글만
            </label>
          </div>
          <div className="flex items-center gap-2">
            <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }} className="px-2 py-1.5 rounded border border-[#2A2A33] bg-[#1A1A20] text-gray-200">
              <option value={30}>30개</option>
              <option value={50}>50개</option>
            </select>
            <button onClick={()=>setShowEditor(true)} className="px-3 py-1.5 rounded bg-violet-600 text-white hover:bg-violet-500">글쓰기</button>
          </div>
        </div>

        {/* 테이블 */}
        <ListTable posts={ordered} page={page} pageSize={pageSize} />

        {/* 페이지네이션 */}
        <div className="mt-4 flex items-center justify-center">
          <div className="flex items-center gap-2">
            {Array.from({length: Math.max(1, Math.ceil(ordered.length / pageSize))},(_,i)=>i+1).slice(0,30).map(n=>(
              <button key={n} onClick={()=>setPage(n)} className={`px-2.5 py-1 rounded border ${page===n?"bg-indigo-600 text-white border-indigo-600":"border-[#2A2A33] bg-[#1A1A20] text-gray-200 hover:bg-[#202027]"}`}>{n}</button>
            ))}
          </div>
        </div>

        <footer className="mt-8 text-center text-[12px] text-gray-400">
          <p>금칙: 음란물, 차별/비하, 혐오 표현, 저작권 침해</p>
        </footer>
      </div>
    </div>
  );
}
