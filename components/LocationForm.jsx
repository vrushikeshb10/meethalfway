'use client'

export default function LocationForm({ locationA, locationB, onChangeA, onChangeB }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="locationA" className="text-sm font-medium text-gray-300">
          Person A's location
        </label>
        <input
          id="locationA"
          type="text"
          value={locationA}
          onChange={e => onChangeA(e.target.value)}
          placeholder="e.g. Brooklyn Bridge, New York"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="locationB" className="text-sm font-medium text-gray-300">
          Person B's location
        </label>
        <input
          id="locationB"
          type="text"
          value={locationB}
          onChange={e => onChangeB(e.target.value)}
          placeholder="e.g. Upper West Side, New York"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
        />
      </div>
    </div>
  )
}
