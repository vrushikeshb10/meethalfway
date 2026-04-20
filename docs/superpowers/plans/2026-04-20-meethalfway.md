# MeetHalfway Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js web app that finds a fair commute-time midpoint between two people and suggests 3 venue options based on their chosen vibe and travel mode.

**Architecture:** Single Next.js App Router project with a `/api/plan` POST route that runs a Claude tool-use agent loop. Claude calls Google Maps API wrappers (geocoding, places search, distance matrix) as tools to orchestrate the full recommendation flow. The frontend is a single client-side page that transitions through idle → loading → results/error states.

**Tech Stack:** Next.js 14 (App Router), Tailwind CSS, Framer Motion, `@anthropic-ai/sdk`, `@googlemaps/google-maps-services-js`, Jest + React Testing Library

---

## File Map

| Path | Responsibility |
|---|---|
| `lib/maps.js` | Google Maps API wrappers: geocode, places search, travel time |
| `lib/claude.js` | System prompt builder, user prompt builder, response parser |
| `app/api/plan/route.js` | POST handler — Claude tool-use agent loop |
| `components/VibeSelector.jsx` | Three large clickable vibe cards |
| `components/TravelModeToggle.jsx` | Pill toggle for driving/transit/walking |
| `components/LocationForm.jsx` | Two controlled text inputs for locations |
| `components/VenueCard.jsx` | Single venue card with travel times and Maps link |
| `components/LoadingState.jsx` | Spinner + loading copy |
| `components/ResultsSection.jsx` | Three VenueCards + Try Again + Start Over |
| `app/page.js` | Main page — state machine, form wiring, API call |
| `app/layout.js` | Root layout: Google Fonts, metadata |
| `app/globals.css` | Tailwind imports + base styles |
| `tailwind.config.js` | Font family extension |
| `.env.local.example` | API key template |
| `.gitignore` | Ensures `.env.local` is never committed |

---

### Task 1: Project Initialization & Configuration

**Files:**
- Create: `package.json` (via create-next-app)
- Create: `tailwind.config.js`
- Create: `jest.config.js`
- Create: `jest.setup.js`
- Create: `.env.local.example`
- Modify: `.gitignore`

- [ ] **Step 1: Bootstrap the Next.js app**

Run:
```bash
npx create-next-app@latest . --app --tailwind --eslint --no-src-dir --import-alias="@/*" --yes
```
Expected: Next.js app created with App Router, Tailwind, and ESLint. No prompts.

- [ ] **Step 2: Install additional dependencies**

Run:
```bash
npm install @anthropic-ai/sdk @googlemaps/google-maps-services-js framer-motion
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```
Expected: All packages installed without errors.

- [ ] **Step 3: Configure Jest**

Create `jest.config.js`:
```javascript
const nextJest = require('next/jest')
const createJestConfig = nextJest({ dir: './' })
module.exports = createJestConfig({
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/']
})
```

Create `jest.setup.js`:
```javascript
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add jest scripts to package.json**

In `package.json`, add to the `"scripts"` section:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 5: Create env template and verify .gitignore**

Create `.env.local.example`:
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

Verify `.gitignore` contains (add if missing):
```
.env.local
.env*.local
```

- [ ] **Step 6: Run tests to confirm Jest works**

Run: `npm test`
Expected: "No tests found, exiting with code 1" or "Test suite failed to run" — the runner itself is working even with no tests.

- [ ] **Step 7: Commit**
```bash
git add .
git commit -m "feat: initialize Next.js project with Tailwind, Jest, and dependencies"
```

---

### Task 2: Google Maps API Library

**Files:**
- Create: `lib/maps.js`
- Create: `lib/__tests__/maps.test.js`

- [ ] **Step 1: Write failing tests**

Create `lib/__tests__/maps.test.js`:
```javascript
import { geocodeLocation, searchPlacesNear, getTravelTime } from '@/lib/maps'

jest.mock('@googlemaps/google-maps-services-js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    geocode: jest.fn(),
    placesNearby: jest.fn(),
    distancematrix: jest.fn()
  })),
  TravelMode: {
    driving: 'driving',
    transit: 'transit',
    walking: 'walking'
  }
}))

const { Client } = require('@googlemaps/google-maps-services-js')
let mockClient

beforeEach(() => {
  mockClient = {
    geocode: jest.fn(),
    placesNearby: jest.fn(),
    distancematrix: jest.fn()
  }
  Client.mockImplementation(() => mockClient)
  jest.resetModules()
})

describe('geocodeLocation', () => {
  it('returns lat and lng for a valid address', async () => {
    mockClient.geocode.mockResolvedValue({
      data: {
        status: 'OK',
        results: [{ geometry: { location: { lat: 40.758, lng: -73.9855 } } }]
      }
    })
    const result = await geocodeLocation('Times Square, New York')
    expect(result).toEqual({ lat: 40.758, lng: -73.9855 })
  })

  it('throws an error if status is not OK', async () => {
    mockClient.geocode.mockResolvedValue({
      data: { status: 'ZERO_RESULTS', results: [] }
    })
    await expect(geocodeLocation('not a real place xyz')).rejects.toThrow('ZERO_RESULTS')
  })
})

