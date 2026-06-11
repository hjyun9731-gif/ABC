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
  async function doReset() {
    if (!confirm('현재 misu_* 업무 데이터를 초기화할까요? 기존 샘플/테스트/업로드 데이터를 비우고, 이후 새로 올리는 엑셀 정보만 표시됩니다.')) return
    if (!confirm('정말 초기화합니다. 이 작업은 misu_members, misu_receivable_items, misu_payments, misu_deposits, misu_closures, misu_pending 데이터만 비웁니다.')) return
    setLoading(true); setError(''); setResult(null); setPreview(null)
    try {
      const res = await api.resetMisuData()
      setResult({inserted:0, updated:0, skipped:0, errors:[res.message || '초기화 완료']})
      await reloadFromDb?.()
    } catch (e) { setError(e.message) }
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
        현재 화면은 샘플 없이 <b>DB에 저장된 실제 엑셀 데이터만</b> 표시합니다. 기존 테스트 저장분을 비우려면 먼저 초기화한 뒤 전체면허자현황 → 미수금명단 순서로 저장하세요.
      </div>
      <div className="filters">
        <select className="select" value={fileType} onChange={e=>{setFileType(e.target.value);setPreview(null);setResult(null)}}>
          {TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input className="input" type="file" accept=".xlsx,.xlsm,.xls,.csv" onChange={e=>{setFile(e.target.files?.[0]||null);setPreview(null);setResult(null)}} />
        <button className="btn" disabled={loading||!file} onClick={doPreview}>미리보기</button>
        <button className="btn green" disabled={loading||!file} onClick={doCommit}>DB 저장</button>
        <button className="btn danger" disabled={loading} onClick={doReset}>기존 DB 초기화</button>
      </div>
      {loading && <p className="small">처리 중입니다...</p>}
      {error && <div className="notice" style={{borderColor:'#ffb4a8',background:'#fff0ed',color:'#b42318',marginTop:12}}>오류: {error}</div>}
    </Card>

    {result && <Card className="card-pad" style={{marginBottom:14}}>
      <h3 style={{marginTop:0}}>저장 결과</h3>
      <div className="tabs">
        <Badge tone="green">추가 {result.inserted || 0}</Badge>
        <Badge tone="blue">갱신 {result.updated || 0}</Badge>
        <Badge tone="orange">건너뜀/빈행 {result.skipped || 0}</Badge>
      </div>
      {result.errors?.length ? <pre className="small">{result.errors.map(e=>typeof e==='string'?e:JSON.stringify(e)).join('\n')}</pre> : <p className="small">오류 없음 · 건너뜀은 빈 행, 차량번호 없는 행, 저장 대상이 아닌 행입니다.</p>}
    </Card>}

    {preview && <Card>
      <div className="card-pad">
        <h3 style={{marginTop:0}}>미리보기: {preview.filename}</h3>
        <p className="small">총 {preview.total_rows?.toLocaleString()}행 · 표시 컬럼 {preview.columns?.length || 0}개</p>
        {preview.message && <p className="small">{preview.message}</p>}
        {preview.raw_columns?.length ? <p className="small">원본 인식 컬럼: {preview.raw_columns.slice(0,20).join(' · ')}{preview.raw_columns.length>20?' ...':''}</p> : null}
        <div className="tabs" style={{marginBottom:10}}>{preview.columns?.slice(0,24).map(c=><Badge key={c} tone="gray">{c}</Badge>)}</div>
      </div>
      <div className="table-wrap"><table className="table"><thead><tr>{preview.columns?.slice(0,18).map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{preview.sample?.map((r,i)=><tr key={i}>{preview.columns?.slice(0,18).map(c=><td key={c}>{String(r[c] ?? '')}</td>)}</tr>)}</tbody></table></div>
    </Card>}
  </div>
}
