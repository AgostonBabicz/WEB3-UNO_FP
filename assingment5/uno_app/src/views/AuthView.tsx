import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../style/Auth.css'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  login,
  register,
  selectAuthError,
  selectAuthStatus,
  selectIsAuthed,
} from '../store/authSlice'

const AuthView: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const isAuthed = useAppSelector(selectIsAuthed)
  const status = useAppSelector(selectAuthStatus)
  const errorFromStore = useAppSelector(selectAuthError)

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
        await dispatch(login(payload)).unwrap()
      } else {
        await dispatch(register(payload)).unwrap()
      }
      // navigation happens in useEffect when isAuthed flips true
    } catch (err: any) {
      // thunk already put error in store, but just in case
      setLocalError(err?.message ?? 'Authentication failed')
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
