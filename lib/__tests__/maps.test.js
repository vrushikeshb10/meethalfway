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
