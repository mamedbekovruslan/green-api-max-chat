import { render, type RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { createQueryWrapper } from './queryWrapper'

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  const user = userEvent.setup()
  return { user, ...render(ui, { wrapper: createQueryWrapper(), ...options }) }
}
