import { List } from 'immutable'

// This one is not functional, but OOP style

// export class PlayerHand {
//   readonly cards: List<Card>

//   constructor(cards: List<Card>) {
//     this.cards = cards
//   }

//   add(card: Card): PlayerHand {
//     return new PlayerHand(this.cards.push(card))
//   }

//   remove(card: Card): PlayerHand {
//     return new PlayerHand(this.cards.remove(this.cards.indexOf(card)))
//   }

//   playCard(ix: number): [Card | undefined, PlayerHand] {
//     const card = this.cards.get(ix)
//     return [card, new PlayerHand(this.cards.remove(ix))]
//   }

//   size(): number {
//     return this.cards.size
//   }

//   hasColor(color: Color): boolean {
//     return this.cards.some((c) => isColored(c) && c.color === color)
//   }

//   toArray(): readonly Card[] {
//     return this.cards.toArray()
//   }
// }
