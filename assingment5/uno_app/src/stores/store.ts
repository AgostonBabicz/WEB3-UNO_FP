import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../slices/authSlice'
import serverGameReducer from '../slices/serverGameSlice'
import unoGameReducer from '../slices/unoGameSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    serverGame: serverGameReducer,
    unoGame: unoGameReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 1. Ignore specific Action Types (The Fix for the Array Error)
        ignoredActions: [
          'serverGame/setWaitingGames', 
        ],

        // 2. Ignore paths in the State
        ignoredPaths: [
          // Functions
          'unoGame.game.randomizer',
          'unoGame.game.shuffler',
          'serverGame.game.randomizer',
          'serverGame.game.shuffler',
          'serverGame.game.currentRound.shuffler',
          'unoGame.game.currentRound.shuffler',
          
          // Arrays of Games (The Fix for the State Error)
          'serverGame.waitingGames',

          // Immutable.js Structures
          'serverGame.game.currentRound.discardDeck',
          'serverGame.game.currentRound.drawDeck',
          'serverGame.game.currentRound.playerHands',
          'serverGame.myHand',
          'unoGame.game.currentRound.discardDeck',
          'unoGame.game.currentRound.drawDeck',
          'unoGame.game.currentRound.playerHands',

          // Sets
          'serverGame.game.currentRound.unoSayersSinceLastAction',
          'unoGame.game.currentRound.unoSayersSinceLastAction',
        ],
        
        // 3. Ignore paths in other Actions (for single objects)
        ignoredActionPaths: [
          'payload.randomizer',
          'payload.shuffler',
          'payload.currentRound.shuffler',
          'payload.currentRound.discardDeck',
          'payload.currentRound.drawDeck',
          'payload.currentRound.playerHands',
          'payload.currentRound.unoSayersSinceLastAction',
          'payload.myHand',
          // Safety catches for nested updates
          'payload.game.currentRound.discardDeck',
          'payload.game.currentRound.drawDeck',
          'payload.game.currentRound.playerHands',
          'payload.game.currentRound.shuffler',
        ],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch