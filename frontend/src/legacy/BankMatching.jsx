/* =========================================================================
   통장매칭 — 통장거래내역 업로드 → 입금정보 읽기 → 대조 → 자동/재/수동확인 → 수납 반영
   매칭 기준: 이름+차량 뒤4자리 우선 / 이름 / 차량 / 입금액 비교
   빨간색(제외) 데이터 제외, 불확실 입금건은 확인 후 반영
   ========================================================================= */
const { formatWon: bWon, formatNum: bNum } = window.AppData;

function BankMatching({ members, deposits, onApply, go }) {
  const memberById = React.useMemo(() => { const m = {}; members.forEach((x) => m[x.id] = x); return m; }, [members]);
  const [rows, setRows] = React.useState(() => deposits.map((d) => ({ ...d })));
  const [uploaded, setUploaded] = React.useState(true);
  const [pickFor, setPickFor] = React.useState(null); // 수동확인 대상 deposit

  const statusMeta = {
    매칭: ['blue', '자동매칭'], 대기: ['blue', '자동매칭'], 확인필요: ['orange', '확인필요'],
    중복: ['purple', '중복후보'], 미매칭: ['gray', '미매칭'], 제외: ['red', '제외대상'],
    반영: ['green', '수납완료'],
  };

  // 통계
  const counts = React.useMemo(() => {
    const c = { 자동: 0, 확인: 0, 제외: 0, 반영: 0, 미매칭: 0 };
    rows.forEach((r) => {
      if (r.상태 === '반영') c.반영++;
      else if (r._exclude || r.상태 === '제외') c.제외++;
      else if (r.상태 === '대기' || r.상태 === '매칭') c.자동++;
      else if (r.상태 === '미매칭') c.미매칭++;
      else c.확인++;
    });
    return c;
  }, [rows]);

  function apply(id) {
    setRows((rs) => rs.map((r) => {
      if (r.id !== id || !r._targetId) return r;
      onApply(r._targetId, r.입금액);
      return { ...r, 상태: '반영' };
    }));
  }
  function applyAll() {
    rows.forEach((r) => { if ((r.상태 === '대기' || r.상태 === '매칭') && r._targetId) onApply(r._targetId, r.입금액); });
    setRows((rs) => rs.map((r) => (r.상태 === '대기' || r.상태 === '매칭') && r._targetId ? { ...r, 상태: '반영' } : r));
  }
  function exclude(id) { setRows((rs) => rs.map((r) => r.id === id ? { ...r, 상태: '제외', _exclude: true } : r)); }
  function confirmPick(id, targetId) {
    const m = memberById[targetId];
    setRows((rs) => rs.map((r) => r.id === id ? { ...r, _targetId: targetId, 상태: '대기', _resolvedName: m.이름 } : r));
    setPickFor(null);
  }

  const cell = { padding: '11px 13px', fontSize: 13, whiteSpace: 'nowrap' };

  return (
    <div style={{ padding: '20px 26px 44px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>통장매칭</div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 3 }}>입금내역을 회원·미수내역과 대조하여 수납 반영 — 불확실한 건은 확인 후 반영합니다.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="default" icon="upload" onClick={() => setUploaded(true)}>통장거래내역 업로드</Button>
          <Button variant="primary" icon="check" onClick={applyAll} disabled={counts.자동 === 0}>자동매칭 일괄 반영 ({counts.자동})</Button>
        </div>
      </div>

      {/* 흐름 스트립 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {['통장거래내역 업로드', '입금정보 읽기', '회원·미수내역 대조', '자동/재매칭', '수납 반영'].map((t, i) => (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid var(--line)', borderRadius: 8, padding: '7px 12px' }}>
              <span style={{ width: 18, height: 18, borderRadius: 9, background: 'var(--blue-strong)', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>{t}</span>
            </div>
            {i < 4 && <Icon name="arrowRight" size={15} color="var(--ink-3)" />}
          </React.Fragment>
        ))}
      </div>

      {/* 카운트 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 14 }}>
        <CountCard label="자동매칭 대기" value={counts.자동} tone="blue" />
        <CountCard label="확인 필요" value={counts.확인} tone="orange" />
        <CountCard label="미매칭" value={counts.미매칭} tone="gray" />
        <CountCard label="제외 대상" value={counts.제외} tone="red" />
        <CountCard label="수납 완료" value={counts.반영} tone="green" />
      </div>

      {/* 매칭 기준 안내 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <RuleCard tone="blue" title="1차 자동매칭" items={['이름 + 차량번호 뒤4자리 우선', '이름 일치 확인', '입금액과 미수내역 비교']} />
        <RuleCard tone="purple" title="재매칭 · 수동확인" items={['미매칭 건 재확인', '후보 여러 명이면 직접 선택', '확인 후 다시 매칭']} />
        <RuleCard tone="red" title="제외 / 보류" items={['빨간색 표시 데이터는 제외', '회원 수납 아님(이자·정산 등)', '불확실 입금건은 확인 후 반영']} />
      </div>

      {/* 입금 테이블 */}
      <Card pad={0} style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                {['입금일', '입금자명', '입금액', '적요', '매칭 회원', '상태', '처리'].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 2 ? 'right' : i === 6 ? 'right' : 'left', padding: '11px 13px', fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const m = r._targetId ? memberById[r._targetId] : null;
                const isExcluded = r._exclude || r.상태 === '제외';
                const [tone, lbl] = statusMeta[r.상태] || ['gray', r.상태];
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--line-2)', background: isExcluded ? 'var(--red-bg)' : r.상태 === '반영' ? 'var(--green-bg)' : 'transparent', opacity: isExcluded ? 0.75 : 1 }}>
                    <td style={{ ...cell }}><span className="tnum" style={{ color: isExcluded ? 'var(--red)' : 'var(--ink-2)' }}>{r.일자}</span></td>
                    <td style={{ ...cell, fontWeight: 700, color: isExcluded ? 'var(--red)' : 'var(--ink)' }}>{r.입금자명}</td>
                    <td style={{ ...cell, textAlign: 'right' }}><span className="tnum" style={{ fontWeight: 800, color: isExcluded ? 'var(--red)' : 'var(--ink)' }}>{bWon(r.입금액)}</span></td>
                    <td style={{ ...cell, color: 'var(--ink-3)', fontSize: 12 }}>{r.적요 || '—'}</td>
                    <td style={{ ...cell }}>
                      {m ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700 }}>{m.이름}</span>
                          <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{m.차량번호.slice(-4)}</span>
                          <Badge tone="gray" size="sm">미수 {bWon(m.미수금액)}</Badge>
                        </div>
                      ) : r._hint ? <span style={{ fontSize: 12, color: isExcluded ? 'var(--red)' : 'var(--ink-3)' }}>{r._hint}</span> : '—'}
                    </td>
                    <td style={{ ...cell }}><Badge tone={tone}>{lbl}</Badge></td>
                    <td style={{ ...cell, textAlign: 'right' }}>
                      {r.상태 === '반영' ? <Badge tone="green"><Icon name="check" size={12} /> 완료</Badge>
                        : isExcluded ? <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>제외됨</span>
                          : (r.상태 === '대기' || r.상태 === '매칭') ? (
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <Button size="sm" variant="success" onClick={() => apply(r.id)}>수납 반영</Button>
                              <Button size="sm" variant="ghost" onClick={() => exclude(r.id)}>제외</Button>
                            </div>
                          ) : r.상태 === '확인필요' ? (
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <Button size="sm" tone="orange" onClick={() => apply(r.id)}>확인 후 반영</Button>
                              <Button size="sm" variant="ghost" onClick={() => exclude(r.id)}>보류</Button>
                            </div>
                          ) : r.상태 === '중복' ? (
                            <Button size="sm" variant="soft" onClick={() => setPickFor(r)}>후보 선택</Button>
                          ) : (
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <Button size="sm" variant="soft" onClick={() => setPickFor(r)}>수동 매칭</Button>
                              <Button size="sm" variant="ghost" onClick={() => exclude(r.id)}>제외</Button>
                            </div>
                          )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 수동/후보 선택 모달 */}
      <ManualMatchModal dep={pickFor} members={members} memberById={memberById} onClose={() => setPickFor(null)} onPick={confirmPick} />
    </div>
  );
}

