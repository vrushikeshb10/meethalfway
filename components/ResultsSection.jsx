'use client'
import VenueCard from './VenueCard'

export default function ResultsSection({ venues, onTryAgain, onStartOver }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Here's your plan ✨</h2>
        <p className="text-gray-400 text-sm mt-1">Sorted by travel time balance</p>
      </div>

      <div className="flex flex-col gap-4">
        {venues.map((venue, i) => (
          <VenueCard key={venue.name} venue={venue} index={i} />
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onTryAgain}
          className="flex-1 py-3 rounded-xl border border-white/20 text-white font-medium hover:bg-white/5 transition-all"
        >
          Try Again
        </button>
        <button
          onClick={onStartOver}
          className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-all"
        >
          Start Over
        </button>
      </div>
    </div>
  )
}
