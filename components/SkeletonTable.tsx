interface SkeletonTableProps {
  rows?: number
  cols?: number
}

export default function SkeletonTable({ rows = 8 }: SkeletonTableProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} aria-label="Loading data">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="animate-shimmer"
          style={{
            height: 68,
            borderRadius: 12,
            border: '1px solid var(--border)',
          }}
        />
      ))}
    </div>
  )
}
