/* =========================================================================
   미수금명단 (회원관리형) — 검색 / 필터 / 표 / 엑셀 / 상세 드로어 연결
   ========================================================================= */
const { SIGUN: ALL_SIGUN, formatWon: won, formatNum: num } = window.AppData;

const PER_PAGE = 40;

function ReceivablesList({ members, preset, onOpenMember }) {
  const [q, setQ] = React.useState('');
  const [sigun, setSigun] = React.useState('전체');
  const [구분, set구분] = React.useState('전체');     // 개인/택배
  const [가입, set가입] = React.useState('전체');     // 협회가입/미가입
  const [scope, setScope] = React.useState('미수있음'); // 미수있음/완납/전체
  const [special, setSpecial] = React.useState(null);   // 30만원이상/장기미납/결번 등
  const [sortKey, setSortKey] = React.useState('미수금액');
  const [sortDir, setSortDir] = React.useState('desc');
  const [page, setPage] = React.useState(1);

  // 대시보드에서 넘어온 preset 적용
  React.useEffect(() => {
    if (!preset) return;
    setSpecial(preset.special || null);
    if (preset.scope) setScope(preset.scope);
    if (preset.sigun) setSigun(preset.sigun);
    if (preset.q != null) setQ(preset.q);
    setPage(1);
  }, [preset]);

  React.useEffect(() => { setPage(1); }, [q, sigun, 구분, 가입, scope, special]);

  // ---- 필터 ----
  const filtered = React.useMemo(() => {
    let arr = members.filter((m) => m.상태 === '정상'); // 폐업 등은 미수금명단 제외
    if (scope === '미수있음') arr = arr.filter((m) => m.미수금액 > 0);
    else if (scope === '완납') arr = arr.filter((m) => m.미수금액 === 0);
    if (sigun !== '전체') arr = arr.filter((m) => m.시군 === sigun);
    if (구분 !== '전체') arr = arr.filter((m) => m.회원구분 === 구분);
    if (가입 !== '전체') arr = arr.filter((m) => m.가입여부 === 가입);
    if (special === '고액') arr = arr.filter((m) => m.고액);
    else if (special === '장기미납') arr = arr.filter((m) => m.장기미납);
    else if (special === '결번') arr = arr.filter((m) => m.결번);
    else if (special === '자격증명미발급') arr = arr.filter((m) => m.자격증명미발급);
    if (q.trim()) {
      const k = q.trim().toLowerCase();
      arr = arr.filter((m) => m.이름.includes(k) || m.차량번호.toLowerCase().includes(k) || m.관리번호.toLowerCase().includes(k) || m.연락처.includes(k) || m.지역원본.includes(k));
    }
    arr = [...arr].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'string') { av = av || ''; bv = bv || ''; return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av); }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return arr;
  }, [members, scope, sigun, 구분, 가입, special, q, sortKey, sortDir]);

  const total = filtered.length;
  const totalAmt = React.useMemo(() => filtered.reduce((s, m) => s + m.미수금액, 0), [filtered]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function toggleSort(k) {
    if (sortKey === k) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
  }
  function exportCSV() {
    const head = ['관리번호', '이름', '차량번호', '지역(원본)', '시군', '회원구분', '가입여부', '연락처', '부과항목', '미수월', '미수금액', '마지막납부', '상태'];
    const lines = [head.join(',')];
    filtered.forEach((m) => lines.push([m.관리번호, m.이름, m.차량번호, m.지역원본, m.시군, m.회원구분, m.가입여부, m.연락처, m.항목, m.미수월수, m.미수금액, m.마지막납부월, m.상태].join(',')));
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '미수금명단_2026-06.csv'; a.click();
  }
  function reset() { setQ(''); setSigun('전체'); set구분('전체'); set가입('전체'); setScope('미수있음'); setSpecial(null); }

  const selStyle = { padding: '8px 11px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#fff', fontFamily: 'inherit', color: 'var(--ink)', fontWeight: 600 };

  return (
    <div style={{ padding: '20px 26px 40px' }}>
      {/* 페이지 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>미수금명단</div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 3 }}>회원정보 · 부과기준 · 미수상세 · 바로처리를 한 화면에서 — 행을 클릭하면 회원 카드가 열립니다.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="default" icon="refresh" size="md" onClick={reset}>필터 초기화</Button>
          <Button variant="soft" icon="excel" size="md" onClick={exportCSV}>엑셀 다운로드</Button>
        </div>
      </div>

      {/* 요약 띠 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <SummaryPill label="검색 결과" value={num(total) + '명'} tone="blue" />
        <SummaryPill label="미수금 합계" value={won(totalAmt)} tone="red" />
        <SummaryPill label="평균 미수" value={won(total ? Math.round(totalAmt / total) : 0)} tone="orange" />
      </div>

      {/* 필터 바 */}
      <Card pad={14} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* 검색 */}
          <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 220 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}><Icon name="search" size={17} /></span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름 · 차량번호 · 관리번호 · 연락처 · 지역 검색"
              style={{ width: '100%', padding: '9px 11px 9px 35px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13.5, fontFamily: 'inherit' }} />
          </div>
          {/* 시군 (강원 18 시군) */}
          <select value={sigun} onChange={(e) => setSigun(e.target.value)} style={selStyle}>
            <option value="전체">전체 시·군</option>
            {ALL_SIGUN.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={구분} onChange={(e) => set구분(e.target.value)} style={selStyle}>
            <option value="전체">개인/택배</option><option value="개인">개인</option><option value="택배">택배</option>
          </select>
          <select value={가입} onChange={(e) => set가입(e.target.value)} style={selStyle}>
            <option value="전체">가입여부</option><option value="협회가입">협회가입</option><option value="협회미가입">협회미가입</option>
          </select>
        </div>
        {/* 빠른 칩 */}
        <div style={{ display: 'flex', gap: 7, marginTop: 11, flexWrap: 'wrap', alignItems: 'center' }}>
          {[['미수있음', '미수있음'], ['완납', '완납'], ['전체', '전체']].map(([lbl, val]) => (
            <Chip key={val} active={scope === val} onClick={() => setScope(val)}>{lbl}</Chip>
          ))}
          <span style={{ width: 1, height: 18, background: 'var(--line)', margin: '0 3px' }} />
          <Chip active={special === '고액'} tone="red" onClick={() => setSpecial(special === '고액' ? null : '고액')}>30만원 이상</Chip>
          <Chip active={special === '장기미납'} tone="orange" onClick={() => setSpecial(special === '장기미납' ? null : '장기미납')}>장기 미납(12개월↑)</Chip>
          <Chip active={special === '결번'} tone="gray" onClick={() => setSpecial(special === '결번' ? null : '결번')}>결번 · 반송</Chip>
          <Chip active={special === '자격증명미발급'} tone="purple" onClick={() => setSpecial(special === '자격증명미발급' ? null : '자격증명미발급')}>자격증명 미발급</Chip>
        </div>
      </Card>

      {/* 표 */}
      <Card pad={0} style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 1040 }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                <Th>관리번호</Th>
                <Th sortable onClick={() => toggleSort('이름')} dir={sortKey === '이름' ? sortDir : null}>회원</Th>
                <Th>차량번호</Th>
                <Th>지역(원본)</Th>
                <Th>구분</Th>
                <Th>연락처</Th>
                <Th>부과항목</Th>
                <Th sortable right onClick={() => toggleSort('미수월수')} dir={sortKey === '미수월수' ? sortDir : null}>미수월</Th>
                <Th sortable right onClick={() => toggleSort('미수금액')} dir={sortKey === '미수금액' ? sortDir : null}>미수금액</Th>
                <Th>마지막납부</Th>
                <Th right>처리</Th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((m) => (
                <tr key={m.id} onClick={() => onOpenMember(m)}
                  style={{ borderBottom: '1px solid var(--line-2)', cursor: 'pointer', transition: 'background .1s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--blue-bg2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <Td><span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)' }}>{m.관리번호}</span></Td>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontWeight: 700 }}>{m.이름}</span>
                      {m.연령 >= 70 && <Badge tone="purple" size="sm">70↑</Badge>}
                      {m.고액 && <Badge tone="red" size="sm">고액</Badge>}
                    </div>
                  </Td>
                  <Td><span className="mono" style={{ fontSize: 12.5 }}>{m.차량번호}</span></Td>
                  <Td><span style={{ color: 'var(--ink-2)' }}>{m.지역원본}</span></Td>
                  <Td>
                    <span style={{ display: 'inline-flex', gap: 4 }}>
                      <Badge tone={m.회원구분 === '택배' ? 'orange' : 'gray'} size="sm">{m.회원구분}</Badge>
                      <Badge tone={m.가입여부 === '협회가입' ? 'blue' : 'gray'} size="sm">{m.가입여부 === '협회가입' ? '가입' : '미가입'}</Badge>
                    </span>
                  </Td>
                  <Td><span className="mono" style={{ fontSize: 12.5, color: m.결번 ? 'var(--red)' : 'var(--ink-2)' }}>{m.연락처}{m.결번 && ' ⚠'}</span></Td>
                  <Td><Badge tone={chargeTone(m.항목)} size="sm">{m.항목}</Badge></Td>
                  <Td right><span className="tnum" style={{ fontWeight: 700, color: m.미수월수 >= 12 ? 'var(--orange)' : 'var(--ink)' }}>{m.미수월수}</span></Td>
                  <Td right><span className="tnum" style={{ fontWeight: 800, color: m.미수금액 >= 300000 ? 'var(--red)' : m.미수금액 > 0 ? 'var(--ink)' : 'var(--ink-3)' }}>{num(m.미수금액)}</span></Td>
                  <Td><span className="tnum" style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{m.마지막납부월}</span></Td>
                  <Td right><span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--blue-strong)', fontWeight: 700, fontSize: 12.5 }}>열기 <Icon name="chevron" size={14} /></span></Td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: '50px 0', color: 'var(--ink-3)' }}>조건에 맞는 회원이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--line)', background: 'var(--surface-2)' }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{num(total)}명 중 {num((page - 1) * PER_PAGE + 1)}–{num(Math.min(page * PER_PAGE, total))}</span>
          <Pager page={page} pages={pages} setPage={setPage} />
        </div>
      </Card>
    </div>
  );
}

