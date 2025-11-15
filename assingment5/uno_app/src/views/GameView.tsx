import React, { useMemo, useState } from 'react'
import '../style/Game.css'
import { Color, CardNumber  } from '../types/deck.types'
import { UnoCard } from '../components/UnoCard'
import { PopUpBox } from '../components/PopUpBox'
import { UnoDeck } from '../components/UnoDeck'

type GameViewProps = {
  botNumber: number
  targetScore?: number
  cardsPerPlayer?: number
  playerName?: string
}

type SimpleCard = {
  type: 'NUMBERED' | 'SKIP' | 'REVERSE' | 'DRAW' | 'WILD' | 'WILD_DRAW'
  color?: Color
  number?: CardNumber
}

const COLORS: Color[] = ['RED', 'YELLOW', 'GREEN', 'BLUE']

const GameView: React.FC<GameViewProps> = ({
  botNumber,
  targetScore = 500,
  cardsPerPlayer = 7,
  playerName = 'You',
}) => {
  const botNames = ['Bot A', 'Bot B', 'Bot C']
  const botCount = Math.min(Math.max(botNumber, 1), 3)
  const bots = botNames.slice(0, botCount)
  const players = [...bots, playerName]
  const meIx = players.length - 1

  const [hands, setHands] = useState<SimpleCard[][]>(() =>
    players.map((_, ix) =>
      Array.from({ length: cardsPerPlayer }, (_, j) => ({
        type: 'NUMBERED',
        color: COLORS[(ix + j) % COLORS.length],
         number: ((((j + ix) % 10) as CardNumber)),
      }))
    )
  )

  const [scores] = useState<number[]>(() => players.map(() => 0))
  const [currentTurn, setCurrentTurn] = useState(0)
  const [showColorPicker, setShowColorPicker] = useState<number | null>(null)

  const [showPopUp, setShowPopUp] = useState(false)
  const [popUpTitle, setPopUpTitle] = useState('')
  const [popUpMessage, setPopUpMessage] = useState('')

  const botIndices = useMemo(() => bots.map(name => players.indexOf(name)), [bots, players])
  const drawPileSize = 40

  const myTurn = () => currentTurn === meIx
  const handOf = (ix: number) => hands[ix] ?? []
  const handCountOf = (ix: number) => handOf(ix).length

  const topDiscard: SimpleCard | null = useMemo(() => {
    const h = handOf(meIx)
    return h[0] ?? null
  }, [hands, meIx])

  function rotateTurn() {
    setCurrentTurn(prev => (prev + 1) % players.length)
  }

  function onPlayCard(ix: number) {
    if (!myTurn()) return
    const myHand = handOf(meIx)
    const card = myHand[ix]
    if (!card) return

    if (card.type === 'WILD' || card.type === 'WILD_DRAW') {
      setShowColorPicker(ix)
      return
    }

    const newHands = hands.slice()
    newHands[meIx] = myHand.filter((_, i) => i !== ix)
    setHands(newHands)
    rotateTurn()
  }

  function pickColor(c: Color) {
    if (showColorPicker === null) return
    console.log('Picked color', c, 'for card index', showColorPicker)
    const myHand = handOf(meIx)
    const card = myHand[showColorPicker]
    if (!card) return
    const updatedCard: SimpleCard = { ...card, color: c }

    const newHands = hands.slice()
    newHands[meIx] = myHand.map((c2, i) => (i === showColorPicker ? updatedCard : c2))
    setHands(newHands)

    setShowColorPicker(null)
    rotateTurn()
  }

  function onDraw() {
    if (!myTurn()) return
     const card: SimpleCard = {
   type: 'NUMBERED',
   color: COLORS[Math.floor(Math.random() * COLORS.length)],
   number: (Math.floor(Math.random() * 10) as CardNumber),
 }
    const newHands = hands.slice()
    newHands[meIx] = [...handOf(meIx), card]
    setHands(newHands)
    rotateTurn()
  }

  function onUno() {
    setPopUpTitle('UNO')
    setPopUpMessage('You yelled UNO! (frontend only, no logic wired)')
    setShowPopUp(true)
  }

  function accuseOpponent(opIx: number) {
    console.log('Accuse opponent index', opIx)
    setPopUpTitle('Accusation')
    setPopUpMessage(`You accused ${players[opIx]} of not saying UNO.`)
    setShowPopUp(true)
  }

  const clearMessage = () => setShowPopUp(false)

  return (
    <main className={`play uno-theme${!myTurn() ? ' waiting' : ''}`}>
      <div className="target-score">Target: {targetScore}</div>
      <div className="bg-swirl"></div>

      <div className="turn-banner">
        {myTurn() ? (
          <span>Your turn</span>
        ) : (
          <span>Waiting for {players[currentTurn] ?? 'someone'}…</span>
        )}
      </div>

      <header className="row opponents">
        {bots.map((botName, bi) => {
          const botIndex = botIndices[bi]
          const isPlaying = currentTurn === botIndex
          return (
            <div
              key={botName}
              className={`opponent${isPlaying ? ' playing' : ''}`}
              onClick={() => accuseOpponent(botIndex)}
              title="Click to accuse this player"
            >
              <div className="column">
                <span className="name">{botName}</span>
                <span className="score">(Score: {scores[botIndex] ?? 0})</span>
              </div>

              <div className="bot-hand">
                {Array.from({ length: handCountOf(botIndex) }, (_, i) => (
                  <i key={i} className="bot-card"></i>
                ))}
              </div>
              <span className="count">{handCountOf(botIndex)}</span>
            </div>
          )
        })}
      </header>

      <section className="table">
        <div className="pile discard">
          {topDiscard && (
            <UnoCard
              type={topDiscard.type}
              color={
                topDiscard.type === 'NUMBERED' ||
                topDiscard.type === 'SKIP' ||
                topDiscard.type === 'REVERSE' ||
                topDiscard.type === 'DRAW'
                  ? topDiscard.color
                  : undefined
              }
              number={topDiscard.type === 'NUMBERED' ? topDiscard.number : undefined}
            />
          )}
        </div>
        <div className="pile draw" onClick={onDraw} title="Draw">
          <UnoDeck size="md" />
          <small className="pile-count">{drawPileSize}</small>
        </div>
      </section>

      <footer className={`hand${myTurn() ? ' playing' : ''}`}>
        <div className="column">
          <span className="name">{players[meIx]}</span>
          <span className="score">(Score: {scores[meIx] ?? 0})</span>
        </div>
        <div className="fan">
          {handOf(meIx).map((card, ix) => (
            <button
              key={ix}
              className="hand-card-btn"
              disabled={!myTurn()}
              onClick={() => onPlayCard(ix)}
              title="Play"
            >
              <UnoCard
                type={card.type}
                color={
                  card.type === 'NUMBERED' ||
                  card.type === 'SKIP' ||
                  card.type === 'REVERSE' ||
                  card.type === 'DRAW'
                    ? card.color
                    : undefined
                }
                number={card.type === 'NUMBERED' ? card.number : undefined}
              />
            </button>
          ))}
        </div>

        <div className="actions">
          <button className="btn draw" onClick={onDraw} disabled={!myTurn()}>
            Draw
          </button>
          <button className="btn uno" onClick={onUno}>
            UNO!
          </button>
        </div>
      </footer>

      {showColorPicker !== null && (
        <div className="color-picker-backdrop">
          <div className="color-picker">
            {COLORS.map(c => (
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

      <PopUpBox
        show={showPopUp}
        title={popUpTitle}
        message={popUpMessage}
        onClose={clearMessage}
      />
    </main>
  )
}

export default GameView
