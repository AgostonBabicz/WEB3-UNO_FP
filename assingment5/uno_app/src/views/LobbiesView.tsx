import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../style/GameHome.css'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { selectUsername, selectIsAuthed } from '../store/authSlice'
import {
  loadWaitingGames,
  joinLobby,
  subscribeAll,
  refreshMyHand,
  selectWaitingGames,
} from '../store/serverGameSlice'

const LobbiesView: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const lobbies = useAppSelector(selectWaitingGames)
  const isAuthed = useAppSelector(selectIsAuthed)
  const username = useAppSelector(selectUsername)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      await dispatch(loadWaitingGames()).unwrap()
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load lobbies')
    } finally {
      setLoading(false)
    }
  }

  const joinLobbyHandler = async (gameId: string) => {
    if (!isAuthed || !username) {
      setError('Please log in first')
      return
    }
    try {
      const result = await dispatch(
        joinLobby({ id: gameId, myName: username })
      ).unwrap()

      const id: string = result.gameId
      await dispatch(subscribeAll())
      await dispatch(refreshMyHand())

      navigate(`/game-server?gameId=${encodeURIComponent(id)}`)
    } catch (e: any) {
      setError(e?.message ?? 'Join failed')
    }
  }

  const goBack = () => {
    navigate('/home')
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
            {lobbies.map((g: any) => (
              <li
                key={g.id}
                className="pill"
                style={{ width: '100%', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <code>{g.id}</code>
                  <span>Players: {g.players?.length ?? 0}/4</span>
                  {g.targetScore && (
                    <span className="hint">Target: {g.targetScore}</span>
                  )}
                </div>
                <button className="chip" onClick={() => joinLobbyHandler(g.id)}>
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
