import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../slices/authSlice'
import serverGameReducer from '../slices/serverGameSlice'
import unoGameReducer from '../slices/unoGameSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    serverGame: serverGameReducer,
    unoGame: unoGameReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
