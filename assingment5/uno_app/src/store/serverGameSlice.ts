import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { apollo } from '../apollo'
import {
  CREATE_GAME,
  GET_GAME,
  ADD_PLAYER,
  START_ROUND,
  HAND,
  PLAYABLE,
  PLAY_CARD,
  DRAW_CARD,
  SAY_UNO,
  ACCUSE_UNO,
  SUB_UPDATES,
  SUB_EVENTS,
  WAITING_GAMES,
} from '../graphql/ops'
import type { RootState } from './store'
import { selectAuth } from './authSlice'
import { Color } from '../types/deck.types'

type GameState = any

type ServerGameState = {
  gameId: string | null
  meIndex: number | null
  game: GameState | null
  myHand: any[]
  playable: number[]
  waitingGames: any[]
  // pop up message
  showPopUpMessage: boolean
  popUpMessage: string | null
  popUpTitle: string | null
  // game over
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

// Non serializable Apollo subscriptions kept here
let updatesSub: { unsubscribe: () => void } | null = null
let eventsSub: { unsubscribe: () => void } | null = null

type CreateLobbyOpts = {
  meName: string
  targetScore?: number
  cardsPerPlayer?: number
}

export const createLobby = createAsyncThunk(
  'serverGame/createLobby',
  async (opts: CreateLobbyOpts, { getState, rejectWithValue }) => {
    try {
      const auth = selectAuth(getState() as RootState)
      const { data } = await apollo.mutate<{createGame: any}>({
        mutation: CREATE_GAME,
        variables: {
          input: {
            players: [opts.meName],
            targetScore: opts.targetScore ?? 500,
            cardsPerPlayer: opts.cardsPerPlayer ?? 7,
            userId: auth.id,
          },
        },
      })
      const g = data?.createGame?.game
      if (!g) throw new Error('createGame failed')
      return {
        gameId: g.id as string,
        meIndex: 0,
        game: g,
      }
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Create lobby failed')
    }
  }
)

export const joinLobby = createAsyncThunk(
  'serverGame/joinLobby',
  async (payload: { id: string; myName: string }, { getState, rejectWithValue }) => {
    try {
      const auth = selectAuth(getState() as RootState)

      const { data: q } = await apollo.query<{game:any}>({
        query: GET_GAME,
        variables: { gameId: payload.id },
        fetchPolicy: 'no-cache',
      })
      if (!q?.game) throw new Error('Game not found')

      const currentPlayers = q.game.players.length
      if (currentPlayers >= 4) throw new Error('Lobby full')

      const { data } = await apollo.mutate<{addPlayer:any}>({
        mutation: ADD_PLAYER,
        variables: { gameId: payload.id, name: payload.myName, userId: auth.id },
      })
      const g = data?.addPlayer
      if (!g) throw new Error('addPlayer failed')

      return {
        gameId: g.id as string,
        meIndex: currentPlayers,
        game: g,
      }
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Join lobby failed')
    }
  }
)

export const loadWaitingGames = createAsyncThunk(
  'serverGame/loadWaitingGames',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apollo.query<{waitingGames:any}>({ query: WAITING_GAMES, fetchPolicy: 'no-cache' })
      return (data?.waitingGames ?? []) as any[]
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Failed to load lobbies')
    }
  }
)

export const startRound = createAsyncThunk(
  'serverGame/startRound',
  async (_, { getState, rejectWithValue, dispatch }) => {
    try {
      const state = getState() as RootState
      const serverGame = state.serverGame
      const auth = selectAuth(state)

      if (!serverGame.gameId) return null

      const { data: gq } = await apollo.query<{game:any}>({
        query: GET_GAME,
        variables: { gameId: serverGame.gameId },
        fetchPolicy: 'no-cache',
      })
      const existingGame = gq?.game

      const { data } = await apollo.mutate<{startRound:any}>({
        mutation: START_ROUND,
        variables: { input: { gameId: serverGame.gameId, userId: auth.id } },
      })


      const updatedGame = data?.startRound ?? existingGame
      if (!updatedGame) return null

      // after round start, refresh hand
      await dispatch(refreshMyHand()).unwrap()
      return updatedGame
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'startRound failed')
    }
  }
)

