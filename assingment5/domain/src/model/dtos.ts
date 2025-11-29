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

export type GameEventsResponse = {
  gameEvents: GraphQlGameEvent 
}

export type GameUpdatesResponse = {
  gameUpdates: GraphQlGame
}

export type JoinLobbyPayload = { 
  id: string
  myName: string 
}

export type CreateLobbyOpts = {
  meName: string
  targetScore?: number
  cardsPerPlayer?: number
}

export type LoginCreds = { username: string; password: string }

export type PlayCardArgs = {
  cardIndex: number
  askedColor?: Color
}

export type RefreshHandData = {
  myHand: Card[]
  playable: number[]
}

export type RegisterCreds = { username: string; password: string }

// game events
export interface GraphQlNotice {
  __typename: 'Notice'
  gameId: string
  title: string
  message: string
  at: string
}

export interface GraphQlPlayerJoined { __typename: 'PlayerJoined'; playerIndex: number; player: GraphQlPlayer }
export interface GraphQlGameStarted { __typename: 'GameStarted'; game: GraphQlGame }
export interface GraphQlTurnChanged { __typename: 'TurnChanged'; playerInTurnIndex: number }
export interface GraphQlCardPlayed { __typename: 'CardPlayed'; playerIndex: number; card: GraphQlCard; askedColor?: string | null }
export interface GraphQlCardDrawn { __typename: 'CardDrawn'; playerIndex: number; drew: number }
export interface GraphQlUnoSaid { __typename: 'UnoSaid'; playerIndex: number }
export interface GraphQlUnoAccusationResult { __typename: 'UnoAccusationResult'; accuserIndex: number; accusedIndex: number; success: boolean }
export interface GraphQlRoundEnded { __typename: 'RoundEnded'; winnerIndex: number; pointsAwarded: number; scores: number[] }
export interface GraphQlGameEnded { __typename: 'GameEnded'; winnerIndex: number; scores: number[] }
export interface GraphQlGameUpdated { __typename: 'GameUpdated'; game: GraphQlGame }

export type GraphQlGameEvent =
  | GraphQlPlayerJoined
  | GraphQlGameStarted
  | GraphQlTurnChanged
  | GraphQlCardPlayed
  | GraphQlCardDrawn
  | GraphQlUnoSaid
  | GraphQlUnoAccusationResult
  | GraphQlRoundEnded
  | GraphQlGameEnded
  | GraphQlGameUpdated
  | GraphQlNotice