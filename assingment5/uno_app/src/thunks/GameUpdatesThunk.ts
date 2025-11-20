import { from } from 'rxjs'
import { map, filter } from 'rxjs/operators'
import { apollo } from '../apollo'
import { serverGameActions } from '../slices/serverGameSlice'
import { SUB_UPDATES } from '../graphql/ops'
import type { AppDispatch, RootState } from '../stores/store'
import type { IndexedGame } from '@uno/domain'

type GameUpdatesResponse = {
  gameUpdates: IndexedGame
}

export const subscribeToGameUpdates = (
  dispatch: AppDispatch, 
  getState: () => RootState
) => {
  const gameId = getState().serverGame.gameId
  if (!gameId) return

  const source$ = from(apollo.subscribe<GameUpdatesResponse>({ 
    query: SUB_UPDATES, 
    variables: { gameId } 
  }))

  const subscription = source$.pipe(
    map(result => result.data?.gameUpdates),
    filter((game): game is IndexedGame => !!game),
    map(game => serverGameActions.setGame(game))
  ).subscribe({
    next: (action) => dispatch(action),
    error: (err) => console.error('Game Updates Error:', err)
  })

  return subscription
}