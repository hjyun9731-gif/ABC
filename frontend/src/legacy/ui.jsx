/* =========================================================================
   공용 UI 토큰 · 기본 컴포넌트 (파스텔 관공서 톤, Pretendard)
   ========================================================================= */

/* ---- 디자인 토큰 (전역 CSS 주입) ---- */
(function injectTokens() {
  const css = `
  :root{
    --bg:#eef1f6; --surface:#ffffff; --surface-2:#f6f8fb;
    --line:#e3e8f0; --line-2:#eef1f6;
    --ink:#1f2738; --ink-2:#56607a; --ink-3:#8a94a8;
    --blue:#3a6ea5; --blue-strong:#2f6bd8; --blue-bg:#e9f1fb; --blue-bg2:#f1f6fd; --blue-line:#cfe0f5;
    --green:#1f9d6b; --green-bg:#e8f6ef; --green-line:#c5e8d6;
    --orange:#dd882f; --orange-bg:#fdf1e2; --orange-line:#f5dcb8;
    --red:#d6493f; --red-bg:#fcebe9; --red-line:#f3cdc9;
    --purple:#6a5acd; --purple-bg:#eeecfb; --purple-line:#d8d2f2;
    --radius:12px; --radius-sm:8px;
    --shadow:0 1px 2px rgba(28,42,71,.05), 0 4px 16px rgba(28,42,71,.05);
    --shadow-lg:0 8px 32px rgba(28,42,71,.14);
  }
  *{box-sizing:border-box}
  html,body{margin:0;padding:0}
  body{
    font-family:'Pretendard','Pretendard Variable',-apple-system,BlinkMacSystemFont,system-ui,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;
    background:var(--bg); color:var(--ink);
    -webkit-font-smoothing:antialiased; font-feature-settings:"tnum";
    font-size:14px; line-height:1.5;
  }
  ::-webkit-scrollbar{width:10px;height:10px}
  ::-webkit-scrollbar-thumb{background:#cfd6e2;border-radius:8px;border:2px solid var(--bg)}
  ::-webkit-scrollbar-thumb:hover{background:#b9c2d3}
  button{font-family:inherit;cursor:pointer}
  .tnum{font-variant-numeric:tabular-nums}
  .mono{font-family:'SF Mono',ui-monospace,'Menlo',monospace}
  `;
  const s = document.createElement('style');
  s.textContent = css;
  document.head.appendChild(s);
})();

const C = {
  blue: 'var(--blue-strong)', green: 'var(--green)', orange: 'var(--orange)',
  red: 'var(--red)', purple: 'var(--purple)', ink: 'var(--ink)', ink2: 'var(--ink-2)', ink3: 'var(--ink-3)',
};

/* ---- 작은 아이콘 (선형, 최소한) ---- */
function Icon({ name, size = 18, color = 'currentColor', stroke = 1.8 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
    list: <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="3.5" cy="6" r="1.2" fill={color} stroke="none" /><circle cx="3.5" cy="12" r="1.2" fill={color} stroke="none" /><circle cx="3.5" cy="18" r="1.2" fill={color} stroke="none" /></>,
    bank: <><line x1="3" y1="21" x2="21" y2="21" /><line x1="4" y1="10" x2="4" y2="18" /><line x1="9" y1="10" x2="9" y2="18" /><line x1="15" y1="10" x2="15" y2="18" /><line x1="20" y1="10" x2="20" y2="18" /><path d="M12 3 21 8 3 8z" /></>,
    closed: <><path d="M3 7l9-4 9 4v6c0 5-9 8-9 8s-9-3-9-8z" /><line x1="9" y1="12" x2="15" y2="12" /></>,
    plus: <><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></>,
    search: <><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
    phone: <><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></>,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="16" y1="2" x2="16" y2="6" /></>,
    won: <><circle cx="12" cy="12" r="9" /><path d="M8 9l1.6 5 2.4-5 2.4 5L18 9" /><line x1="7" y1="12" x2="17" y2="12" /></>,
    alert: <><path d="M12 3 22 20H2z" /><line x1="12" y1="10" x2="12" y2="14" /><circle cx="12" cy="17.5" r=".6" fill={color} stroke={color} /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <><polyline points="4 12 10 18 20 6" /></>,
    chevron: <><polyline points="9 6 15 12 9 18" /></>,
    close: <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>,
    excel: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 8l6 8M15 8l-6 8" /></>,
    filter: <><path d="M3 5h18l-7 8v6l-4-2v-4z" /></>,
    edit: <><path d="M4 20h4L19 9l-4-4L4 16z" /><line x1="13" y1="7" x2="17" y2="11" /></>,
    refresh: <><path d="M21 12a9 9 0 1 1-3-6.7" /><polyline points="21 4 21 9 16 9" /></>,
    memo: <><rect x="4" y="3" width="16" height="18" rx="2" /><line x1="8" y1="8" x2="16" y2="8" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="16" x2="13" y2="16" /></>,
    arrowRight: <><line x1="4" y1="12" x2="20" y2="12" /><polyline points="14 6 20 12 14 18" /></>,
    pin: <><path d="M12 21s7-6.4 7-11a7 7 0 0 0-14 0c0 4.6 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
    swap: <><polyline points="7 4 3 8 7 12" /><line x1="3" y1="8" x2="17" y2="8" /><polyline points="17 12 21 16 17 20" /><line x1="21" y1="16" x2="7" y2="16" /></>,
    upload: <><path d="M12 16V4" /><polyline points="7 9 12 4 17 9" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></>,
  };
  return <svg {...p} style={{ display: 'block', flex: 'none' }}>{paths[name] || null}</svg>;
}

