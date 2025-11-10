import { List } from 'immutable'

export type Type =
  | 'NUMBERED'
  | 'SKIP'
  | 'REVERSE'
  | 'DRAW'
  | 'WILD'
  | 'WILD DRAW'

export type Deck<C extends Card = Card> = Readonly<List<C>> & {
  readonly length: number
}

const colors = ['BLUE', 'RED', 'GREEN', 'YELLOW'] as const
export type Color = (typeof colors)[number]

const cardNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const
export type CardNumber = (typeof cardNumbers)[number]

export type NumberCard = Readonly<{
  type: 'NUMBERED'
  color: Color
  number: CardNumber
}>
export type SkipCard = Readonly<{ type: 'SKIP'; color: Color }>
export type ReverseCard = Readonly<{ type: 'REVERSE'; color: Color }>
export type DrawCard = Readonly<{ type: 'DRAW'; color: Color }>

export type SpecialCard = SkipCard | ReverseCard | DrawCard

export type WildCard = Readonly<{ type: 'WILD' | 'WILD DRAW' }>
export type ColoredCard = Readonly<NumberCard | SpecialCard>

export type NumKey = Extract<Type, 'NUMBERED'>
export type SpecialKey = Extract<Type, 'SKIP' | 'REVERSE' | 'DRAW'>
export type WildKey = Extract<Type, 'WILD' | 'WILD DRAW'>
export type CardMap = Record<NumKey, NumberCard> &
  Record<SpecialKey, SpecialCard> &
  Record<WildKey, WildCard>

export type TypedCard<T extends Type> = CardMap[T]
export type Card = Readonly<TypedCard<Type>>
