'use client'
import { motion } from 'framer-motion'
import VenueCard from './VenueCard'

export default function ResultsSection({ venues, onTryAgain, onStartOver }) {
  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-white">Here's your plan ✨</h2>
        <p className="text-gray-400 text-sm mt-1">Sorted by travel time balance</p>
      </motion.div>

      <div className="flex flex-col gap-4">
        {venues.map((venue, i) => (
          <motion.div
            key={venue.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12, duration: 0.4, ease: 'easeOut' }}
          >
            <VenueCard venue={venue} index={i} />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex gap-3 pt-2"
      >
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
      </motion.div>
    </div>
  )
}