describe('searchPlacesNear', () => {
  it('returns array of places with name, address, placeId', async () => {
    mockClient.placesNearby.mockResolvedValue({
      data: {
        status: 'OK',
        results: [
          { name: 'The Wine Bar', vicinity: '123 Main St', place_id: 'abc123' },
          { name: 'Jazz Lounge', vicinity: '456 Oak Ave', place_id: 'def456' }
        ]
      }
    })
    const result = await searchPlacesNear(40.758, -73.9855, 'wine bar', 1500)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ name: 'The Wine Bar', address: '123 Main St', placeId: 'abc123' })
  })

  it('returns empty array if no results', async () => {
    mockClient.placesNearby.mockResolvedValue({
      data: { status: 'ZERO_RESULTS', results: [] }
    })
    const result = await searchPlacesNear(0, 0, 'anything', 1000)
    expect(result).toEqual([])
  })
})

describe('getTravelTime', () => {
  it('returns duration text for a valid route', async () => {
    mockClient.distancematrix.mockResolvedValue({
      data: {
        status: 'OK',
        rows: [{ elements: [{ status: 'OK', duration: { text: '18 mins' } }] }]
      }
    })
    const result = await getTravelTime('Times Square, NY', 'Central Park, NY', 'transit')
    expect(result).toBe('18 mins')
  })

  it('throws if route element status is not OK', async () => {
    mockClient.distancematrix.mockResolvedValue({
      data: {
        status: 'OK',
        rows: [{ elements: [{ status: 'NOT_FOUND' }] }]
      }
    })
    await expect(getTravelTime('A', 'B', 'driving')).rejects.toThrow('NOT_FOUND')
  })
})
```

- [ ] **Step 2: Run to confirm tests fail**

Run: `npm test lib/__tests__/maps.test.js`
Expected: FAIL — "Cannot find module '@/lib/maps'"

- [ ] **Step 3: Implement `lib/maps.js`**

Create `lib/maps.js`:
```javascript
import { Client, TravelMode } from '@googlemaps/google-maps-services-js'

const client = new Client()

export async function geocodeLocation(address) {
  const response = await client.geocode({
    params: { address, key: process.env.GOOGLE_MAPS_API_KEY }
  })
  const { status, results } = response.data
  if (status !== 'OK' || results.length === 0) throw new Error(status)
  return results[0].geometry.location
}

export async function searchPlacesNear(lat, lng, keyword, radiusMeters = 1500) {
  const response = await client.placesNearby({
    params: {
      location: { lat, lng },
      radius: radiusMeters,
      keyword,
      key: process.env.GOOGLE_MAPS_API_KEY
    }
  })
  const { status, results } = response.data
  if (status === 'ZERO_RESULTS' || results.length === 0) return []
  return results.map(r => ({ name: r.name, address: r.vicinity, placeId: r.place_id }))
}

export async function getTravelTime(originAddress, destinationAddress, mode) {
  const modeMap = {
    driving: TravelMode.driving,
    transit: TravelMode.transit,
    walking: TravelMode.walking
  }
  const response = await client.distancematrix({
    params: {
      origins: [originAddress],
      destinations: [destinationAddress],
      mode: modeMap[mode] || TravelMode.transit,
      key: process.env.GOOGLE_MAPS_API_KEY
    }
  })
  const element = response.data.rows[0]?.elements[0]
  if (!element || element.status !== 'OK') throw new Error(element?.status || 'NO_ROUTE')
  return element.duration.text
}
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `npm test lib/__tests__/maps.test.js`
Expected: PASS — 6 tests passing

- [ ] **Step 5: Commit**
```bash
git add lib/maps.js lib/__tests__/maps.test.js
git commit -m "feat: add Google Maps geocoding, places search, and travel time utilities"
```

---

### Task 3: Claude Orchestration Library

**Files:**
- Create: `lib/claude.js`
- Create: `lib/__tests__/claude.test.js`

- [ ] **Step 1: Write failing tests**

Create `lib/__tests__/claude.test.js`:
```javascript
import { buildSystemPrompt, buildUserPrompt, parseVenueResponse } from '@/lib/claude'

describe('buildSystemPrompt', () => {
  it('returns a string containing the vibe-to-venue mapping', () => {
    const prompt = buildSystemPrompt()
    expect(typeof prompt).toBe('string')
    expect(prompt).toContain('romantic')
    expect(prompt).toContain('rooftop')
    expect(prompt).toContain('escape room')
  })

  it('contains the VENUES_JSON output format instruction', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('VENUES_JSON:')
  })
})

describe('buildUserPrompt', () => {
  it('embeds all four input variables', () => {
    const prompt = buildUserPrompt('Brooklyn Bridge, NY', 'Times Square, NY', 'romantic', 'transit')
    expect(prompt).toContain('Brooklyn Bridge')
    expect(prompt).toContain('Times Square')
    expect(prompt).toContain('romantic')
    expect(prompt).toContain('transit')
  })
})

describe('parseVenueResponse', () => {
  it('extracts venues array from a VENUES_JSON-marked response', () => {
    const text = `Here are the venues:\nVENUES_JSON:\n{"venues":[{"name":"The Rooftop","description":"Amazing views","travelTimeA":"15 mins","travelTimeB":"18 mins","address":"123 Main St","googleMapsUrl":"https://maps.google.com/?q=test"}]}`
    const result = parseVenueResponse(text)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('The Rooftop')
    expect(result[0].travelTimeA).toBe('15 mins')
    expect(result[0].travelTimeB).toBe('18 mins')
  })

  it('throws if VENUES_JSON marker is missing', () => {
    expect(() => parseVenueResponse('No JSON here')).toThrow('Failed to parse venues')
  })

  it('throws if venues array is empty', () => {
    expect(() => parseVenueResponse('VENUES_JSON:\n{"venues":[]}')).toThrow('Failed to parse venues')
  })
})
```

