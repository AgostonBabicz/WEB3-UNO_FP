import React, { useEffect, useMemo, useRef, useCallback, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../stores/hooks'
import {
  init,
  clearMessage,
  selectUnoGame,
  playCard,
  draw,
  sayUno,
  accuse
} from '../slices/unoGameSlice'

import type { Game,Round,Color } from '@uno/domain'

import {
  roundGetHand,
  roundTopOfDiscard,
  roundDrawPile,
  roundHasEnded,
  roundCanPlay,
} from '@uno/domain'
import { UnoCard } from '../components/UnoCard'
import { UnoDeck } from '../components/UnoDeck'
import { PopUpBox } from '../components/PopUpBox'
import { useNavigate } from 'react-router-dom'
import BotTakeTurn from '../thunks/BotTurnThunk'


type GameViewProps = {
  botNumber: number
  playerName: string
  cardsPerPlayer: number
  targetScore: number
}

const COLORS: Color[] = ['RED', 'YELLOW', 'GREEN', 'BLUE']

const GameView: React.FC<GameViewProps> = ({
  botNumber,
  playerName,
  cardsPerPlayer,
  targetScore,
}) => {
  const dispatch = useAppDispatch()
  const uno = useAppSelector(selectUnoGame)
  const navigate = useNavigate()

  const botNames = useMemo(() => ['Bot A', 'Bot B', 'Bot C'], [])
  const botCount = useMemo(() => Math.min(Math.max(botNumber || 1, 1), 3), [botNumber])
  const bots = useMemo(() => botNames.slice(0, botCount), [botNames, botCount])
  const me = playerName || 'You'
  const players = useMemo(() => [...bots, me], [bots, me])

  const meIx = players.indexOf(me)

  const initRef = useRef(false)
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    dispatch(
      init({
        players,
        targetScore,
        cardsPerPlayer,
      }),
    )
  }, [dispatch, players, targetScore, cardsPerPlayer])

  const game = uno.game as Game | null
  const round = (game?.currentRound ?? null) as Round | null

  const playerInTurn = round ? (round.playerInTurn ?? round.currentPlayerIndex) : undefined

  const roundEnded = round ? roundHasEnded(round) : false
  const isGameOver = game?.winner !== undefined

  const myTurn = playerInTurn === meIx && !roundEnded && !isGameOver

  const handOf = useCallback((ix: number) => (round ? roundGetHand(round, ix) : []), [round])

  const myHand = handOf(meIx)
  const drawPileSize = round ? roundDrawPile(round).size : 0
  const discardTop = round ? roundTopOfDiscard(round) : undefined
  const botIndices = useMemo(() => bots.map((_, bi) => bi), [bots])

  const [showColorPicker, setShowColorPicker] = useState<number | null>(null)

  const canPlayAt = (ix: number) => (round ? roundCanPlay(ix, round) : false)

  const handlePlayCard = (ix: number) => {
    if (!myTurn || !round) return
    if (!roundCanPlay(ix, round)) return

    const hand = roundGetHand(round, meIx)
    const card = hand[ix]
    if (!card) return

    if (card.type === 'WILD' || card.type === 'WILD_DRAW') {
      setShowColorPicker(ix)
      return
    }

    dispatch(playCard({ cardIx : ix }))
  }

  const pickColor = (c: Color) => {
    if (showColorPicker === null) return
    dispatch(playCard({ cardIx: showColorPicker, askedColor: c }))
    setShowColorPicker(null)
  }

  const handleDraw = () => {
    if (!myTurn || !round) return
    dispatch(draw())
  }

  const handleUno = () => {
    dispatch(sayUno( meIx ))
  }

  const handleAccuse = (opIx: number) => {
    if (!round) return
    dispatch(accuse({ accuser: meIx, accused: opIx }))
  }

  const handleClosePopup = () => {
    dispatch(clearMessage())
  }

  useEffect(() => {
    if (!round || !game) return
    if (roundEnded || isGameOver) return
    if (playerInTurn == null) return
    if (playerInTurn === meIx) return

    dispatch(BotTakeTurn())
  }, [dispatch, round, game, playerInTurn, roundEnded, isGameOver, meIx])

  useEffect(() => {
    if (!isGameOver) return

    navigate('/game-over?winner=' + encodeURIComponent(game?.winner || 'Unknown'))
  }, [isGameOver, game, players])

  return (
    <main className={`play uno-theme ${myTurn ? '' : 'waiting'}`}>
      <div className="target-score">Target: {targetScore}</div>
      <div className="bg-swirl" />

      <div className="turn-banner">
        {myTurn ? (
          <span>Your turn</span>
        ) : (
          <span>{playerInTurn != null ? `Waiting for ${players[playerInTurn]}…` : 'Waiting…'}</span>
        )}
      </div>

      <header className="row opponents">
        {bots.map((botName, bi) => {
          const pIx = botIndices[bi]
          const score = game && Array.isArray(game.scores) ? (game.scores[pIx] ?? 0) : 0
          const count = handOf(pIx).length

          return (
            <div
              key={botName}
              className={`opponent ${playerInTurn === pIx ? 'playing' : ''}`}
              onClick={() => handleAccuse(pIx)}
              title="Click to accuse this player"
            >
              <div className="column">
                <span className="name">{botName}</span>
                <span className="score">(Score: {score})</span>
              </div>

              <div className="bot-hand">
                {Array.from({ length: count }).map((_, i) => (
                  <i key={i} className="bot-card" />
                ))}
              </div>
              <span className="count">{count}</span>
            </div>
          )
        })}
      </header>

      <section className="table">
        <div className="pile discard">
          {discardTop && (
            <UnoCard
              type={discardTop.type}
              color={
                discardTop.type === 'NUMBERED' ||
                discardTop.type === 'SKIP' ||
                discardTop.type === 'REVERSE' ||
                discardTop.type === 'DRAW'
                  ? (discardTop as any).color
                  : undefined
              }
              number={discardTop.type === 'NUMBERED' ? (discardTop as any).number : undefined}
            />
          )}
        </div>
        <div className="pile draw" onClick={handleDraw} title="Draw">
          <UnoDeck size="md" />
          <small className="pile-count">{drawPileSize}</small>
        </div>
      </section>

      <footer className={`hand ${myTurn ? 'playing' : ''}`}>
        <div className="column">
          <span className="name">{players[meIx]}</span>
          <span className="score">
            (Score: {game && Array.isArray(game.scores) ? (game.scores[meIx] ?? 0) : 0})
          </span>
        </div>

        <div className="fan">
          {myHand.map((card, ix) => (
            <button
              key={ix}
              className="hand-card-btn"
              disabled={!myTurn || !canPlayAt(ix)}
              onClick={() => handlePlayCard(ix)}
              title="Play"
            >
              <UnoCard
                type={card.type}
                color={
                  card.type === 'NUMBERED' ||
                  card.type === 'SKIP' ||
                  card.type === 'REVERSE' ||
                  card.type === 'DRAW'
                    ? (card as any).color
                    : undefined
                }
                number={card.type === 'NUMBERED' ? (card as any).number : undefined}
              />
            </button>
          ))}
        </div>

        <div className="actions">
          <button className="btn draw" onClick={handleDraw} disabled={!myTurn}>
            Draw
          </button>
          <button className="btn uno" onClick={handleUno}>
            UNO!
          </button>
        </div>
      </footer>

      {showColorPicker !== null && (
        <div className="color-picker-backdrop">
          <div className="color-picker">
            {COLORS.map((c) => (
              <button
                key={c}
                className="color-chip"
                data-color={c.toLowerCase()}
                onClick={() => pickColor(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {uno.showPopUpMessage && (
        <PopUpBox
          show={uno.showPopUpMessage}
          title={uno.popUpTitle || ''}
          message={uno.popUpMessage || ''}
          onClose={handleClosePopup}
        />
      )}
    </main>
  )
}

export default GameView
