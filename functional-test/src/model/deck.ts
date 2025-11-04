import { List } from 'immutable'
import { Shuffler } from '../utils/random_utils';

type Type = 'NUMBERED' | 'SKIP' | 'REVERSE' | 'DRAW' | 'WILD' | 'WILD DRAW'
const colors = ['BLUE', 'RED', 'GREEN', 'YELLOW'] as const;
export type Color = typeof colors[number];
const cardNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
type CardNumber = typeof cardNumbers[number];

type NumberCard = { type: 'NUMBERED', color: Color, number: CardNumber }
type SkipCard = { type: 'SKIP', color: Color }
type ReverseCard = { type: 'REVERSE', color: Color }
type DrawCard = { type: 'DRAW', color: Color }

type SpecialCard = SkipCard | ReverseCard | DrawCard

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
export type Card = Readonly<TypedCard<Type>>

export function isColored(card:Card) : card is ColoredCard{
    return card.type !== 'WILD' && card.type !== 'WILD DRAW'
}
export function isWild(card: Card) : card is WildCard{
    return card.type==='WILD'||card.type==="WILD DRAW"
}



export class Deck<C extends Card = Card> {
    readonly cards: List<C>
    readonly length: number

    constructor(cards: List<C>) {
        this.cards = cards
        this.length = this.cards.size
    }

    // Filter overloadig so that NumberCard is narrowed in the test (maybe use elsewhere later)
    filter<S extends C>(predicate: (card: C, index: number) => card is S): Deck<S>
    filter(predicate: (card: C, index: number) => boolean): Deck<C>
    filter(predicate: any): any {
        const cards = this.cards.filter(predicate as any)
        return new Deck(cards)
    }
    map<R>(mapper: (card: C, index: number) => R) {
        return this.cards.map(mapper)
    }

    toArray(): C[] {
        return this.cards.toArray()
    }

    deal() : [C|undefined, Deck<C>]{
        const card = this.cards.first()
        const rest = this.cards.shift()
        return [card,new Deck(rest)]
    }

    shuffle(shuffler:Shuffler<C>) : Deck<C>{
        const cardsShuffled = List(shuffler(this.cards.toArray()))
        return new Deck(cardsShuffled)
    }

    getDeck() : List<C>{
        return List(this.cards)
    }

    get size() : number{
        return this.cards.size
    }

    top() : C|undefined{
        return this.cards.first()
    }
    // Maybe it won't be needed as compared to the OOP, we handle top and peek the same way here
    peek() : C|undefined{
        return this.cards.first()
    }

    getDeckUnderTop() : Deck<C>{
        return new Deck(this.cards.shift())
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
    return new Deck<Card>(cards)
}