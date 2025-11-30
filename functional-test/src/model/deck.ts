import { List } from 'immutable'
import { Shuffler } from '../utils/random_utils'
import { Card, ColoredCard, Deck, WildCard } from '../types/deck.types'

const colors = ['BLUE', 'RED', 'GREEN', 'YELLOW'] as const
const cardNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const

export function isColored(card: Card): card is ColoredCard {
  return card.type !== 'WILD' && card.type !== 'WILD_DRAW'
}
export function isWild(card: Card): card is WildCard {
  return card.type === 'WILD' || card.type === 'WILD_DRAW'
}

function wrapDeck<C extends Card>(l: List<C>): Deck<C> {
  const out = l as Deck<C>
  if (!('length' in out)) {
    Object.defineProperty(out, 'length', {
      get: () => l.size,
      enumerable: false,
      configurable: true,
    })
  }
  return out
}

export function createEmptyDeck<C extends Card = Card>(): Deck<C> {
  return wrapDeck(List<C>())
}
export function createDeckWithCards<C extends Card>(
  cards: ReadonlyArray<C>
): Deck<C> {
  return wrapDeck(List(cards))
}
export function deal<C extends Card>(deck: Deck<C>): [C | undefined, Deck<C>] {
  const card = deck.first()
  const rest = wrapDeck(deck.shift())
  return [card, rest]
}
export function putCardOnTop<C extends Card>(deck: Deck<C>, card: C): Deck<C> {
  return wrapDeck(deck.unshift(card))
}
export function getDeckUnderTop<C extends Card>(deck: Deck<C>): Deck<C> {
  return wrapDeck(deck.shift())
}
export function shuffle<C extends Card>(
  deck: Deck<C>,
  shuffler: Shuffler<C>
): Deck<C> {
  return wrapDeck(List(shuffler(deck.toArray())))
}

export function size<C extends Card>(deck: Deck<C>): number {
  return deck.size
}
export function top<C extends Card>(deck: Deck<C>): C | undefined {
  return deck.first()
}
export function peek<C extends Card>(deck: Deck<C>): C | undefined {
  return deck.first()
}
export function toArray<C extends Card>(deck: Deck<C>): C[] {
  return deck.toArray()
}

export function mapDeck<C extends Card, R>(
  deck: Deck<C>,
  mapper: (card: C, index: number) => R
): List<R> {
  return deck.map(mapper) as List<R>
}

export function filterDeck<C extends Card, S extends C>(
  deck: Deck<C>,
  predicate: (card: C, index: number) => card is S
): Deck<S>
export function filterDeck<C extends Card>(
  deck: Deck<C>,
  predicate: (card: C, index: number) => boolean
): Deck<C>
export function filterDeck(
  deck: Deck<Card>,
  predicate: (card: Card, index: number) => boolean
): Deck<Card> {
  return deck.filter(predicate) as Deck<Card>
}

export function createInitialDeck(): Deck<Card> {
  const cards = List<Card>().withMutations((cs) => {
    for (const n of cardNumbers.slice(1)) {
      for (const color of colors) {
        cs.push({ type: 'NUMBERED', color, number: n })
        cs.push({ type: 'NUMBERED', color, number: n })
      }
    }
    for (const color of colors) {
      for (let j = 0; j < 2; j++) {
        cs.push({ type: 'SKIP', color })
        cs.push({ type: 'REVERSE', color })
        cs.push({ type: 'DRAW', color })
      }
    }
    for (let i = 0; i < 4; i++) {
      cs.push({ type: 'WILD' })
      cs.push({ type: 'WILD_DRAW' })
    }
    cs.push({ type: 'NUMBERED', color: 'BLUE', number: 0 })
    cs.push({ type: 'NUMBERED', color: 'RED', number: 0 })
    cs.push({ type: 'NUMBERED', color: 'GREEN', number: 0 })
    cs.push({ type: 'NUMBERED', color: 'YELLOW', number: 0 })
  })
  return wrapDeck(cards)
}
