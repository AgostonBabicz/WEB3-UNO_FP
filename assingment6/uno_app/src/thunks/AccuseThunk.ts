import * as api from '../api/api'
import { serverGameActions } from '../slices/serverGameSlice'
import type { AppDispatch, RootState } from '../stores/store'

const accuse = (accusedIndex: number) => async (dispatch: AppDispatch, getState: () => RootState) => {
  const state = getState()
  const { gameId, meIndex } = state.serverGame
  const { id: userId } = state.auth

  if (!gameId || meIndex === null || !userId) throw new Error("Invalid State")

  try {
    const game = await api.accuseUno({
      gameId,
      accuserIndex: meIndex,
      accusedIndex,
      userId
    })

    dispatch(serverGameActions.setGame(game))
    return game
  } catch (e) {
    console.error("Accuse Error", e)
    throw e
  }
}

export default accuse