function SummaryPill({ label, value, tone }) {
  const c = { blue: ['var(--blue-strong)', 'var(--blue-bg)'], red: ['var(--red)', 'var(--red-bg)'], orange: ['var(--orange)', 'var(--orange-bg)'] }[tone];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 15px', background: c[1], borderRadius: 10, border: '1px solid var(--line)' }}>
      <span style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 800, color: c[0] }} className="tnum">{value}</span>
    </div>
  );
}
function Chip({ children, active, onClick, tone = 'blue' }) {
  const cmap = { blue: 'var(--blue-strong)', red: 'var(--red)', orange: 'var(--orange)', purple: 'var(--purple)', gray: 'var(--ink-2)' };
  const bmap = { blue: 'var(--blue-bg)', red: 'var(--red-bg)', orange: 'var(--orange-bg)', purple: 'var(--purple-bg)', gray: 'var(--surface-2)' };
  return (
    <button onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 700,
      border: `1px solid ${active ? cmap[tone] : 'var(--line)'}`,
      background: active ? bmap[tone] : '#fff', color: active ? cmap[tone] : 'var(--ink-2)',
    }}>{children}</button>
  );
}
function Th({ children, right, sortable, onClick, dir }) {
  return (
    <th onClick={onClick} style={{ textAlign: right ? 'right' : 'left', padding: '11px 13px', fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', whiteSpace: 'nowrap', cursor: sortable ? 'pointer' : 'default', userSelect: 'none' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, justifyContent: right ? 'flex-end' : 'flex-start' }}>
        {children}{sortable && <span style={{ color: dir ? 'var(--blue-strong)' : 'var(--ink-3)', fontSize: 10 }}>{dir === 'asc' ? '▲' : dir === 'desc' ? '▼' : '⇅'}</span>}
      </span>
    </th>
  );
}
function Td({ children, right }) {
  return <td style={{ padding: '10px 13px', textAlign: right ? 'right' : 'left', whiteSpace: 'nowrap' }}>{children}</td>;
}
function Pager({ page, pages, setPage }) {
  const win = [];
  let s = Math.max(1, page - 2), e = Math.min(pages, s + 4); s = Math.max(1, e - 4);
  for (let i = s; i <= e; i++) win.push(i);
  const btn = (active) => ({ minWidth: 30, height: 30, borderRadius: 7, border: `1px solid ${active ? 'var(--blue-strong)' : 'var(--line)'}`, background: active ? 'var(--blue-strong)' : '#fff', color: active ? '#fff' : 'var(--ink-2)', fontSize: 12.5, fontWeight: 700, padding: '0 7px' });
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      <button style={btn(false)} disabled={page === 1} onClick={() => setPage(1)}>«</button>
      <button style={btn(false)} disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
      {win.map((p) => <button key={p} style={btn(p === page)} onClick={() => setPage(p)}>{p}</button>)}
      <button style={btn(false)} disabled={page === pages} onClick={() => setPage(page + 1)}>›</button>
      <button style={btn(false)} disabled={page === pages} onClick={() => setPage(pages)}>»</button>
    </div>
  );
}

window.ReceivablesList = ReceivablesList;
