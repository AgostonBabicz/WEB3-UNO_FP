import { Game } from "./uno"
import { List } from 'immutable'
import type { Round } from './round'
import type { Card, Color, CardType, Deck } from './deck'
import type { PlayerHand } from './player_hand'
import type { GameEvent } from './events'
import { createHand } from './player_hand'
import { createDeckWithCards, createEmptyDeck } from './deck'
import { standardRandomizer, standardShuffler } from '../utils/random_utils'
import { GraphQlGame } from "./dtos"

export type UUID = string

type Indexed<Y, pending extends boolean> = Readonly<Y & {id: string, pending: pending}>
export type IndexedGame = Indexed<Game, true>

// A placeholder card used to fill decks/hands so .size returns the correct number
const DUMMY_CARD: Card = { type: 'NUMBERED', color: 'BLUE', number: 0 }

export function parseCard(raw: any): Card {
  if (!raw) throw new Error('Invalid card data')

  if (raw.type === 'NUMBERED') {
    const num = typeof raw.number === 'string' && raw.number.startsWith('N')
      ? parseInt(raw.number.substring(1))
      : raw.number

    return { type: 'NUMBERED', color: raw.color as Color, number: num }
  }

  if (raw.type === 'WILD' || raw.type === 'WILD_DRAW') {
    return { type: raw.type as 'WILD' | 'WILD_DRAW' }
  }

  return { type: raw.type as any, color: raw.color as Color }
}

export function parseRound(
  raw: any, 
  playerNames: string[], 
  playerHandCounts: number[]
): Round {
  if (!raw) throw new Error('Invalid round data')

  const discardDeck: Deck = raw.discardTop 
    ? createDeckWithCards([parseCard(raw.discardTop)]) 
    : createEmptyDeck()

  const drawSize = raw.drawPileSize ?? 0
  const drawDeck: Deck = createDeckWithCards(Array(drawSize).fill(DUMMY_CARD))

  const playerHands = List<PlayerHand>(
    playerNames.map((_, index) => {
      const count = playerHandCounts[index] ?? 0
      return createHand(Array(count).fill(DUMMY_CARD))
    })
  )

  return {
    playerCount: playerNames.length,
    players: playerNames,
    currentPlayerIndex: raw.playerInTurnIndex ?? 0,
    playerInTurn: raw.playerInTurnIndex,
    discardDeck,
    drawDeck,
    playerHands,
    dealer: 0,
    shuffler: standardShuffler,
    cardsPerPlay: 7,
    startResolved: true,
    resolving: false,
    scored: raw.hasEnded ?? false,
    currentDirection: (raw.direction === 'CLOCKWISE' || raw.direction === 1) ? 'clockwise' : 'counterclockwise',
    direction: (raw.direction === 'CLOCKWISE' || raw.direction === 1) ? 1 : -1,
    currentColor: raw.currentColor ?? '',
    lastActor: null,
    lastUnoSayer: null,
    pendingUnoAccused: null,
    unoProtectedForWindow: false,
    unoSayersSinceLastAction: new Set(),
  }
}

export function parseGame(raw: any): IndexedGame {
  if (!raw) throw new Error('Invalid game data')

  const players = raw.players?.map((p: any) => p.name) ?? []
  const scores = raw.players?.map((p: any) => p.score ?? 0) ?? []
  const handCounts = raw.players?.map((p: any) => p.handCount ?? 0) ?? []

  const currentRound = raw.currentRound 
    ? parseRound(raw.currentRound, players, handCounts) 
    : undefined

  const game: Game = {
    playerCount: players.length,
    targetScore: raw.targetScore ?? 500,
    cardsPerPlayer: raw.cardsPerPlayer ?? 7,
    players,
    scores,
    currentRound,
    winner: raw.winnerIndex,
    randomizer: standardRandomizer,
    shuffler: standardShuffler,
  }
  return { ...game, id: raw.id, pending: false } as unknown as IndexedGame
}

export function parseEvent(raw: any): GameEvent {
  if (!raw || !raw.__typename) throw new Error('Invalid event data')

  const { __typename, ...rest } = raw

  switch (__typename) {
    case 'CardPlayed':
      return {
        __typename,
        gameId: rest.gameId,
        playerIndex: rest.playerIndex,
        card: parseCard(rest.card),
        askedColor: rest.askedColor
      } as any

    case 'GameUpdated':
      return {
        __typename,
        game: parseGame(rest.game)
      } as any

    case 'GameStarted':
        return rest.game 
          ? { __typename, gameId: rest.gameId, game: parseGame(rest.game) } as any
          : raw

    default:
      return raw as GameEvent
  }
}
export const toDomainCard = parseCard
export const toDomainGame = parseGame