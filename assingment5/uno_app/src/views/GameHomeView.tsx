import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../style/GameHome.css'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { selectIsAuthed, selectUsername } from '../store/authSlice'
import {
  createLobby,
  subscribeAll,
  refreshMyHand,
} from '../store/serverGameSlice'

const GameHomeView: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const isAuthed = useAppSelector(selectIsAuthed)
  const username = useAppSelector(selectUsername)

  const [botCounter, setBotCounter] = useState<number>(1)
  const [cardsPerPlayer, setCardsPerPlayer] = useState<number>(7)
  const [targetScore, setTargetScore] = useState<number>(500)
  const [error, setError] = useState<string>('')

  const increaseBotCounter = () => {
    if (botCounter < 3) {
      setBotCounter(prev => prev + 1)
      setError('')
    } else {
      setError('The maximum number of bots is 3')
    }
  }

  const decreaseBotCounter = () => {
    if (botCounter > 1) {
      setBotCounter(prev => prev - 1)
      setError('')
    } else {
      setError('The minimum number of bots is 1')
    }
  }

  const startBotGame = () => {
    if (!isAuthed) {
      setError('Please log in first')
      return
    }

    const name = username || 'You'
    navigate(
      `/game?botNumber=${botCounter}` +
        `&playerName=${encodeURIComponent(name)}` +
        `&cardsPerPlayer=${cardsPerPlayer}` +
        `&targetScore=${targetScore}`
    )
  }

  const startOnline = async () => {
    if (!isAuthed || !username) {
      setError('Please log in first')
      return
    }
    setError('')
    try {
      const result = await dispatch(
        createLobby({
          meName: username,
          targetScore,
          cardsPerPlayer,
        })
      ).unwrap()

      // result has { gameId, meIndex, game }
      const gameId: string = result.gameId
      await dispatch(subscribeAll())
      await dispatch(refreshMyHand())

      navigate(`/game-server?gameId=${encodeURIComponent(gameId)}`)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create lobby')
    }
  }

  const browseLobbies = () => {
    navigate('/lobbies')
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

        {!isAuthed && (
          <div className="auth-warning">
            <p>You need to log in before playing.</p>
            <button className="cta" onClick={() => navigate('/')}>
              Go to Login
            </button>
          </div>
        )}

        {isAuthed && (
          <>
            <div className="selector">
              <label className="label" htmlFor="startingCards">
                Starting Cards
              </label>
              <input
                id="startingCards"
                className="input"
                type="number"
                min={5}
                max={10}
                value={cardsPerPlayer}
                onChange={e => setCardsPerPlayer(Number(e.target.value) || 0)}
              />
              <p className="hint">Default is 7 cards</p>
            </div>

            <div className="selector">
              <label className="label" htmlFor="targetScore">
                Target Score
              </label>
              <input
                id="targetScore"
                className="input"
                type="number"
                min={100}
                max={1000}
                step={50}
                value={targetScore}
                onChange={e => setTargetScore(Number(e.target.value) || 0)}
              />
              <p className="hint">Default is 500 points</p>
            </div>

            <div className="selector">
              <label className="label">Opponents (Bot mode)</label>
              <div className="pill">
                <button className="chip" onClick={decreaseBotCounter}>
                  −
                </button>
                <strong className="count">{botCounter}</strong>
                <button className="chip" onClick={increaseBotCounter}>
                  +
                </button>
              </div>
              <p className="hint">Choose 1–3 bots</p>
              <p className="error">{error}</p>
            </div>

            <div className="selector" style={{ gap: '0.6rem' }}>
              <button className="cta" onClick={startBotGame}>
                Play (Bots)
              </button>
              <button className="cta" onClick={startOnline}>
                Create Online Lobby
              </button>
              <button className="cta" onClick={browseLobbies}>
                Browse Public Lobbies
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default GameHomeView
