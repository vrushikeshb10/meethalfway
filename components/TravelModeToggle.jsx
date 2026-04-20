'use client'

const MODES = [
  { id: 'driving', label: 'Driving', emoji: '🚗' },
  { id: 'transit', label: 'Transit', emoji: '🚇' },
  { id: 'walking', label: 'Walking', emoji: '🚶' }
]

export default function TravelModeToggle({ selected, onChange }) {
  return (
    <div className="flex bg-white/5 rounded-full p-1 border border-white/10 w-fit">
      {MODES.map(mode => (
        <button
          key={mode.id}
          data-testid={`mode-${mode.id}`}
          onClick={() => onChange(mode.id)}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200
            ${selected === mode.id
              ? 'bg-white text-gray-900'
              : 'text-gray-400 hover:text-white'
            }`}
        >
          <span>{mode.emoji}</span>
          <span>{mode.label}</span>
        </button>
      ))}
    </div>
  )
}
