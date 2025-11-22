import { from } from 'rxjs'
import { map, filter } from 'rxjs/operators'
import { apollo } from '../apollo'
import { serverGameActions } from '../slices/serverGameSlice'
import { SUB_EVENTS } from '../graphql/ops'
import type { AppDispatch, RootState } from '../stores/store'
import * as api from '../api/api'
import { GameEventsResponse, GraphQlGameEvent } from '../../../domain/src/index'

export const subscribeToGameEvents = (
  dispatch: AppDispatch, 
  getState: () => RootState
) => {
  const gameId = getState().serverGame.gameId
  if (!gameId) return

  const source$ = from(apollo.subscribe<GameEventsResponse>({ 
    query: SUB_EVENTS, 
    variables: { gameId } 
  }))

  const subscription = source$.pipe(
    map(result => result.data?.gameEvents),
    filter((event): event is GraphQlGameEvent => !!event)
  ).subscribe({
    next: async (event) => {
      try {
        switch(event.__typename) {
            case 'Notice':
                 dispatch(serverGameActions.setMessage({
                     title: event.title,
                     message: event.message
                 }))
                 break

            case 'PlayerJoined':
                dispatch(serverGameActions.setMessage({ 
                    title: 'New Player', 
                    message: `${event.player.name} joined!`
                }))
                const updatedGame = await api.getGame(gameId)
                dispatch(serverGameActions.setGame(updatedGame))
                break

            case 'GameStarted':
                dispatch(serverGameActions.setMessage({ 
                    title: 'Game Started!', 
                    message: 'Let the games begin.' 
                }))
                if (!event.game) {
                    const g = await api.getGame(gameId)
                    dispatch(serverGameActions.setGame(g))
                } else {
                    dispatch(serverGameActions.setGame(event.game as any))
                }
                break

            case 'GameEnded':
                dispatch(serverGameActions.handleGameEnded(event))
                break

            case 'UnoSaid':
               dispatch(serverGameActions.setMessage({ 
                 title: 'UNO!', 
                 message: `Player ${event.playerIndex} yelled UNO!` 
               }))
               break
        }
      } catch (e) {
        console.error("Error handling event side-effect:", e)
      }
    },
    error: (err) => console.error('Game Events Error:', err)
  })

  return subscription
}