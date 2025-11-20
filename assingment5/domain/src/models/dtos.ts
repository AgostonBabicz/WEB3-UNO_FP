import { Card, CardType, Color } from "./deck"

export interface GraphQlCard {
  type: CardType
  color?: Color
  number?: number | string
}

export interface GraphQlPlayer {
  id: string
  name: string
  handCount: number
  score: number
  saidUno: boolean
}

export interface GraphQlRound {
  playerInTurnIndex?: number
  discardTop?: GraphQlCard
  drawPileSize: number
  currentColor?: Color
  direction?: 'CLOCKWISE' | 'COUNTER_CLOCKWISE' | number
  hasEnded: boolean
}

export interface GraphQlGame {
  id: string
  createdAt: string
  targetScore: number
  cardsPerPlayer: number
  players: GraphQlPlayer[] // Mutable array
  currentRound?: GraphQlRound | null
  winnerIndex?: number | null
}

// Wrapper types for Queries/Mutations
export interface CreateGameData {
  createGame: { game: GraphQlGame }
}

export interface GetGameData {
  game: GraphQlGame
}

export interface WaitingGamesData {
  waitingGames: GraphQlGame[]
}

export interface StartRoundData {
  startRound: GraphQlGame
}

export interface StandardMutationData {
  playCard?: GraphQlGame
  drawCard?: GraphQlGame
  sayUno?: GraphQlGame
  accuseUno?: GraphQlGame
  addPlayer?: GraphQlGame
}

export interface HandData {
    hand: GraphQlCard[]
}

export interface PlayableData {
    playableIndexes: number[]
}

export type AuthUser = {
  id: string
  username: string
}
export interface AuthResponse {
  id: string
  username: string
}
export interface LoginData {
  login: AuthResponse
}

export interface RegisterData {
  createUser: AuthResponse
}

export type HandUpdatePayload = {
  myHand: Card[]
  playable: number[]
}