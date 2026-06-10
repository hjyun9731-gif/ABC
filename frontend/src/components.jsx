import React from 'react'
import { formatWon, formatNum } from './data.js'
export { formatWon, formatNum }
export function Badge({children,tone='gray'}){return <span className={'badge '+tone}>{children}</span>}
export function Card({children,className='',style}){return <div className={'card '+className} style={style}>{children}</div>}
export function PageHead({title,desc,children}){return <div className="top-row"><div><h1 className="page-title">{title}</h1>{desc&&<div className="page-desc">{desc}</div>}</div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{children}</div></div>}
export function Stat({label,value,note,tone='blue',onClick}){return <button onClick={onClick} className="card stat" style={{textAlign:'left',borderColor:onClick?'#b9c7ff':undefined,background:onClick?'#fff':'#fff'}}><div className="stat-label">{label}</div><div className="stat-value" style={{color:`var(--${tone})`}}>{value}</div>{note&&<div className="stat-note">{note}</div>}</button>}
export function Empty({children='자료가 없습니다.'}){return <div className="card card-pad" style={{color:'var(--sub)',textAlign:'center',padding:40}}>{children}</div>}
