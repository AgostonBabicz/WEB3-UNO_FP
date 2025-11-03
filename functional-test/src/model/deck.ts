import { List } from 'immutable'

type Type = 'NUMBERED' | 'SKIP' | 'REVERSE' | 'DRAW' | 'WILD' | 'WILD DRAW'
const colors = ['BLUE', 'RED', 'GREEN', 'YELLOW'] as const;
type Color = typeof colors[number];
const cardNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
type CardNumber = typeof cardNumbers[number];

type NumberCard = { type: 'NUMBERED', color: Color, number: CardNumber }
type SpecialCard = { type: 'SKIP' | 'REVERSE' | 'DRAW', color: Color }
type WildCard = { type: 'WILD' | 'WILD DRAW' }
type ColoredCard = Readonly<NumberCard | SpecialCard>

type NumKey = Extract<Type, 'NUMBERED'>
type SpecialKey = Extract<Type, 'SKIP' | 'REVERSE' | 'DRAW'>
type WildKey = Extract<Type, 'WILD' | 'WILD DRAW'>
type CardMap =
    & Record<NumKey, NumberCard>
    & Record<SpecialKey, SpecialCard>
    & Record<WildKey, WildCard>

type TypedCard<T extends Type> = CardMap[T]
type Card = Readonly<TypedCard<Type>>


export class Deck {
    readonly cards: List<Card>
    readonly length: number

    constructor(cards: List<Card>) {
        this.cards = cards
        this.length = this.cards.size
    }

    filter(predicate: (card: Card, index: number) => boolean): Deck {
        const cards = this.cards.filter(predicate)
        return new Deck(cards)
    }

    map<U>(mapper: (card: Card, index: number) => U): List<U> {
        return this.cards.map(mapper);
    }

    toArray(): ReadonlyArray<Card> {
        return this.cards.toArray();
    }

}

export function createInitialDeck(): Deck {
    const cards: List<Card> = List<Card>().withMutations(cs => {
        for (const n of cardNumbers.slice(1)) {
            for (const color of colors) {
                cs.push({ type: 'NUMBERED', color, number: n })
                cs.push({ type: 'NUMBERED', color, number: n })
            }
        }
        for (const color of ['BLUE', 'RED', 'GREEN', 'YELLOW'] as const) {
            for (let j = 0; j < 2; j++) {
                cs.push({ type: 'SKIP', color })
                cs.push({ type: 'REVERSE', color })
                cs.push({ type: 'DRAW', color })
            }
        }

        for (let i = 0; i < 4; i++) {
            cs.push({ type: 'WILD' })
            cs.push({ type: 'WILD DRAW' })
        }

        cs.push({ type: 'NUMBERED', color: 'BLUE', number: 0 })
        cs.push({ type: 'NUMBERED', color: 'RED', number: 0 })
        cs.push({ type: 'NUMBERED', color: 'GREEN', number: 0 })
        cs.push({ type: 'NUMBERED', color: 'YELLOW', number: 0 })
    })
    return new Deck(cards)
}