'use client'

export default function VenueCard({ venue, index }) {
  const { name, description, travelTimeA, travelTimeB, address, googleMapsUrl } = venue

  return (
    <div className="flex flex-col gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/[0.08] transition-all duration-200">
      <div>
        <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">#{index + 1}</span>
        <h3 className="text-xl font-bold text-white mt-1">{name}</h3>
        <p className="text-gray-400 text-sm mt-1 leading-relaxed">{description}</p>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Person A</div>
          <div className="text-lg font-bold text-white">{travelTimeA}</div>
        </div>
        <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Person B</div>
          <div className="text-lg font-bold text-white">{travelTimeB}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 truncate pr-2">{address}</span>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-medium text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors"
        >
          Open in Maps →
        </a>
      </div>
    </div>
  )
}
