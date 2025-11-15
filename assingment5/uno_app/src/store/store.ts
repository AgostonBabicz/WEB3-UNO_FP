import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import serverGameReducer from './serverGameSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    serverGame: serverGameReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
