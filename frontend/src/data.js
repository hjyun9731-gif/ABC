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
  // 실제 협회 엑셀을 업로드하기 전에는 임의 샘플을 보여주지 않는다.
  // 엑셀 업로드 → DB 저장 후 /api/members 결과만 화면에 표시한다.
  return {members: [], closures: [], payments: [], pending: [], deposits: []}
}
export function getOpenArrears(m){return (m.arrears||[]).filter(a=>!a.paid)}
