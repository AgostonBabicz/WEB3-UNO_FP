import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../stores/store'

type AuthState = {
  id: string | null
  username: string
  isAuthed: boolean
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const initialState: AuthState = {
  id: null,
  username: '',
  isAuthed: false,
  status: 'idle',
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Synchronous Actions
    authStart(state) {
      state.status = 'loading'
      state.error = null
    },
    authSuccess(state, action: PayloadAction<{ id: string; username: string }>) {
      state.status = 'succeeded'
      state.id = action.payload.id
      state.username = action.payload.username
      state.isAuthed = true
      state.error = null
      // localStorage.setItem('userId', action.payload.id)
      // localStorage.setItem('username', action.payload.username)
    },
    authFailure(state, action: PayloadAction<string>) {
      state.status = 'failed'
      state.error = action.payload
    },
    logout(state) {
      state.id = null
      state.username = ''
      state.isAuthed = false
      state.status = 'idle'
      state.error = null
      // localStorage.removeItem('userId')
      // localStorage.removeItem('username')
    },
    clearAuthError(state) {
      state.error = null
    },
  },
})

export const authActions = authSlice.actions
export const { logout, clearAuthError } = authSlice.actions

// Selectors
export const selectAuth = (state: RootState) => state.auth
export const selectIsAuthed = (state: RootState) => state.auth.isAuthed
export const selectUsername = (state: RootState) => state.auth.username
export const selectAuthStatus = (state: RootState) => state.auth.status
export const selectAuthError = (state: RootState) => state.auth.error

export default authSlice.reducer