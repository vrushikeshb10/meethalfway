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
