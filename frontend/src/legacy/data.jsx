/* =========================================================================
   미수금관리 프로그램 — 데이터 모델 · 부과규칙 · 샘플데이터
   강원도개인소형화물자동차운송사업협회
   - 모든 데이터는 seed 고정(reload 해도 동일). 실제 환경에서는 DB/엑셀로 대체.
   - 부과규칙은 BILLING 한 곳에서만 정의 → 모든 화면이 동일 규칙 사용.
   ========================================================================= */

/* ---- 고정 시드 PRNG (mulberry32) ---- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260610);
const rand = () => rng();
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const chance = (p) => rand() < p;

/* ============================ 부과 규칙 ============================ */
const BILLING = {
  관리비: 5000,        // 협회 미가입(택배 등) — 자격증명 발급일 다음 달부터
  협회비: 10000,       // 협회 가입자 — 가입일 다음 달부터
  협회비_70세: 5000,   // 70세 이상 협회 가입자 인하
  기준일: { year: 2026, month: 6 }, // 현재 부과 기준월 (2026-06)
};
// 회원의 월 부과액 계산 (가입여부/연령 기반)
function monthlyCharge(m) {
  if (m.가입여부 === '협회가입') {
    return m.연령 >= 70 ? BILLING.협회비_70세 : BILLING.협회비;
  }
  return BILLING.관리비;
}
function chargeType(m) {
  return m.가입여부 === '협회가입' ? '협회비' : '관리비';
}
// "발급/가입일 다음 달부터" → 부과 시작월
function nextMonth(y, mo) { return mo === 12 ? { y: y + 1, m: 1 } : { y, m: mo + 1 }; }
function ymKey(y, m) { return `${y}-${String(m).padStart(2, '0')}`; }
function ymLabel(y, m) { return `${String(y).slice(2)}.${String(m).padStart(2, '0')}`; }
// 두 연월 사이 개월 수(포함). (y2,m2) - (y1,m1) + 1
function monthsBetween(y1, m1, y2, m2) {
  return (y2 - y1) * 12 + (m2 - m1) + 1;
}

/* ============================ 강원 시·군 ============================ */
const SIGUN = [
  '춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시',
  '홍천군', '횡성군', '영월군', '평창군', '정선군',
  '철원군', '화천군', '양구군', '인제군', '고성군', '양양군',
];
// 엑셀 원본에 들어올 법한 표기 변형 → 시군 정규화
const REGION_RAW = {
  '춘천시': ['춘천', '춘천시', '춘천 신북', '춘천퇴계', '춘천 후평'],
  '원주시': ['원주', '원주시', '원주 문막', '원주단계', '원주 무실'],
  '강릉시': ['강릉', '강릉시', '강릉 주문진', '강릉포남'],
  '동해시': ['동해', '동해시', '동해 천곡'],
  '태백시': ['태백', '태백시'],
  '속초시': ['속초', '속초시', '속초 조양'],
  '삼척시': ['삼척', '삼척시', '삼척 도계'],
  '홍천군': ['홍천', '홍천군'],
  '횡성군': ['횡성', '횡성군', '횡성 우천'],
  '영월군': ['영월', '영월군'],
  '평창군': ['평창', '평창군', '평창 대화'],
  '정선군': ['정선', '정선군', '정선 고한'],
  '철원군': ['철원', '철원군', '철원 갈말'],
  '화천군': ['화천', '화천군'],
  '양구군': ['양구', '양구군'],
  '인제군': ['인제', '인제군', '인제 원통'],
  '고성군': ['고성', '고성군', '고성 간성'],
  '양양군': ['양양', '양양군'],
};
// 시군별 인구 가중치(대략) — 도시 비중 큼
const SIGUN_WEIGHT = {
  '춘천시': 18, '원주시': 22, '강릉시': 14, '동해시': 6, '태백시': 3, '속초시': 5, '삼척시': 4,
  '홍천군': 5, '횡성군': 3, '영월군': 2, '평창군': 3, '정선군': 2,
  '철원군': 3, '화천군': 2, '양구군': 2, '인제군': 2, '고성군': 2, '양양군': 2,
};
function weightedSigun() {
  const entries = Object.entries(SIGUN_WEIGHT);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [k, w] of entries) { if ((r -= w) <= 0) return k; }
  return '춘천시';
}

