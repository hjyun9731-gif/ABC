import React from 'react'
import { Card, PageHead, Stat, Badge, formatWon, formatNum } from '../components.jsx'

export default function Dashboard({data,summary,navigate}){
  const bySigun = Object.entries(data.members.filter(m=>m.status==='정상'&&m.totalArrears>0).reduce((acc,m)=>{acc[m.sigun]=(acc[m.sigun]||0)+m.totalArrears;return acc},{})).sort((a,b)=>b[1]-a[1]).slice(0,8)
  const recentPayments=[...data.payments].slice(-6).reverse()
  return <div>
    <PageHead title="대시보드" desc="현황을 보고 → 대상자를 찾고 → 미수금명단에서 바로 처리하는 화면입니다." />
    <div className="grid grid-4" style={{marginBottom:16}}>
      <Stat label="총 회원수" value={formatNum(summary.totalMembers)} note={`정상 ${formatNum(summary.activeMembers)}명`} onClick={()=>navigate('roster')}/>
      <Stat label="미수 인원" value={formatNum(summary.arrearsCount)} note="클릭 시 미수명단" tone="orange" onClick={()=>navigate('list',{amount:'미수있음'})}/>
      <Stat label="총 미수금액" value={formatWon(summary.totalArrears)} note="정상 회원 기준" tone="red" onClick={()=>navigate('list',{amount:'미수있음'})}/>
      <Stat label="이번달 수납액" value={formatWon(summary.thisMonthPayments)} note="수납내역 기준" tone="green" onClick={()=>navigate('payments')}/>
    </div>
    <div className="grid grid-3" style={{marginBottom:16}}>
      <Card className="card-pad"><h3>주의 대상</h3><div className="tabs"><button className="chip active" onClick={()=>navigate('list',{amount:'30만원이상'})}>30만원 이상 {summary.highAmount}명</button><button className="chip active" onClick={()=>navigate('list',{special:'장기'})}>장기미납 {summary.longOverdue}명</button><button className="chip active" onClick={()=>navigate('list',{special:'결번'})}>결번/반송 {summary.disconnected}명</button><button className="chip active" onClick={()=>navigate('list',{special:'자격'})}>자격증명 미발급 {summary.certMissing}명</button></div></Card>
      <Card className="card-pad"><h3>처리 대기</h3><p><Badge tone="blue">예정자</Badge> {summary.pending}건</p><p><Badge tone="orange">통장매칭 확인</Badge> {summary.bankPending}건</p><p><Badge tone="red">폐업/양도/이관</Badge> {summary.closures}건</p></Card>
      <Card className="card-pad"><h3>부과 규칙</h3><p>관리비 <b>5,000원</b></p><p>협회비 <b>10,000원</b></p><p>70세 이상 협회가입자 <b>5,000원</b></p><p className="small">관리비는 발급일 다음 달, 협회비는 가입일 다음 달부터 부과</p></Card>
    </div>
    <div className="grid grid-2">
      <Card className="card-pad"><h3>지역별 미수금 TOP</h3>{bySigun.map(([s,amt])=><div key={s} style={{display:'grid',gridTemplateColumns:'90px 1fr 100px',gap:10,alignItems:'center',margin:'10px 0'}}><b>{s}</b><div style={{height:10,background:'var(--blue2)',borderRadius:999,overflow:'hidden'}}><div style={{width:`${Math.max(8,amt/bySigun[0][1]*100)}%`,height:'100%',background:'var(--blue)'}}/></div><span className="right money">{formatWon(amt)}</span></div>)}</Card>
      <Card className="card-pad"><h3>최근 수납</h3><table className="table" style={{minWidth:0}}><tbody>{recentPayments.map(p=><tr key={p.id}><td>{p.paidDate}</td><td><b>{p.name}</b><br/><span className="small">{p.vehicleNo}</span></td><td>{p.method}</td><td className="right money">{formatWon(p.amount)}</td></tr>)}</tbody></table></Card>
    </div>
  </div>
}
