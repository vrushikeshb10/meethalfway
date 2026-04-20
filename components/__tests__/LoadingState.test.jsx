import { render, screen } from '@testing-library/react'
import LoadingState from '@/components/LoadingState'

describe('LoadingState', () => {
  it('renders a spinner element', () => {
    render(<LoadingState />)
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('renders a loading message', () => {
    render(<LoadingState />)
    expect(screen.getByText(/Finding your perfect spot/i)).toBeInTheDocument()
  })
})