/* ============================ 이름 / 차량 ============================ */
const SURNAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '홍'];
const GIVEN1 = ['민', '서', '지', '현', '준', '영', '성', '재', '동', '상', '경', '광', '태', '병', '종', '기', '용', '석', '대', '진'];
const GIVEN2 = ['수', '호', '우', '훈', '철', '식', '환', '근', '국', '남', '규', '욱', '한', '백', '곤', '식', '복', '길', '관', '택'];
function makeName() { return pick(SURNAMES) + pick(GIVEN1) + pick(GIVEN2); }
// 영업용 화물 번호판 (예: 강원81바1234)
const PLATE_PREFIX = ['80바', '81바', '82바', '83바', '84바', '85사', '86사', '87사', '88아', '88바'];
function makePlate() { return '강원' + pick(PLATE_PREFIX) + String(randInt(1000, 9999)); }
function makePhone() {
  return '010-' + String(randInt(2000, 9999)) + '-' + String(randInt(1000, 9999));
}

/* ============================ 관리번호 ============================ */
// 신규: 신yy-nn / 양도양수: 양yy-nn
function makeMgmtNo(kind, yy, seq) {
  const p = kind === '양도양수' ? '양' : '신';
  return `${p}${String(yy).padStart(2, '0')}-${String(seq).padStart(3, '0')}`;
}

/* ============================ 회원 생성 ============================ */
const STATUS = { 정상: '정상', 폐업: '폐업', 양도: '양도', 이관: '이관', 탈퇴: '탈퇴' };

