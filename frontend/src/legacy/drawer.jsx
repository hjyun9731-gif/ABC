/* =========================================================================
   회원 상세 드로어 + 처리 모달 (폐업 등록 / 수납 반영 / 메모)
   미수금명단 = 회원관리 화면 의 핵심. 대시보드/명단 어디서든 같은 드로어 사용.
   ========================================================================= */
const { formatWon, formatNum } = window.AppData;

/* ---------------- 폐업/이탈 등록 모달 ---------------- */
function ClosureModal({ open, member, onClose, onConfirm }) {
  const [유형, set유형] = React.useState('폐업');
  const [공문번호, set공문] = React.useState('');
  const [처리일, set처리일] = React.useState('2026-06-10');
  const [내용, set내용] = React.useState('');
  const [납부안내, set납부안내] = React.useState(true);
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    if (open) { set유형('폐업'); set공문(''); set처리일('2026-06-10'); set내용(''); set납부안내(true); setTouched(false); }
  }, [open, member]);
  if (!member) return null;

  const 미납 = member.미수금액;
  const 내용필수미입력 = 내용.trim().length === 0;

  const field = { width: '100%', padding: '9px 11px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13.5, fontFamily: 'inherit', color: 'var(--ink)', background: '#fff' };

  return (
    <Modal open={open} onClose={onClose} title="폐업 · 이탈 등록" width={560}
      footer={<>
        <Button variant="ghost" onClick={onClose}>취소</Button>
        <Button variant="primary" icon="check"
          onClick={() => { setTouched(true); if (내용필수미입력) return; onConfirm({ 유형, 공문번호, 처리일, 내용, 추후납부안내: 미납 > 0 && 납부안내, 미납잔액: 미납 }); }}>
          {유형} 처리 완료
        </Button>
      </>}>
      {/* 대상 회원 요약 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 10, marginBottom: 16 }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="user" size={20} color="var(--blue-strong)" /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{member.이름} <span style={{ color: 'var(--ink-3)', fontWeight: 600, fontSize: 13 }} className="mono">{member.관리번호}</span></div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{member.차량번호} · {member.지역원본} · {member.연락처}</div>
        </div>
        {미납 > 0
          ? <Badge tone="red">미수 {formatWon(미납)}</Badge>
          : <Badge tone="green">미수금 없음</Badge>}
      </div>

      {/* 흐름 안내 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-2)', marginBottom: 14, flexWrap: 'wrap' }}>
        {['시청 폐업공문 접수', '폐업현황으로 이동', '미수금명단에서 제외'].map((t, i) => (
          <React.Fragment key={i}>
            <span style={{ background: 'var(--blue-bg)', color: 'var(--blue-strong)', padding: '3px 9px', borderRadius: 6, fontWeight: 600 }}>{t}</span>
            {i < 2 && <Icon name="arrowRight" size={13} color="var(--ink-3)" />}
          </React.Fragment>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={lblS}>처리 유형</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {['폐업', '양도', '이관', '탈퇴'].map((t) => (
              <button key={t} onClick={() => set유형(t)} style={{
                flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 700,
                border: `1px solid ${유형 === t ? 'var(--blue-strong)' : 'var(--line)'}`,
                background: 유형 === t ? 'var(--blue-bg)' : '#fff', color: 유형 === t ? 'var(--blue-strong)' : 'var(--ink-2)',
              }}>{t}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={lblS}>처리일</label>
          <input type="date" value={처리일} onChange={(e) => set처리일(e.target.value)} style={field} />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={lblS}>공문번호 <span style={{ color: 'var(--ink-3)', fontWeight: 500 }}>(시청 폐업공문)</span></label>
        <input value={공문번호} onChange={(e) => set공문(e.target.value)} placeholder="예: 강원시청-2026-123" style={field} />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={lblS}>처리 내용 <span style={{ color: 'var(--red)', fontWeight: 700 }}>* 필수</span></label>
        <textarea value={내용} onChange={(e) => set내용(e.target.value)} rows={3}
          placeholder="미수금이 없어도 처리 내용은 반드시 입력해야 합니다. (예: 시청 폐업공문 접수, 본인 폐업 신청 등)"
          style={{ ...field, resize: 'vertical', borderColor: touched && 내용필수미입력 ? 'var(--red)' : 'var(--line)' }} />
        {touched && 내용필수미입력 && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4, fontWeight: 600 }}>처리 내용은 미수금 유무와 관계없이 반드시 입력해야 합니다.</div>}
      </div>

      {/* 미수금 있으면 납부안내 대상 */}
      {미납 > 0 && (
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '11px 13px', background: 'var(--orange-bg)', border: '1px solid var(--orange-line)', borderRadius: 10, cursor: 'pointer', marginTop: 6 }}>
          <input type="checkbox" checked={납부안내} onChange={(e) => set납부안내(e.target.checked)} style={{ marginTop: 2, accentColor: 'var(--orange)' }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--orange)', fontSize: 13.5 }}>미납금 추후 납부 안내 대상으로 남기기</div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>미수금 <b className="tnum">{formatWon(미납)}</b> 잔여. 폐업 처리 후에도 추후 연락하여 납부를 안내합니다.</div>
          </div>
        </label>
      )}
    </Modal>
  );
}
const lblS = { display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 6 };

