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

const NAV = [
  { key: 'dashboard', label: '대시보드' },
  { key: 'list', label: '미수금명단', main: true },
  { key: 'bank', label: '통장매칭' },
  { key: 'closure', label: '폐업현황' },
  { key: 'roster', label: '전체자명단' },
  { key: 'payments', label: '수납내역' },
  { key: 'pending', label: '신규 · 예정자' },
]

export default function App() {
  const [view, setView] = useState('list')
  const [health, setHealth] = useState('확인 중…')
  const [preset, setPreset] = useState(null)
  const [data, setData] = useState(() => buildInitialData())

  useEffect(() => {
    api.health().then((d) => setHealth(`연결됨 (${d.app})`)).catch(() => setHealth('백엔드 미연결 · 화면은 샘플데이터로 동작'))
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

  function saveMemo(memberId, memo){
    setData(d => ({...d, members: d.members.map(m => m.id===memberId ? {...m, memo, updatedAt:'방금'} : m)}))
  }

  function applyPayment(memberId, amount, method='직접수납'){
    let created=[]
    setData(d => {
      const members = d.members.map(m => {
        if(m.id!==memberId) return m
        let remain = Number(amount)||0
        const arrears = (m.arrears||[]).map(a => {
          if(!a.paid && remain >= a.amount){ remain -= a.amount; created.push({member:m, item:a}); return {...a, paid:true} }
          return a
        })
        const open = arrears.filter(a=>!a.paid)
        return {...m, arrears, arrearsMonths: open.length, totalArrears: open.reduce((s,a)=>s+a.amount,0), lastPaymentYm: created.length?created[created.length-1].item.label:m.lastPaymentYm, updatedAt:'방금'}
      })
      const payments = [...d.payments, ...created.map((c, idx)=>({id:'PNEW'+Date.now()+idx, memberId:c.member.id, name:c.member.name, vehicleNo:c.member.vehicleNo, paidForYm:c.item.label, chargeItem:c.item.item, amount:c.item.amount, method, paidDate:new Date().toISOString().slice(0,10)}))]
      return {...d, members, payments}
    })
  }

  function registerClosure(memberId, payload){
    setData(d => {
      const member = d.members.find(m=>m.id===memberId)
      if(!member) return d
      const type = payload.type || '폐업'
      const updatedMember = {...member, status:type, memo:payload.content || member.memo, updatedAt:'방금'}
      const closure = {id:'CNEW'+Date.now(), memberId, name:member.name, vehicleNo:member.vehicleNo, sigun:member.sigun, type, processDate:payload.processDate || new Date().toISOString().slice(0,10), docNo:payload.docNo||'', content:payload.content||'미수금명단에서 처리', unpaidBalance:member.totalArrears, notifyLater:member.totalArrears>0, memo:payload.memo||''}
      return {...d, members:d.members.map(m=>m.id===memberId?updatedMember:m), closures:[closure,...d.closures]}
    })
  }

  function matchDeposit(depositId, memberId){
    const deposit = data.deposits.find(x=>x.id===depositId)
    if(!deposit) return
    applyPayment(memberId, deposit.amount, '통장매칭')
    setData(d => ({...d, deposits:d.deposits.map(x=>x.id===depositId?{...x,status:'매칭완료',candidateId:memberId}:x)}))
  }
  function excludeDeposit(depositId){ setData(d=>({...d, deposits:d.deposits.map(x=>x.id===depositId?{...x,status:'제외'}:x)})) }
  function addPending(payload){ setData(d=>({...d,pending:[{...payload,id:'NNEW'+Date.now(),step:'예정자 등록',note:payload.note||''},...d.pending]})) }

  const screenProps = {data, summary, navigate, preset, setPreset, saveMemo, applyPayment, registerClosure, matchDeposit, excludeDeposit, addPending}
  const Screen = {dashboard:Dashboard,list:ReceivablesList,bank:BankMatching,closure:ClosureBoard,roster:Roster,payments:PaymentsHistory,pending:PendingBoard}[view]

  return <div className="app">
    <aside className="sidebar">
      <div className="brand">미수금관리</div>
      <div className="brand-sub">강원 개인소형화물협회</div>
      <nav>{NAV.map(n=><button key={n.key} onClick={()=>navigate(n.key)} className={'nav-btn '+(view===n.key?'active':'')}>{n.label}{n.main?' · MAIN':''}</button>)}</nav>
      <div className="health">백엔드: {health}<br/>현재 화면: 샘플데이터 기반<br/>실제 DB/API 연결 전 업무흐름 검증용</div>
    </aside>
    <main className="main"><Screen {...screenProps}/></main>
  </div>
}
