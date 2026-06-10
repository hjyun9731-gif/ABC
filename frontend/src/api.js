/* =========================================================================
   API 클라이언트
   - 모든 백엔드 호출을 이 파일에 모은다.
   - 프로토타입의 window.AppData.buildDataset() 를 대체할 자리.
   - 화면 구현 단계에서 함수 본문을 채운다(골격에서는 시그니처/공통 fetch 만).
   ========================================================================= */

const BASE = '/api';

async function http(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `요청 실패 (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  health: () => http('/health'),

  // 미수금명단 / 전체자명단
  listMembers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return http(`/members${qs ? `?${qs}` : ''}`);
  },
  getMember: (id) => http(`/members/${id}`),
  updateMember: (id, body) => http(`/members/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  // 수납 반영 / 폐업 등록 (백엔드 다음 단계 구현)
  applyPayment: (id, body) => http(`/members/${id}/payments`, { method: 'POST', body: JSON.stringify(body) }),
  registerClosure: (id, body) => http(`/members/${id}/closure`, { method: 'POST', body: JSON.stringify(body) }),

  // 통장매칭
  listDeposits: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return http(`/deposits${qs ? `?${qs}` : ''}`);
  },
  matchDeposit: (id, body) => http(`/deposits/${id}/match`, { method: 'POST', body: JSON.stringify(body) }),
  excludeDeposit: (id) => http(`/deposits/${id}/exclude`, { method: 'POST' }),

  // 폐업현황 / 예정자 / 대시보드
  listClosures: () => http('/closures'),
  listPending: () => http('/pending'),
  dashboardSummary: () => http('/dashboard/summary'),
};
