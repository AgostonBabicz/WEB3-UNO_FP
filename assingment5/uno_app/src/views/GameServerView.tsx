import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import '../style/Game.css'

import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  selectServerGame,
  selectServerGamePopUp,
  selectServerGameGameOver,
  selectServerGameMyHand,
  selectServerGamePlayable,
  subscribeAll,
  refreshMyHand,
  startRound,
  playCard,
  drawCard,
  sayUno as sayUnoThunk,
  accuse as accuseThunk,
  resetGameOver,
} from '../store/serverGameSlice'
import { Color } from '../types/deck.types'
import { PopUpMessage } from '../components/PopUpMessage'
import { UnoCard } from '../components/UnoCard'
import { UnoDeck } from '../components/UnoDeck'

const GameServerView: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const { gameId, game, meIndex } = useAppSelector(selectServerGame)
  const myHand = useAppSelector(selectServerGameMyHand)
  const playable = useAppSelector(selectServerGamePlayable)
  const popUp = useAppSelector(selectServerGamePopUp)
  const gameOver = useAppSelector(selectServerGameGameOver)

  const [showColorPicker, setShowColorPicker] = useState<number | null>(null)

  const urlGameId = searchParams.get('gameId') || ''

  const players = useMemo(() => game?.players ?? [], [game])
  const roundStarted = !!game?.currentRound
  const enoughPlayers = players.length >= 2

  const currentTurn: number | null =
    game?.currentRound?.playerInTurnIndex ?? null

  const myTurn =
    roundStarted &&
    meIndex != null &&
    currentTurn != null &&
    currentTurn === meIndex

  const yourHand = myHand

  const discardTop = game?.currentRound?.discardTop
  const drawPileSize = game?.currentRound?.drawPileSize ?? 0

  const canPlayAt = (ix: number) => playable.includes(ix)

  // handle subscriptions on mount
  useEffect(() => {
    // assume gameId already set by createLobby / joinLobby in Home/Lobbies
    if (urlGameId && !gameId) {
      // optional: could add an action to sync gameId from URL if needed
      // for now we just rely on store gameId
      console.warn('URL gameId present but store has no gameId. You may want to hydrate from URL.')
    }

    dispatch(subscribeAll())
    dispatch(refreshMyHand())

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // navigate to game over when serverGameSlice says so
  useEffect(() => {
    if (gameOver.triggered && gameOver.winner) {
      navigate(`/game-over?winner=${encodeURIComponent(gameOver.winner)}`)
      dispatch(resetGameOver())
    }
  }, [gameOver.triggered, gameOver.winner, navigate, dispatch])

  const onPlayCard = async (ix: number) => {
    if (!myTurn) return
    const card = yourHand[ix]
    if (!card) return
    if (!canPlayAt(ix)) return
    if (card.type === 'WILD' || card.type === 'WILD_DRAW') {
      setShowColorPicker(ix)
    } else {
      await dispatch(playCard({ cardIndex: ix })).unwrap()
    }
  }

  const pickColor = async (c: Color) => {
    if (showColorPicker === null) return
    await dispatch(playCard({ cardIndex: showColorPicker, askedColor: c })).unwrap()
    setShowColorPicker(null)
  }

  const onDraw = async () => {
    if (!myTurn) return
    await dispatch(drawCard()).unwrap()
  }

  const onUno = async () => {
    await dispatch(sayUnoThunk()).unwrap()
  }

  const accuseOpponent = async (opIx: number) => {
    await dispatch(accuseThunk(opIx)).unwrap()
  }

  const onStartRoundClick = async () => {
    await dispatch(startRound()).unwrap()
  }

  const clearMessage = () => {
    // hide PopUpMessage by action from slice
    // but we already have clearMessage exported in serverGameSlice
    dispatch({ type: 'serverGame/clearMessage' })
  }

  const visibleOpponents = players.filter((_: any, i: number) => i !== meIndex)

  return (
    <main className={`play uno-theme${!myTurn ? ' waiting' : ''}`}>
      <div className="target-score">Target: {game?.targetScore ?? 500}</div>
      <div className="bg-swirl"></div>

      <div className="turn-banner">
        {!roundStarted && (
          <span>Waiting for players… ({players.length}/4)</span>
        )}

        {roundStarted && (
          <>
            {myTurn ? (
              <span>Your turn</span>
            ) : (
              <span>
                Waiting for {players[currentTurn ?? 0]?.name ?? 'someone'}…
              </span>
            )}
          </>
        )}
      </div>

      {!roundStarted && (
        <button
          className="start-round-btn"
          disabled={!enoughPlayers}
          onClick={onStartRoundClick}
        >
          Start Round
        </button>
      )}

      <header className="row opponents">
        {visibleOpponents.map((p: any) => {
          const index = players.indexOf(p)
          const isPlaying = currentTurn === index
          return (
            <div
              key={p.id}
              className={`opponent${isPlaying ? ' playing' : ''}`}
              onClick={() => accuseOpponent(index)}
              title="Click to accuse this player"
            >
              <div className="column">
                <span className="name">{p.name}</span>
                <span className="score">(Score: {p.score})</span>
              </div>

              <div className="bot-hand">
                {Array.from({ length: p.handCount }, (_, i) => (
                  <i key={i} className="bot-card"></i>
                ))}
              </div>
              <span className="count">{p.handCount}</span>
            </div>
          )
        })}
      </header>

      <PopUpMessage
        show={popUp.show}
        title={popUp.title || ''}
        message={popUp.message || ''}
        onClose={clearMessage}
      />

      <section className="table">
        <div className="pile discard">
          {discardTop && (
            <UnoCard
              type={discardTop.type}
              color={discardTop.color}
              number={discardTop.number}
            />
          )}
        </div>
        <div className="pile draw" onClick={onDraw} title="Draw">
          {roundStarted && <UnoDeck size="md" />}
          {roundStarted && (
            <small className="pile-count">{drawPileSize}</small>
          )}
        </div>
      </section>

      <footer className={`hand${myTurn ? ' playing' : ''}`}>
        <div className="column">
          <span className="name">{players[meIndex ?? 0]?.name}</span>
          <span className="score">
            (Score: {players[meIndex ?? 0]?.score ?? 0})
          </span>
        </div>
        <div className="fan">
          {yourHand.map((card: any, ix: number) => (
            <button
              key={ix}
              className="hand-card-btn"
              disabled={!myTurn || !canPlayAt(ix)}
              onClick={() => onPlayCard(ix)}
              title="Play"
            >
              <UnoCard
                type={card.type}
                color={card.color}
                number={card.number}
              />
            </button>
          ))}
        </div>

        <div className="actions">
          <button className="btn draw" onClick={onDraw} disabled={!myTurn}>
            Draw
          </button>
          <button
            className="btn uno"
            onClick={onUno}
            disabled={!roundStarted}
          >
            UNO!
          </button>
        </div>
      </footer>

      {showColorPicker !== null && (
        <div className="color-picker-backdrop">
          <div className="color-picker">
            {['RED', 'YELLOW', 'GREEN', 'BLUE'].map(c => (
              <button
                key={c}
                className="color-chip"
                data-color={c.toLowerCase()}
                onClick={() => pickColor(c as Color)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

export default GameServerView
