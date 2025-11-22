'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import '../style/Game.css'

import { useAppDispatch, useAppSelector } from '../stores/hooks'
import {
  selectServerGame,
  selectServerGamePopUp,
  selectServerGameGameOver,
  selectServerGameMyHand,
  selectServerGamePlayable,
} from '../slices/serverGameSlice'
import { serverGameActions } from '../slices/serverGameSlice'
import { Card, CardNumber, Color } from '@uno/domain'
import { UnoCard } from '../components/UnoCard'
import { UnoDeck } from '../components/UnoDeck'
import PlayCardThunk from '../thunks/PlayCardThunk'
import DrawCardThunk from '../thunks/DrawCardThunk'
import SayUnoThunk from '../thunks/SayUnoThunk'
import AccuseThunk from '../thunks/AccuseThunk'
import StartRoundThunk from '../thunks/StartRoundThunk'
import { subscribeToGameUpdates } from '../thunks/GameUpdatesThunk'
import { subscribeToGameEvents } from '../thunks/GameEventsThunk'
import RefreshMyHandThunk from '../thunks/RefreshHandThunk'
import { PopUpMessage } from 'src/components/PopUpMessage'

const GameServerView: React.FC = () => {
  const dispatch = useAppDispatch()
  const router = useRouter()

  const { gameId, game, meIndex } = useAppSelector(selectServerGame)
  const myHand = useAppSelector(selectServerGameMyHand)
  const playable = useAppSelector(selectServerGamePlayable)
  const popUp = useAppSelector(selectServerGamePopUp)
  const gameOver = useAppSelector(selectServerGameGameOver)

  const [showColorPicker, setShowColorPicker] = useState<number | null>(null)

  const players = useMemo(() => {
    if (!game) return []
    return game.players.map((name, index) => ({
      id: name,
      name: name,
      score: game.scores?.[index] ?? 0,
      handCount: game.currentRound?.playerHands.get(index)?.cards.size ?? 0,
    }))
  }, [game])

  const roundStarted = !!game?.currentRound
  const enoughPlayers = players.length >= 2
  const currentTurn: number | null = game?.currentRound?.currentPlayerIndex ?? null // 'currentPlayerIndex' in domain
  const myTurn = roundStarted && meIndex != null && currentTurn != null && currentTurn === meIndex
  const yourHand = myHand
  const discardTop = game?.currentRound?.discardDeck.first() 
  const drawPileSize = game?.currentRound?.drawDeck.size ?? 0

  const canPlayAt = (ix: number) => playable.includes(ix)

  useEffect(() => {
    const updatesSub = dispatch(subscribeToGameUpdates)
    const eventsSub = dispatch(subscribeToGameEvents)
    dispatch(RefreshMyHandThunk())

    return () => {
      if (updatesSub && 'unsubscribe' in updatesSub) updatesSub.unsubscribe()
      if (eventsSub && 'unsubscribe' in eventsSub) eventsSub.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (gameOver.triggered && gameOver.winner) {
      router.push(`/game-over?winner=${encodeURIComponent(gameOver.winner)}`)
      dispatch(serverGameActions.resetGameOver())
    }
  }, [gameOver.triggered, gameOver.winner, dispatch, router])

  const onPlayCard = async (ix: number) => {
    if (!myTurn) return
    const card = yourHand[ix]
    if (!card) return
    if (!canPlayAt(ix)) return
    if (card.type === 'WILD' || card.type === 'WILD_DRAW') {
      setShowColorPicker(ix)
    } else {
      await dispatch(PlayCardThunk({ cardIndex: ix }))
    }
  }

  const pickColor = async (c: Color) => {
    if (showColorPicker === null) return
    await dispatch(PlayCardThunk({ cardIndex: showColorPicker, askedColor: c }))
    setShowColorPicker(null)
  }

  const onDraw = async () => {
    if (!myTurn) return
    await dispatch(DrawCardThunk())
  }

  const onUno = async () => {
    await dispatch(SayUnoThunk())
  }

  const accuseOpponent = async (opIx: number) => {
    await dispatch(AccuseThunk(opIx))
  }

  const onStartRoundClick = async () => {
    await dispatch(StartRoundThunk())
  }

  // const handleCloseMessage = () => {
  //   dispatch(serverGameActions.clearMessage())
  // }

  const visibleOpponents = players.filter((_, i) => i !== meIndex)

  return (
    <main className={`play uno-theme${!myTurn ? ' waiting' : ''}`}>
      <div className="target-score">Target: {game?.targetScore ?? 500}</div>
      <div className="bg-swirl"></div>

      <div className="turn-banner">
        {!roundStarted && <span>Waiting for players… ({players.length}/4)</span>}

        {roundStarted && (
          <>
            {myTurn ? (
              <span>Your turn</span>
            ) : (
              <span>Waiting for {players[currentTurn ?? 0]?.name ?? 'someone'}…</span>
            )}
          </>
        )}
      </div>

      {!roundStarted && (
        <button className="start-round-btn" disabled={!enoughPlayers} onClick={onStartRoundClick}>
          Start Round
        </button>
      )}

      <header className="row opponents">
        {visibleOpponents.map((p) => {
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

      {/* <PopUpMessage
        show={popUp.show}
        title={popUp.title || ''}
        message={popUp.message || ''}
        onClose={handleCloseMessage}
      /> */}

      <section className="table">
        <div className="pile discard">
          {/* 1. FIXED CARD TYPE SAFETY */}
          {discardTop && (
            <UnoCard 
              type={discardTop.type} 
              color={'color' in discardTop ? discardTop.color : undefined} 
              number={'number' in discardTop ? (discardTop.number as CardNumber) : undefined}
            />
          )}
        </div>
        <div className="pile draw" onClick={onDraw} title="Draw">
          {roundStarted && <UnoDeck size="md" />}
          {roundStarted && <small className="pile-count">{drawPileSize}</small>}
        </div>
      </section>

      <footer className={`hand${myTurn ? ' playing' : ''}`}>
        <div className="column">
          <span className="name">{players[meIndex ?? 0]?.name}</span>
          <span className="score">(Score: {players[meIndex ?? 0]?.score ?? 0})</span>
        </div>
        <div className="fan">
          {yourHand.map((card: Card, ix: number) => (
            <button
              key={ix}
              className="hand-card-btn"
              disabled={!myTurn || !canPlayAt(ix)}
              onClick={() => onPlayCard(ix)}
              title="Play"
            >
              <UnoCard
                type={card.type}
                color={'color' in card ? card.color : undefined}
                number={'number' in card ? (card.number as CardNumber) : undefined}
              />
            </button>
          ))}
        </div>

        <div className="actions">
          <button className="btn draw" onClick={onDraw} disabled={!myTurn}>
            Draw
          </button>
          <button className="btn uno" onClick={onUno} disabled={!roundStarted}>
            UNO!
          </button>
        </div>
      </footer>

      {showColorPicker !== null && (
        <div className="color-picker-backdrop">
          <div className="color-picker">
            {['RED', 'YELLOW', 'GREEN', 'BLUE'].map((c) => (
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
