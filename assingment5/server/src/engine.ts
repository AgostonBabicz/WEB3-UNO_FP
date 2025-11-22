import { v4 as uuid } from 'uuid'


import type { Game, Round, Card, Color } from '@uno/domain'
import {
  createModelGame,
  applyRoundStep,
  startNewRoundModel,
  roundGetHand,
  roundDraw,
  roundPlay,
  roundSayUno,
  roundCatchUnoFailure,
  roundHasEnded,
  roundCanPlay,
  roundDiscardPile,
  roundDrawPile,
  deckTop,
  deckSize
} from '@uno/domain'
import { persistGameCreate, persistRoundStart } from './helpers/game/persistanceFunctions'

export type PublishFn = (evt: any) => void

type GqlCard = {
  type: 'NUMBERED' | 'SKIP' | 'REVERSE' | 'DRAW' | 'WILD' | 'WILD_DRAW'
  color?: 'RED' | 'YELLOW' | 'GREEN' | 'BLUE'
  number?: 'N0' | 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'N6' | 'N7' | 'N8' | 'N9'
}

function toGqlCard(c: Card | undefined | null): GqlCard | null {
  if (!c) return null

  let number: GqlCard['number'] | undefined
  if (c.type === 'NUMBERED') {
    const v = (c as any).number
    if (typeof v !== 'number' || v < 0 || v > 9) {
      throw new Error(`Invalid NUMBERED card number: ${v}`)
    }
    number = `N${v}` as GqlCard['number']
  }

  return {
    type: c.type as GqlCard['type'],
    ...((c as any).color ? { color: (c as any).color } : {}),
    ...(number ? { number } : {}),
  }
}

export function notify(gameId: string, title: string, message: string, publish: PublishFn) {
  publish({
    __typename: 'Notice',
    gameId,
    title,
    message,
    at: new Date().toISOString(),
  })
}

const GAMES = new Map<string, Game>()
const GAME_IDS = new WeakMap<Game, string>()
const GAME_META = new WeakMap<Game, { createdAt: string; updatedAt: string | null }>()
const ROUND_IDS = new WeakMap<Game, string | null>()
const PLAYER_IDS = new WeakMap<Game, string[]>()

function touch(g: Game) {
  const meta = GAME_META.get(g)
  if (meta) meta.updatedAt = new Date().toISOString()
}
function getPlayerIds(g: Game, count: number): string[] {
  let ids = PLAYER_IDS.get(g)
  if (!ids) {
    ids = Array.from({ length: count }, () => uuid())
    PLAYER_IDS.set(g, ids)
  } else if (ids.length < count) {
    // append ids for newly added players
    for (let i = ids.length; i < count; i++) ids.push(uuid())
  } else if (ids.length > count) {
    ids = ids.slice(0, count)
    PLAYER_IDS.set(g, ids)
  }
  return ids
}
function ensureRoundId(g: Game): string {
  let id = ROUND_IDS.get(g) ?? null
  if (!id) {
    id = uuid()
    ROUND_IDS.set(g, id)
  }
  return id
}

function clearRoundId(g: Game) {
  ROUND_IDS.set(g, null)
}
export async function createGame(
  players: string[],
  targetScore: number,
  cardsPerPlayer: number,
  publish: PublishFn,
  hostUserId?: string | null,
) {
  if (players.length > 4) throw new Error('Max 4 players')

  const id = uuid()

  const g = createModelGame({
    players,
    targetScore,
    cardsPerPlayer,
  })

  GAMES.set(id, g)
  GAME_IDS.set(g, id)
  GAME_META.set(g, { createdAt: new Date().toISOString(), updatedAt: null })
  if (g.currentRound) ensureRoundId(g)

  await persistGameCreate(id, g, hostUserId ?? null)

  const view = gameView(g, id)
  publish({ __typename: 'GameUpdated', game: view })
  return view
}

export function addPlayer(gameId: string, name: string, publish: PublishFn) {
  const g = must(gameId)
  if (g.currentRound) throw new Error('Cannot join: round already started')

  const ng: Game = {
    ...g,
    playerCount: g.playerCount + 1,
    players: [...g.players, name],
    scores: [...g.scores, 0],
  }

  GAMES.set(gameId, ng)
  touch(ng)

  publish({
    __typename: 'PlayerJoined',
    gameId,
    playerIndex: ng.players.length - 1,
    player: { name },
  })
  const view = gameView(ng, gameId)
  publish({ __typename: 'GameUpdated', game: view })
  return view
}