- [ ] **Step 2: Run to confirm tests fail**

Run: `npm test lib/__tests__/claude.test.js`
Expected: FAIL — "Cannot find module '@/lib/claude'"

- [ ] **Step 3: Implement `lib/claude.js`**

Create `lib/claude.js`:
```javascript
export function buildSystemPrompt() {
  return `You are a venue recommendation assistant for the MeetHalfway app.

Your job is to help two people find a great place to meet that is equidistant in travel time for both.

VIBE TO VENUE MAPPING:
- romantic: rooftop restaurant, wine bar, fine dining, jazz café, cocktail lounge
- casual: café, park, brewery, bookstore café, food market, coffee shop
- adventurous: escape room, comedy club, go-karting, arcade, live music venue, bowling alley

FAIR MIDPOINT ALGORITHM:
1. Geocode both locations to get coordinates.
2. Compute geographic midpoint: lat = (latA + latB) / 2, lng = (lngA + lngB) / 2.
3. Use get_travel_time to check travel times from A and B to the geographic midpoint.
4. If the difference exceeds 10 minutes, compute a new candidate point 30% of the way from the farther person's location toward the midpoint (e.g. if A takes 30 min and B takes 10 min, shift toward A: newLat = midLat + 0.3 * (latA - midLat)).
5. Check travel times to the new candidate. Use whichever midpoint has the most balanced travel times.

REQUIRED OUTPUT FORMAT:
After finding venues and computing travel times, output this exact marker on its own line, then the JSON immediately after:
VENUES_JSON:
{"venues":[{"name":"...","description":"...","travelTimeA":"...","travelTimeB":"...","address":"...","googleMapsUrl":"https://maps.google.com/?q=ENCODED_ADDRESS"}]}

Return exactly 3 venues. Each description must be one vivid, compelling sentence — not dry facts. googleMapsUrl must be https://maps.google.com/?q= followed by the URL-encoded venue address.`
}

export function buildUserPrompt(locationA, locationB, vibe, travelMode) {
  return `Find a great place to meet for these two people:
- Person A is at: ${locationA}
- Person B is at: ${locationB}
- Vibe: ${vibe}
- Travel mode: ${travelMode}

Steps:
1. Geocode both locations.
2. Find the fair midpoint (roughly equal travel time for both people using the algorithm in your instructions).
3. Search for ${vibe} venues near that midpoint.
4. Get travel times from each person to each shortlisted venue using ${travelMode} mode.
5. Return the 3 venues where travel times are most balanced.

End your response with the VENUES_JSON marker and JSON.`
}

export function parseVenueResponse(responseText) {
  const marker = 'VENUES_JSON:'
  const markerIndex = responseText.indexOf(marker)
  if (markerIndex === -1) throw new Error('Failed to parse venues: no VENUES_JSON marker found')

  const jsonStr = responseText.slice(markerIndex + marker.length).trim()
  let parsed
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error('Failed to parse venues: invalid JSON after VENUES_JSON marker')
  }

  if (!Array.isArray(parsed.venues) || parsed.venues.length === 0) {
    throw new Error('Failed to parse venues: venues array is empty or missing')
  }

  return parsed.venues
}
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `npm test lib/__tests__/claude.test.js`
Expected: PASS — 5 tests passing

- [ ] **Step 5: Commit**
```bash
git add lib/claude.js lib/__tests__/claude.test.js
git commit -m "feat: add Claude prompt builders and venue response parser"
```

---

### Task 4: API Route

**Files:**
- Create: `app/api/plan/route.js`
- Create: `app/api/plan/__tests__/route.test.js`

- [ ] **Step 1: Write failing tests**

