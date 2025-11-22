import { serverGameActions } from '../slices/serverGameSlice'
import type { AppDispatch, RootState } from '../stores/store'
import * as api from '../api/api'
import { CreateLobbyOpts } from '@uno/domain'

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
  } catch (e: any) {
    console.error("Create Lobby Error", e)
    throw e
  }
}

export default createLobby