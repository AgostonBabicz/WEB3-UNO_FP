'use client'
import { useEffect, useRef } from 'react'
import { Provider } from 'react-redux'
import { store } from '@/src/stores/store'
import { authActions } from '@/src/slices/authSlice'
import { serverGameActions } from '@/src/slices/serverGameSlice'
import { subscribeToGameUpdates } from '@/src/thunks/GameUpdatesThunk'
import { subscribeToGameEvents } from '@/src/thunks/GameEventsThunk'
import { AuthUser, GraphQlGame, parseGame } from '@uno/domain'

type Props = {
  children: React.ReactNode
  user?: AuthUser
  waitingGames?: GraphQlGame[]
  activeGame?: GraphQlGame
}
export default function ReduxHydrator({ 
  children, 
  user, 
  waitingGames,
  activeGame 
}: Props) {
  const initialized = useRef<boolean | null>(null)

  if (initialized.current === null) {
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
      const meIndex = activeGame.players.findIndex((p: string) => p === user?.username)
      store.dispatch(serverGameActions.setGameId({ 
          gameId: activeGame.id, 
          meIndex: meIndex !== -1 ? meIndex : 0 
      }))
    }
    initialized.current = true
  }

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
  }, [])

  return (
    <Provider store={store}>
      {children}
    </Provider>
  )
}