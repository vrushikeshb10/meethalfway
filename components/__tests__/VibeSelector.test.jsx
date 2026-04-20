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