/* ---------------- 수납(납부) 반영 모달 ---------------- */
function PaymentModal({ open, member, onClose, onConfirm }) {
  const [months, setMonths] = React.useState(1);
  React.useEffect(() => { if (open && member) setMonths(Math.min(member.미수월수, 1) || 0); }, [open, member]);
  if (!member) return null;
  const amount = months * member.월부과액;
  const field = { width: '100%', padding: '9px 11px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13.5 };
  return (
    <Modal open={open} onClose={onClose} title="수납 반영" width={460}
      footer={<>
        <Button variant="ghost" onClick={onClose}>취소</Button>
        <Button variant="success" icon="check" disabled={months <= 0}
          onClick={() => onConfirm({ months, amount })}>수납 처리</Button>
      </>}>
      <div style={{ marginBottom: 14, fontSize: 13.5 }}>
        <b>{member.이름}</b> · 미수 {member.미수월수}개월 · 월 {formatWon(member.월부과액)} ({member.항목})
      </div>
      <label style={lblS}>납부 개월수</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <input type="range" min={0} max={member.미수월수} value={months} onChange={(e) => setMonths(+e.target.value)} style={{ flex: 1, accentColor: 'var(--green)' }} />
        <input type="number" min={0} max={member.미수월수} value={months} onChange={(e) => setMonths(Math.max(0, Math.min(member.미수월수, +e.target.value)))} style={{ ...field, width: 70, textAlign: 'center' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--green-bg)', border: '1px solid var(--green-line)', borderRadius: 10 }}>
        <span style={{ fontWeight: 700, color: 'var(--ink-2)' }}>수납 금액</span>
        <span style={{ fontWeight: 800, color: 'var(--green)', fontSize: 18 }} className="tnum">{formatWon(amount)}</span>
      </div>
    </Modal>
  );
}

/* ---------------- 회원 상세 드로어 ---------------- */
function MemberDrawer({ member, onClose, onClosure, onPayment, onMemo }) {
  const [memoEdit, setMemoEdit] = React.useState(false);
  const [memoVal, setMemoVal] = React.useState('');
  React.useEffect(() => { if (member) { setMemoEdit(false); setMemoVal(member.메모 || ''); } }, [member]);

  const open = !!member;
  return (
    <>
      {/* dim */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: open ? 'rgba(20,28,46,.32)' : 'transparent',
        pointerEvents: open ? 'auto' : 'none', transition: 'background .2s', zIndex: 150,
      }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100vh', width: 480, maxWidth: '94vw',
        background: 'var(--surface-2)', boxShadow: '-12px 0 40px rgba(20,28,46,.18)', zIndex: 160,
        transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform .26s cubic-bezier(.4,0,.2,1)',
        display: 'flex', flexDirection: 'column',
      }}>
        {member && <DrawerInner key={member.id} member={member} onClose={onClose} onClosure={onClosure} onPayment={onPayment}
          onMemo={onMemo} memoEdit={memoEdit} setMemoEdit={setMemoEdit} memoVal={memoVal} setMemoVal={setMemoVal} />}
      </div>
    </>
  );
}

