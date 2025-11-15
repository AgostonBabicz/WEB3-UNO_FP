import { List } from 'immutable'
import { Shuffler } from '../utils/random_utils'
import { Card, Color, Deck } from './deck.types'
import { PlayerHand } from './player_hand.types'

export type Direction = 1 | -1

export type Round = Readonly<{
  playerCount: number
  players: ReadonlyArray<string>
  currentPlayerIndex: number
  discardDeck: Deck
  drawDeck: Deck
  playerHands: List<PlayerHand>
  dealer: number
  shuffler?: Shuffler<Card>
  cardsPerPlay?: number
  startResolved: boolean
  currentDirection: 'clockwise' | 'counterclockwise'
  direction: Direction
  currentColor: '' | Color
  resolving: boolean
  lastActor: number | null
  lastUnoSayer: number | null
  pendingUnoAccused: number | null
  unoProtectedForWindow: boolean
  unoSayersSinceLastAction: Set<number>
  playerInTurn: number | undefined
  scored?: boolean
}>
