/**
 * @jest-environment node
 */
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
