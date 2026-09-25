import { QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { createQueryClient } from './queryClient'

export function App() {
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <main className="app-placeholder">
        <h1>MAX Chat</h1>
        <p>Каркас проекта готов</p>
      </main>
    </QueryClientProvider>
  )
}
