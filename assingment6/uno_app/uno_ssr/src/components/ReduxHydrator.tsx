'use client'
import { useEffect, useState } from 'react'
import { Provider } from 'react-redux'
import { AppStore, makeStore } from '@/src/stores/store'
import { authActions } from '@/src/slices/authSlice'
import { serverGameActions } from '@/src/slices/serverGameSlice'
import { subscribeToGameUpdates } from '@/src/thunks/GameUpdatesThunk'
import { subscribeToGameEvents } from '@/src/thunks/GameEventsThunk'
import { AuthUser, GraphQlGame, GraphQlPlayer, parseGame } from '@uno/domain'

type Props = {
  children: React.ReactNode
  user?: AuthUser
  waitingGames?: GraphQlGame[]
  activeGame?: GraphQlGame
}
const createHydratedStore = (
  user: AuthUser | undefined, 
  waitingGames: GraphQlGame[] | undefined, 
  activeGame: GraphQlGame | undefined
): AppStore => {
  
  const store = makeStore()
  
  if (user) {
    store.dispatch(authActions.authSuccess(user))
  }
  if (waitingGames) {
    const domainGames = waitingGames.map(g => parseGame(g))
    store.dispatch(serverGameActions.setWaitingGames(domainGames))
  }
  if (activeGame) {
    const domainGame = parseGame(activeGame)
    store.dispatch(serverGameActions.setGame(domainGame))
    const meIndex = activeGame.players.findIndex((p: GraphQlPlayer) => p.name === user?.username)
    store.dispatch(serverGameActions.setGameId({ 
        gameId: activeGame.id, 
        meIndex: meIndex !== -1 ? meIndex : 0 
    }))
  }
  
  return store
}
export default function ReduxHydrator({ 
  children, 
  user, 
  waitingGames,
  activeGame 
}: Props) {
  
  const [store] = useState(() => 
    createHydratedStore(user, waitingGames, activeGame)
  )

  useEffect(() => {
    let updatesSub: { unsubscribe: () => void } | undefined
    let eventsSub: { unsubscribe: () => void } | undefined

    const state = store.getState()
    if (state.serverGame.gameId) {
        updatesSub = store.dispatch(subscribeToGameUpdates)
        eventsSub = store.dispatch(subscribeToGameEvents)
    }

    return () => {
      if (updatesSub && 'unsubscribe' in updatesSub) updatesSub.unsubscribe()
      if (eventsSub && 'unsubscribe' in eventsSub) eventsSub.unsubscribe()
    }
  }, [store])

  return (
    <Provider store={store}>
      {children}
    </Provider>
  )
}