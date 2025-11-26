'use client'

import { Provider } from 'react-redux'
import { makeStore } from '@/src/stores/store'

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const store = makeStore()
  return (
    <Provider store={store}>
      {children}
    </Provider>
  )
}