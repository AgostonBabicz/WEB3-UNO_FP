import React, { useMemo, useState } from 'react'
import '../style/Game.css'
import { Color, CardNumber } from '../types/deck.types'
import { PopUpMessage } from '../components/PopUpMessage'
import { UnoCard } from '../components/UnoCard'
import { UnoDeck } from '../components/UnoDeck'
import { COLORS } from '../models/colors'

type Player = {
  id: string
  name: string
  score: number
  handCount: number
}

type SimpleCard = {
  type: 'NUMBERED' | 'SKIP' | 'REVERSE' | 'DRAW' | 'WILD' | 'WILD_DRAW'
  color?: Color
  number?: CardNumber
}

const COLOR_LIST: Color[] = ['RED', 'YELLOW', 'GREEN', 'BLUE']

const GameServerView: React.FC = () => {
  const [players] = useState<Player[]>([
    { id: '1', name: 'Alice', score: 120, handCount: 5 },
    { id: '2', name: 'Bob', score: 80, handCount: 7 },
    { id: '3', name: 'You', score: 150, handCount: 6 },
  ])

  const [meIx] = useState<number>(2)
  const [currentTurn, setCurrentTurn] = useState<number | null>(0)
  const [roundStarted, setRoundStarted] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState<number | null>(null)

  const [myHand, setMyHand] = useState<SimpleCard[]>(() =>
    Array.from({ length: 6 }, (_, i) => ({
      type: 'NUMBERED',
      color: COLOR_LIST[i % COLOR_LIST.length],
      number: (((i + 1) % 10) as CardNumber),
    }))
  )

  const [discardTop, setDiscardTop] = useState<SimpleCard | null>(() =>
    myHand.length > 0 ? myHand[0] : null
  )
  const [drawPileSize] = useState<number>(30)
  const [targetScore] = useState<number>(500)

  const [showPopUpMessage, setShowPopUpMessage] = useState(false)
  const [popUpTitle, setPopUpTitle] = useState('')
  const [popUpMessage, setPopUpMessage] = useState('')

  const enoughPlayers = useMemo(() => players.length >= 2, [players])
  const myTurn = useMemo(
    () => roundStarted && currentTurn === meIx,
    [roundStarted, currentTurn, meIx]
  )

  function canPlayAt(ix: number) {
    return myTurn && !!myHand[ix]
  }

  async function onPlayCard(ix: number) {
    if (!myTurn) return
    const card = myHand[ix]
    if (!card) return
    if (card.type === 'WILD' || card.type === 'WILD_DRAW') {
      setShowColorPicker(ix)
      return
    }
    const newHand = myHand.filter((_, i) => i !== ix)
    setMyHand(newHand)
    setDiscardTop(card)
    setCurrentTurn(prev => {
      if (prev === null) return 0
      return (prev + 1) % players.length
    })
  }

  async function pickColor(c: Color) {
    if (showColorPicker === null) return
    const card = myHand[showColorPicker]
    if (!card) return
    const colored: SimpleCard = { ...card, color: c }
    const newHand = myHand.map((c2, i) => (i === showColorPicker ? colored : c2))
    setMyHand(newHand)
    setDiscardTop(colored)
    setShowColorPicker(null)
    setCurrentTurn(prev => {
      if (prev === null) return 0
      return (prev + 1) % players.length
    })
  }

  async function onDraw() {
    if (!myTurn) return
    const card: SimpleCard = {
   type: 'NUMBERED',
   color: COLORS[Math.floor(Math.random() * COLORS.length)],
   number: (Math.floor(Math.random() * 10) as CardNumber),
 }
    setMyHand(prev => [...prev, card])
  }

  async function onUno() {
    setPopUpTitle('UNO')
    setPopUpMessage('You called UNO in the online game mock.')
    setShowPopUpMessage(true)
  }

  async function accuseOpponent(opIx: number) {
    const p = players[opIx]
    setPopUpTitle('Accuse')
    setPopUpMessage(`You accused ${p?.name ?? 'someone'} of not saying UNO.`)
    setShowPopUpMessage(true)
  }

  async function onStartRound() {
    setRoundStarted(true)
    setCurrentTurn(0)
  }

  const clearMessage = () => setShowPopUpMessage(false)

  const visibleOpponents = players.filter((_, i) => i !== meIx)

  return (
    <main className={`play uno-theme${!myTurn ? ' waiting' : ''}`}>
      <div className="target-score">Target: {targetScore}</div>
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
          onClick={onStartRound}
        >
          Start Round
        </button>
      )}

      <header className="row opponents">
        {visibleOpponents.map(p => {
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
        show={showPopUpMessage}
        title={popUpTitle || ''}
        message={popUpMessage || ''}
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
          <span className="name">{players[meIx]?.name}</span>
          <span className="score">
            (Score: {players[meIx]?.score ?? 0})
          </span>
        </div>
        <div className="fan">
          {myHand.map((card, ix) => (
            <button
              key={ix}
              className="hand-card-btn"
              disabled={!canPlayAt(ix)}
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
          <button className="btn uno" onClick={onUno} disabled={!roundStarted}>
            UNO!
          </button>
        </div>
      </footer>

      {showColorPicker !== null && (
        <div className="color-picker-backdrop">
          <div className="color-picker">
            {COLOR_LIST.map(c => (
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
    </main>
  )
}

export default GameServerView