export const refreshMyHand = createAsyncThunk(
  'serverGame/refreshMyHand',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState
      const { gameId, meIndex } = state.serverGame
      if (gameId == null || meIndex == null) return null

      const [h, p] = await Promise.all<{data:any}>([
        apollo.query({
          query: HAND,
          variables: { gameId, playerIndex: meIndex },
          fetchPolicy: 'no-cache',
        }),
        apollo.query<{data:any}>({
          query: PLAYABLE,
          variables: { gameId, playerIndex: meIndex },
          fetchPolicy: 'no-cache',
        }),
      ])

      return {
        myHand: h.data?.hand ?? [],
        playable: p.data?.playableIndexes ?? [],
      }
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'refreshMyHand failed')
    }
  }
)

export const playCard = createAsyncThunk(
  'serverGame/playCard',
  async ({ cardIndex, askedColor }: { cardIndex: number; askedColor?: Color }, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as RootState
      const { gameId, meIndex } = state.serverGame
      const auth = selectAuth(state)
      if (!gameId || meIndex == null) return null

      await apollo.mutate({
        mutation: PLAY_CARD,
        variables: {
          input: {
            gameId,
            playerIndex: meIndex,
            cardIndex,
            askedColor,
            userId: auth.id,
          },
        },
      })

      await dispatch(refreshMyHand()).unwrap()
      return null
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'playCard failed')
    }
  }
)

export const drawCard = createAsyncThunk(
  'serverGame/drawCard',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as RootState
      const { gameId, meIndex } = state.serverGame
      const auth = selectAuth(state)
      if (!gameId || meIndex == null) return null

      await apollo.mutate({
        mutation: DRAW_CARD,
        variables: {
          input: {
            gameId,
            playerIndex: meIndex,
            userId: auth.id,
          },
        },
      })

      await dispatch(refreshMyHand()).unwrap()
      return null
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'drawCard failed')
    }
  }
)

export const sayUno = createAsyncThunk(
  'serverGame/sayUno',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState
      const { gameId, meIndex } = state.serverGame
      const auth = selectAuth(state)
      if (!gameId || meIndex == null) return null

      await apollo.mutate({
        mutation: SAY_UNO,
        variables: {
          input: {
            gameId,
            playerIndex: meIndex,
            userId: auth.id,
          },
        },
      })

      return null
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'sayUno failed')
    }
  }
)

export const accuse = createAsyncThunk(
  'serverGame/accuse',
  async (accusedIndex: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState
      const { gameId, meIndex } = state.serverGame
      const auth = selectAuth(state)
      if (!gameId || meIndex == null) return null

      await apollo.mutate({
        mutation: ACCUSE_UNO,
        variables: {
          input: {
            gameId,
            accuserIndex: meIndex,
            accusedIndex,
            userId: auth.id,
          },
        },
      })

      return null
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'accuse failed')
    }
  }
)

// Subscription helper: updates + events
export const subscribeAll = createAsyncThunk(
  'serverGame/subscribeAll',
  async (_, { getState, dispatch }) => {
    const state = getState() as RootState
    const { gameId } = state.serverGame
    if (!gameId) return

    updatesSub?.unsubscribe()
    eventsSub?.unsubscribe()

    updatesSub = apollo
      .subscribe({ query: SUB_UPDATES, variables: { gameId } })
      .subscribe({
        next: async ({ data }: any) => {
          const g = data?.gameUpdates
          if (g) {
            dispatch(serverGameSlice.actions.setGame(g))
            dispatch(serverGameSlice.actions.checkGameOverFromGame(g))
            await dispatch(refreshMyHand())
          }
        },
        error: () => {},
      })

    eventsSub = apollo
      .subscribe({ query: SUB_EVENTS, variables: { gameId } })
      .subscribe({
        next: ({ data }: any) => {
          const ev = data?.gameEvents
          if (!ev) return
          if (ev.__typename === 'GameEnded') {
            dispatch(serverGameSlice.actions.handleGameEnded(ev))
          }
          if (ev.__typename === 'Notice') {
            dispatch(
              serverGameSlice.actions.setMessage({
                title: ev.title,
                message: ev.message,
              })
            )
          }
        },
        error: () => {},
      })
  }
)

