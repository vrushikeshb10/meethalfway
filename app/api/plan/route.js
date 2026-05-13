import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt, buildUserPrompt, parseVenueResponse } from '@/lib/claude'
import { geocodeLocation, searchPlacesNear, getTravelTime } from '@/lib/maps'

function getAnthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

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
        keyword: { type: 'string', description: 'e.g. "restaurant", "escape room", "rooftop restaurant". Use broad terms — avoid niche Western terms like "wine bar" or "brewery".' },
        radius_meters: { type: 'number', description: 'Search radius in meters. Use 3000–5000 for Indian cities. Default 3000.' }
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
    case 'geocode_location': {
      const result = await geocodeLocation(input.address)
      console.log(`[geocode] "${input.address}" →`, result)
      return result
    }
    case 'search_places_near': {
      const radius = input.radius_meters || 3000
      console.log(`[search] keyword="${input.keyword}" lat=${input.lat} lng=${input.lng} radius=${radius}m`)
      const result = await searchPlacesNear(input.lat, input.lng, input.keyword, radius)
      console.log(`[search] found ${result.length} results:`, result.map(r => r.name))
      return result
    }
    case 'get_travel_time': {
      const result = await getTravelTime(input.origin_address, input.destination_address, input.mode)
      console.log(`[travel] "${input.origin_address}" → "${input.destination_address}" (${input.mode}): ${result}`)
      return result
    }
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

async function runAgentLoop(locationA, locationB, vibe, travelMode) {
  const messages = [{ role: 'user', content: buildUserPrompt(locationA, locationB, vibe, travelMode) }]

  for (let i = 0; i < 20; i++) {
    const response = await getAnthropicClient().messages.create({
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
            console.error(`[tool-error] ${block.name}:`, err.message)
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
