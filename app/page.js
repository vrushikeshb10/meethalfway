'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import LocationForm from '@/components/LocationForm'
import VibeSelector from '@/components/VibeSelector'
import TravelModeToggle from '@/components/TravelModeToggle'
import LoadingState from '@/components/LoadingState'
import ResultsSection from '@/components/ResultsSection'

const ERROR_MESSAGES = {
  invalid_address: "We couldn't find that location. Try being more specific — add a city or landmark.",
  no_venues: "No venues found near your midpoint. Try a different vibe or expand your search.",
  api_failure: "Something went wrong on our end. Please try again in a moment."
}

const INITIAL_FORM = { locationA: '', locationB: '', vibe: null, travelMode: 'transit' }

export default function Home() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [state, setState] = useState('idle') // idle | loading | results | error
  const [venues, setVenues] = useState([])
  const [errorType, setErrorType] = useState(null)

  const canSubmit = form.locationA.trim() && form.locationB.trim() && form.vibe && form.travelMode

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setState('loading')
    setErrorType(null)

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorType(data.errorType || 'api_failure')
        setState('error')
        return
      }

      setVenues(data.venues)
      setState('results')
    } catch {
      setErrorType('api_failure')
      setState('error')
    }
  }

  function handleTryAgain() {
    setState('idle')
    setErrorType(null)
  }

  function handleStartOver() {
    setForm(INITIAL_FORM)
    setVenues([])
    setErrorType(null)
    setState('idle')
  }

  if (state === 'loading') {
    return (
      <main className="min-h-screen bg-[#0A0A14] flex items-center justify-center p-4">
        <LoadingState />
      </main>
    )
  }

  if (state === 'results') {
    return (
      <main className="min-h-screen bg-[#0A0A14] p-4 py-12">
        <div className="max-w-lg mx-auto">
          <Header />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8"
          >
            <ResultsSection venues={venues} onTryAgain={handleTryAgain} onStartOver={handleStartOver} />
          </motion.div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0A0A14] p-4 py-12">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Header />
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col gap-8"
        >
          <section>
            <SectionLabel>Where are you both starting from?</SectionLabel>
            <LocationForm
              locationA={form.locationA}
              locationB={form.locationB}
              onChangeA={v => setForm(f => ({ ...f, locationA: v }))}
              onChangeB={v => setForm(f => ({ ...f, locationB: v }))}
            />
          </section>

          <section>
            <SectionLabel>What's the vibe?</SectionLabel>
            <VibeSelector
              selected={form.vibe}
              onChange={v => setForm(f => ({ ...f, vibe: v }))}
            />
          </section>

          <section>
            <SectionLabel>How are you getting there?</SectionLabel>
            <TravelModeToggle
              selected={form.travelMode}
              onChange={v => setForm(f => ({ ...f, travelMode: v }))}
            />
          </section>

          {(state === 'error') && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              {ERROR_MESSAGES[errorType] ?? ERROR_MESSAGES.api_failure}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200
              ${canSubmit
                ? 'bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white shadow-lg shadow-violet-500/20'
                : 'bg-white/5 text-gray-600 cursor-not-allowed'
              }`}
          >
            Find Our Spot →
          </button>
        </motion.form>
      </div>
    </main>
  )
}

function Header() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-black text-white tracking-tight">
        Meet<span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">Halfway</span>
      </h1>
      <p className="text-gray-400 mt-2 text-sm">Find the perfect spot. Equal travel time for both.</p>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{children}</p>
  )
}
