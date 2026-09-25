import { render, type RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { createQueryWrapper, createTestQueryClient } from './queryWrapper'

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  const user = userEvent.setup()
  const queryClient = createTestQueryClient()
  return {
    user,
    queryClient,
    ...render(ui, { wrapper: createQueryWrapper(queryClient), ...options }),
  }
}
