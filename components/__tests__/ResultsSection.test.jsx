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
