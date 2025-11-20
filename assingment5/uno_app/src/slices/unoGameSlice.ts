import { createSlice, PayloadAction, Draft } from '@reduxjs/toolkit'
import type { RootState } from '../stores/store'
import { createGame, gamePlay } from '@uno/domain'
import {
  roundDraw,
  roundPlay,
  catchUnoFailure,
  roundSayUno as domainSayUno // Alias to avoid conflict if needed
} from '@uno/domain'
import type { Game, Round, Color } from '@uno/domain'

type Opts = {
  players: string[]
  targetScore?: number
  cardsPerPlayer?: number
}

type UnoGameState = {
  opts: Opts | null
  game: Game | null
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
      }) as Draft<Game>
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
      }) as Draft<Game>
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
      state.game = gamePlay(step, state.game as Game) as Draft<Game>
    },

    draw(state) {
      if (!state.game || !state.game.currentRound) return
      const step = (r: Round) => roundDraw(r)
      state.game = gamePlay(step, state.game as Game) as Draft<Game>
    },

    sayUno(state, action: PayloadAction<number>) {
      if (!state.game || !state.game.currentRound) return
      const playerIx = action.payload
      const step = (r: Round) => domainSayUno(playerIx, r)
      state.game = gamePlay(step, state.game as Game) as Draft<Game>
    },

    accuse(state, action: PayloadAction<{ accuser: number; accused: number }>) {
      if (!state.game || !state.game.currentRound) return
      const { accuser, accused } = action.payload
      const step = (r: Round) => catchUnoFailure({ accuser, accused }, r)
      state.game = gamePlay(step, state.game as Game) as Draft<Game>
    },
  },
})

export const unoGameActions = unoGameSlice.actions
export const { init, reset, setMessage, clearMessage, playCard, draw, sayUno, accuse } = unoGameSlice.actions

export const selectUnoGame = (state: RootState) => state.unoGame

export default unoGameSlice.reducer