Create `app/api/plan/__tests__/route.test.js`:
```javascript
jest.mock('@anthropic-ai/sdk')
jest.mock('@/lib/maps')

import { POST } from '@/app/api/plan/route'

const mockCreate = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  require('@anthropic-ai/sdk').default.mockImplementation(() => ({
    messages: { create: mockCreate }
  }))
})

const validBody = {
  locationA: 'Brooklyn Bridge, NY',
  locationB: 'Times Square, NY',
  vibe: 'romantic',
  travelMode: 'transit'
}

function makeRequest(body) {
  return new Request('http://localhost/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

describe('POST /api/plan', () => {
  it('returns 400 if required fields are missing', async () => {
    const res = await POST(makeRequest({ locationA: 'A' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })

  it('returns 200 with venues on success', async () => {
    const venueJson = JSON.stringify({
      venues: [
        { name: 'Place A', description: 'Nice', travelTimeA: '10 mins', travelTimeB: '12 mins', address: '1 Main', googleMapsUrl: 'https://maps.google.com/?q=test' },
        { name: 'Place B', description: 'Cool', travelTimeA: '15 mins', travelTimeB: '14 mins', address: '2 Oak', googleMapsUrl: 'https://maps.google.com/?q=test2' },
        { name: 'Place C', description: 'Fun', travelTimeA: '8 mins', travelTimeB: '9 mins', address: '3 Elm', googleMapsUrl: 'https://maps.google.com/?q=test3' }
      ]
    })
    mockCreate.mockResolvedValue({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: `VENUES_JSON:\n${venueJson}` }]
    })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.venues).toHaveLength(3)
    expect(data.venues[0].name).toBe('Place A')
  })

  it('returns 422 with errorType invalid_address on ZERO_RESULTS', async () => {
    mockCreate.mockRejectedValue(new Error('ZERO_RESULTS'))
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(422)
    const data = await res.json()
    expect(data.errorType).toBe('invalid_address')
  })

  it('returns 500 with errorType api_failure on unexpected error', async () => {
    mockCreate.mockRejectedValue(new Error('Network timeout'))
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.errorType).toBe('api_failure')
  })
})
```

- [ ] **Step 2: Run to confirm tests fail**

Run: `npm test app/api/plan/__tests__/route.test.js`
Expected: FAIL — "Cannot find module '@/app/api/plan/route'"

- [ ] **Step 3: Implement `app/api/plan/route.js`**

Create `app/api/plan/route.js`:
```javascript
import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt, buildUserPrompt, parseVenueResponse } from '@/lib/claude'
import { geocodeLocation, searchPlacesNear, getTravelTime } from '@/lib/maps'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const TOOLS = [
  {
    name: 'geocode_location',
    description: 'Convert a human-readable address to lat/lng coordinates.',
    input_schema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'The address to geocode' }
      },
      required: ['address']
    }
  },
  {
    name: 'search_places_near',
    description: 'Search for venues near a lat/lng coordinate using a keyword.',
    input_schema: {
      type: 'object',
      properties: {
        lat: { type: 'number' },
        lng: { type: 'number' },
        keyword: { type: 'string', description: 'e.g. "wine bar", "escape room", "rooftop restaurant"' },
        radius_meters: { type: 'number', description: 'Search radius in meters, default 1500' }
      },
      required: ['lat', 'lng', 'keyword']
    }
  },
  {
    name: 'get_travel_time',
    description: 'Get travel time between two addresses using a specific travel mode.',
    input_schema: {
      type: 'object',
      properties: {
        origin_address: { type: 'string' },
        destination_address: { type: 'string' },
        mode: { type: 'string', enum: ['driving', 'transit', 'walking'] }
      },
      required: ['origin_address', 'destination_address', 'mode']
    }
  }
]

async function executeTool(name, input) {
  switch (name) {
    case 'geocode_location':
      return await geocodeLocation(input.address)
    case 'search_places_near':
      return await searchPlacesNear(input.lat, input.lng, input.keyword, input.radius_meters || 1500)
    case 'get_travel_time':
      return await getTravelTime(input.origin_address, input.destination_address, input.mode)
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

async function runAgentLoop(locationA, locationB, vibe, travelMode) {
  const messages = [{ role: 'user', content: buildUserPrompt(locationA, locationB, vibe, travelMode) }]

  for (let i = 0; i < 20; i++) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8096,
      system: buildSystemPrompt(),
      tools: TOOLS,
      messages
    })

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find(b => b.type === 'text')
      if (!textBlock) throw new Error('No text block in final response')
      return parseVenueResponse(textBlock.text)
    }

    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use')
      const toolResults = await Promise.all(
        toolUseBlocks.map(async (block) => {
          let content
          try {
            const result = await executeTool(block.name, block.input)
            content = JSON.stringify(result)
          } catch (err) {
            content = JSON.stringify({ error: err.message })
          }
          return { type: 'tool_result', tool_use_id: block.id, content }
        })
      )
      messages.push({ role: 'assistant', content: response.content })
      messages.push({ role: 'user', content: toolResults })
    }
  }

  throw new Error('Agent loop exceeded maximum iterations')
}

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { locationA, locationB, vibe, travelMode } = body ?? {}

  if (!locationA || !locationB || !vibe || !travelMode) {
    return Response.json(
      { error: 'Missing required fields: locationA, locationB, vibe, travelMode' },
      { status: 400 }
    )
  }

  try {
    const venues = await runAgentLoop(locationA, locationB, vibe, travelMode)
    return Response.json({ venues })
  } catch (err) {
    if (err.message.includes('ZERO_RESULTS') || err.message.includes('NOT_FOUND')) {
      return Response.json({ errorType: 'invalid_address' }, { status: 422 })
    }
    if (err.message.includes('Failed to parse venues')) {
      return Response.json({ errorType: 'no_venues' }, { status: 404 })
    }
    console.error('Plan API error:', err)
    return Response.json({ errorType: 'api_failure' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `npm test app/api/plan/__tests__/route.test.js`
Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**
```bash
git add app/api/plan/route.js app/api/plan/__tests__/route.test.js
git commit -m "feat: add /api/plan POST route with Claude tool-use agent loop"
```

---

### Task 5: VibeSelector Component

**Files:**
- Create: `components/VibeSelector.jsx`
- Create: `components/__tests__/VibeSelector.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `components/__tests__/VibeSelector.test.jsx`:
```javascript
import { render, screen, fireEvent } from '@testing-library/react'
import VibeSelector from '@/components/VibeSelector'

describe('VibeSelector', () => {
  it('renders all 3 vibe options', () => {
    render(<VibeSelector selected={null} onChange={() => {}} />)
    expect(screen.getByText('Romantic')).toBeInTheDocument()
    expect(screen.getByText('Casual')).toBeInTheDocument()
    expect(screen.getByText('Adventurous')).toBeInTheDocument()
  })

  it('calls onChange with the vibe id when a card is clicked', () => {
    const onChange = jest.fn()
    render(<VibeSelector selected={null} onChange={onChange} />)
    fireEvent.click(screen.getByText('Romantic'))
    expect(onChange).toHaveBeenCalledWith('romantic')
  })

  it('applies selected styles (ring-2) to the active vibe card', () => {
    render(<VibeSelector selected="casual" onChange={() => {}} />)
    expect(screen.getByTestId('vibe-casual')).toHaveClass('ring-2')
  })

  it('does not apply ring-2 to inactive cards', () => {
    render(<VibeSelector selected="casual" onChange={() => {}} />)
    expect(screen.getByTestId('vibe-romantic')).not.toHaveClass('ring-2')
  })
})
```

