interface SkeletonTableProps {
  rows?: number
  cols?: number
}

export default function SkeletonTable({ rows = 10, cols = 4 }: SkeletonTableProps) {
  return (
    <div className="w-full space-y-2" aria-label="Loading data">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="h-8 flex-1 animate-pulse rounded bg-gray-800"
            />
          ))}
        </div>
      ))}
    </div>
  )
}
