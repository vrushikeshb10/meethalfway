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