- [ ] **Step 2: Run to confirm tests fail**

Run: `npm test components/__tests__/VibeSelector.test.jsx`
Expected: FAIL — "Cannot find module '@/components/VibeSelector'"

- [ ] **Step 3: Implement `components/VibeSelector.jsx`**

Create `components/VibeSelector.jsx`:
```jsx
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
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `npm test components/__tests__/VibeSelector.test.jsx`
Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**
```bash
git add components/VibeSelector.jsx components/__tests__/VibeSelector.test.jsx
git commit -m "feat: add VibeSelector component with card-based selection"
```

---

### Task 6: TravelModeToggle Component

**Files:**
- Create: `components/TravelModeToggle.jsx`
- Create: `components/__tests__/TravelModeToggle.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `components/__tests__/TravelModeToggle.test.jsx`:
```javascript
import { render, screen, fireEvent } from '@testing-library/react'
import TravelModeToggle from '@/components/TravelModeToggle'

describe('TravelModeToggle', () => {
  it('renders all three travel mode options', () => {
    render(<TravelModeToggle selected="transit" onChange={() => {}} />)
    expect(screen.getByText(/Driving/i)).toBeInTheDocument()
    expect(screen.getByText(/Transit/i)).toBeInTheDocument()
    expect(screen.getByText(/Walking/i)).toBeInTheDocument()
  })

  it('applies bg-white to the selected mode', () => {
    render(<TravelModeToggle selected="transit" onChange={() => {}} />)
    expect(screen.getByTestId('mode-transit')).toHaveClass('bg-white')
  })

  it('does not apply bg-white to unselected modes', () => {
    render(<TravelModeToggle selected="transit" onChange={() => {}} />)
    expect(screen.getByTestId('mode-driving')).not.toHaveClass('bg-white')
  })

  it('calls onChange with mode id when a pill is clicked', () => {
    const onChange = jest.fn()
    render(<TravelModeToggle selected="transit" onChange={onChange} />)
    fireEvent.click(screen.getByTestId('mode-walking'))
    expect(onChange).toHaveBeenCalledWith('walking')
  })
})
```

- [ ] **Step 2: Run to confirm tests fail**

Run: `npm test components/__tests__/TravelModeToggle.test.jsx`
Expected: FAIL — "Cannot find module '@/components/TravelModeToggle'"

- [ ] **Step 3: Implement `components/TravelModeToggle.jsx`**

