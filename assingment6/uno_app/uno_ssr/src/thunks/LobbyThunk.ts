import { serverGameActions } from '../slices/serverGameSlice'
import type { AppDispatch, RootState } from '../stores/store'
import * as api from '../api/api'

type CreateLobbyOpts = {
  meName: string
  targetScore?: number
  cardsPerPlayer?: number
}

const createLobby = (opts: CreateLobbyOpts) => async (dispatch: AppDispatch, getState: () => RootState) => {
  try {
    const userId = getState().auth.id
    if (!userId) throw new Error("Not authenticated")

    const game = await api.createGame({
      players: [opts.meName],
      targetScore: opts.targetScore ?? 500,
      cardsPerPlayer: opts.cardsPerPlayer ?? 7,
      userId,
    })

    if (!game) throw new Error('createGame failed')

    dispatch(serverGameActions.setGameId({ 
      gameId: game.id, 
      meIndex: 0 
    }))
    
    dispatch(serverGameActions.setGame(game))

    return { gameId: game.id }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to create lobby'
    console.error("Create Lobby Error with message: ", message)
    throw e
  }
}

export default createLobby