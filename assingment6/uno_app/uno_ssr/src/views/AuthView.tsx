import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../style/Auth.css'
import {
  selectAuthError,
  selectAuthStatus,
  selectIsAuthed,
} from '../slices/authSlice'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '@/src/stores/hooks'
import LoginThunk from '../thunks/LoginThunk'
import RegisterThunk from '../thunks/RegisterThunk'

const AuthView: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const isAuthed = useSelector(selectIsAuthed)
  const status = useSelector(selectAuthStatus)
  const errorFromStore = useSelector(selectAuthError)

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const busy = status === 'loading'
  const error = localError || errorFromStore || null

  useEffect(() => {
    if (isAuthed) {
      navigate('/home')
    }
  }, [isAuthed, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)

    if (!username.trim() || !password) {
      setLocalError('Username and password are required')
      return
    }

    const payload = { username: username.trim(), password }

    try {
      if (mode === 'login') {
        await dispatch(LoginThunk(payload))
      } else {
        await dispatch(RegisterThunk(payload))
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed'
      setLocalError(message)
    }
  }

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'))
    setLocalError(null)
  }

  return (
    <main className="auth-page uno-theme">
      <div className="bg-swirl"></div>

      <section className="auth-card">
        <div className="brand small">
          <div className="ring"></div>
          <div className="oval"></div>
          <div className="word">UNO</div>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Auth mode">
          <button
            className={`auth-tab${mode === 'login' ? ' active' : ''}`}
            onClick={() => setMode('login')}
            role="tab"
            aria-selected={mode === 'login'}
          >
            Login
          </button>

          <button
            className={`auth-tab${mode === 'register' ? ' active' : ''}`}
            onClick={() => setMode('register')}
            role="tab"
            aria-selected={mode === 'register'}
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="selector">
            <label className="label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              autoComplete="username"
            />
          </div>

          <div className="selector">
            <label className="label" htmlFor="password">
              Password
            </label>
            <div className="password-row">
              <input
                id="password"
                className="input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                className="btn icon"
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                aria-pressed={showPassword}
                aria-label="Toggle password visibility"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && <p className="error">{error}</p>}

          <button className="cta wide" disabled={busy} type="submit">
            {busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}
          </button>

          <p className="auth-hint">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button className="link" type="button" onClick={toggleMode}>
              {mode === 'login' ? 'Register' : 'Login'}
            </button>
          </p>
        </form>
      </section>
    </main>
  )
}

export default AuthView