Create `components/TravelModeToggle.jsx`:
```jsx
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
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `npm test components/__tests__/TravelModeToggle.test.jsx`
Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**
```bash
git add components/TravelModeToggle.jsx components/__tests__/TravelModeToggle.test.jsx
git commit -m "feat: add TravelModeToggle pill component"
```

---

### Task 7: LocationForm Component

**Files:**
- Create: `components/LocationForm.jsx`
- Create: `components/__tests__/LocationForm.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `components/__tests__/LocationForm.test.jsx`:
```javascript
import { render, screen, fireEvent } from '@testing-library/react'
import LocationForm from '@/components/LocationForm'

describe('LocationForm', () => {
  it('renders a labeled input for Person A', () => {
    render(<LocationForm locationA="" locationB="" onChangeA={() => {}} onChangeB={() => {}} />)
    expect(screen.getByLabelText(/Person A/i)).toBeInTheDocument()
  })

  it('renders a labeled input for Person B', () => {
    render(<LocationForm locationA="" locationB="" onChangeA={() => {}} onChangeB={() => {}} />)
    expect(screen.getByLabelText(/Person B/i)).toBeInTheDocument()
  })

  it('calls onChangeA when Person A input changes', () => {
    const onChangeA = jest.fn()
    render(<LocationForm locationA="" locationB="" onChangeA={onChangeA} onChangeB={() => {}} />)
    fireEvent.change(screen.getByLabelText(/Person A/i), { target: { value: 'Brooklyn Bridge' } })
    expect(onChangeA).toHaveBeenCalledWith('Brooklyn Bridge')
  })

  it('calls onChangeB when Person B input changes', () => {
    const onChangeB = jest.fn()
    render(<LocationForm locationA="" locationB="" onChangeA={() => {}} onChangeB={onChangeB} />)
    fireEvent.change(screen.getByLabelText(/Person B/i), { target: { value: 'Times Square' } })
    expect(onChangeB).toHaveBeenCalledWith('Times Square')
  })

  it('displays provided values', () => {
    render(<LocationForm locationA="Brooklyn" locationB="Bronx" onChangeA={() => {}} onChangeB={() => {}} />)
    expect(screen.getByDisplayValue('Brooklyn')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Bronx')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to confirm tests fail**

Run: `npm test components/__tests__/LocationForm.test.jsx`
Expected: FAIL — "Cannot find module '@/components/LocationForm'"

- [ ] **Step 3: Implement `components/LocationForm.jsx`**

Create `components/LocationForm.jsx`:
```jsx
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
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `npm test components/__tests__/LocationForm.test.jsx`
Expected: PASS — 5 tests passing

- [ ] **Step 5: Commit**
```bash
git add components/LocationForm.jsx components/__tests__/LocationForm.test.jsx
git commit -m "feat: add LocationForm component with controlled inputs"
```

---

### Task 8: VenueCard Component

**Files:**
- Create: `components/VenueCard.jsx`
- Create: `components/__tests__/VenueCard.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `components/__tests__/VenueCard.test.jsx`:
```javascript
import { render, screen } from '@testing-library/react'
import VenueCard from '@/components/VenueCard'

const mockVenue = {
  name: 'The Midnight Rooftop',
  description: 'Sweeping skyline views and handcrafted cocktails 30 floors up.',
  travelTimeA: '14 mins',
  travelTimeB: '17 mins',
  address: '1 Main Street, New York, NY',
  googleMapsUrl: 'https://maps.google.com/?q=test-place'
}

describe('VenueCard', () => {
  it('renders the venue name', () => {
    render(<VenueCard venue={mockVenue} index={0} />)
    expect(screen.getByText('The Midnight Rooftop')).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(<VenueCard venue={mockVenue} index={0} />)
    expect(screen.getByText(/Sweeping skyline views/i)).toBeInTheDocument()
  })

  it('renders travel time for Person A', () => {
    render(<VenueCard venue={mockVenue} index={0} />)
    expect(screen.getByText('14 mins')).toBeInTheDocument()
  })

  it('renders travel time for Person B', () => {
    render(<VenueCard venue={mockVenue} index={0} />)
    expect(screen.getByText('17 mins')).toBeInTheDocument()
  })

  it('renders a Google Maps link with correct href that opens in new tab', () => {
    render(<VenueCard venue={mockVenue} index={0} />)
    const link = screen.getByRole('link', { name: /maps/i })
    expect(link).toHaveAttribute('href', 'https://maps.google.com/?q=test-place')
    expect(link).toHaveAttribute('target', '_blank')
  })
})
```

- [ ] **Step 2: Run to confirm tests fail**

Run: `npm test components/__tests__/VenueCard.test.jsx`
Expected: FAIL — "Cannot find module '@/components/VenueCard'"

- [ ] **Step 3: Implement `components/VenueCard.jsx`**

Create `components/VenueCard.jsx`:
```jsx
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
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `npm test components/__tests__/VenueCard.test.jsx`
Expected: PASS — 5 tests passing

- [ ] **Step 5: Commit**
```bash
git add components/VenueCard.jsx components/__tests__/VenueCard.test.jsx
git commit -m "feat: add VenueCard component with travel times and Maps link"
```

---

### Task 9: LoadingState Component

**Files:**
- Create: `components/LoadingState.jsx`
- Create: `components/__tests__/LoadingState.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `components/__tests__/LoadingState.test.jsx`:
```javascript
import { render, screen } from '@testing-library/react'
import LoadingState from '@/components/LoadingState'

