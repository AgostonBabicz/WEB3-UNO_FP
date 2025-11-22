import * as api from '../api/api'
import { serverGameActions } from '../slices/serverGameSlice'
import type { AppDispatch, RootState } from '../stores/store'

type JoinLobbyPayload = { 
  id: string
  myName: string 
}

const joinLobby = ({ id: gameId, myName }: JoinLobbyPayload) => async (dispatch: AppDispatch, getState: () => RootState) => {
  try {
    const auth = getState().auth
    if (!auth.id) throw new Error("Not authenticated")
    const existingGame = await api.getGameDTO(gameId)
    
    if (existingGame.players.length >= 4) {
      throw new Error('Lobby full')
    }
    const updatedGame = await api.addPlayer(gameId, myName, auth.id)
    const meIndex = updatedGame.players.indexOf(myName)
    if (meIndex === -1) throw new Error("Joined but couldn't find self in player list")

    dispatch(serverGameActions.setGameId({ 
      gameId: updatedGame.id, 
      meIndex 
    }))
    dispatch(serverGameActions.setGame(updatedGame))

    return { 
      gameId: updatedGame.id, 
      meIndex, 
      game: updatedGame 
    }

  } catch (e) {
    console.error("Join lobby failed", e)
    throw e
  }
}

export default joinLobby