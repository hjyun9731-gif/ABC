export const SIGUN = ['춘천시','원주시','강릉시','동해시','태백시','속초시','삼척시','홍천군','횡성군','영월군','평창군','정선군','철원군','화천군','양구군','인제군','고성군','양양군']
export const BILLING = { management: 5000, association: 10000, seniorAssociation: 5000, baseYm: '2026-06' }
const names = ['김민수','이영호','박현주','최성철','정지훈','강태식','윤경수','장재환','임광호','한상훈','오민규','서준우','신동근','권영택','황병국','안재석','송기환','류대길','홍성복','조현철']
const regionsRaw = ['춘천 후평','춘천 퇴계','원주 문막','원주 단계','강릉 주문진','강릉 포남','홍천','횡성 우천','철원 갈말','속초 조양','동해 천곡','삼척 도계']
function rnd(seed){let t=seed+0x6D2B79F5;return()=>{t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const r = rnd(20260610)
const pick = a => a[Math.floor(r()*a.length)]
const ri = (a,b)=>Math.floor(r()*(b-a+1))+a
const pad = n => String(n).padStart(2,'0')
const ymLabel = ym => ym ? ym.slice(2).replace('-', '.') : '-'
const prevYm = ym => {let [y,m]=ym.split('-').map(Number);m--; if(m===0){y--;m=12} return `${y}-${pad(m)}`}
const addMonth = date => {const [y,m]=date.split('-').map(Number); return m===12?`${y+1}-01`:`${y}-${pad(m+1)}`}
function memberCharge(m){ if(m.membership==='협회가입') return m.age>=70 ? BILLING.seniorAssociation : BILLING.association; return BILLING.management }
function chargeItem(m){ return m.membership==='협회가입' ? '협회비' : '관리비' }
function makeArrears(count, amount, item){ const out=[]; let ym=BILLING.baseYm; for(let i=0;i<count;i++){out.unshift({ym,label:ymLabel(ym),amount,item,paid:false}); ym=prevYm(ym)} return out }
export function formatWon(n){return (n||0).toLocaleString('ko-KR')+'원'}
export function formatNum(n){return (n||0).toLocaleString('ko-KR')}
export function buildInitialData(){
  const members=[]; const closures=[]; const payments=[]; const pending=[]; const deposits=[];
  const sigunWeight = ['춘천시','춘천시','춘천시','원주시','원주시','원주시','강릉시','강릉시','홍천군','횡성군','철원군','속초시','동해시','삼척시','평창군','인제군','양양군','고성군']
  for(let i=1;i<=180;i++){
    const sigun = pick(sigunWeight); const memberType = r()<.32?'택배':'개인'; const membership = memberType==='택배' ? (r()<.72?'협회미가입':'협회가입') : (r()<.8?'협회가입':'협회미가입')
    const age = ri(36,78); const cert = `${ri(2018,2026)}-${pad(ri(1,12))}-${pad(ri(1,28))}`; const join = membership==='협회가입' ? `${ri(2019,2026)}-${pad(ri(1,12))}-${pad(ri(1,28))}` : null
    const temp = {membership, age}; const monthlyCharge = memberCharge(temp); const item = chargeItem(temp)
    let months = 0; const roll = r(); if(roll<.50) months=0; else if(roll<.77) months=ri(1,3); else if(roll<.93) months=ri(4,11); else months=ri(12,60)
    const arrears = makeArrears(months, monthlyCharge, item); const totalArrears = months*monthlyCharge
    const statusRoll = r(); let status='정상'; if(statusRoll>.965) status=pick(['폐업','양도','이관','탈퇴'])
    const id='M'+String(i).padStart(5,'0'); const yy=cert.slice(2,4); const mgmtNo=(r()<.14?'양':'신')+yy+'-'+String(i).padStart(3,'0')
    let last = months>0 ? ymLabel(prevYm(arrears[0].ym)) : ymLabel(BILLING.baseYm)
    const phone = r()<.03 ? '결번' : `010-${ri(2000,9999)}-${ri(1000,9999)}`
    const m={id, sigun, regionRaw: pick(regionsRaw), name: pick(names), vehicleNo:'강원'+pick(['80바','81바','82바','83바','88아','88바'])+ri(1000,9999), memberType, membership, mgmtNo, certIssueDate:cert, assocJoinDate:join, billingStartYm:addMonth(membership==='협회가입'?join:cert), chargeItem:item, monthlyCharge, birthYear:2026-age, age, arrears, arrearsMonths:months, totalArrears, lastPaymentYm:last, phone, status, memo: totalArrears>=300000?'장기 미납, 추후 연락 필요': phone==='결번'?'연락처 결번 확인 필요':(r()<.08?'주소/연락처 확인 완료':''), certMissing:r()<.018, disconnected:phone==='결번', updatedAt:'2026-06-10'}
    members.push(m)
    if(status!=='정상') closures.push({id:'C'+i, memberId:id, name:m.name, vehicleNo:m.vehicleNo, sigun, type:status, processDate:`2026-${pad(ri(1,6))}-${pad(ri(1,28))}`, docNo:`공문-${ri(100,999)}`, content:'시청 공문 접수 후 처리', unpaidBalance:totalArrears, notifyLater:totalArrears>0, memo:m.memo})
    const histN=ri(1,4); for(let h=0;h<histN;h++){payments.push({id:'P'+i+'-'+h, memberId:id, name:m.name, vehicleNo:m.vehicleNo, paidForYm:ymLabel(prevYm(BILLING.baseYm)), chargeItem:item, amount:monthlyCharge, method:pick(['통장매칭','CMS','현금']), paidDate:`2026-${pad(ri(1,6))}-${pad(ri(1,28))}`})}
  }
  for(let i=1;i<=18;i++){pending.push({id:'N'+i, name:pick(names), vehicleNo:'강원81바'+ri(1000,9999), sigun:pick(SIGUN), memberType:pick(['개인','택배']), membership:pick(['협회가입','협회미가입']), certIssueDate:`2026-${pad(ri(1,6))}-${pad(ri(1,28))}`, step:pick(['자격증명 발급','신규허가 서류 접수','예정자 등록','전체자명단 전환 대기']), note:''})}
  for(let i=1;i<=30;i++){const candidate=pick(members.filter(m=>m.status==='정상')); const good=r()<.7; deposits.push({id:'D'+i, depositDate:`2026-06-${pad(ri(1,10))}`, depositorName:good?candidate.name+(r()<.55?candidate.vehicleNo.slice(-4):''):pick(names), amount:good?candidate.monthlyCharge*ri(1,3):pick([5000,10000,15000,30000]), memo:good?'입금자명 자동 후보':'확인 필요', status:good?'대기':'미매칭', candidateId:good?candidate.id:null})}
  return {members, closures, payments, pending, deposits}
}
export function getOpenArrears(m){return (m.arrears||[]).filter(a=>!a.paid)}
