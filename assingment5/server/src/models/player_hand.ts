import { List } from 'immutable'
import { Card } from '../types/deck.types'
import { PlayerHand } from '../types/player_hand.types'

const make = (cards: List<Card>): PlayerHand => {
  const obj = { cards } as PlayerHand
  Object.defineProperties(obj, {
    size: {
      value: () => cards.size,
      enumerable: false,
      configurable: true,
      writable: false,
    },
    getPlayerHand: {
      value: () => cards,
      enumerable: false,
      configurable: true,
      writable: false,
    },
  })
  return obj
}

export const createHand = (cards: Card[] = []): PlayerHand => make(List(cards))
export const add = (h: PlayerHand, c: Card): PlayerHand => make(h.cards.push(c))
export const remove = (h: PlayerHand, c: Card): PlayerHand =>
  make(h.cards.remove(h.cards.indexOf(c)))
export const toArray = (h: PlayerHand): readonly Card[] => h.cards.toArray()