function DrawerInner({ member: m, onClose, onClosure, onPayment, onMemo, memoEdit, setMemoEdit, memoVal, setMemoVal }) {
  return (
    <>
      {/* header */}
      <div style={{ padding: '18px 22px 14px', background: '#fff', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 11, background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="user" size={24} color="var(--blue-strong)" /></div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 19, fontWeight: 800 }}>{m.이름}</span>
                <Badge tone={statusTone(m.상태)}>{m.상태}</Badge>
                {m.연령 >= 70 && <Badge tone="purple" size="sm">70세↑</Badge>}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 3 }} className="mono">{m.관리번호} · {m.차량번호}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', padding: 4, display: 'flex' }}><Icon name="close" size={22} /></button>
        </div>
        {/* 미수 요약 배너 */}
        <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, padding: '11px 14px', borderRadius: 10, background: m.미수금액 > 0 ? 'var(--red-bg)' : 'var(--green-bg)', border: `1px solid ${m.미수금액 > 0 ? 'var(--red-line)' : 'var(--green-line)'}` }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-2)' }}>미수금액</div>
            <div style={{ fontSize: 21, fontWeight: 800, color: m.미수금액 > 0 ? 'var(--red)' : 'var(--green)', marginTop: 1 }} className="tnum">{formatWon(m.미수금액)}</div>
          </div>
          <div style={{ flex: 1, padding: '11px 14px', borderRadius: 10, background: '#fff', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-2)' }}>미수 개월</div>
            <div style={{ fontSize: 21, fontWeight: 800, marginTop: 1 }} className="tnum">{m.미수월수}<span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-3)' }}> 개월</span></div>
          </div>
        </div>
        {/* 주의 플래그 */}
        {(m.장기미납 || m.고액 || m.결번 || m.자격증명미발급) && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {m.고액 && <Badge tone="red" size="sm">30만원 이상</Badge>}
            {m.장기미납 && <Badge tone="orange" size="sm">장기 미납</Badge>}
            {m.결번 && <Badge tone="gray" size="sm">결번 · 반송</Badge>}
            {m.자격증명미발급 && <Badge tone="purple" size="sm">자격증명 미발급</Badge>}
          </div>
        )}
      </div>

      {/* body scroll */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
        {/* 1. 회원정보 */}
        <Card pad={15} style={{ marginBottom: 12 }}>
          <DSubTitle icon="user" tone="blue">회원정보</DSubTitle>
          <KV label="이름">{m.이름}</KV>
          <KV label="차량번호" mono>{m.차량번호}</KV>
          <KV label="지역(원본)">{m.지역원본} <span style={{ color: 'var(--ink-3)', fontWeight: 500 }}>→ {m.시군}</span></KV>
          <KV label="연락처" mono>{m.연락처} {m.결번 && <Badge tone="red" size="sm">결번</Badge>}</KV>
          <KV label="관리번호" mono>{m.관리번호} <Badge tone="gray" size="sm">{m.등록구분}</Badge></KV>
          <KV label="회원구분">{m.회원구분} · {m.가입여부 === '협회가입' ? <Badge tone="blue" size="sm">협회가입</Badge> : <Badge tone="gray" size="sm">협회미가입</Badge>}</KV>
        </Card>

        {/* 2. 부과기준 */}
        <Card pad={15} style={{ marginBottom: 12 }}>
          <DSubTitle icon="calendar" tone="green">부과기준 정보</DSubTitle>
          <KV label="자격증명 발급">{m.자격증명발급일}</KV>
          <KV label="협회 가입일">{m.협회가입일 || '—'}</KV>
          <KV label="부과 시작월">{m.부과시작월} <span style={{ color: 'var(--ink-3)', fontWeight: 500, fontSize: 12 }}>({m.가입여부 === '협회가입' ? '가입일' : '발급일'} 다음 달부터)</span></KV>
          <KV label="부과 항목"><Badge tone={chargeTone(m.항목)}>{m.항목}</Badge> 월 <b className="tnum">{formatWon(m.월부과액)}</b>{m.연령 >= 70 && m.항목 === '협회비' && <span style={{ color: 'var(--purple)', fontSize: 12 }}> (70세 인하)</span>}</KV>
        </Card>

        {/* 3. 미수 상세 */}
        <Card pad={15} style={{ marginBottom: 12 }}>
          <DSubTitle icon="won" tone="orange">미수 상세</DSubTitle>
          <KV label="마지막 납부">{m.마지막납부월}</KV>
          {m.미수목록.length > 0 ? (
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {m.미수목록.map((x) => (
                <span key={x.ym} className="tnum" style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--red)', background: 'var(--red-bg)', border: '1px solid var(--red-line)', borderRadius: 6, padding: '3px 7px' }}>{x.label}</span>
              ))}
            </div>
          ) : <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700, marginTop: 6 }}>미수 없음 · 완납</div>}
          {/* 납부이력 */}
          <div style={{ marginTop: 14, fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 6 }}>납부 이력</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {m.납부이력.length === 0 && <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>이력 없음</span>}
            {m.납부이력.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, padding: '5px 9px', background: 'var(--surface-2)', borderRadius: 7 }}>
                <span><b className="tnum">{h.ym}</b> · {h.항목}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Badge tone={h.방식 === '통장매칭' ? 'blue' : 'gray'} size="sm">{h.방식}</Badge><span className="tnum" style={{ fontWeight: 700 }}>{formatWon(h.금액)}</span></span>
              </div>
            ))}
          </div>
        </Card>

        {/* 4. 메모 */}
        <Card pad={15} style={{ marginBottom: 12 }}>
          <DSubTitle icon="memo" tone="purple" right={<button onClick={() => setMemoEdit(!memoEdit)} style={{ background: 'none', border: 'none', color: 'var(--blue-strong)', fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="edit" size={13} />{memoEdit ? '취소' : '수정'}</button>}>메모</DSubTitle>
          {memoEdit ? (
            <div>
              <textarea value={memoVal} onChange={(e) => setMemoVal(e.target.value)} rows={3} style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }} />
              <div style={{ textAlign: 'right', marginTop: 6 }}><Button size="sm" variant="primary" onClick={() => { onMemo(m.id, memoVal); setMemoEdit(false); }}>저장</Button></div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: m.메모 ? 'var(--ink)' : 'var(--ink-3)', lineHeight: 1.6 }}>{m.메모 || '메모 없음'}</div>
          )}
        </Card>

        {/* 수정이력 */}
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', padding: '2px 4px' }}>
          최근 수정: {m.수정이력[m.수정이력.length - 1].일시} · {m.수정이력[m.수정이력.length - 1].내용}
        </div>
      </div>

      {/* footer 바로 처리 기능 */}
      <div style={{ padding: '13px 18px', background: '#fff', borderTop: '1px solid var(--line)' }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-3)', marginBottom: 8 }}>바로 처리</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="success" icon="won" style={{ flex: 1 }} disabled={m.미수금액 <= 0 || m.상태 !== '정상'} onClick={() => onPayment('open', m)}>수납 반영</Button>
          <Button variant="danger" icon="closed" style={{ flex: 1 }} disabled={m.상태 !== '정상'} onClick={() => onClosure('open', m)}>폐업 · 이탈 등록</Button>
        </div>
        {m.상태 !== '정상' && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8, textAlign: 'center' }}>이미 {m.상태} 처리된 회원입니다 · 폐업현황에서 관리</div>}
      </div>
    </>
  );
}

function DSubTitle({ icon, tone = 'blue', children, right }) {
  const c = { blue: 'var(--blue-strong)', green: 'var(--green)', orange: 'var(--orange)', purple: 'var(--purple)' }[tone];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <Icon name={icon} size={16} color={c} />
        <span style={{ fontSize: 13.5, fontWeight: 800 }}>{children}</span>
      </div>
      {right}
    </div>
  );
}

Object.assign(window, { ClosureModal, PaymentModal, MemberDrawer });
