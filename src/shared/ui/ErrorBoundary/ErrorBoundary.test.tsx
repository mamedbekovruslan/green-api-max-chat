import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

function Broken(): never {
  throw new Error('render failed')
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children when nothing fails', () => {
    render(
      <ErrorBoundary fallback={<p>Запасной экран</p>}>
        <p>Содержимое</p>
      </ErrorBoundary>,
    )

    expect(screen.getByText('Содержимое')).toBeInTheDocument()
  })

  it('renders the fallback instead of a crashed subtree', () => {
    render(
      <ErrorBoundary fallback={<p>Запасной экран</p>}>
        <Broken />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Запасной экран')).toBeInTheDocument()
    expect(screen.queryByText('render failed')).not.toBeInTheDocument()
  })
})
