import { from } from 'rxjs'
import { map, filter } from 'rxjs/operators'
import { apollo } from '../apollo'
import { serverGameActions } from '../slices/serverGameSlice'
import { SUB_EVENTS } from '../graphql/ops'
import type { AppDispatch, RootState } from '../stores/store'
import type { GameEvent } from '@uno/domain'

type GameEventsResponse = {
  gameEvents: GameEvent
}

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
    filter((event): event is GameEvent => !!event),
    map(event => {
      switch(event.__typename) {
        case 'GameEnded':
          return serverGameActions.handleGameEnded(event)
        case 'PlayerJoined':
           return serverGameActions.setMessage({ 
             title: 'New Player', 
             message: `${event.player} joined!` 
           })
        case 'UnoSaid':
           return serverGameActions.setMessage({ 
             title: 'UNO!', 
             message: `Player ${event.playerIndex} yelled UNO!` 
           })
        default:
          return null
      }
    }),
    filter(action => action !== null)
  ).subscribe({
    next: (action) => { if(action) dispatch(action) },
    error: (err) => console.error('Game Events Error:', err)
  })

  return subscription
}