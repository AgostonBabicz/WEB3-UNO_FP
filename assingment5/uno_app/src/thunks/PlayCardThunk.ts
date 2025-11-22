import * as api from '../api/api'
import { serverGameActions } from '../slices/serverGameSlice'
import type { AppDispatch, RootState } from '../stores/store'
import type { PlayCardArgs } from '@uno/domain'
import RefreshHand from './RefreshHandThunk'



const playCard = ({ cardIndex, askedColor }: PlayCardArgs) => async (dispatch: AppDispatch, getState: () => RootState) => {
  const state = getState()
  const { gameId, meIndex } = state.serverGame
  const { id: userId } = state.auth

  if (!gameId || meIndex === null || !userId) throw new Error("Invalid State")

  try {
    const game = await api.playCard({
      gameId,
      playerIndex: meIndex,
      cardIndex,
      askedColor,
      userId
    })

    dispatch(serverGameActions.setGame(game))
    await dispatch(RefreshHand())
    
    return game
  } catch (e) {
    console.error("Play Card Error", e)
    throw e
  }
}

export default playCard