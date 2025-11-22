import * as api from '../api/api'
import { serverGameActions } from '../slices/serverGameSlice'
import type { AppDispatch, RootState } from '../stores/store'
import RefreshHand from './RefreshHandThunk'

const drawCard = () => async (dispatch: AppDispatch, getState: () => RootState) => {
  const state = getState()
  const { gameId, meIndex } = state.serverGame
  const { id: userId } = state.auth

  if (!gameId || meIndex === null || !userId) throw new Error("Invalid State")

  try {
    const game = await api.drawCard({
      gameId,
      playerIndex: meIndex,
      userId
    })

    dispatch(serverGameActions.setGame(game))
    await dispatch(RefreshHand()) 
    
    return game
  } catch (e) {
    console.error("Draw Card Error", e)
    throw e
  }
}

export default drawCard