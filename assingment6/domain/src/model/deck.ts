import { List } from 'immutable'
import { Shuffler } from '../utils/random_utils'

export type Type =
  | 'NUMBERED'
  | 'SKIP'
  | 'REVERSE'
  | 'DRAW'
  | 'WILD'
  | 'WILD_DRAW'


const colors = ['BLUE', 'RED', 'GREEN', 'YELLOW'] as const
export type Color = (typeof colors)[number]

const cardNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const
export type CardNumber = (typeof cardNumbers)[number]


export type NumberCard = Readonly<{type: 'NUMBERED', color: Color,number: CardNumber}>
export type SkipCard = Readonly<{ type: 'SKIP'; color: Color }>
export type ReverseCard = Readonly<{ type: 'REVERSE'; color: Color }>
export type DrawCard = Readonly<{ type: 'DRAW'; color: Color }>

export type SpecialCard = SkipCard | ReverseCard | DrawCard

export type WildCard = Readonly<{ type: 'WILD' | 'WILD_DRAW' }>
export type ColoredCard = Readonly<NumberCard | SpecialCard>

export type NumKey = Extract<Type, 'NUMBERED'>
export type SpecialKey = Extract<Type, 'SKIP' | 'REVERSE' | 'DRAW'>
export type WildKey = Extract<Type, 'WILD' | 'WILD_DRAW'>
export type CardMap = Record<NumKey, NumberCard> &
  Record<SpecialKey, SpecialCard> &
  Record<WildKey, WildCard>

export type TypedCard<T extends Type> = CardMap[T]
export type Card = Readonly<TypedCard<Type>>

export type Deck<Card> = List<Card>

export function isColored(card: Card): card is ColoredCard {
  return card.type !== 'WILD' && card.type !== 'WILD_DRAW'
}
export function isWild(card: Card): card is WildCard {
  return card.type === 'WILD' || card.type === 'WILD_DRAW'
}

export function deckSize<C extends Card>(deck: Deck<C>): number {
    return deck.size
}

export function toArray<C extends Card>(deck: Deck<C>): C[] {
    return deck.toArray() 
}

export function top<C extends Card>(deck: Deck<C>): C | undefined {
    return deck.first()
}
// peek() is deckTop()

export function deal<C extends Card>(deck: Deck<C>): [C | undefined, Deck<C>] {
    const card = deck.first()
    const rest = deck.shift() as Deck<C>
    return [card, rest]
}
export function shuffle<C extends Card>(deck: Deck<C>, shuffler: Shuffler<C>): Deck<C> {
    const cardsShuffled = List(shuffler(deck.toArray()))
    return cardsShuffled as Deck<C>
}

export function getDeckUnderTop<C extends Card>(deck: Deck<C>): Deck<C> {
    return deck.shift() as Deck<C>
}

export function putCardOnTop<C extends Card>(deck: Deck<C>, card: C): Deck<C> {
    return deck.unshift(card) as Deck<C>
}

export function filter<C extends Card, S extends C>(
    deck: Deck<C>, 
    predicate: (card: C, index: number) => card is S
): Deck<S>

export function filter<C extends Card>(
    deck: Deck<C>, 
    predicate: (card: C, index: number) => boolean
): Deck<C>

export function filter(deck: Deck<Card>, predicate: any): any {
    const cards = deck.filter(predicate as any)
    return cards as Deck<Card>
}


export function createInitialDeck(): Deck<Card> {
    const cards: List<Card> = List<Card>().withMutations(cs => {
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
    return cards as Deck<Card>
}

export function createEmptyDeck(): Deck<Card> {
    return List() as Deck<Card>;
}


export function createDeckWithCards(cards: Card[]): Deck<Card> {
  return List(cards) as Deck<Card>;
}