describe('LoadingState', () => {
  it('renders a spinner element', () => {
    render(<LoadingState />)
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('renders a loading message', () => {
    render(<LoadingState />)
    expect(screen.getByText(/Finding your perfect spot/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to confirm tests fail**

Run: `npm test components/__tests__/LoadingState.test.jsx`
Expected: FAIL — "Cannot find module '@/components/LoadingState'"

- [ ] **Step 3: Implement `components/LoadingState.jsx`**

Create `components/LoadingState.jsx`:
```jsx
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
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `npm test components/__tests__/LoadingState.test.jsx`
Expected: PASS — 2 tests passing

- [ ] **Step 5: Commit**
```bash
git add components/LoadingState.jsx components/__tests__/LoadingState.test.jsx
git commit -m "feat: add LoadingState spinner component"
```

---

### Task 10: ResultsSection Component

**Files:**
- Create: `components/ResultsSection.jsx`
- Create: `components/__tests__/ResultsSection.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `components/__tests__/ResultsSection.test.jsx`:
```javascript
import { render, screen, fireEvent } from '@testing-library/react'
import ResultsSection from '@/components/ResultsSection'

const mockVenues = [
  { name: 'Venue A', description: 'Desc A', travelTimeA: '10 mins', travelTimeB: '12 mins', address: '1 Main', googleMapsUrl: 'https://maps.google.com/?q=a' },
  { name: 'Venue B', description: 'Desc B', travelTimeA: '15 mins', travelTimeB: '14 mins', address: '2 Oak', googleMapsUrl: 'https://maps.google.com/?q=b' },
  { name: 'Venue C', description: 'Desc C', travelTimeA: '8 mins', travelTimeB: '9 mins', address: '3 Elm', googleMapsUrl: 'https://maps.google.com/?q=c' }
]

describe('ResultsSection', () => {
  it('renders all 3 venue cards', () => {
    render(<ResultsSection venues={mockVenues} onTryAgain={() => {}} onStartOver={() => {}} />)
    expect(screen.getByText('Venue A')).toBeInTheDocument()
    expect(screen.getByText('Venue B')).toBeInTheDocument()
    expect(screen.getByText('Venue C')).toBeInTheDocument()
  })

  it('renders a Try Again button', () => {
    render(<ResultsSection venues={mockVenues} onTryAgain={() => {}} onStartOver={() => {}} />)
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('renders a Start Over button', () => {
    render(<ResultsSection venues={mockVenues} onTryAgain={() => {}} onStartOver={() => {}} />)
    expect(screen.getByRole('button', { name: /start over/i })).toBeInTheDocument()
  })

  it('calls onTryAgain when Try Again is clicked', () => {
    const onTryAgain = jest.fn()
    render(<ResultsSection venues={mockVenues} onTryAgain={onTryAgain} onStartOver={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onTryAgain).toHaveBeenCalledTimes(1)
  })

  it('calls onStartOver when Start Over is clicked', () => {
    const onStartOver = jest.fn()
    render(<ResultsSection venues={mockVenues} onTryAgain={() => {}} onStartOver={onStartOver} />)
    fireEvent.click(screen.getByRole('button', { name: /start over/i }))
    expect(onStartOver).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run to confirm tests fail**

Run: `npm test components/__tests__/ResultsSection.test.jsx`
Expected: FAIL — "Cannot find module '@/components/ResultsSection'"

- [ ] **Step 3: Implement `components/ResultsSection.jsx`**

Create `components/ResultsSection.jsx`:
```jsx
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
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `npm test components/__tests__/ResultsSection.test.jsx`
Expected: PASS — 5 tests passing

- [ ] **Step 5: Commit**
```bash
git add components/ResultsSection.jsx components/__tests__/ResultsSection.test.jsx
git commit -m "feat: add ResultsSection with venue cards and action buttons"
```

---

### Task 11: Main Page

**Files:**
- Modify: `app/page.js`

- [ ] **Step 1: Replace app/page.js with the full page implementation**

Replace the entire contents of `app/page.js` with:
```jsx
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

  const canSubmit = form.locationA.trim() && form.locationB.trim() && form.vibe

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
```

- [ ] **Step 2: Start dev server and verify idle state**

Run: `npm run dev`
Open `http://localhost:3000`. Expected: MeetHalfway header with gradient text, two location inputs, three vibe cards, transit travel mode pre-selected, disabled submit button.

- [ ] **Step 3: Verify form enables the submit button**

Fill in both location inputs and click a vibe card. Expected: "Find Our Spot →" button becomes active with violet-to-pink gradient.

- [ ] **Step 4: Commit**
```bash
git add app/page.js
git commit -m "feat: implement main page with idle/loading/results/error state machine"
```

---

### Task 12: App Layout & Global Styles

**Files:**
- Modify: `app/layout.js`
- Modify: `app/globals.css`
- Modify: `tailwind.config.js`

- [ ] **Step 1: Update app/layout.js with Google Fonts and metadata**

Replace `app/layout.js` with:
```javascript
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['400', '500', '600', '700', '800']
})

export const metadata = {
  title: 'MeetHalfway — Find the perfect spot',
  description: 'Find a venue where both of you have equal travel time. Two locations, one great meeting point.'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <body className="font-sans antialiased bg-[#0A0A14] text-white">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Update app/globals.css**

Replace `app/globals.css` with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    box-sizing: border-box;
  }

  ::selection {
    background-color: rgba(139, 92, 246, 0.3);
  }
}
```

- [ ] **Step 3: Update tailwind.config.js with font family extension**

Replace `tailwind.config.js` with:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-plus-jakarta)', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
```

- [ ] **Step 4: Verify page still looks correct**

With dev server running, reload `http://localhost:3000`. Expected: Inter font loads, dark background, no layout shift, gradient header renders correctly.

- [ ] **Step 5: Commit**
```bash
git add app/layout.js app/globals.css tailwind.config.js
git commit -m "feat: configure layout with Google Fonts and dark theme"
```

---

### Task 13: Venue Card Stagger Animation

**Files:**
- Modify: `components/ResultsSection.jsx`

- [ ] **Step 1: Add staggered entrance animation to venue cards**

Replace `components/ResultsSection.jsx` with:
```jsx
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
```

- [ ] **Step 2: Run all tests to confirm nothing broke**

Run: `npm test`
Expected: All tests pass. (Framer Motion is not imported in tests — no mock needed.)

- [ ] **Step 3: Verify animations in the browser**

With dev server running, submit the form with real addresses and wait for results. Expected: venue cards slide in one by one with ~120ms stagger, buttons fade in after all cards have appeared.

- [ ] **Step 4: Commit**
```bash
git add components/ResultsSection.jsx
git commit -m "feat: add staggered entrance animation to venue results"
```

---

### Task 14: Environment Setup & Production Build

**Files:**
- Create: `.env.local` (from example, not committed)
- Verify: `.gitignore`

- [ ] **Step 1: Create .env.local from the example**

Run:
```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in real values:
```
ANTHROPIC_API_KEY=sk-ant-api03-...
GOOGLE_MAPS_API_KEY=AIzaSy...
```

- [ ] **Step 2: Confirm .env.local is not tracked by git**

Run: `git status`
Expected: `.env.local` does NOT appear in the output.

- [ ] **Step 3: Run a production build to catch errors**

Run: `npm run build`
Expected: Build completes with no errors. Note any warnings but don't block on them.

- [ ] **Step 4: Test the full end-to-end flow**

Run: `npm run dev`

1. Open `http://localhost:3000`
2. Enter "Brooklyn Bridge, New York" in Person A
3. Enter "Upper West Side, New York" in Person B
4. Select Casual vibe
5. Leave travel mode on Transit
6. Click "Find Our Spot →"
7. Wait 20–40 seconds
8. Expected: 3 venue cards appear (café, park, brewery, or similar), each with a name, description, two travel times, and an active Google Maps link

- [ ] **Step 5: Test an invalid address**

Start Over, enter "asdfghjklzxcvbnm" as Person A's location, enter a valid address for B, select a vibe, and submit. Expected: error banner reads "We couldn't find that location. Try being more specific — add a city or landmark."

- [ ] **Step 6: Commit and tag as ready for deploy**
```bash
git add .
git commit -m "feat: complete MeetHalfway MVP — ready for Vercel deploy"
```

**To deploy to Vercel:**
```bash
npx vercel
```
When prompted, add environment variables `ANTHROPIC_API_KEY` and `GOOGLE_MAPS_API_KEY` in the Vercel dashboard under Project → Settings → Environment Variables.

---

## Self-Review

### Spec Coverage

| Requirement | Task |
|---|---|
| Person A + B location inputs | Task 7 (LocationForm) |
| Vibe selector — 3 options with emoji | Task 5 (VibeSelector) |
| Travel mode toggle — 3 options, default Transit | Task 6 (TravelModeToggle) |
| Fair commute-time midpoint (not geographic average) | Task 3 (system prompt algorithm) + Task 4 (Claude loop) |
| Vibe → venue type mapping (romantic/casual/adventurous) | Task 3 (buildSystemPrompt) |
| 3 venue cards with name, description, travel times, Maps link | Task 8 (VenueCard) + Task 10 (ResultsSection) |
| Loading spinner | Task 9 (LoadingState) |
| Try Again button | Task 10 (ResultsSection) |
| Start Over button | Task 10 (ResultsSection) |
| Error: invalid address specific message | Task 4 (route.js) + Task 11 (page.js) |
| Error: no venues specific message | Task 4 (route.js) + Task 11 (page.js) |
| Error: API failure specific message | Task 4 (route.js) + Task 11 (page.js) |
| .env.local + .gitignore | Task 1 + Task 14 |
| Mobile-friendly layout | `max-w-lg mx-auto` + responsive Tailwind throughout |
| "MeetHalfway" prominently displayed | Task 11 (Header component) |
| 2026 aesthetic: dark, bold typography, gradients | Tasks 11–12 |
| Smooth micro animations | Task 13 (Framer Motion) |
| Vibe selector feels tactile — large cards not dropdown | Task 5 (VibeSelector grid layout) |
| Travel mode as pill toggle | Task 6 (TravelModeToggle) |
| Results feel like personalized recommendation | Task 3 (system prompt description requirement) |
| Vercel deploy-ready | Task 14 |

### Placeholder Scan

No TBD, TODO, "implement later", "add validation", or "similar to Task N" found. Every step includes complete code.

### Type Consistency

- `travelTimeA` / `travelTimeB` — used consistently in `lib/claude.js`, `VenueCard.jsx`, all test fixtures.
- `vibe` / `travelMode` — consistent across form state, API route body destructuring, `buildUserPrompt` parameters, and system prompt.
- `googleMapsUrl` — consistent in `parseVenueResponse`, `VenueCard.jsx`, and all test mock venues.
- `onTryAgain` / `onStartOver` — consistent between `ResultsSection.jsx` prop names and `page.js` handler names.