function buildMember(i, seqByYear) {
  const 시군 = weightedSigun();
  const 지역원본 = pick(REGION_RAW[시군]);
  // 회원구분
  const 회원구분 = chance(0.32) ? '택배' : '개인';
  // 가입여부: 택배는 미가입 비중↑(경로 A), 개인은 가입 비중↑(경로 B)
  let 가입여부;
  if (회원구분 === '택배') 가입여부 = chance(0.72) ? '협회미가입' : '협회가입';
  else 가입여부 = chance(0.78) ? '협회가입' : '협회미가입';

  // 연령(70세 감면 판정)
  const 출생연도 = randInt(1948, 1992);
  const 연령 = 2026 - 출생연도;

  // 자격증명 발급일 (수년 전 ~ 최근)
  const 발급연 = randInt(2016, 2025);
  const 발급월 = randInt(1, 12);
  const 발급일 = `${발급연}-${String(발급월).padStart(2, '0')}-${String(randInt(1, 28)).padStart(2, '0')}`;
  // 협회 가입일 (가입자만) — 보통 발급 이후
  let 가입일 = null, 가입연 = 발급연, 가입월 = 발급월;
  if (가입여부 === '협회가입') {
    가입연 = randInt(발급연, 2025);
    가입월 = randInt(1, 12);
    가입일 = `${가입연}-${String(가입월).padStart(2, '0')}-${String(randInt(1, 28)).padStart(2, '0')}`;
  }

  // 관리번호 (양도양수 일부)
  const kind = chance(0.12) ? '양도양수' : '신규';
  const yy = String(발급연).slice(2);
  seqByYear[yy] = (seqByYear[yy] || 0) + 1;
  const 관리번호 = makeMgmtNo(kind, yy, seqByYear[yy]);

  // ---- 부과 시작월: "기준일 다음 달부터" ----
  let baseY, baseM;
  if (가입여부 === '협회가입') { baseY = 가입연; baseM = 가입월; }
  else { baseY = 발급연; baseM = 발급월; }
  const start = nextMonth(baseY, baseM); // 부과 시작 연월

  // ---- 미수내역 생성 ----
  // 전체 부과 가능 개월수
  const totalMonths = Math.max(0, monthsBetween(start.y, start.m, BILLING.기준일.year, BILLING.기준일.month));
  const 월액 = monthlyCharge({ 가입여부, 연령 });
  const 항목 = chargeType({ 가입여부 });

  // 미수 패턴: 대부분 정상납부, 일부 단기, 소수 장기/고액
  let 미수월수 = 0;
  const roll = rand();
  if (totalMonths <= 0) 미수월수 = 0;
  else if (roll < 0.55) 미수월수 = 0;                         // 완납
  else if (roll < 0.82) 미수월수 = Math.min(totalMonths, randInt(1, 3));
  else if (roll < 0.95) 미수월수 = Math.min(totalMonths, randInt(4, 11));
  else 미수월수 = Math.min(totalMonths, randInt(12, 64));      // 장기 미납(30만원 이상 가능)

  // 미수 월 목록 = 기준월에서 거꾸로 미수월수 만큼
  const 미수목록 = [];
  let cy = BILLING.기준일.year, cm = BILLING.기준일.month;
  for (let k = 0; k < 미수월수; k++) {
    미수목록.unshift({ ym: ymKey(cy, cm), label: ymLabel(cy, cm), 항목, 금액: 월액, 납부: false });
    if (cm === 1) { cy -= 1; cm = 12; } else cm -= 1;
  }
  const 미수금액 = 미수월수 * 월액;

  // 마지막 납부월 = 미수 시작 직전월 (미수가 있으면), 없으면 기준월
  let 마지막납부월 = '-';
  if (미수월수 > 0) {
    let py = cy, pm = cm; 마지막납부월 = ymLabel(py, pm);
  } else if (totalMonths > 0) {
    마지막납부월 = ymLabel(BILLING.기준일.year, BILLING.기준일.month);
  }

  // 납부 이력(최근 몇 건) — 완납분
  const 납부이력 = [];
  let hy = cy, hm = cm; // 미수 시작 직전부터 과거로
  const histN = randInt(2, 6);
  for (let k = 0; k < histN; k++) {
    if (hy < start.y || (hy === start.y && hm < start.m)) break;
    납부이력.unshift({ ym: ymLabel(hy, hm), 항목, 금액: 월액, 방식: pick(['통장매칭', '통장매칭', '현금', 'CMS']), 일자: `${hy}-${String(hm).padStart(2, '0')}-${String(randInt(5, 27)).padStart(2, '0')}` });
    if (hm === 1) { hy -= 1; hm = 12; } else hm -= 1;
  }

  // 상태: 대부분 정상. 소수 폐업/양도/이관/탈퇴(미수금명단에서 기본 제외)
  let 상태 = STATUS.정상;
  const sroll = rand();
  if (sroll > 0.965) 상태 = pick([STATUS.폐업, STATUS.폐업, STATUS.양도, STATUS.이관, STATUS.탈퇴]);

  // 주의 플래그
  const 결번 = chance(0.015);       // 연락처 결번/반송
  const 자격증명미발급 = chance(0.01);
  const 장기미납 = 미수월수 >= 12;
  const 고액 = 미수금액 >= 300000;

  // 메모(일부)
  let 메모 = '';
  if (결번) 메모 = '연락처 결번 — 주소지 우편 반송됨';
  else if (고액) 메모 = pick(['장기 미납, 수차례 안내했으나 미납 지속', '분할납부 협의 중', '폐업 의사 표명, 확인 필요']);
  else if (chance(0.06)) 메모 = pick(['자동이체 신청함', '주소 변경됨', '연락처 변경 확인', '가족이 대신 납부']);

  // 폐업/처리 정보(상태가 정상이 아니면)
  let 처리정보 = null;
  if (상태 !== STATUS.정상) {
    const py = randInt(2024, 2026), pm = randInt(1, 6);
    처리정보 = {
      유형: 상태,
      처리일: `${py}-${String(pm).padStart(2, '0')}-${String(randInt(1, 28)).padStart(2, '0')}`,
      공문번호: `강원시청-${randInt(2024, 2026)}-${randInt(100, 999)}`,
      내용: pick(['시청 폐업공문 접수 후 처리', '본인 신청 폐업', '양도양수 처리 완료', '타지역 이관']),
      미납잔액: 미수금액,
      추후납부안내: 미수금액 > 0,
    };
  }

  return {
    id: 'M' + String(i).padStart(5, '0'),
    관리번호, 등록구분: kind,
    이름: makeName(),
    차량번호: makePlate(),
    연락처: makePhone(),
    시군, 지역원본,
    회원구분, 가입여부,
    출생연도, 연령,
    자격증명발급일: 발급일,
    협회가입일: 가입일,
    부과시작월: ymLabel(start.y, start.m),
    부과시작ym: ymKey(start.y, start.m),
    항목, 월부과액: 월액,
    미수월수, 미수금액, 미수목록,
    마지막납부월, 납부이력,
    상태,
    결번, 자격증명미발급, 장기미납, 고액,
    메모,
    처리정보,
    수정이력: [
      { 일시: '2026-05-' + String(randInt(1, 28)).padStart(2, '0') + ' 10:' + String(randInt(10, 59)), 내용: '부과내역 갱신', 담당: '관리자' },
    ],
  };
}

