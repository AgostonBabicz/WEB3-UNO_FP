//ASK OLE IG PLS
import { List } from "immutable";
import { Card, Color, isColored } from "./deck";

export type PlayerHand = Readonly<{
  cards: List<Card>;
}>;

export const createHand = (cards: Card[] = []): PlayerHand =>
  ({ cards: List(cards) });

export const add = (hand: PlayerHand, card: Card): PlayerHand =>
  ({ cards: hand.cards.push(card) });

export const remove = (hand: PlayerHand, card: Card): PlayerHand =>
  ({ cards: hand.cards.remove(hand.cards.indexOf(card)) });

export const playCard = (hand: PlayerHand, index: number): [Card | undefined, PlayerHand] =>
  [hand.cards.get(index), { cards: hand.cards.remove(index) }];

export const toArray = (hand: PlayerHand): readonly Card[] =>
  hand.cards.toArray();
