import { describe, it, expect } from '@jest/globals'
import { createInitialDeck } from '../utils/test_adapter'
import * as _ from 'lodash'
import { Card } from '../../src/models/deck'

describe('Initial deck', () => {
  const initialDeck = createInitialDeck()
  it('contains 19 numbered blue cards', () => {
    expect(
      initialDeck.filter(_.matches({ type: 'NUMBERED', color: 'BLUE' })).size
    ).toEqual(19)
  })
  it('contains 19 numbered green cards', () => {
    expect(
      initialDeck.filter(_.matches({ type: 'NUMBERED', color: 'GREEN' })).size
    ).toEqual(19)
  })
  it('contains 19 numbered red cards', () => {
    expect(
      initialDeck.filter(_.matches({ type: 'NUMBERED', color: 'RED' })).size
    ).toEqual(19)
  })
  it('contains 19 numbered yellow cards', () => {
    expect(
      initialDeck.filter(_.matches({ type: 'NUMBERED', color: 'YELLOW' })).size
    ).toEqual(19)
  })
  it('only contains numbered card with numbers between 0 and 9', () => {
    const numberedDeck = initialDeck.filter(
      (card: Card) => card.type === 'NUMBERED'
    )
    const numbers = numberedDeck.map((card: any) => card.number)
    expect(numbers.every((n: number) => 0 <= n && n <= 9)).toBeTruthy()
  })
  it('contains numbered cards of every legal number and color', () => {
    const numberedDeck = initialDeck.filter(
      (card: Card) => card.type === 'NUMBERED'
    )
    const numberedCardsByColor = _.groupBy(
      numberedDeck.toArray(),
      (card) => (card as any).color
    )
    _.forEach(numberedCardsByColor, (cards) => {
      const cardsByNumber = _.groupBy(cards, (card) => card.number)
      _.forEach(cardsByNumber, (cards, number) => {
        if (number === '0') expect(cards.length).toEqual(1)
        else expect(cards.length).toEqual(2)
      })
    })
  })
  it('contains 8 skip cards', () => {
    expect(initialDeck.filter(_.matches({ type: 'SKIP' })).size).toEqual(8)
  })
  it('contains 2 skip cards of each color', () => {
    const skipCards = initialDeck.filter((card: Card) => card.type === 'SKIP')
    const skipCardsByColor = _.groupBy(
      skipCards.toArray(),
      (card) => (card as any).color
    )
    _.forEach(skipCardsByColor, (cards) => expect(cards.length).toEqual(2))
  })
  it('contains 8 reverse cards', () => {
    expect(initialDeck.filter(_.matches({ type: 'REVERSE' })).size).toEqual(8)
  })
  it('contains 2 reverse cards of each color', () => {
    const reverseCards = initialDeck.filter(
      (card: Card) => card.type === 'REVERSE'
    )
    const reverseCardsByColor = _.groupBy(
      reverseCards.toArray(),
      (card) => (card as any).color
    )
    _.forEach(reverseCardsByColor, (cards) => expect(cards.length).toEqual(2))
  })
  it('contains 8 draw cards', () => {
    expect(initialDeck.filter(_.matches({ type: 'DRAW' })).size).toEqual(8)
  })
  it('contains 2 draw cards of each color', () => {
    const drawCards = initialDeck.filter((card: Card) => card.type === 'DRAW')
    const drawCardsByColor = _.groupBy(
      drawCards.toArray(),
      (card) => (card as any).color
    )
    _.forEach(drawCardsByColor, (cards) => expect(cards.length).toEqual(2))
  })
  it('contains 4 wild cards', () => {
    expect(initialDeck.filter(_.matches({ type: 'WILD' })).size).toEqual(4)
  })
  it('contains 4 wild draw cards', () => {
    expect(initialDeck.filter(_.matches({ type: 'WILD DRAW' })).size).toEqual(4)
  })
  // Blank cards skipped, since they have no gameplay
  it('contains 108 cards', () => {
    expect(initialDeck.size).toEqual(108)
  })
})
