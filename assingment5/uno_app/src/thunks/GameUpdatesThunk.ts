import { from } from 'rxjs'
import { map, filter, tap } from 'rxjs/operators'
import { apollo } from '../apollo'
import { serverGameActions } from '../slices/serverGameSlice'
import { SUB_UPDATES } from '../graphql/ops'
import type { AppDispatch, RootState } from '../stores/store'
import refreshMyHand from './RefreshHandThunk'
import { GraphQlGame, parseGame } from '@uno/domain'

type GameUpdatesResponse = {
  gameUpdates: GraphQlGame
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
    filter((game): game is GraphQlGame => !!game),
    map(rawGame => parseGame(rawGame)),
    
    tap(domainGame => {
      dispatch(serverGameActions.setGame(domainGame))
      dispatch(refreshMyHand())
    })
  ).subscribe({
    error: (err) => console.error('Game Updates Error:', err)
  })

  return subscription
}

function from_graphql_game(rawGame: GraphQlGame): any {
  throw new Error('Function not implemented.')
}
