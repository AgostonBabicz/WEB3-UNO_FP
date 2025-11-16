import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { apollo } from '../apollo'
import { LOGIN, REGISTER } from '../graphql/ops_auth'
import type { RootState } from './store'

type AuthState = {
  id: string | null
  username: string
  isAuthed: boolean
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const initialState: AuthState = {
  id: localStorage.getItem('userId'),
  username: localStorage.getItem('username') || '',
  isAuthed: !!localStorage.getItem('userId'),
  status: 'idle',
  error: null,
}

type LoginPayload = { username: string; password: string }

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }: LoginPayload, { rejectWithValue }) => {
    try {
      const { data } = await apollo.mutate<{ login: any }>({
        mutation: LOGIN,
        variables: { input: { username, password } },
      })
      const user = data?.login
      if (!user) throw new Error('Login failed')
      return { id: user.id as string, username: user.username as string }
    } catch (err: any) {
      return rejectWithValue(err?.message ?? 'Login failed')
    }
  },
)

export const register = createAsyncThunk(
  'auth/register',
  async ({ username, password }: LoginPayload, { rejectWithValue }) => {
    try {
      const { data } = await apollo.mutate<{ createUser: any }>({
        mutation: REGISTER,
        variables: { input: { username, password } },
      })
      const user = data?.createUser
      if (!user) throw new Error('Register failed')
      return { id: user.id as string, username: user.username as string }
    } catch (err: any) {
      return rejectWithValue(err?.message ?? 'Register failed')
    }
  },
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.id = null
      state.username = ''
      state.isAuthed = false
      state.status = 'idle'
      state.error = null
      localStorage.removeItem('userId')
      localStorage.removeItem('username')
    },
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.id = action.payload.id
        state.username = action.payload.username
        state.isAuthed = true
        state.error = null
        localStorage.setItem('userId', action.payload.id)
        localStorage.setItem('username', action.payload.username)
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        state.error = (action.payload as string) ?? 'Login failed'
      })
      .addCase(register.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.id = action.payload.id
        state.username = action.payload.username
        state.isAuthed = true
        state.error = null
        localStorage.setItem('userId', action.payload.id)
        localStorage.setItem('username', action.payload.username)
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed'
        state.error = (action.payload as string) ?? 'Register failed'
      })
  },
})

export const { logout, clearAuthError } = authSlice.actions

export const selectAuth = (state: RootState) => state.auth
export const selectIsAuthed = (state: RootState) => state.auth.isAuthed
export const selectUsername = (state: RootState) => state.auth.username
export const selectAuthStatus = (state: RootState) => state.auth.status
export const selectAuthError = (state: RootState) => state.auth.error

export default authSlice.reducer
