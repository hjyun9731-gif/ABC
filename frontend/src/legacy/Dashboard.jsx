/* =========================================================================
   대시보드 — 현황 + 우선처리 대상 + 최근 작업. 각 항목 클릭 → 해당 화면/필터 이동
   ========================================================================= */
const { formatWon: dWon, formatNum: dNum, BILLING } = window.AppData;

function Dashboard({ members, pending, deposits, monthPayment, go }) {
  const stats = React.useMemo(() => {
    const active = members.filter((m) => m.상태 === '정상');
    const 미수자 = active.filter((m) => m.미수금액 > 0);
    const 총미수 = 미수자.reduce((s, m) => s + m.미수금액, 0);
    const 관리비대상 = active.filter((m) => m.가입여부 === '협회미가입');
    const 협회비대상 = active.filter((m) => m.가입여부 === '협회가입');
    const 신규부과 = active.filter((m) => m.부과시작월 >= '25.07').length; // 최근 1년 내 부과 시작
    const 감면 = 협회비대상.filter((m) => m.연령 >= 70);
    const 장기 = active.filter((m) => m.장기미납);
    const 고액 = active.filter((m) => m.고액);
    const 결번 = active.filter((m) => m.결번);
    const 미발급 = active.filter((m) => m.자격증명미발급);
    const 폐업등 = members.filter((m) => m.상태 !== '정상');
    const 매칭대기 = deposits.filter((d) => ['대기', '미매칭', '중복', '확인필요'].includes(d.상태) && !d._exclude);
    const 납부안내대상 = 폐업등.filter((m) => m.처리정보 && m.처리정보.추후납부안내);
    // 지역 분포 top
    const byReg = {};
    미수자.forEach((m) => { byReg[m.시군] = (byReg[m.시군] || 0) + 1; });
    const regTop = Object.entries(byReg).sort((a, b) => b[1] - a[1]).slice(0, 6);
    // 미수월 분포
    const bucket = { '1-3': 0, '4-11': 0, '12-23': 0, '24+': 0 };
    미수자.forEach((m) => { const n = m.미수월수; if (n <= 3) bucket['1-3']++; else if (n <= 11) bucket['4-11']++; else if (n <= 23) bucket['12-23']++; else bucket['24+']++; });
    return { active, 미수자, 총미수, 관리비대상, 협회비대상, 신규부과, 감면, 장기, 고액, 결번, 미발급, 폐업등, 매칭대기, 납부안내대상, regTop, bucket };
  }, [members, deposits]);

  return (
    <div style={{ padding: '20px 26px 44px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>대시보드</div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 3 }}>2026년 6월 기준 · 현황을 보고 → 대상자를 찾고 → 바로 처리하는 화면</div>
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: 12.5, color: 'var(--ink-2)', alignItems: 'center' }}>
          <Badge tone="blue">관리비 {dWon(BILLING.관리비)}</Badge>
          <Badge tone="blue">협회비 {dWon(BILLING.협회비)}</Badge>
          <Badge tone="purple">70세↑ 협회비 {dWon(BILLING.협회비_70세)}</Badge>
        </div>
      </div>

      {/* 1. 오늘/이번달 요약 — 큰 4칸 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 14 }}>
        <BigStat icon="user" tone="blue" label="총 회원수" value={dNum(stats.active.length) + '명'} sub="정상 회원" />
        <BigStat icon="alert" tone="red" label="미수 인원" value={dNum(stats.미수자.length) + '명'} sub={`전체의 ${Math.round(stats.미수자.length / stats.active.length * 100)}%`} onClick={() => go('list', { scope: '미수있음' })} />
        <BigStat icon="won" tone="orange" label="총 미수금액" value={dWon(stats.총미수)} sub="정상 회원 기준" onClick={() => go('list', { scope: '미수있음' })} />
        <BigStat icon="check" tone="green" label="이번달 수납액" value={dWon(monthPayment)} sub="6월 누적" onClick={() => go('bank')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* 2. 부과 현황 */}
        <Card>
          <SectionTitle tone="blue" icon="calendar">부과 현황</SectionTitle>
          <MiniRow label="관리비 부과" value={dNum(stats.관리비대상.length) + '명'} tone="orange" onClick={() => go('list', { scope: '전체', 가입: '협회미가입' })} />
          <MiniRow label="협회비 부과" value={dNum(stats.협회비대상.length) + '명'} tone="blue" onClick={() => go('list', { scope: '전체', 가입: '협회가입' })} />
          <MiniRow label="최근 신규 부과(1년)" value={dNum(stats.신규부과) + '명'} tone="green" onClick={() => go('pending')} />
          <MiniRow label="70세 이상 감면" value={dNum(stats.감면.length) + '명'} tone="purple" last />
        </Card>
        {/* 3. 주의 대상 */}
        <Card>
          <SectionTitle tone="orange" icon="alert">주의 대상</SectionTitle>
          <MiniRow label="장기 미납 (12개월↑)" value={dNum(stats.장기.length) + '명'} tone="orange" onClick={() => go('list', { special: '장기미납', scope: '미수있음' })} />
          <MiniRow label="30만원 이상 미납" value={dNum(stats.고액.length) + '명'} tone="red" onClick={() => go('list', { special: '고액', scope: '미수있음' })} />
          <MiniRow label="결번 · 반송" value={dNum(stats.결번.length) + '명'} tone="gray" onClick={() => go('list', { special: '결번', scope: '전체' })} />
          <MiniRow label="자격증명 미발급" value={dNum(stats.미발급.length) + '명'} tone="purple" onClick={() => go('list', { special: '자격증명미발급', scope: '전체' })} last />
        </Card>
        {/* 4. 처리 대기 */}
        <Card>
          <SectionTitle tone="purple" icon="clock">처리 대기</SectionTitle>
          <MiniRow label="예정자 등록" value={dNum(pending.length) + '건'} tone="blue" onClick={() => go('pending')} />
          <MiniRow label="폐업 · 양도 · 이관" value={dNum(stats.폐업등.length) + '건'} tone="red" onClick={() => go('closure')} />
          <MiniRow label="통장매칭 미확인" value={dNum(stats.매칭대기.length) + '건'} tone="orange" onClick={() => go('bank')} />
          <MiniRow label="추후 납부 안내 대상" value={dNum(stats.납부안내대상.length) + '명'} tone="green" onClick={() => go('closure')} last />
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 14 }}>
        {/* 6. 분포 / 비교 */}
        <Card>
          <SectionTitle tone="blue" icon="dashboard">분포 · 비교</SectionTitle>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 8 }}>미수 인원 지역별 (상위)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
            {stats.regTop.map(([reg, n]) => {
              const max = stats.regTop[0][1];
              return (
                <div key={reg} onClick={() => go('list', { sigun: reg, scope: '미수있음' })} style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
                  <span style={{ width: 56, fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)' }}>{reg}</span>
                  <div style={{ flex: 1, height: 16, background: 'var(--surface-2)', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ width: `${n / max * 100}%`, height: '100%', background: 'var(--blue-strong)', borderRadius: 5, opacity: .85 }} />
                  </div>
                  <span className="tnum" style={{ width: 38, textAlign: 'right', fontSize: 12.5, fontWeight: 700 }}>{dNum(n)}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <DistBox title="개인 / 택배" a={['개인', stats.active.filter((m) => m.회원구분 === '개인').length]} b={['택배', stats.active.filter((m) => m.회원구분 === '택배').length]} ca="var(--ink-2)" cb="var(--orange)" />
            <DistBox title="가입 / 미가입" a={['가입', stats.협회비대상.length]} b={['미가입', stats.관리비대상.length]} ca="var(--blue-strong)" cb="var(--ink-3)" />
          </div>
        </Card>

        {/* 미수월 분포 + 5. 최근 내역 */}
        <Card>
          <SectionTitle tone="orange" icon="clock">미수월 분포 · 최근 내역</SectionTitle>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {Object.entries(stats.bucket).map(([k, v], i) => {
              const tone = ['var(--green)', 'var(--blue-strong)', 'var(--orange)', 'var(--red)'][i];
              const max = Math.max(...Object.values(stats.bucket));
              return (
                <div key={k} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ height: 70, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div style={{ width: '60%', height: `${Math.max(8, v / max * 100)}%`, background: tone, borderRadius: '5px 5px 0 0', opacity: .85 }} />
                  </div>
                  <div className="tnum" style={{ fontSize: 14, fontWeight: 800, marginTop: 5 }}>{dNum(v)}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>{k}개월</div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 7 }}>최근 작업</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <RecentRow tone="green" icon="won" text="통장매칭 수납 22건 반영" time="오늘" />
            <RecentRow tone="red" icon="closed" text={`폐업 처리 ${stats.폐업등.length}건 · 폐업현황 이동`} time="이번달" onClick={() => go('closure')} />
            <RecentRow tone="blue" icon="plus" text={`예정자 ${pending.length}건 등록 대기`} time="이번달" onClick={() => go('pending')} />
            <RecentRow tone="orange" icon="edit" text="미수 부과내역 갱신 (2026-06)" time="이번달" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function BigStat({ icon, tone, label, value, sub, onClick }) {
  const c = { blue: 'var(--blue-strong)', red: 'var(--red)', orange: 'var(--orange)', green: 'var(--green)' }[tone];
  const bg = { blue: 'var(--blue-bg)', red: 'var(--red-bg)', orange: 'var(--orange-bg)', green: 'var(--green-bg)' }[tone];
  return (
    <Card pad={16} onClick={onClick} hover={!!onClick} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={18} color={c} /></div>
      </div>
      <div style={{ fontSize: 25, fontWeight: 800, marginTop: 8, color: 'var(--ink)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }} className="tnum">{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
        {sub}{onClick && <span style={{ color: c, fontWeight: 700, marginLeft: 'auto', display: 'inline-flex', alignItems: 'center' }}>바로가기 <Icon name="chevron" size={12} /></span>}
      </div>
    </Card>
  );
}

function MiniRow({ label, value, tone, onClick, last }) {
  const c = { blue: 'var(--blue-strong)', red: 'var(--red)', orange: 'var(--orange)', green: 'var(--green)', purple: 'var(--purple)', gray: 'var(--ink-2)' }[tone];
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 4px',
      borderBottom: last ? 'none' : '1px dashed var(--line-2)', cursor: onClick ? 'pointer' : 'default',
    }}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.background = 'var(--surface-2)')}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
      <span style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, background: c, flex: 'none' }} />{label}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 'none' }}>
        <span style={{ fontSize: 14.5, fontWeight: 800, color: c, whiteSpace: 'nowrap' }} className="tnum">{value}</span>
        {onClick && <Icon name="chevron" size={14} color="var(--ink-3)" />}
      </span>
    </div>
  );
}
function DistBox({ title, a, b, ca, cb }) {
  const total = a[1] + b[1];
  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 9, padding: 11 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 7 }}>{title}</div>
      <div style={{ display: 'flex', height: 9, borderRadius: 5, overflow: 'hidden', marginBottom: 7 }}>
        <div style={{ width: `${a[1] / total * 100}%`, background: ca }} />
        <div style={{ width: `${b[1] / total * 100}%`, background: cb }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: ca, fontWeight: 700 }}>{a[0]} {dNum(a[1])}</span>
        <span style={{ color: cb, fontWeight: 700 }}>{b[0]} {dNum(b[1])}</span>
      </div>
    </div>
  );
}
function RecentRow({ tone, icon, text, time, onClick }) {
  const c = { blue: 'var(--blue-strong)', red: 'var(--red)', orange: 'var(--orange)', green: 'var(--green)' }[tone];
  const bg = { blue: 'var(--blue-bg)', red: 'var(--red-bg)', orange: 'var(--orange-bg)', green: 'var(--green-bg)' }[tone];
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px', borderRadius: 8, cursor: onClick ? 'pointer' : 'default', background: 'var(--surface-2)' }}>
      <div style={{ width: 26, height: 26, borderRadius: 7, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Icon name={icon} size={15} color={c} /></div>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', flex: 1 }}>{text}</span>
      <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{time}</span>
      {onClick && <Icon name="chevron" size={14} color="var(--ink-3)" />}
    </div>
  );
}

window.Dashboard = Dashboard;
