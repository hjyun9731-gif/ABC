/* =========================================================================
   App — 사이드바 네비 + 전역 상태(회원/입금/예정자) + 드로어·모달 연결
   ========================================================================= */
const { buildDataset, formatNum: aNum } = window.AppData;

const NAV = [
  { key: 'dashboard', label: '대시보드', icon: 'dashboard' },
  { key: 'list', label: '미수금명단', icon: 'list', badge: 'main' },
  { key: 'bank', label: '통장매칭', icon: 'bank' },
  { key: 'closure', label: '폐업현황', icon: 'closed' },
  { key: 'pending', label: '신규 · 예정자', icon: 'plus' },
];

function App() {
  const DS = React.useMemo(() => buildDataset(), []);
  const [members, setMembers] = React.useState(DS.members);
  const [pending] = React.useState(DS.pending);
  const [deposits] = React.useState(DS.deposits);
  const [view, setView] = React.useState('dashboard');
  const [preset, setPreset] = React.useState(null);
  const [active, setActive] = React.useState(null);      // 드로어 회원
  const [closureFor, setClosureFor] = React.useState(null);
  const [paymentFor, setPaymentFor] = React.useState(null);
  const [monthPayment, setMonthPayment] = React.useState(8420000); // 이번달 수납 누적(데모 시작값)
  const [toast, setToast] = React.useState(null);

  const liveMember = active ? members.find((m) => m.id === active.id) : null;

  function go(v, p) { setView(v); setPreset(p ? { ...p, _t: Date.now() } : null); setActive(null); }
  function showToast(msg, tone = 'green') { setToast({ msg, tone }); setTimeout(() => setToast(null), 2600); }

  // ---- 데이터 변경 핸들러 ----
  function applyPayment(memberId, amount) {
    setMembers((ms) => ms.map((m) => {
      if (m.id !== memberId) return m;
      // 입금액으로 가능한 개월수 차감
      const k = Math.min(m.미수월수, Math.floor(amount / m.월부과액) || (amount > 0 ? 1 : 0));
      const 남은목록 = m.미수목록.slice(k);
      const removed = m.미수목록.slice(0, k);
      const newHist = [...m.납부이력, ...removed.map((x) => ({ ym: x.label, 항목: x.항목, 금액: x.금액, 방식: '통장매칭', 일자: '2026-06-10' }))];
      return { ...m, 미수목록: 남은목록, 미수월수: 남은목록.length, 미수금액: 남은목록.length * m.월부과액, 마지막납부월: '26.06', 납부이력: newHist.slice(-8), 장기미납: 남은목록.length >= 12, 고액: 남은목록.length * m.월부과액 >= 300000 };
    }));
    setMonthPayment((v) => v + amount);
  }
  function confirmPaymentModal({ amount }) {
    applyPayment(paymentFor.id, amount);
    showToast(`${paymentFor.이름} 수납 ${window.AppData.formatWon(amount)} 반영 완료`);
    setPaymentFor(null);
  }
  function confirmClosure(payload) {
    const target = closureFor;
    setMembers((ms) => ms.map((m) => m.id === target.id ? {
      ...m, 상태: payload.유형,
      처리정보: { 유형: payload.유형, 처리일: payload.처리일, 공문번호: payload.공문번호 || '미입력', 내용: payload.내용, 미납잔액: payload.미납잔액, 추후납부안내: payload.추후납부안내 },
    } : m));
    showToast(`${target.이름} ${payload.유형} 처리 — 미수금명단에서 제외${payload.추후납부안내 ? ' · 납부안내 대상 등록' : ''}`, 'red');
    setClosureFor(null);
    setActive(null);
  }
  function updateMemo(memberId, memo) {
    setMembers((ms) => ms.map((m) => m.id === memberId ? { ...m, 메모: memo } : m));
    showToast('메모가 저장되었습니다.', 'blue');
  }

  // 드로어 내 액션 라우팅
  function drawerClosure(_, m) { setClosureFor(m); }
  function drawerPayment(_, m) { setPaymentFor(m); }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* 사이드바 */}
      <aside style={{ width: 222, flex: 'none', background: '#fff', borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--blue-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="won" size={20} color="#fff" /></div>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}>미수금관리</div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 600 }}>강원 개인소형화물협회</div>
            </div>
          </div>
        </div>
        <nav style={{ padding: 12, flex: 1 }}>
          {NAV.map((n) => {
            const on = view === n.key;
            return (
              <button key={n.key} onClick={() => go(n.key)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 3,
                borderRadius: 9, border: 'none', background: on ? 'var(--blue-bg)' : 'transparent',
                color: on ? 'var(--blue-strong)' : 'var(--ink-2)', fontSize: 13.5, fontWeight: on ? 800 : 600, textAlign: 'left',
              }}>
                <Icon name={n.icon} size={18} color={on ? 'var(--blue-strong)' : 'var(--ink-3)'} />
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.badge === 'main' && <span style={{ fontSize: 9.5, fontWeight: 800, color: on ? 'var(--blue-strong)' : 'var(--ink-3)', background: on ? '#fff' : 'var(--surface-2)', padding: '2px 6px', borderRadius: 5 }}>MAIN</span>}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: 14, borderTop: '1px solid var(--line)', fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 700, color: 'var(--ink-2)' }}>2026년 6월 기준</div>
          전체 {aNum(members.length)}명 · 프로토타입 데이터
        </div>
      </aside>

      {/* 메인 */}
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {view === 'dashboard' && <Dashboard members={members} pending={pending} deposits={deposits} monthPayment={monthPayment} go={go} />}
        {view === 'list' && <ReceivablesList members={members} preset={preset} onOpenMember={setActive} />}
        {view === 'bank' && <BankMatching members={members} deposits={deposits} onApply={(id, amt) => { applyPayment(id, amt); }} go={go} />}
        {view === 'closure' && <ClosureBoard members={members} onOpenMember={setActive} go={go} />}
        {view === 'pending' && <PendingBoard pending={pending} go={go} />}
      </main>

      {/* 회원 상세 드로어 */}
      <MemberDrawer member={liveMember} onClose={() => setActive(null)} onClosure={drawerClosure} onPayment={drawerPayment} onMemo={updateMemo} />

      {/* 모달 */}
      <ClosureModal open={!!closureFor} member={closureFor} onClose={() => setClosureFor(null)} onConfirm={confirmClosure} />
      <PaymentModal open={!!paymentFor} member={paymentFor} onClose={() => setPaymentFor(null)} onConfirm={confirmPaymentModal} />

      {/* 토스트 */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 26, left: '50%', transform: 'translateX(-50%)', zIndex: 300,
          display: 'flex', alignItems: 'center', gap: 9, padding: '12px 20px', borderRadius: 11,
          background: toast.tone === 'red' ? 'var(--red)' : toast.tone === 'blue' ? 'var(--blue-strong)' : 'var(--green)',
          color: '#fff', boxShadow: '0 10px 34px rgba(20,28,46,.3)', fontSize: 13.5, fontWeight: 700,
        }}>
          <Icon name="check" size={17} />{toast.msg}
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
