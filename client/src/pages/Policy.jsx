// client/src/pages/Policy.jsx
export default function Policy() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 text-zinc-100">
      <h1 className="text-2xl font-semibold tracking-tight mb-2">
        이용약관
      </h1>
      <p className="text-sm text-zinc-400 mb-8">
        이 문서는 Promptree 서비스를 이용하기 위한 기본적인 약관 초안입니다.
        실제 서비스 오픈 전, 반드시 법률 전문가의 검토를 거친 뒤 수정·보완하세요.
      </p>

      <div className="space-y-8 text-sm leading-6">
        {/* 1 */}
        <section>
          <h2 className="text-base font-semibold mb-2 text-zinc-50">
            제1조 (목적)
          </h2>
          <p className="text-zinc-300">
            이 약관은 Promptree(이하 &quot;서비스&quot;)가 제공하는
            프롬프트 생성 및 게시판 기능 등 제반 서비스의 이용과 관련하여,
            서비스와 이용자 간의 권리·의무 및 책임사항 등을 규정함을
            목적으로 합니다.
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-base font-semibold mb-2 text-zinc-50">
            제2조 (용어의 정의)
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-zinc-300">
            <li>
              &quot;이용자&quot;란 본 약관에 동의하고 서비스를 이용하는
              모든 사람을 말합니다.
            </li>
            <li>
              &quot;게시물&quot;이란 이용자가 서비스 내에 게시한 글, 댓글,
              이미지, 동영상 등 일체의 정보를 의미합니다.
            </li>
            <li>
              &quot;프롬프트&quot;란 AI 모델에 입력하기 위해 작성된 문장,
              설명, 명령 등의 텍스트를 말합니다.
            </li>
          </ul>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-base font-semibold mb-2 text-zinc-50">
            제3조 (약관의 효력 및 변경)
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-zinc-300">
            <li>
              본 약관은 서비스 화면에 게시하거나 기타의 방법으로 공지함으로써
              효력이 발생합니다.
            </li>
            <li>
              서비스는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수
              있으며, 변경 시 사전에 서비스 내 공지사항 등을 통해 고지합니다.
            </li>
            <li>
              이용자가 변경된 약관에 동의하지 않을 경우 서비스 이용을
              중단하고 탈퇴할 수 있으며, 계속 이용 시 변경된 약관에 동의한
              것으로 간주됩니다.
            </li>
          </ul>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-base font-semibold mb-2 text-zinc-50">
            제4조 (서비스의 제공 및 변경)
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-zinc-300">
            <li>
              서비스는 프롬프트 생성기, 게시판, 기타 부가 기능 등을
              제공합니다.
            </li>
            <li>
              서비스는 운영상·기술상의 필요에 따라 서비스 내용을 추가하거나
              변경할 수 있습니다.
            </li>
            <li>
              베타/실험적 기능의 경우 사전 예고 없이 중단되거나 변경될 수
              있습니다.
            </li>
          </ul>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-base font-semibold mb-2 text-zinc-50">
            제5조 (이용자의 의무)
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-zinc-300">
            <li>이용자는 관련 법령과 본 약관, 서비스에서 안내하는 내용을 준수해야 합니다.</li>
            <li>
              이용자는 다음 각 호의 행위를 해서는 안 됩니다.
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>타인의 권리(저작권, 초상권 등)를 침해하는 행위</li>
                <li>불법·음란·폭력적·차별적 내용을 게시하는 행위</li>
                <li>
                  서비스의 정상적인 운영을 방해하거나 서버에 과도한 부하를
                  유발하는 행위
                </li>
                <li>타인의 명의를 도용하거나 허위 정보를 기재하는 행위</li>
              </ul>
            </li>
          </ul>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-base font-semibold mb-2 text-zinc-50">
            제6조 (게시물의 관리)
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-zinc-300">
            <li>
              게시물에 대한 책임은 이를 작성·게시한 이용자에게 있으며,
              서비스는 관련 법령을 위반하거나 다른 이용자에게 피해를 주는
              게시물에 대해 사전 통지 없이 수정·비노출·삭제 등의 조치를
              취할 수 있습니다.
            </li>
            <li>
              이용자는 자신이 작성한 게시물을 서비스 홍보·운영을 위해
              서비스 내·외부에서 노출·편집·복제하는 것에 동의한 것으로
              봅니다. (구체적인 범위는 실제 운영 정책에 맞게 조정하세요.)
            </li>
          </ul>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-base font-semibold mb-2 text-zinc-50">
            제7조 (서비스의 제한 및 중단)
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-zinc-300">
            <li>
              서비스는 시스템 점검, 서비스 개선, 천재지변, 통신 장애 등
              불가피한 사유가 발생한 경우 서비스 제공을 일시적으로 중단할 수
              있습니다.
            </li>
            <li>
              서비스 중단이 장기간 지속되는 경우, 서비스는 사전에 가능한 범위
              내에서 공지사항 등을 통해 안내합니다.
            </li>
          </ul>
        </section>

        {/* 8 */}
        <section>
          <h2 className="text-base font-semibold mb-2 text-zinc-50">
            제8조 (면책)
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-zinc-300">
            <li>
              서비스는 이용자 상호 간 또는 이용자와 제3자 사이에 발생한
              분쟁에 대하여 개입하지 않으며, 그로 인한 손해에 대해 책임을
              지지 않습니다.
            </li>
            <li>
              서비스가 제공하는 프롬프트 및 출력 결과는 참고용이며,
              실제 사용에 따른 책임은 이용자에게 있습니다.
            </li>
          </ul>
        </section>

        {/* 9 */}
        <section>
          <h2 className="text-base font-semibold mb-2 text-zinc-50">
            제9조 (준거법 및 관할)
          </h2>
          <p className="text-zinc-300">
            본 약관은 대한민국 법률을 준거법으로 하며, 서비스와 이용자 간에
            분쟁이 발생할 경우 관련 법령에 따른 관할 법원을 전속관할로 합니다.
          </p>
        </section>
      </div>
    </div>
  );
}
