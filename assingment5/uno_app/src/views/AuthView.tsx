// src/views/AuthView.tsx
import React, { useState } from 'react'
import '../style/Auth.css'

const AuthView: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!username.trim() || !password) {
      setError('Username and password are required')
      return
    }

    setBusy(true)
    // Dummy async to mimic auth
    setTimeout(() => {
      console.log(`Submitting ${mode} with`, { username, password })
      setBusy(false)
    }, 600)
  }

  const toggleMode = () => {
    setMode(prev => (prev === 'login' ? 'register' : 'login'))
    setError(null)
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
              onChange={e => setUsername(e.target.value)}
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
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                className="btn icon"
                type="button"
                onClick={() => setShowPassword(p => !p)}
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
