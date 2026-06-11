import React, { useEffect, useMemo, useState } from 'react'
import { api } from './api.js'
import { buildInitialData, getOpenArrears } from './data.js'
import './styles.css'
import Dashboard from './screens/Dashboard.jsx'
import ReceivablesList from './screens/ReceivablesList.jsx'
import BankMatching from './screens/BankMatching.jsx'
import ClosureBoard from './screens/ClosureBoard.jsx'
import Roster from './screens/Roster.jsx'
import PaymentsHistory from './screens/PaymentsHistory.jsx'
import PendingBoard from './screens/PendingBoard.jsx'
import ExcelImport from './screens/ExcelImport.jsx'

const NAV = [
  { key: 'dashboard', label: '대시보드' },
  { key: 'list', label: '미수금명단', main: true },
  { key: 'bank', label: '통장매칭' },
  { key: 'closure', label: '폐업현황' },
  { key: 'roster', label: '전체자명단' },
  { key: 'payments', label: '수납내역' },
  { key: 'pending', label: '신규 · 예정자' },
  { key: 'import', label: '엑셀 업로드' },
]

export default function App() {
  const [view, setView] = useState('list')
  const [health, setHealth] = useState('확인 중…')
  const [preset, setPreset] = useState(null)
  const [data, setData] = useState(() => buildInitialData())

  async function reloadFromDb(){
    try{
      const [members, closures, pending, deposits, payments] = await Promise.all([
        api.listMembers({size: 10000}),
        api.listClosures().catch(()=>[]),
        api.listPending().catch(()=>[]),
        api.listDeposits({size: 5000}).catch(()=>[]),
        api.listPayments({size: 5000}).catch(()=>[]),
      ])
      setData(d => ({...d, members: Array.isArray(members)?members:[], closures: closures||[], pending: pending||[], deposits: deposits||[], payments: payments||[]}))
      setHealth(Array.isArray(members) && members.length ? '연결됨 · 실제 DB 데이터 표시 중' : '연결됨 · DB 데이터 없음, 엑셀 업로드 필요')
      return true
    }catch(e){
      setData(d => ({...d, members: [], closures: [], pending: [], deposits: [], payments: []}))
      setHealth('백엔드 미연결 · 데이터 표시 불가')
      return false
    }
  }

  useEffect(() => {
    api.health().then((d) => { setHealth(`연결됨 (${d.app})`); reloadFromDb() }).catch(() => setHealth('백엔드 미연결 · 데이터 표시 불가'))
  }, [])

  const summary = useMemo(() => {
    const active = data.members.filter(m => m.status === '정상')
    const arrearsMembers = active.filter(m => m.totalArrears > 0)
    const thisMonthPayments = data.payments.filter(p => p.paidDate?.startsWith('2026-06')).reduce((s,p)=>s+p.amount,0)
    return {
      totalMembers: data.members.length,
      activeMembers: active.length,
      arrearsCount: arrearsMembers.length,
      totalArrears: arrearsMembers.reduce((s,m)=>s+m.totalArrears,0),
      thisMonthPayments,
      highAmount: arrearsMembers.filter(m=>m.totalArrears>=300000).length,
      longOverdue: arrearsMembers.filter(m=>m.arrearsMonths>=12).length,
      disconnected: active.filter(m=>m.disconnected).length,
      certMissing: active.filter(m=>m.certMissing).length,
      pending: data.pending.length,
      closures: data.closures.length,
      bankPending: data.deposits.filter(d=>d.status!=='매칭완료' && d.status!=='제외').length,
    }
  }, [data])

  function navigate(nextView, nextPreset=null){ setView(nextView); setPreset(nextPreset) }

  async function saveMemo(memberId, memo){
    try{ await api.updateMember(memberId,{memo}); await reloadFromDb() }
    catch(e){ alert(e.message || '메모 저장 실패') }
  }

  async function applyPayment(memberId, amount, method='직접수납'){
    try{ await api.applyPayment(memberId,{amount:Number(amount)||0, method}); await reloadFromDb() }
    catch(e){ alert(e.message || '수납 반영 실패') }
  }

  async function registerClosure(memberId, payload){
    try{ await api.registerClosure(memberId,{type:payload.type, doc_no:payload.docNo || payload.doc_no || '', content:payload.content || '', notify_later:payload.notify_later || false, process_date:payload.processDate || new Date().toISOString().slice(0,10)}); await reloadFromDb() }
    catch(e){ alert(e.message || '폐업 등록 실패') }
  }

  async function matchDeposit(depositId, memberId){
    try{ await api.matchDeposit(depositId,{member_id:memberId}); await reloadFromDb() }
    catch(e){ alert(e.message || '통장매칭 실패') }
  }
  async function excludeDeposit(depositId){
    try{ await api.excludeDeposit(depositId); await reloadFromDb() }
    catch(e){ alert(e.message || '입금 제외 실패') }
  }
  function addPending(payload){ setData(d=>({...d,pending:[{...payload,id:'NNEW'+Date.now(),step:'예정자 등록',note:payload.note||''},...d.pending]})) }

  const screenProps = {data, summary, navigate, preset, setPreset, saveMemo, applyPayment, registerClosure, matchDeposit, excludeDeposit, addPending, reloadFromDb}
  const Screen = {dashboard:Dashboard,list:ReceivablesList,bank:BankMatching,closure:ClosureBoard,roster:Roster,payments:PaymentsHistory,pending:PendingBoard,import:ExcelImport}[view]

  return <div className="app">
    <aside className="sidebar">
      <div className="brand">미수금관리</div>
      <div className="brand-sub">강원 개인소형화물협회</div>
      <nav>{NAV.map(n=><button key={n.key} onClick={()=>navigate(n.key)} className={'nav-btn '+(view===n.key?'active':'')}>{n.label}{n.main?' · MAIN':''}</button>)}</nav>
      <div className="health">백엔드: {health}<br/>현재 화면: 실제 DB 데이터만 표시<br/>엑셀 업로드 후 DB 저장해야 표시됨</div>
    </aside>
    <main className="main"><Screen {...screenProps}/></main>
  </div>
}