function buildMembers(n) {
  const seqByYear = {};
  const list = [];
  for (let i = 1; i <= n; i++) list.push(buildMember(i, seqByYear));
  return list;
}

/* ============================ 예정자(신규/예정자 등록) ============================ */
function buildPending(n) {
  const list = [];
  const steps = ['자격증명 발급', '시청 신규허가 접수', '예정자 등록', '전체자명단 등록', '관리번호 부여'];
  for (let i = 1; i <= n; i++) {
    const 시군 = weightedSigun();
    const stepIdx = randInt(0, steps.length - 1);
    const kind = chance(0.18) ? '양도양수' : '신규';
    const 회원구분 = chance(0.35) ? '택배' : '개인';
    const 가입여부 = chance(0.5) ? '협회가입' : '협회미가입';
    list.push({
      id: 'P' + String(i).padStart(3, '0'),
      이름: makeName(),
      차량번호: chance(0.7) ? makePlate() : '미정',
      연락처: makePhone(),
      시군, 지역원본: pick(REGION_RAW[시군]),
      회원구분, 가입여부, 등록구분: kind,
      자격증명발급일: chance(0.8) ? `2026-0${randInt(1, 6)}-${String(randInt(1, 28)).padStart(2, '0')}` : '-',
      단계: steps[stepIdx],
      단계index: stepIdx,
      관리번호: stepIdx >= 4 ? makeMgmtNo(kind, 26, i) : '-',
      예상부과: 가입여부 === '협회가입' ? '협회비' : '관리비',
      비고: pick(['', '', '서류 보완 필요', '연락처 확인 완료', '차량 등록 대기']),
    });
  }
  return list;
}