function ManualMatchModal({ dep, members, memberById, onClose, onPick }) {
  const [kw, setKw] = React.useState('');
  React.useEffect(() => { setKw(dep ? dep.입금자명 : ''); }, [dep]);
  if (!dep) return null;
  let candidates;
  if (dep._candidates) candidates = dep._candidates.map((id) => memberById[id]);
  else {
    const k = kw.trim();
    candidates = k ? members.filter((m) => m.상태 === '정상' && (m.이름.includes(k) || m.차량번호.includes(k))).slice(0, 8) : [];
  }
  const field = { width: '100%', padding: '9px 11px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13.5 };
  return (
    <Modal open={!!dep} onClose={onClose} title="수동 매칭 · 후보 확인" width={520}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', background: 'var(--surface-2)', borderRadius: 9, marginBottom: 14, fontSize: 13 }}>
        <span>입금자 <b>{dep.입금자명}</b></span>
        <span className="tnum" style={{ fontWeight: 800 }}>{bWon(dep.입금액)}</span>
      </div>
      {!dep._candidates && (
        <input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="이름 또는 차량번호로 회원 검색" style={{ ...field, marginBottom: 12 }} autoFocus />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 320, overflowY: 'auto' }}>
        {candidates.length === 0 && <div style={{ fontSize: 13, color: 'var(--ink-3)', textAlign: 'center', padding: '24px 0' }}>일치하는 회원이 없습니다. 검색어를 바꿔보세요.</div>}
        {candidates.map((m) => (
          <div key={m.id} onClick={() => onPick(dep.id, m.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 13px', border: '1px solid var(--line)', borderRadius: 9, cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--blue-bg2)'; e.currentTarget.style.borderColor = 'var(--blue-line)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--line)'; }}>
            <div>
              <div style={{ fontWeight: 700 }}>{m.이름} <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>{m.차량번호}</span></div>
              <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>{m.지역원본} · {m.관리번호} · 미수 {m.미수월수}개월</div>
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Badge tone={m.미수금액 > 0 ? 'red' : 'green'}>{bWon(m.미수금액)}</Badge>
              <Icon name="chevron" size={16} color="var(--ink-3)" />
            </span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function CountCard({ label, value, tone }) {
  const c = { blue: 'var(--blue-strong)', orange: 'var(--orange)', gray: 'var(--ink-2)', red: 'var(--red)', green: 'var(--green)' }[tone];
  const bg = { blue: 'var(--blue-bg)', orange: 'var(--orange-bg)', gray: 'var(--surface-2)', red: 'var(--red-bg)', green: 'var(--green-bg)' }[tone];
  return (
    <div style={{ background: bg, border: '1px solid var(--line)', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: c, marginTop: 2 }} className="tnum">{bNum(value)}<span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-3)' }}> 건</span></div>
    </div>
  );
}
function RuleCard({ tone, title, items }) {
  const c = { blue: 'var(--blue-strong)', purple: 'var(--purple)', red: 'var(--red)' }[tone];
  const bg = { blue: 'var(--blue-bg)', purple: 'var(--purple-bg)', red: 'var(--red-bg)' }[tone];
  return (
    <div style={{ flex: 1, background: '#fff', border: '1px solid var(--line)', borderRadius: 11, padding: 14 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: bg, color: c, fontWeight: 800, fontSize: 12.5, padding: '4px 10px', borderRadius: 7, marginBottom: 9 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {items.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12.5, color: 'var(--ink-2)' }}>
            <span style={{ marginTop: 1, color: c }}><Icon name="check" size={13} /></span>{t}
          </div>
        ))}
      </div>
    </div>
  );
}

window.BankMatching = BankMatching;
