import { Shuffler, standardShuffler } from '../../src/utils/random_utils'
import * as deck from '../../src/model/deck'
import * as round from '../../src/model/round'
import * as uno from '../../src/model/uno'
import { Card, Deck } from '../../src/types/deck.types'
import { Props, Game } from '../../src/types/uno.types'

export function createInitialDeck(): Deck {
  return deck.createInitialDeck()
}

export type RoundProps = {
  players: string[]
  dealer: number
  shuffler?: Shuffler<Card>
  cardsPerPlayer?: number
}

export function createRound({
  players,
  dealer,
  shuffler = standardShuffler,
  cardsPerPlayer = 7,
}: RoundProps) {
  return round.createRound(players, dealer, shuffler, cardsPerPlayer)
}

export function createGame(props: Partial<Props>): Game {
  return uno.createGame(props)
}
