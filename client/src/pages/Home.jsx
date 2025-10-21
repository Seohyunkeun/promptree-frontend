export default function Home() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">홈</h1>
      <p className="text-zinc-300">
        배포는 성공했고, 지금은 우리가 만든 라우팅·UI 골격만 먼저 반영한 상태야.
      </p>
      <ul className="list-disc pl-5 text-zinc-300">
        <li>상단 네비로 페이지 이동 확인</li>
        <li>HELLO 🚀 문구가 나오면 스모크 테스트 성공</li>
        <li>다음 단계에서 다크톤 커스텀/게시판 기능 붙임</li>
      </ul>
    </section>
  );
}
