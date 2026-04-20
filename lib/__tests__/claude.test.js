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

  it('handles trailing text after the JSON', () => {
    const text = 'VENUES_JSON:\n{"venues":[{"name":"Bar","description":"Nice","travelTimeA":"10 mins","travelTimeB":"12 mins","address":"1 Main","googleMapsUrl":"https://maps.google.com/?q=test"}]}\nI hope this helps!'
    const result = parseVenueResponse(text)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Bar')
  })
})
