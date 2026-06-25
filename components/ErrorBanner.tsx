interface ErrorBannerProps {
  message: string
  onRetry: () => void
}

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      borderRadius: 12,
      border: '1px solid rgba(239,68,68,0.2)',
      background: 'rgba(239,68,68,0.06)',
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--loss)',
          flexShrink: 0,
          display: 'inline-block',
        }} />
        <span style={{
          fontSize: 12,
          color: 'var(--loss)',
          fontFamily: 'Syne, sans-serif',
          fontWeight: 500,
        }}>
          {message}
        </span>
      </div>
      <button
        onClick={onRetry}
        style={{
          flexShrink: 0,
          background: 'var(--surface)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 6,
          padding: '6px 14px',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: 'var(--loss)',
          cursor: 'pointer',
          fontFamily: 'Syne, sans-serif',
          transition: 'all 0.15s',
        }}
      >
        RETRY
      </button>
    </div>
  )
}
