import { UUID } from './common'
import { Card, Color } from './deck'
import { Game } from './uno'

// Events (union members)
export type PlayerJoined = { gameId: UUID; playerIndex: number; player: string } // simplified player to string name
export type GameStarted = { gameId: UUID; game: Game }
export type TurnChanged = { gameId: UUID; playerInTurnIndex: number }
export type CardPlayedEvt = {
  gameId: UUID
  playerIndex: number
  card: Card
  askedColor?: Color | null
}
export type CardDrawnEvt = { gameId: UUID; playerIndex: number; drew: number }
export type UnoSaidEvt = { gameId: UUID; playerIndex: number }
export type UnoAccusationResultEvt = {
  gameId: UUID
  accuserIndex: number
  accusedIndex: number
  success: boolean
}
export type RoundEndedEvt = {
  gameId: UUID
  winnerIndex: number
  pointsAwarded: number
  scores: number[]
}
export type GameEndedEvt = { gameId: UUID; winnerIndex: number; scores: number[] }
export type GameUpdatedEvt = { game: Game }

export type GameEvent =
  | ({ __typename: 'PlayerJoined' } & PlayerJoined)
  | ({ __typename: 'GameStarted' } & GameStarted)
  | ({ __typename: 'TurnChanged' } & TurnChanged)
  | ({ __typename: 'CardPlayed' } & CardPlayedEvt)
  | ({ __typename: 'CardDrawn' } & CardDrawnEvt)
  | ({ __typename: 'UnoSaid' } & UnoSaidEvt)
  | ({ __typename: 'UnoAccusationResult' } & UnoAccusationResultEvt)
  | ({ __typename: 'RoundEnded' } & RoundEndedEvt)
  | ({ __typename: 'GameEnded' } & GameEndedEvt)
  | ({ __typename: 'GameUpdated' } & GameUpdatedEvt)