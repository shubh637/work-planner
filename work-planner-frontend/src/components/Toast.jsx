import React from 'react'

const TOAST_STYLES = {
  success: { bg: '#d1fae5', border: '#6ee7b7', color: '#065f46', icon: 'M20 6L9 17l-5-5' },
  error:   { bg: '#fee2e2', border: '#fca5a5', color: '#991b1b', icon: 'M18 6L6 18M6 6l12 12' },
  warning: { bg: '#fef3c7', border: '#fde68a', color: '#92400e', icon: 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' },
  info:    { bg: '#e0f2fe', border: '#7dd3fc', color: '#0c4a6e', icon: 'M12 16v-4m0-4h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z' },
}

export default function Toast({ toasts, onDismiss }) {
  if (!toasts.length) return null

  return (
    <div style={{
      position: 'fixed', top: '72px', right: '20px',
      display: 'flex', flexDirection: 'column', gap: '8px',
      zIndex: 9999, pointerEvents: 'none',
    }}>
      {toasts.map(t => {
        const s = TOAST_STYLES[t.type] || TOAST_STYLES.info
        return (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: '10px', padding: '12px 14px',
            boxShadow: '0 4px 16px rgba(15,23,42,0.12)',
            minWidth: '260px', maxWidth: '360px',
            animation: 'toastIn 0.28s cubic-bezier(0.34,1.2,0.64,1)',
            pointerEvents: 'all',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.color}
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d={s.icon} />
            </svg>
            <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, color: s.color, lineHeight: 1.4 }}>
              {t.message}
            </span>
            <button onClick={() => onDismiss(t.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '2px', color: s.color, opacity: 0.6, flexShrink: 0,
              display: 'flex', alignItems: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}
