// client/src/pages/Privacy.jsx
export default function Privacy() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 text-zinc-100">
      <h1 className="text-2xl font-semibold tracking-tight mb-2">
        개인정보 처리방침
      </h1>
      <p className="text-sm text-zinc-400 mb-8">
        Promptree는 가능한 한 최소한의 개인정보만을 처리하는 것을 목표로
        합니다. 아래 내용은 서비스 운영을 위한 기본 방침 예시이며, 실제
        오픈 전 반드시 서비스 실제 기능에 맞게 수정·보완해야 합니다.
      </p>

      <div className="space-y-8 text-sm leading-6">
        {/* 1 */}
        <section>
          <h2 className="text-base font-semibold mb-2 text-zinc-50">
            1. 수집하는 개인정보 항목
          </h2>
          <p className="text-zinc-300 mb-2">
            현재 Promptree는 별도의 회원가입 기능 없이, 브라우저
            로컬스토리지를 활용하여 다음과 같은 정보를 사용자 단말에만
            저장할 수 있습니다.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-zinc-300">
            <li>프롬프트 생성 히스토리</li>
            <li>게시판 글/댓글 내용</li>
            <li>브라우저에서 임시로 생성한 사용자 식별용 ID(익명)</li>
          </ul>
          <p className="text-xs text-zinc-500 mt-2">
            ※ 로컬스토리지에 저장되는 데이터는 서버가 아닌 이용자의
            브라우저에만 저장되며, 브라우저 캐시·저장소 초기화 시 함께
            삭제됩니다.
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-base font-semibold mb-2 text-zinc-50">
            2. 개인정보의 수집·이용 목적
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-zinc-300">
            <li>프롬프트 생성 기록 및 게시판 글 목록을 다시 볼 수 있도록 하기 위함</li>
            <li>동일 브라우저에서 추천(좋아요) 중복 방지 등 최소한의 식별을 위한 용도</li>
          </ul>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-base font-semibold mb-2 text-zinc-50">
            3. 보유 및 이용 기간
          </h2>
          <p className="text-zinc-300">
            서비스는 서버 측에서 별도의 개인정보를 저장하지 않으며, 이용자의
            브라우저 로컬스토리지에 저장된 정보는 이용자가 브라우저 설정을
            통해 캐시/저장소를 삭제할 때까지 보관됩니다.
          </p>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-base font-semibold mb-2 text-zinc-50">
            4. 제3자 제공 및 위탁
          </h2>
          <p className="text-zinc-300">
            현재 서비스는 수집한 개인정보를 제3자에게 제공하거나 외부에
            위탁하지 않습니다. 향후 외부 분석 도구, 광고 플랫폼 등을 도입할
            경우, 관련 내용을 본 방침에 사전 반영하고 고지하겠습니다.
          </p>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-base font-semibold mb-2 text-zinc-50">
            5. 쿠키 및 유사 기술의 사용
          </h2>
          <p className="text-zinc-300 mb-2">
            서비스는 이용 편의를 위해 쿠키 또는 이와 유사한 기술을 사용할 수
            있습니다. 쿠키에는 개인을 직접 식별할 수 있는 정보는 저장되지
            않으며, 브라우저 설정을 통해 쿠키 저장을 거부하거나 삭제할 수
            있습니다.
          </p>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-base font-semibold mb-2 text-zinc-50">
            6. 이용자의 권리
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-zinc-300">
            <li>
              이용자는 브라우저 내 저장된 게시글/댓글/프롬프트를 직접 삭제할
              수 있습니다.
            </li>
            <li>
              브라우저 설정을 통해 로컬스토리지·쿠키 등을 초기화하면, 서비스가
              저장한 데이터도 함께 삭제됩니다.
            </li>
          </ul>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-base font-semibold mb-2 text-zinc-50">
            7. 개인정보 보호 문의처
          </h2>
          <p className="text-zinc-300 mb-1">
            개인정보 처리와 관련된 문의, 수정 요청, 기타 의견이 있을 경우
            아래 연락처로 문의해 주세요.
          </p>
          <p className="text-zinc-300">
            이메일:{" "}
            <a
              href="mailto:sidh0318@naver.com"
              className="underline underline-offset-4 hover:text-zinc-100"
            >
              sidh0318@naver.com
            </a>
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="text-base font-semibold mb-2 text-zinc-50">
            8. 개인정보 처리방침의 변경
          </h2>
          <p className="text-zinc-300">
            서비스는 관련 법령의 개정 또는 서비스 내용 변경에 따라 본
            개인정보 처리방침을 수정할 수 있으며, 변경 사항은 서비스 내
            공지사항 등을 통해 공지합니다.
          </p>
        </section>
      </div>
    </div>
  );
}
