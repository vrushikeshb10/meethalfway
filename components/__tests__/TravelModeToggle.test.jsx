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
