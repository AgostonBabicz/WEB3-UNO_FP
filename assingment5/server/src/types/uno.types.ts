import { Randomizer, Shuffler } from '../utils/random_utils'
import { Card } from './deck.types'
import { Round } from './round.types'

export type Game = Readonly<{
  readonly playerCount: number
  readonly targetScore: number
  readonly players: ReadonlyArray<string>
  readonly scores: ReadonlyArray<number>
  readonly currentRound: Round | undefined
  readonly randomizer: Randomizer
  readonly shuffler: Shuffler<Card>
  readonly cardsPerPlayer: number
  readonly winner: number | undefined // index, not name
}>

export type Props = Readonly<{
  readonly players: ReadonlyArray<string>
  readonly targetScore: number
  readonly randomizer: Randomizer
  readonly shuffler: Shuffler<Card>
  readonly cardsPerPlayer: number
}>
