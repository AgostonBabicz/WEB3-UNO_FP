import * as api from '../api/api'
import { serverGameActions } from '../slices/serverGameSlice'
import type { AppDispatch, RootState } from '../stores/store'
import type { RefreshHandData } from '@uno/domain'



const refreshMyHand = () => async (
  dispatch: AppDispatch, 
  getState: () => RootState
): Promise<RefreshHandData | null> => {
  
  const { gameId, meIndex } = getState().serverGame
  
  if (!gameId || meIndex === null) return null

  try {
    const [hand, playable] = await Promise.all([
      api.getHand(gameId, meIndex),
      api.getPlayable(gameId, meIndex)
    ])

    const payload = { myHand: hand, playable }
    dispatch(serverGameActions.setHand(payload))
    return payload

  } catch (e) {
    console.error("Failed to refresh hand", e)
    return null
  }
}

export default refreshMyHand