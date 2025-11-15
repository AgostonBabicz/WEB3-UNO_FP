import React, { useState } from 'react'
import '../style/GameHome.css'

type Lobby = {
  id: string
  players: number
  targetScore?: number
}

const LobbiesView: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lobbies, setLobbies] = useState<Lobby[]>([])

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      setTimeout(() => {
        setLobbies([
          { id: 'ABC123', players: 2, targetScore: 500 },
          { id: 'XYZ999', players: 3, targetScore: 300 },
        ])
        setLoading(false)
      }, 500)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load lobbies')
      setLoading(false)
    }
  }

  const join = (gameId: string) => {
    console.log('Join lobby', gameId)
  }

  const goBack = () => {
    console.log('Back to home')
  }

  return (
    <main className="home uno-theme">
      <div className="bg-swirl"></div>

      <section className="center">
        <div className="brand">
          <div className="ring"></div>
          <div className="oval"></div>
          <div className="word">UNO</div>
        </div>

        <div className="selector" style={{ gap: '0.6rem' }}>
          <button className="cta" onClick={refresh} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button className="cta" onClick={goBack}>
            Back
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        {!loading && lobbies.length === 0 && (
          <div className="selector">
            <p className="hint">No public lobbies available right now.</p>
          </div>
        )}

        {lobbies.length > 0 && (
          <ul
            className="selector"
            style={{ width: '100%', maxWidth: 640, gap: '0.8rem' }}
          >
            {lobbies.map(g => (
              <li
                key={g.id}
                className="pill"
                style={{ width: '100%', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <code>{g.id}</code>
                  <span>Players: {g.players}/4</span>
                  {g.targetScore && (
                    <span className="hint">Target: {g.targetScore}</span>
                  )}
                </div>
                <button className="chip" onClick={() => join(g.id)}>
                  Join
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default LobbiesView
