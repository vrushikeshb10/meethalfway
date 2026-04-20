import { Client, TravelMode } from '@googlemaps/google-maps-services-js'

function getClient() {
  return new Client()
}

export async function geocodeLocation(address) {
  const client = getClient()
  const response = await client.geocode({
    params: { address, key: process.env.GOOGLE_MAPS_API_KEY }
  })
  const { status, results } = response.data
  if (status !== 'OK' || results.length === 0) throw new Error(status)
  return results[0].geometry.location
}

export async function searchPlacesNear(lat, lng, keyword, radiusMeters = 1500) {
  const client = getClient()
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
  const client = getClient()
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
