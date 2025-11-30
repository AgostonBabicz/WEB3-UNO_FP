import { Randomizer, Shuffler, standardRandomizer, standardShuffler } from '../../src/utils/random_utils'
import * as deck from '../../src/model/deck'
import * as round from '../../src/model/round'
import * as uno from '../../src/model/uno'


export function createInitialDeck(): deck.Deck<deck.Card> {
  return deck.createInitialDeck()
}

export type RoundProps = {
  players: readonly string[]
  dealer: number
  shuffler?: Shuffler<deck.Card>
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

export function createGame(props: Partial<uno.Props>): uno.Game {
  const players = props.players ?? ['A', 'B']
    const targetScore = props.targetScore ?? 500
    const cardsPerPlayer = props.cardsPerPlayer ?? 7
    const randomizer: Randomizer = props.randomizer ?? standardRandomizer
    const shuffler: Shuffler<deck.Card> = props.shuffler ?? standardShuffler
  
    const playerCount = players.length
    const scores: ReadonlyArray<number> = Array(playerCount).fill(0)
  
    const dealer = randomizer(playerCount)
    const currentRound = round.createRound(
      [...players],
      dealer,
      shuffler,
      cardsPerPlayer
    )
  
    return {
      playerCount,
      targetScore,
      players,
      scores,
      currentRound:currentRound,
      randomizer,
      shuffler,
      cardsPerPlayer,
      winner: undefined,
    } as const
}
