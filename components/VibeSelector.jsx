'use client'

const VIBES = [
  { id: 'romantic', label: 'Romantic', emoji: '🌹', description: 'Wine bars, rooftop dining, jazz cafés' },
  { id: 'casual', label: 'Casual', emoji: '☕', description: 'Cafés, parks, breweries, food markets' },
  { id: 'adventurous', label: 'Adventurous', emoji: '⚡', description: 'Escape rooms, live music, comedy clubs' }
]

export default function VibeSelector({ selected, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {VIBES.map(vibe => (
        <button
          key={vibe.id}
          data-testid={`vibe-${vibe.id}`}
          onClick={() => onChange(vibe.id)}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 text-center cursor-pointer
            ${selected === vibe.id
              ? 'ring-2 ring-violet-500 border-violet-500 bg-violet-500/10'
              : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
            }`}
        >
          <span className="text-3xl">{vibe.emoji}</span>
          <span className="font-semibold text-white text-sm">{vibe.label}</span>
          <span className="text-xs text-gray-400 leading-tight">{vibe.description}</span>
        </button>
      ))}
    </div>
  )
}
