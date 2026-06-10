/* =========================================================================
   폐업현황(이탈) + 신규/예정자 유입 화면
   ========================================================================= */
const { formatWon: fWon, formatNum: fNum, BILLING: FB } = window.AppData;

/* ---------------- 폐업현황 ---------------- */
function ClosureBoard({ members, onOpenMember, go }) {
  const [type, setType] = React.useState('전체');
  const [onlyDue, setOnlyDue] = React.useState(false);
  const list = React.useMemo(() => {
    let arr = members.filter((m) => m.상태 !== '정상' && m.처리정보);
    if (type !== '전체') arr = arr.filter((m) => m.상태 === type);
    if (onlyDue) arr = arr.filter((m) => m.처리정보.추후납부안내);
    return arr.sort((a, b) => (b.처리정보.처리일 || '').localeCompare(a.처리정보.처리일 || ''));
  }, [members, type, onlyDue]);
  const dueCount = members.filter((m) => m.처리정보 && m.처리정보.추후납부안내).length;
  const dueAmt = members.filter((m) => m.처리정보 && m.처리정보.추후납부안내).reduce((s, m) => s + m.미수금액, 0);

  return (
    <div style={{ padding: '20px 26px 44px' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>폐업현황 · 이탈 관리</div>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 3 }}>폐업·양도·이관·탈퇴 처리된 회원 — 미수금이 남아 있으면 추후 납부 안내 대상으로 관리합니다.</div>
      </div>

      {/* 흐름 + 핵심규칙 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <Card>
          <SectionTitle tone="red" icon="closed">폐업 처리 흐름</SectionTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            {['시청 폐업공문 접수', '폐업현황으로 이동', '미수금명단에서 제외'].map((t, i) => (
              <React.Fragment key={i}>
                <span style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-line)', padding: '6px 11px', borderRadius: 8, fontSize: 12.5, fontWeight: 700 }}>{t}</span>
                {i < 2 && <Icon name="arrowRight" size={14} color="var(--ink-3)" />}
              </React.Fragment>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.7, background: 'var(--orange-bg)', border: '1px solid var(--orange-line)', borderRadius: 9, padding: '10px 13px' }}>
            <b style={{ color: 'var(--orange)' }}>중요</b> · 폐업 처리되면 미수금명단에서는 빠지지만, 미수금 유무와 관계없이 처리 내용은 반드시 입력합니다. 미수금이 남아 있는 경우 추후 연락하여 납부를 안내합니다.
          </div>
        </Card>
        <Card style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, background: 'var(--orange-bg)', border: '1px solid var(--orange-line)', borderRadius: 11, padding: '15px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>추후 납부 안내 대상</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--orange)', marginTop: 6 }} className="tnum">{fNum(dueCount)}<span style={{ fontSize: 14, fontWeight: 600 }}>명</span></div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 4 }}>미납 잔액 합계 <b className="tnum">{fWon(dueAmt)}</b></div>
          </div>
          <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 11, padding: '15px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>총 이탈 처리</div>
            <div style={{ fontSize: 30, fontWeight: 800, marginTop: 6 }} className="tnum">{fNum(members.filter((m) => m.상태 !== '정상').length)}<span style={{ fontSize: 14, fontWeight: 600 }}>건</span></div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 4 }}>폐업 · 양도 · 이관 · 탈퇴</div>
          </div>
        </Card>
      </div>

      {/* 필터 */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 12, alignItems: 'center' }}>
        {['전체', '폐업', '양도', '이관', '탈퇴'].map((t) => (
          <button key={t} onClick={() => setType(t)} style={{ padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, border: `1px solid ${type === t ? 'var(--blue-strong)' : 'var(--line)'}`, background: type === t ? 'var(--blue-bg)' : '#fff', color: type === t ? 'var(--blue-strong)' : 'var(--ink-2)' }}>{t}</button>
        ))}
        <span style={{ width: 1, height: 18, background: 'var(--line)', margin: '0 4px' }} />
        <button onClick={() => setOnlyDue(!onlyDue)} style={{ padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, border: `1px solid ${onlyDue ? 'var(--orange)' : 'var(--line)'}`, background: onlyDue ? 'var(--orange-bg)' : '#fff', color: onlyDue ? 'var(--orange)' : 'var(--ink-2)' }}>미납 잔액 있는 건만</button>
        <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--ink-2)' }}>{fNum(list.length)}건</span>
      </div>

      <Card pad={0} style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                {['처리일', '유형', '회원', '차량번호', '지역', '공문번호', '처리내용', '미납 잔액', ''].map((h, i) => (
                  <th key={i} style={{ textAlign: i === 7 ? 'right' : 'left', padding: '11px 13px', fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id} onClick={() => onOpenMember(m)} style={{ borderBottom: '1px solid var(--line-2)', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={td}><span className="tnum" style={{ color: 'var(--ink-2)' }}>{m.처리정보.처리일}</span></td>
                  <td style={td}><Badge tone={statusTone(m.상태)}>{m.상태}</Badge></td>
                  <td style={{ ...td, fontWeight: 700 }}>{m.이름} <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 500 }}>{m.관리번호}</span></td>
                  <td style={td}><span className="mono" style={{ fontSize: 12.5 }}>{m.차량번호}</span></td>
                  <td style={{ ...td, color: 'var(--ink-2)' }}>{m.지역원본}</td>
                  <td style={td}><span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>{m.처리정보.공문번호}</span></td>
                  <td style={{ ...td, color: 'var(--ink-2)', fontSize: 12.5, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.처리정보.내용}</td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    {m.미수금액 > 0
                      ? <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}><span className="tnum" style={{ fontWeight: 800, color: 'var(--red)' }}>{fWon(m.미수금액)}</span><Badge tone="orange" size="sm">납부안내</Badge></span>
                      : <Badge tone="green" size="sm">정산완료</Badge>}
                  </td>
                  <td style={{ ...td, textAlign: 'right' }}><Icon name="chevron" size={15} color="var(--ink-3)" /></td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink-3)' }}>해당 조건의 이탈 건이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ---------------- 신규/예정자 유입 ---------------- */
function PendingBoard({ pending, go }) {
  const steps = ['자격증명 발급', '시청 신규허가 접수', '예정자 등록', '전체자명단 등록', '관리번호 부여'];
  return (
    <div style={{ padding: '20px 26px 44px' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>신규 · 예정자 유입</div>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 3 }}>자격증명 발급 → 시청 신규허가 접수 → 예정자 등록 → 전체자명단 등록 → 관리번호 부여 → 부과 시작</div>
      </div>

      {/* 유입 흐름 */}
      <Card style={{ marginBottom: 14 }}>
        <SectionTitle tone="green" icon="plus">유입 흐름</SectionTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {steps.map((t, i) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--green-bg)', border: '1px solid var(--green-line)', borderRadius: 8, padding: '7px 12px' }}>
                <span style={{ width: 18, height: 18, borderRadius: 9, background: 'var(--green)', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>{t}</span>
              </div>
              {i < steps.length - 1 && <Icon name="arrowRight" size={14} color="var(--ink-3)" />}
            </React.Fragment>
          ))}
        </div>
        {/* 부과 구분 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
          <RouteCard tone="orange" tag="경로 A" head="택배 + 협회 미가입 → 관리비 부과" rows={[['기준', '자격증명 발급일 다음 달부터'], ['금액', fWon(FB.관리비)]]} />
          <RouteCard tone="blue" tag="경로 B" head="협회 가입자 → 협회비 부과" rows={[['기준', '협회 가입일 다음 달부터'], ['금액', `${fWon(FB.협회비)} (70세↑ ${fWon(FB.협회비_70세)})`]]} />
        </div>
        <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--ink-2)', background: 'var(--blue-bg2)', border: '1px solid var(--blue-line)', borderRadius: 9, padding: '9px 13px' }}>
          관리번호 규칙 — 신규: <b className="mono">신yy-nn</b> · 양도양수: <b className="mono">양yy-nn</b>
        </div>
      </Card>

      {/* 예정자 표 */}
      <Card pad={0} style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>예정자 명단 <span style={{ color: 'var(--ink-3)', fontWeight: 600, fontSize: 13 }}>{fNum(pending.length)}건</span></span>
          <Button size="sm" variant="soft" icon="plus">예정자 등록</Button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                {['이름', '차량번호', '지역', '구분', '등록구분', '예상 부과', '진행 단계', '관리번호', '비고'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '11px 13px', fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pending.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--line-2)' }}>
                  <td style={{ ...td, fontWeight: 700 }}>{p.이름}</td>
                  <td style={td}><span className="mono" style={{ fontSize: 12.5, color: p.차량번호 === '미정' ? 'var(--ink-3)' : 'var(--ink)' }}>{p.차량번호}</span></td>
                  <td style={{ ...td, color: 'var(--ink-2)' }}>{p.지역원본}</td>
                  <td style={td}><Badge tone={p.회원구분 === '택배' ? 'orange' : 'gray'} size="sm">{p.회원구분}</Badge></td>
                  <td style={td}><Badge tone="gray" size="sm">{p.등록구분}</Badge></td>
                  <td style={td}><Badge tone={p.예상부과 === '협회비' ? 'blue' : 'orange'} size="sm">{p.예상부과}</Badge></td>
                  <td style={{ ...td, minWidth: 160 }}><StepBar idx={p.단계index} steps={steps} /></td>
                  <td style={td}><span className="mono" style={{ fontSize: 12.5, color: p.관리번호 === '-' ? 'var(--ink-3)' : 'var(--blue-strong)', fontWeight: 600 }}>{p.관리번호}</span></td>
                  <td style={{ ...td, fontSize: 12, color: 'var(--ink-3)' }}>{p.비고 || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StepBar({ idx, steps }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {steps.map((_, i) => (
        <div key={i} title={steps[i]} style={{ flex: 1, height: 6, borderRadius: 3, background: i <= idx ? 'var(--green)' : 'var(--line)' }} />
      ))}
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', marginLeft: 5, whiteSpace: 'nowrap' }}>{idx + 1}/{steps.length}</span>
    </div>
  );
}
function RouteCard({ tone, tag, head, rows }) {
  const c = { orange: 'var(--orange)', blue: 'var(--blue-strong)' }[tone];
  const bg = { orange: 'var(--orange-bg)', blue: 'var(--blue-bg)' }[tone];
  const line = { orange: 'var(--orange-line)', blue: 'var(--blue-line)' }[tone];
  return (
    <div style={{ border: `1px solid ${line}`, borderRadius: 11, overflow: 'hidden' }}>
      <div style={{ background: bg, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ background: c, color: '#fff', fontSize: 11.5, fontWeight: 800, padding: '2px 8px', borderRadius: 6 }}>{tag}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{head}</span>
      </div>
      <div style={{ padding: '10px 14px' }}>
        {rows.map(([k, v], i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12.5 }}>
            <span style={{ color: 'var(--ink-3)', fontWeight: 600 }}>{k}</span><span style={{ fontWeight: 700 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
const td = { padding: '10px 13px', whiteSpace: 'nowrap', fontSize: 13 };

Object.assign(window, { ClosureBoard, PendingBoard });
