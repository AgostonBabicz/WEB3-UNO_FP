import * as api from '../api/api'
import { serverGameActions } from '../slices/serverGameSlice'
import type { AppDispatch, RootState } from '../stores/store'
import RefreshHand from './RefreshHandThunk'

const startRound = () => async (dispatch: AppDispatch, getState: () => RootState) => {
  const state = getState()
  const { gameId } = state.serverGame
  const { id: userId } = state.auth

  if (!gameId || !userId) throw new Error("Missing Game ID or User ID")

  try {
    const game = await api.startRound(gameId, userId)
    
    dispatch(serverGameActions.setGame(game))
    // Immediately fetch new cards
    await dispatch(RefreshHand())
    
    return game
  } catch (e) {
    console.error("Start Round Error", e)
    throw e
  }
}

export default startRound