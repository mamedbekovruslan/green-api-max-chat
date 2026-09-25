import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Avatar } from './Avatar'

describe('Avatar', () => {
  it('shows the image when src is given', () => {
    const { container } = render(<Avatar name="Женя" seed="1" src="https://example.com/a.jpg" />)

    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/a.jpg')
  })

  it('shows the first letter when there is no image', () => {
    render(<Avatar name="женя" seed="1" />)

    expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('Ж')
  })

  it('falls back to the letter when the image fails to load', () => {
    const { container } = render(<Avatar name="Женя" seed="1" src="https://example.com/a.jpg" />)

    fireEvent.error(container.querySelector('img') as HTMLImageElement)

    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('Ж')
  })

  it('uses a digit for phone-like names', () => {
    render(<Avatar name="+7 999 000-00-00" seed="1" />)

    expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('7')
  })
})
