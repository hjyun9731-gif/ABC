const BASE = '/api';

async function http(path, options = {}) {
  const headers = options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' };
  const res = await fetch(BASE + path, { headers, ...options });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `요청 실패 (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

function qs(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== '전체') sp.set(k, v);
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const api = {
  health: () => http('/health'),
  listMembers: (params = {}) => http(`/members${qs(params)}`),
  getMember: (id) => http(`/members/${id}`),
  updateMember: (id, body) => http(`/members/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  applyPayment: (id, body) => http(`/members/${id}/payments`, { method: 'POST', body: JSON.stringify(body) }),
  registerClosure: (id, body) => http(`/members/${id}/closure`, { method: 'POST', body: JSON.stringify(body) }),
  listDeposits: (params = {}) => http(`/deposits${qs(params)}`),
  matchDeposit: (id, body) => http(`/deposits/${id}/match`, { method: 'POST', body: JSON.stringify(body) }),
  excludeDeposit: (id) => http(`/deposits/${id}/exclude`, { method: 'POST' }),
  listClosures: () => http('/closures'),
  listPending: () => http('/pending'),
  dashboardSummary: () => http('/dashboard/summary'),
  importPreview: (fileType, file) => {
    const fd = new FormData(); fd.append('file_type', fileType); fd.append('file', file);
    return http('/import/preview', { method: 'POST', body: fd });
  },
  importCommit: (fileType, file) => {
    const fd = new FormData(); fd.append('file_type', fileType); fd.append('file', file);
    return http('/import/commit', { method: 'POST', body: fd });
  },
  resetMisuData: () => http('/import/reset', { method: 'POST' }),
};
