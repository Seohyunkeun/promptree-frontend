export default function Board() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">게시판</h1>
      <p className="text-zinc-300">
        1차: 로컬스토리지 기반 목록/글쓰기 → 2차: 댓글/좋아요 → 3차: 서버 연동.
      </p>
      <div className="rounded-2xl border border-zinc-800 p-4 bg-zinc-900/40">
        <p className="text-zinc-400">다음 패스에서 “통으로” 구현 파일 제공</p>
      </div>
    </section>
  );
}
