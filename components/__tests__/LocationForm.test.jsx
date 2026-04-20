import { render, screen, fireEvent } from '@testing-library/react'
import LocationForm from '@/components/LocationForm'

describe('LocationForm', () => {
  it('renders a labeled input for Person A', () => {
    render(<LocationForm locationA="" locationB="" onChangeA={() => {}} onChangeB={() => {}} />)
    expect(screen.getByLabelText(/Person A/i)).toBeInTheDocument()
  })

  it('renders a labeled input for Person B', () => {
    render(<LocationForm locationA="" locationB="" onChangeA={() => {}} onChangeB={() => {}} />)
    expect(screen.getByLabelText(/Person B/i)).toBeInTheDocument()
  })

  it('calls onChangeA when Person A input changes', () => {
    const onChangeA = jest.fn()
    render(<LocationForm locationA="" locationB="" onChangeA={onChangeA} onChangeB={() => {}} />)
    fireEvent.change(screen.getByLabelText(/Person A/i), { target: { value: 'Brooklyn Bridge' } })
    expect(onChangeA).toHaveBeenCalledWith('Brooklyn Bridge')
  })

  it('calls onChangeB when Person B input changes', () => {
    const onChangeB = jest.fn()
    render(<LocationForm locationA="" locationB="" onChangeA={() => {}} onChangeB={onChangeB} />)
    fireEvent.change(screen.getByLabelText(/Person B/i), { target: { value: 'Times Square' } })
    expect(onChangeB).toHaveBeenCalledWith('Times Square')
  })

  it('displays provided values', () => {
    render(<LocationForm locationA="Brooklyn" locationB="Bronx" onChangeA={() => {}} onChangeB={() => {}} />)
    expect(screen.getByDisplayValue('Brooklyn')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Bronx')).toBeInTheDocument()
  })
})