/* ============================ 통장 입금내역 (통장매칭) ============================ */
// members 중 일부를 골라 입금건 생성 + 미매칭/중복/제외(빨간색) 케이스 섞음
function buildDeposits(members) {
  const active = members.filter((m) => m.상태 === '정상' && m.미수금액 > 0);
  const deposits = [];
  let did = 1;
  const used = new Set();

  function depFor(m, opts = {}) {
    const day = `2026-06-${String(randInt(1, 9)).padStart(2, '0')}`;
    // 입금자명: 보통 본인, 가끔 가족/상호
    const 입금자 = opts.입금자 || (chance(0.8) ? m.이름 : m.이름.slice(0, 1) + pick(['하나', '상사', '물류', '카고']));
    // 입금액: 보통 미수 1~전액, 가끔 단월
    const months = Math.min(m.미수월수, randInt(1, Math.max(1, m.미수월수)));
    const 금액 = opts.금액 != null ? opts.금액 : months * m.월부과액;
    return {
      id: 'D' + String(did++).padStart(3, '0'),
      일자: day,
      입금자명: 입금자,
      입금액: 금액,
      적요: opts.적요 || pick(['', '', '차량번호 ' + m.차량번호.slice(-4), m.차량번호.slice(-4)]),
      _targetId: m.id, // 정답(데모용)
      상태: opts.상태 || '대기',
      _hint: opts.hint || null,
    };
  }

  // 1) 깔끔하게 매칭되는 건 (이름+차량 뒤4자리)
  for (let k = 0; k < 22 && k < active.length; k++) {
    let m; do { m = pick(active); } while (used.has(m.id));
    used.add(m.id);
    deposits.push(depFor(m, { 적요: '차량 ' + m.차량번호.slice(-4) }));
  }
  // 2) 이름만 있고 차량 정보 없는 건 (이름 일치)
  for (let k = 0; k < 8 && k < active.length; k++) {
    let m; do { m = pick(active); } while (used.has(m.id));
    used.add(m.id);
    deposits.push(depFor(m, { 적요: '' }));
  }
  // 3) 동명이인(중복 후보) — 같은 이름 회원 2명 이상
  const byName = {};
  active.forEach((m) => { (byName[m.이름] = byName[m.이름] || []).push(m); });
  const dupNames = Object.values(byName).filter((a) => a.length >= 2).slice(0, 4);
  dupNames.forEach((arr) => {
    const m = arr[0];
    deposits.push({
      id: 'D' + String(did++).padStart(3, '0'),
      일자: `2026-06-0${randInt(1, 9)}`,
      입금자명: m.이름, 입금액: m.월부과액 * randInt(1, 3), 적요: '',
      _targetId: null, _candidates: arr.map((x) => x.id), 상태: '중복',
      _hint: '동명이인 후보 ' + arr.length + '명',
    });
  });
  // 4) 미매칭 — 명단에 없는 입금자
  for (let k = 0; k < 5; k++) {
    deposits.push({
      id: 'D' + String(did++).padStart(3, '0'),
      일자: `2026-06-0${randInt(1, 9)}`,
      입금자명: makeName(), 입금액: pick([5000, 10000, 15000, 30000]), 적요: '',
      _targetId: null, 상태: '미매칭', _hint: '명단에서 일치 회원 없음',
    });
  }
  // 5) 빨간색 제외 대상 — 협회 자체/오입금/이자 등
  ['협회운영비', '이자', '카드정산', '오입금반환'].forEach((label) => {
    deposits.push({
      id: 'D' + String(did++).padStart(3, '0'),
      일자: `2026-06-0${randInt(1, 9)}`,
      입금자명: label, 입금액: pick([1, 320, 50000, 12000]), 적요: '제외대상',
      _targetId: null, 상태: '제외', _exclude: true, _hint: '회원 수납 아님 — 제외',
    });
  });
  // 6) 불확실 금액 (미수액과 불일치) — 확인 후 반영
  for (let k = 0; k < 4 && k < active.length; k++) {
    let m; do { m = pick(active); } while (used.has(m.id));
    used.add(m.id);
    const d = depFor(m, { 금액: m.월부과액 * randInt(1, 2) + randInt(1, 4) * 1000, 적요: '금액 불일치' });
    d.상태 = '확인필요'; d._hint = '입금액이 미수내역과 불일치 — 확인 후 반영';
    deposits.push(d);
  }
  // 정렬: 일자
  deposits.sort((a, b) => a.일자.localeCompare(b.일자) || a.id.localeCompare(b.id));
  return deposits;
}

/* ============================ 전체 데이터셋 ============================ */
function buildDataset() {
  const members = buildMembers(3240);
  const pending = buildPending(36);
  const deposits = buildDeposits(members);
  return { members, pending, deposits };
}

/* 통계 헬퍼 (대시보드/명단 공용) */
function formatWon(n) { return (n || 0).toLocaleString('ko-KR') + '원'; }
function formatNum(n) { return (n || 0).toLocaleString('ko-KR'); }

window.AppData = {
  BILLING, SIGUN, REGION_RAW, STATUS,
  monthlyCharge, chargeType, buildDataset,
  formatWon, formatNum, ymLabel, ymKey,
};