/* ---- Badge ---- */
function Badge({ tone = 'gray', children, soft = true, size = 'md' }) {
  const map = {
    gray: ['#5b6678', '#eef1f6', '#e3e8f0'],
    blue: ['var(--blue-strong)', 'var(--blue-bg)', 'var(--blue-line)'],
    green: ['var(--green)', 'var(--green-bg)', 'var(--green-line)'],
    orange: ['var(--orange)', 'var(--orange-bg)', 'var(--orange-line)'],
    red: ['var(--red)', 'var(--red-bg)', 'var(--red-line)'],
    purple: ['var(--purple)', 'var(--purple-bg)', 'var(--purple-line)'],
  };
  const [fg, bg, line] = map[tone] || map.gray;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      color: fg, background: soft ? bg : 'transparent',
      border: `1px solid ${line}`, borderRadius: 999,
      padding: size === 'sm' ? '1px 7px' : '2px 9px',
      fontSize: size === 'sm' ? 11.5 : 12.5, fontWeight: 600, whiteSpace: 'nowrap', lineHeight: 1.5,
    }}>{children}</span>
  );
}

/* ---- Button ---- */
function Button({ children, onClick, variant = 'default', size = 'md', icon, tone, disabled, style }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 9, fontWeight: 600, lineHeight: 1, whiteSpace: 'nowrap',
    padding: size === 'sm' ? '7px 11px' : size === 'lg' ? '12px 20px' : '9px 15px',
    fontSize: size === 'sm' ? 13 : 14, transition: 'all .12s', border: '1px solid transparent',
    opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto',
  };
  const styles = {
    primary: { background: 'var(--blue-strong)', color: '#fff', boxShadow: '0 1px 2px rgba(47,107,216,.3)' },
    default: { background: '#fff', color: 'var(--ink)', border: '1px solid var(--line)' },
    ghost: { background: 'transparent', color: 'var(--ink-2)', border: '1px solid transparent' },
    soft: { background: 'var(--blue-bg)', color: 'var(--blue-strong)', border: '1px solid var(--blue-line)' },
    danger: { background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-line)' },
    success: { background: 'var(--green)', color: '#fff' },
  };
  const toneStyle = tone === 'green' ? { background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-line)' }
    : tone === 'orange' ? { background: 'var(--orange-bg)', color: 'var(--orange)', border: '1px solid var(--orange-line)' }
    : tone === 'red' ? { background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-line)' } : {};
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...base, ...(styles[variant] || styles.default), ...toneStyle, ...style }}>
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 16} />}
      {children}
    </button>
  );
}

/* ---- Card ---- */
function Card({ children, style, pad = 18, onClick, hover }) {
  const [h, setH] = React.useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)',
        boxShadow: hover && h ? 'var(--shadow-lg)' : 'var(--shadow)', padding: pad,
        cursor: onClick ? 'pointer' : 'default',
        transform: hover && h ? 'translateY(-2px)' : 'none', transition: 'all .14s',
        ...style,
      }}>{children}</div>
  );
}

/* ---- Section title ---- */
function SectionTitle({ children, sub, right, icon, tone = 'blue' }) {
  const bar = { blue: 'var(--blue-strong)', green: 'var(--green)', orange: 'var(--orange)', purple: 'var(--purple)' }[tone];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ width: 4, height: 17, background: bar, borderRadius: 3 }} />
        {icon && <Icon name={icon} size={18} color={bar} />}
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em' }}>{children}</span>
        {sub && <span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 500 }}>{sub}</span>}
      </div>
      {right}
    </div>
  );
}

/* ---- Modal ---- */
function Modal({ open, onClose, title, children, width = 560, footer }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(20,28,46,.42)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(2px)',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 16, width, maxWidth: '100%', maxHeight: '88vh',
        overflow: 'hidden', boxShadow: '0 24px 70px rgba(20,28,46,.34)', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '17px 22px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontSize: 16.5, fontWeight: 800 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', padding: 4, borderRadius: 6, display: 'flex' }}><Icon name="close" size={20} /></button>
        </div>
        <div style={{ padding: 22, overflowY: 'auto' }}>{children}</div>
        {footer && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, padding: '15px 22px', borderTop: '1px solid var(--line)', background: 'var(--surface-2)' }}>{footer}</div>}
      </div>
    </div>
  );
}

/* ---- KV row (상세 정보 표시) ---- */
function KV({ label, children, mono }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '6px 0', borderBottom: '1px dashed var(--line-2)' }}>
      <span style={{ width: 92, flex: 'none', fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', fontFamily: mono ? "'SF Mono',ui-monospace,monospace" : 'inherit' }}>{children}</span>
    </div>
  );
}

/* ---- 상태 → 배지 톤 ---- */
function statusTone(s) {
  return s === '정상' ? 'green' : s === '폐업' ? 'red' : s === '양도' ? 'orange' : s === '이관' ? 'purple' : 'gray';
}
function chargeTone(t) { return t === '협회비' ? 'blue' : 'orange'; }

Object.assign(window, { Icon, Badge, Button, Card, SectionTitle, Modal, KV, C, statusTone, chargeTone });
