import { List } from 'immutable'
import { Card } from './deck.types'

export type PlayerHand = Readonly<{
  cards: List<Card>
  size(): number
  getPlayerHand(): List<Card>
}>
