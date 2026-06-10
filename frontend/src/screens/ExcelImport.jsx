import React, { useState } from 'react'
import { Card, PageHead, Badge } from '../components.jsx'
import { api } from '../api.js'

const TYPES = [
  { value: 'members', label: '전체면허자현황 / 전체자명단' },
  { value: 'arrears', label: '미수금명단 / 미납내역' },
  { value: 'deposits', label: '통장거래내역' },
]

export default function ExcelImport({ reloadFromDb }) {
  const [fileType, setFileType] = useState('members')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function doPreview() {
    if (!file) return alert('엑셀 파일을 먼저 선택하세요.')
    setLoading(true); setError(''); setResult(null)
    try { setPreview(await api.importPreview(fileType, file)) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }
  async function doCommit() {
    if (!file) return alert('엑셀 파일을 먼저 선택하세요.')
    if (!confirm('미리보기 내용을 DB에 반영할까요? 기존 데이터 삭제 없이 추가/보강만 합니다.')) return
    setLoading(true); setError('')
    try {
      const res = await api.importCommit(fileType, file)
      setResult(res)
      await reloadFromDb?.()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return <div>
    <PageHead title="엑셀 업로드" desc="실제 협회 엑셀을 DB에 반영합니다. 미리보기 후 저장해야 반영됩니다." />
    <Card className="card-pad" style={{marginBottom:14}}>
      <div className="notice" style={{marginBottom:12}}>
        삭제/초기화 없이 저장합니다. 먼저 <b>전체면허자현황</b>을 올린 뒤 <b>미수금명단</b>을 올리면 이름+차량번호로 매칭됩니다.
      </div>
      <div className="filters">
        <select className="select" value={fileType} onChange={e=>{setFileType(e.target.value);setPreview(null);setResult(null)}}>
          {TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input className="input" type="file" accept=".xlsx,.xlsm,.xls,.csv" onChange={e=>{setFile(e.target.files?.[0]||null);setPreview(null);setResult(null)}} />
        <button className="btn" disabled={loading||!file} onClick={doPreview}>미리보기</button>
        <button className="btn green" disabled={loading||!file} onClick={doCommit}>DB 저장</button>
      </div>
      {loading && <p className="small">처리 중입니다...</p>}
      {error && <div className="notice" style={{borderColor:'#ffb4a8',background:'#fff0ed',color:'#b42318',marginTop:12}}>오류: {error}</div>}
    </Card>

    {result && <Card className="card-pad" style={{marginBottom:14}}>
      <h3 style={{marginTop:0}}>저장 결과</h3>
      <div className="tabs">
        <Badge tone="green">추가 {result.inserted || 0}</Badge>
        <Badge tone="blue">갱신 {result.updated || 0}</Badge>
        <Badge tone="orange">건너뜀 {result.skipped || 0}</Badge>
      </div>
      {result.errors?.length ? <pre className="small">{result.errors.join('\n')}</pre> : <p className="small">오류 없음</p>}
    </Card>}

    {preview && <Card>
      <div className="card-pad">
        <h3 style={{marginTop:0}}>미리보기: {preview.filename}</h3>
        <p className="small">총 {preview.total_rows?.toLocaleString()}행 · 컬럼 {preview.columns?.length || 0}개</p>
        <div className="tabs" style={{marginBottom:10}}>{preview.columns?.slice(0,24).map(c=><Badge key={c} tone="gray">{c}</Badge>)}</div>
      </div>
      <div className="table-wrap"><table className="table"><thead><tr>{preview.columns?.slice(0,12).map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{preview.sample?.map((r,i)=><tr key={i}>{preview.columns?.slice(0,12).map(c=><td key={c}>{String(r[c] ?? '')}</td>)}</tr>)}</tbody></table></div>
    </Card>}
  </div>
}