const serverGameSlice = createSlice({
  name: 'serverGame',
  initialState,
  reducers: {
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
    setGame(state, action: PayloadAction<GameState>) {
      state.game = action.payload
    },
    checkGameOverFromGame(state, action: PayloadAction<GameState>) {
      const g = action.payload
      const winnerIx = g?.winnerIndex
      if (winnerIx == null || state.gameOverTriggered) return
      const winnerName = g.players?.[winnerIx]?.name ?? 'Unknown'
      state.gameOverWinnerName = winnerName
      state.gameOverTriggered = true
    },
    handleGameEnded(state, action: PayloadAction<any>) {
      if (state.gameOverTriggered) return
      const ev = action.payload
      const winnerIx = ev.winnerIndex
      const winnerName = state.game?.players?.[winnerIx]?.name ?? 'Unknown'
      state.gameOverWinnerName = winnerName
      state.gameOverTriggered = true
    },
    resetGameOver(state) {
      state.gameOverWinnerName = null
      state.gameOverTriggered = false
    },
  },
  extraReducers: builder => {
    builder
      .addCase(createLobby.fulfilled, (state, action) => {
        if (!action.payload) return
        state.gameId = action.payload.gameId
        state.meIndex = action.payload.meIndex
        state.game = action.payload.game
        state.gameOverTriggered = false
        state.gameOverWinnerName = null
      })
      .addCase(joinLobby.fulfilled, (state, action) => {
        if (!action.payload) return
        state.gameId = action.payload.gameId
        state.meIndex = action.payload.meIndex
        state.game = action.payload.game
        state.gameOverTriggered = false
        state.gameOverWinnerName = null
      })
      .addCase(loadWaitingGames.fulfilled, (state, action) => {
        state.waitingGames = action.payload ?? []
      })
      .addCase(loadWaitingGames.rejected, state => {
        state.waitingGames = []
      })
      .addCase(startRound.fulfilled, (state, action) => {
        if (action.payload) {
          state.game = action.payload
        }
      })
      .addCase(refreshMyHand.fulfilled, (state, action) => {
        if (!action.payload) return
        state.myHand = action.payload.myHand
        state.playable = action.payload.playable
      })
  },
})

export const {
  setMessage,
  clearMessage,
  setGame,
  checkGameOverFromGame,
  handleGameEnded,
  resetGameOver,
} = serverGameSlice.actions

export const selectServerGame = (state: RootState) => state.serverGame
export const selectServerGamePopUp = (state: RootState) => ({
  show: state.serverGame.showPopUpMessage,
  title: state.serverGame.popUpTitle,
  message: state.serverGame.popUpMessage,
})
export const selectWaitingGames = (state: RootState) => state.serverGame.waitingGames
export const selectServerGameId = (state: RootState) => state.serverGame.gameId
export const selectServerGameMyIndex = (state: RootState) => state.serverGame.meIndex
export const selectServerGameGame = (state: RootState) => state.serverGame.game
export const selectServerGameMyHand = (state: RootState) => state.serverGame.myHand
export const selectServerGamePlayable = (state: RootState) => state.serverGame.playable
export const selectServerGameGameOver = (state: RootState) => ({
  winner: state.serverGame.gameOverWinnerName,
  triggered: state.serverGame.gameOverTriggered,
})

export default serverGameSlice.reducer
