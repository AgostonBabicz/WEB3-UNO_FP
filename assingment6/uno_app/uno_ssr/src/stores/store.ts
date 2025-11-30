import { enableMapSet } from 'immer'
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../slices/authSlice'
import serverGameReducer from '../slices/serverGameSlice'
import unoGameReducer from '../slices/unoGameSlice'

enableMapSet()

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      serverGame: serverGameReducer,
      unoGame: unoGameReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [
            'serverGame/setWaitingGames', 
          ],
          ignoredPaths: [
            'unoGame.game.randomizer',
            'unoGame.game.shuffler',
            'serverGame.game.randomizer',
            'serverGame.game.shuffler',
            'serverGame.game.currentRound.shuffler',
            'unoGame.game.currentRound.shuffler',
            'serverGame.waitingGames',
            'serverGame.game.currentRound.discardDeck',
            'serverGame.game.currentRound.drawDeck',
            'serverGame.game.currentRound.playerHands',
            'serverGame.myHand',
            'unoGame.game.currentRound.discardDeck',
            'unoGame.game.currentRound.drawDeck',
            'unoGame.game.currentRound.playerHands',
            'serverGame.game.currentRound.unoSayersSinceLastAction',
            'unoGame.game.currentRound.unoSayersSinceLastAction',
          ],
        
          ignoredActionPaths: [
            'payload.randomizer',
            'payload.shuffler',
            'payload.currentRound.shuffler',
            'payload.currentRound.discardDeck',
            'payload.currentRound.drawDeck',
            'payload.currentRound.playerHands',
            'payload.currentRound.unoSayersSinceLastAction',
            'payload.myHand',
            'payload.game.currentRound.discardDeck',
            'payload.game.currentRound.drawDeck',
            'payload.game.currentRound.playerHands',
            'payload.game.currentRound.shuffler',
          ],
        },
      }),
  });
};
export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']