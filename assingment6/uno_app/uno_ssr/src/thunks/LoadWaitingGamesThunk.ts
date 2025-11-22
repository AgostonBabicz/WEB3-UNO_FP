import * as api from '../api/api'
import { serverGameActions } from '../slices/serverGameSlice'
import type { AppDispatch, RootState } from '../stores/store'

const loadWaitingGames = () => async (dispatch: AppDispatch, getState: () => RootState) => {
  try {
    console.log('Loading waiting games...')

    const games = await api.getWaitingGamesDTO()

    console.log('Loaded waiting games:', games)

    dispatch(serverGameActions.setWaitingGames(games))
    
    return games
  } catch (e) {
    console.error("Failed to load lobbies", e)
    dispatch(serverGameActions.setWaitingGames([]))
    throw e
  }
}

export default loadWaitingGames