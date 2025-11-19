import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from './store'

import { createGame, gamePlay } from '@uno/domain'
import {
  roundDraw,
  roundSayUno,
  roundGetHand,
  roundCanPlay,
  checkUnoFailure,
  catchUnoFailure,
  roundPlay,
} from '@uno/domain'
import { Game,Card, Color, Round  } from '@uno/domain'
import { randomDelay } from '../utils/randomDelay'

type Opts = {
  players: string[]
  targetScore?: number
  cardsPerPlayer?: number
}

type UnoGameState = {
  opts: Opts | null
  game: Game | null | any
  showPopUpMessage: boolean
  popUpMessage: string | null
  popUpTitle: string | null
}

const initialState: UnoGameState = {
  opts: null,
  game: null,
  showPopUpMessage: false,
  popUpMessage: null,
  popUpTitle: null,
}

// helpers

function currentRound(state: UnoGameState): Round | undefined {
  return state.game?.currentRound
}

function currentPlayerIndex(r: Round): number | undefined {
  return r.playerInTurn ?? r.currentPlayerIndex
}

function isBot(state: UnoGameState, ix: number): boolean {
  const opts = state.opts
  if (!opts) return false
  // last player is the human
  return ix >= 0 && ix < opts.players.length - 1
}

function handOfRound(r: Round, ix: number): readonly Card[] {
  return roundGetHand(r, ix)
}

function chooseWildColor(state: UnoGameState, r: Round, ix: number): Color {
  const hand = handOfRound(r, ix)
  const counts: Record<Color, number> = {
    RED: 0,
    YELLOW: 0,
    GREEN: 0,
    BLUE: 0,
  }
  for (const c of hand) {
    if ('color' in c) counts[c.color as Color]++
  }
  let best: Color = 'RED'
  let bestN = -1
  for (const k of Object.keys(counts) as Color[]) {
    if (counts[k] > bestN) {
      best = k
      bestN = counts[k]
    }
  }
  return best
}

export const botTakeTurn = createAsyncThunk<boolean, void, { state: RootState }>(
  'unoGame/botTakeTurn',
  async (_, { getState, dispatch }) => {
    const root = getState()
    const slice = root.unoGame
    const g = slice.game as Game | null
    const r = g?.currentRound as Round | undefined

    if (!g || !r) return false
    if (g.winner !== undefined) return false

    const ix = currentPlayerIndex(r)
    if (ix == null || !isBot(slice, ix)) return false

    await new Promise((res) => setTimeout(res, randomDelay()))

    let s2 = (getState() as RootState).unoGame
    let g2 = s2.game as Game | null
    let r2 = g2?.currentRound as Round | undefined

    if (!g2 || !r2) return false
    if (g2.winner !== undefined) return false

    const currentIx = currentPlayerIndex(r2)
    if (currentIx !== ix || !isBot(s2, currentIx)) return false

    const opts = s2.opts

    if (opts) {
      for (let t = 0; t < opts.players.length; t++) {
        if (t === ix) continue
        if (checkUnoFailure({ accuser: ix, accused: t }, r2)) {
          dispatch(
            accuse({
              accuser: ix,
              accused: t,
            }),
          )
          dispatch(
            setMessage({
              title: 'You are accused!',
              message: `${opts.players[ix]} accuses ${opts.players[t]} of not saying UNO! Now Draw 4`,
            }),
          )
          break
        }
      }
    }

    const hand = handOfRound(r2, ix)
    let played = false

    for (let i = 0; i < hand.length; i++) {
      if (roundCanPlay(i, r2)) {
        const card = hand[i]
        if (card.type === 'WILD' || card.type === 'WILD_DRAW') {
          const color = chooseWildColor(s2, r2, ix)
          dispatch(
            setMessage({
              title: 'Bot plays',
              message: `Bot ${opts?.players[ix]} plays ${card.type} and chooses ${color}`,
            }),
          )
          dispatch(playCard({ cardIx: i, askedColor: color }))
        } else {
          dispatch(playCard({ cardIx: i }))
        }
        played = true
        break
      }
    }

    if (!played) {
      dispatch(draw())
    }

    // maybe say UNO
    s2 = (getState() as RootState).unoGame
    g2 = s2.game as Game | null
    r2 = g2?.currentRound as Round | undefined
    if (!g2 || !r2 || g2.winner !== undefined) return true

    const handAfter = handOfRound(r2, ix)
    if (handAfter.length === 1 && Math.random() > 0.5) {
      dispatch(
        setMessage({
          title: 'Bot says UNO!',
          message: `Bot ${s2.opts?.players[ix]} says UNO!`,
        }),
      )
      dispatch(sayUno(ix))
    }

    return true
  },
)

const unoGameSlice = createSlice({
  name: 'unoGame',
  initialState,
  reducers: {
    init(state, action: PayloadAction<Opts>) {
      const opts = action.payload
      state.opts = opts
      state.game = createGame({
        players: opts.players,
        targetScore: opts.targetScore,
        cardsPerPlayer: opts.cardsPerPlayer,
      }) as any
      state.showPopUpMessage = false
      state.popUpMessage = null
      state.popUpTitle = null
    },
    reset(state) {
      const opts = state.opts
      if (!opts) return
      state.game = createGame({
        players: opts.players,
        targetScore: opts.targetScore,
        cardsPerPlayer: opts.cardsPerPlayer,
      }) as any
      state.showPopUpMessage = false
      state.popUpMessage = null
      state.popUpTitle = null
    },

    setMessage(state, action: PayloadAction<{ title: string; message: string }>) {
      state.popUpTitle = action.payload.title
      state.popUpMessage = action.payload.message
      state.showPopUpMessage = true
    },
    clearMessage(state) {
      state.showPopUpMessage = false
      state.popUpMessage = null
      state.popUpTitle = null
    },
    playCard(state, action: PayloadAction<{ cardIx: number; askedColor?: Color }>) {
      if (!state.game || !state.game.currentRound) return
      const { cardIx, askedColor } = action.payload
      const step = (r: Round) => roundPlay(cardIx, askedColor, r)
      state.game = gamePlay(step, state.game as Game) as any
    },

    draw(state) {
      if (!state.game || !state.game.currentRound) return
      const step = (r: Round) => roundDraw(r)
      state.game = gamePlay(step, state.game as Game) as any
    },

    sayUno(state, action: PayloadAction<number>) {
      if (!state.game || !state.game.currentRound) return
      const playerIx = action.payload
      const step = (r: Round) => roundSayUno(playerIx, r)
      state.game = gamePlay(step, state.game as Game) as any
    },

    accuse(state, action: PayloadAction<{ accuser: number; accused: number }>) {
      if (!state.game || !state.game.currentRound) return
      const { accuser, accused } = action.payload
      const step = (r: Round) => catchUnoFailure({ accuser, accused }, r)
      state.game = gamePlay(step, state.game as Game) as any
    },
  },
})

export const { init, reset, setMessage, clearMessage, playCard, draw, sayUno, accuse } =
  unoGameSlice.actions

export const selectUnoGame = (state: RootState) => state.unoGame

export default unoGameSlice.reducer