export function startRound(gameId: string, publish: PublishFn) {
  const g = must(gameId)
  if (g.currentRound) throw new Error('Round already started')
  if (g.playerCount < 2) throw new Error('Need at least 2 players to start')

  const ng = startNewRoundModel(g)

  GAMES.set(gameId, ng)
  ensureRoundId(ng)
  touch(ng)

  persistRoundStart(gameId, 1)
  const view = gameView(ng, gameId)
  publish({ __typename: 'GameUpdated', game: view })
  return view
}

export function waitingGames() {
  return Array.from(GAMES.entries())
    .filter(([_, g]) => !g.currentRound && g.playerCount < 4)
    .map(([id, g]) => gameView(g, id))
}

export function getGame(gameId: string) {
  const g = must(gameId)
  return gameView(g, gameId)
}

export function resetGame(gameId: string, publish: PublishFn) {
  const g = must(gameId)
  const id = gameId

  const ng = createModelGame({
    players: [...g.players],
    targetScore: g.targetScore,
    cardsPerPlayer: g.cardsPerPlayer,
    randomizer: g.randomizer,
    shuffler: g.shuffler,
  })

  GAMES.set(id, ng)
  GAME_IDS.set(ng, id)

  const oldMeta = GAME_META.get(g)
  GAME_META.set(ng, {
    createdAt: oldMeta?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  clearRoundId(ng)
  const view = gameView(ng, id)
  publish({ __typename: 'GameUpdated', game: view })
  return view
}

export function hand(gameId: string, playerIndex: number): GqlCard[] {
  const g = must(gameId)
  const r = g.currentRound
  if (!r) return []
  const raw = roundGetHand(r, playerIndex) ?? []
  return raw.map(toGqlCard).filter(Boolean) as GqlCard[]
}

export function playableIndexes(gameId: string, playerIndex: number): number[] {
  const g = must(gameId)
  const r = g.currentRound
  if (!r) return []
  if (r.playerInTurn !== playerIndex) return []
  const hand = roundGetHand(r, playerIndex) ?? []
  return hand.map((_, i) => (roundCanPlay(i, r) ? i : -1)).filter((i) => i >= 0)
}

export function drawCard(gameId: string, playerIndex: number, publish: PublishFn) {
  const g = must(gameId)
  const r = g.currentRound
  if (!r) throw new Error('Round not started')
  if (r.playerInTurn !== playerIndex) throw new Error('Not your turn')

  const ng = updateGameWithRoundStep(gameId, (round) => roundDraw(round))
  const view = gameView(ng, gameId)

  const playerName = g.players[playerIndex] ?? `Player ${playerIndex}`
  notify(gameId, 'Drawn card', `${playerName} drew a card`, publish)
  publish({ __typename: 'CardDrawn', gameId, playerIndex, drew: 1 })
  publish({ __typename: 'GameUpdated', game: view })
  return view
}

export function playCard(
  gameId: string,
  playerIndex: number,
  cardIndex: number,
  askedColor: Color | null | undefined,
  publish: PublishFn,
) {
  const g = must(gameId)
  const r = g.currentRound
  if (!r) throw new Error('Round not started')
  if (r.playerInTurn !== playerIndex) throw new Error('Not your turn')

  const ng = updateGameWithRoundStep(gameId, (round) =>
    roundPlay(cardIndex, askedColor ?? undefined, round),
  )

  const rAfter = ng.currentRound

  if (rAfter) {
    const playerName = g.players[playerIndex] ?? `Player ${playerIndex}`
    const playedCardModel = deckTop(roundDiscardPile(rAfter))
    const gqlCard = toGqlCard(playedCardModel)
    if (!gqlCard) {
      throw new Error('Could not determine played card')
    }

    if (gqlCard.type === 'NUMBERED') {
      const number = gqlCard.number
      const color = gqlCard.color
      notify(
        gameId,
        'Numbered card played',
        `${playerName} chose ${color} ${number}`,
        publish,
      )
    } else if (gqlCard.type === 'WILD') {
      const asked = askedColor ?? 'RED'
      notify(gameId, 'Wild card played', `${playerName} chose ${asked}`, publish)
    } else if (gqlCard.type === 'WILD_DRAW') {
      const asked = askedColor ?? 'RED'
      notify(
        gameId,
        'Wild card played',
        `${playerName} chose ${asked}, draw 4 cards`,
        publish,
      )
    } else if (gqlCard.type === 'DRAW') {
      const color = gqlCard.color
      notify(
        gameId,
        `Draw (${color}) card played`,
        `${playerName} made the next player draw 2 cards`,
        publish,
      )
    } else if (gqlCard.type === 'REVERSE') {
      const color = gqlCard.color
      notify(
        gameId,
        `Reverse (${color}) card played`,
        `${playerName} made the round's direction the opposite`,
        publish,
      )
    } else {
      // SKIP
      const color = gqlCard.color
      notify(
        gameId,
        `Skip (${color}) card played`,
        `${playerName} skipped the next player in turn`,
        publish,
      )
    }

    // Only publish CardPlayed while a round still exists
    publish({
      __typename: 'CardPlayed',
      gameId,
      playerIndex,
      card: gqlCard,
      askedColor: askedColor ?? null,
    })
  }

  const view = gameView(ng, gameId)

  // GameUpdated is always published, even when the game is over
  publish({ __typename: 'GameUpdated', game: view })
  return view
}

export function sayUno(gameId: string, playerIndex: number, publish: PublishFn) {
  const g = must(gameId)
  if (!g.currentRound) throw new Error('Round not started')

  const ng = updateGameWithRoundStep(gameId, (round) => roundSayUno(playerIndex, round))

  const playerName = g.players[playerIndex] ?? `Player ${playerIndex}`
  notify(gameId, 'UNO!', `${playerName} yelled UNO!`, publish)

  const view = gameView(ng, gameId)
  publish({ __typename: 'UnoSaid', gameId, playerIndex })
  publish({ __typename: 'GameUpdated', game: view })
  return view
}

export function accuseUno(
  gameId: string,
  accuserIndex: number,
  accusedIndex: number,
  publish: PublishFn,
) {
  const g = must(gameId)
  const before = g.currentRound
  if (!before) throw new Error('Round not started')

  const ng = updateGameWithRoundStep(gameId, (round) =>
    roundCatchUnoFailure({ accuser: accuserIndex, accused: accusedIndex }, round),
  )
  const after = ng.currentRound

  let success = false
  if (before && after) {
    const beforeLen = roundGetHand(before, accusedIndex).length
    const afterLen = roundGetHand(after, accusedIndex).length
    success = afterLen > beforeLen
  }

  notify(gameId, `${accuserIndex} accused ${accusedIndex} for not saying uno`, '', publish)

  const view = gameView(ng, gameId)
  publish({
    __typename: 'UnoAccusationResult',
    gameId,
    accuserIndex,
    accusedIndex,
    success,
  })
  publish({ __typename: 'GameUpdated', game: view })
  return view
}

// ------------------------ internals ------------------------

function must(gameId: string): Game {
  const g = GAMES.get(gameId)
  if (!g) throw new Error('Game not found')
  return g
}

function updateGameWithRoundStep(gameId: string, step: (r: Round) => Round): Game {
  const g = must(gameId)
  if (!g.currentRound) throw new Error('Round not started')

  const ng = applyRoundStep(step, g)
  GAMES.set(gameId, ng)
  touch(ng)
  return ng
}

function playerCountOf(g: Game): number {
  return g.playerCount
}

function gameView(g: Game, id: string) {
  const meta = GAME_META.get(g) ?? {
    createdAt: new Date().toISOString(),
    updatedAt: null as string | null,
  }
  if (!GAME_META.has(g)) GAME_META.set(g, meta)

  const playerIds = getPlayerIds(g, g.playerCount)
  const round = g.currentRound ?? null

  const handCount = (ix: number) => (round ? roundGetHand(round, ix).length : 0)

  const saidUno = (_ix: number) => false

  return {
    id,
    createdAt: meta.createdAt,
    targetScore: g.targetScore,
    cardsPerPlayer: g.cardsPerPlayer,

    players: g.players.map((name, ix) => ({
      id: playerIds[ix],
      name,
      handCount: handCount(ix),
      score: g.scores[ix] ?? 0,
      saidUno: saidUno(ix),
    })),

    currentRound: round
      ? {
          id: ensureRoundId(g),
          playerInTurnIndex: round.playerInTurn ?? null,
          discardTop: toGqlCard(deckTop(roundDiscardPile(round))),
          drawPileSize: deckSize(roundDrawPile(round)),
          currentColor: round.currentColor ?? null,
          direction: round.currentDirection,
          hasEnded: roundHasEnded(round),
        }
      : null,

    winnerIndex: g.winner,
  }
}
