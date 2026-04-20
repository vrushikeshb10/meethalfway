'use client'

export default function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20">
      <div
        data-testid="spinner"
        className="w-14 h-14 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin"
      />
      <div className="text-center">
        <p className="text-lg font-semibold text-white">Finding your perfect spot</p>
        <p className="text-sm text-gray-400 mt-1">Usually takes 20–40 seconds</p>
      </div>
    </div>
  )
}
