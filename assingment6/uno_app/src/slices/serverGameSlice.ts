import { createSlice, PayloadAction, Draft } from '@reduxjs/toolkit'
import type { RootState } from '../stores/store'
import type { Card, Game } from '@uno/domain' 

type ServerGameState = {
  gameId: string | null
  meIndex: number | null
  game: Game | null
  myHand: Card[] 
  playable: number[]
  waitingGames: any[]
  showPopUpMessage: boolean
  popUpMessage: string | null
  popUpTitle: string | null
  gameOverWinnerName: string | null
  gameOverTriggered: boolean
}

const initialState: ServerGameState = {
  gameId: null,
  meIndex: null,
  game: null,
  myHand: [],
  playable: [],
  waitingGames: [],
  showPopUpMessage: false,
  popUpMessage: null,
  popUpTitle: null,
  gameOverWinnerName: null,
  gameOverTriggered: false,
}

export const serverGameSlice = createSlice({
  name: 'serverGame',
  initialState,
  reducers: {
    // Plain state setters
    setGameId(state, action: PayloadAction<{ gameId: string, meIndex: number }>) {
      state.gameId = action.payload.gameId
      state.meIndex = action.payload.meIndex
    },
    setGame(state, action: PayloadAction<Game>) {
      state.game = action.payload as Draft<Game>
    },
    setHand(state, action: PayloadAction<{ myHand: Card[]; playable: number[] }>) {
      state.myHand = action.payload.myHand as any 
      state.playable = action.payload.playable
    },
    
    setWaitingGames(state, action: PayloadAction<any[]>) {
      state.waitingGames = action.payload
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
    handleGameEnded(state, action: PayloadAction<{ winnerIndex: number }>) {
       if (state.gameOverTriggered) return
       const winnerIx = action.payload.winnerIndex
       // Safe navigation in case players array isn't fully loaded
       const winnerName = state.game?.players?.[winnerIx] ?? 'Unknown'
       state.gameOverWinnerName = winnerName
       state.gameOverTriggered = true
    },
    resetGameOver(state) {
      state.gameOverWinnerName = null
      state.gameOverTriggered = false
    },
  },
})

export const serverGameActions = serverGameSlice.actions
export default serverGameSlice.reducer
export const selectServerGame = (state: RootState) => state.serverGame
export const selectServerGamePopUp = (state: RootState) => ({
  show: state.serverGame.showPopUpMessage,
  title: state.serverGame.popUpTitle,
  message: state.serverGame.popUpMessage,
})
export const selectWaitingGames = (state: RootState) => state.serverGame.waitingGames
export const selectServerGameMyIndex = (state: RootState) => state.serverGame.meIndex
export const selectServerGameGame = (state: RootState) => state.serverGame.game
export const selectServerGameMyHand = (state: RootState) => state.serverGame.myHand
export const selectServerGamePlayable = (state: RootState) => state.serverGame.playable
export const selectServerGameGameOver = (state: RootState) => ({
  winner: state.serverGame.gameOverWinnerName,
  triggered: state.serverGame.gameOverTriggered,
})
export const selectServerGameId = (state: RootState) => state.serverGame.gameId