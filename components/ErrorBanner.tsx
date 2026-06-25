interface ErrorBannerProps {
  message: string
  onRetry: () => void
}

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-red-300">
      <span className="text-sm">{message}</span>
      <button
        onClick={onRetry}
        className="ml-4 rounded bg-red-800 px-3 py-1 text-xs text-red-100 hover:bg-red-700 transition-colors"
      >
        Retry
      </button>
    </div>
  )
}
