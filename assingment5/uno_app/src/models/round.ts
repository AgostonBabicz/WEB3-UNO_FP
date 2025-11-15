import { List } from 'immutable'
import { Card, Color, Deck } from '../types/deck.types'
import { PlayerHand } from '../types/player_hand.types'
import { Round, Direction } from '../types/round.types'
import { mod } from '../utils/mod'
import { Shuffler } from '../utils/random_utils'
import { withState } from '../utils/updater'

import {
  createInitialDeck,
  createEmptyDeck,
  isWild,
  isColored,
  createDeckWithCards,
  deal as deckDeal,
  shuffle as deckShuffle,
  putCardOnTop as deckPutTop,
  getDeckUnderTop as deckUnderTop,
  top as deckTop,
  toArray as deckToArray,
  size as deckSize,
} from './deck'

import {
  createHand,
  add as handAdd,
  remove as handRemove,
  toArray as handToArray,
} from './player_hand'

function withHandView(
  h: PlayerHand
): PlayerHand & { size(): number; getPlayerHand(): List<Card> } {
  const anyHand = h as PlayerHand & {
    size?: () => number
    getPlayerHand?: () => List<Card>
  }

  Object.defineProperties(anyHand, {
    size: {
      value: () => anyHand.cards.size,
      enumerable: false,
      configurable: true,
      writable: false,
    },
    getPlayerHand: {
      value: () => anyHand.cards,
      enumerable: false,
      configurable: true,
      writable: false,
    },
  })

  return anyHand as PlayerHand & { size(): number; getPlayerHand(): List<Card> }
}

function withDeckView<C extends Card>(
  d: Deck<C>
): Deck<C> & { readonly length: number } {
  const out = d as Deck<C> & { readonly length: number }
  if (!('length' in out)) {
    Object.defineProperty(out, 'length', {
      get: () => deckSize(d),
      enumerable: false,
      configurable: true,
    })
  }
  return out
}

function setDrawDeck(s: Round, d: Deck<Card>): Round {
  return withState(s, { drawDeck: withDeckView(d) })
}
function setDiscardDeck(s: Round, d: Deck<Card>): Round {
  return withState(s, { discardDeck: withDeckView(d) })
}
function setPlayerHand(s: Round, p: number, h: PlayerHand): Round {
  return withState(s, {
    playerHands: s.playerHands.update(p, () => withHandView(h)),
  })
}
function updatePlayerHand(
  s: Round,
  p: number,
  updater: (h: PlayerHand) => PlayerHand
): Round {
  return withState(s, {
    playerHands: s.playerHands.update(p, (h) =>
      withHandView(updater(h ?? createHand()))
    ),
  })
}

export function createRound(
  players: ReadonlyArray<string>,
  dealer: number,
  shuffler: Shuffler<Card>,
  cardsPerPlay: number
): Round {
  const initialState = makeRoundState(players, dealer, shuffler, cardsPerPlay)
  return resolveStart(initialState)
}

function setTurn(s: Round, idx: number): Round {
  return withState(s, { currentPlayerIndex: idx, playerInTurn: idx })
}

function makeRoundState(
  players: ReadonlyArray<string>,
  dealer: number,
  shuffler: Shuffler<Card>,
  cardsPerPlay: number
): Round {
  if (players.length < 2) throw new Error('A Round requires at least 2 players')
  if (players.length > 10) throw new Error('A Round allows at most 10 players')

  let drawDeck = withDeckView(deckShuffle(createInitialDeck(), shuffler))
  let discardDeck = withDeckView(createEmptyDeck<Card>())
  let playerHands = List<PlayerHand>(
    Array.from({ length: players.length }, () => withHandView(createHand()))
  )

  for (let p = 0; p < players.length; p++) {
    for (let j = 0; j < (cardsPerPlay ?? 7); j++) {
      const [c, nd] = deckDeal(drawDeck)
      if (!c) throw new Error('Not enough cards')
      drawDeck = withDeckView(nd)
      playerHands = playerHands.update(p, (h) => withHandView(handAdd(h!, c)))
    }
  }

  let top: Card | undefined
  while (true) {
    const [card, rest] = deckDeal(drawDeck)
    if (!card) throw new Error('Not enough cards')

    if (isWild(card)) {
      drawDeck = withDeckView(deckShuffle(deckPutTop(rest, card), shuffler))
      continue
    }

    top = card
    drawDeck = withDeckView(rest)
    break
  }

  discardDeck = withDeckView(deckPutTop(discardDeck, top!))
  const currentColor = isColored(top!) ? top!.color : ''

  return {
    players,
    playerCount: players.length,
    currentPlayerIndex: dealer,
    discardDeck,
    drawDeck,
    playerHands,
    dealer,
    shuffler,
    cardsPerPlay,
    startResolved: false,
    currentDirection: 'clockwise',
    direction: 1,
    currentColor,
    resolving: false,
    lastActor: null,
    lastUnoSayer: null,
    pendingUnoAccused: null,
    unoProtectedForWindow: false,
    unoSayersSinceLastAction: new Set<number>(),
    playerInTurn: dealer,
  }
}

function resolveStart(s: Round): Round {
  if (s.startResolved) return s
  const top = deckTop(s.discardDeck)!
  const pc = s.playerCount
  const dir = s.direction

  const base = withState(s, {
    startResolved: true,
    currentColor: isColored(top) ? top.color : s.currentColor,
  })

  switch (top.type) {
    case 'DRAW': {
      const target = mod(base.dealer + dir, pc)
      const [, s2] = drawTo(base, target, 2)
      return setTurn(s2, mod(target + dir, pc))
    }
    case 'SKIP':
      return setTurn(base, mod(base.dealer + 2 * dir, pc))

    case 'REVERSE': {
      const ndir = -dir as Direction
      const base2 = withState(base, {
        direction: ndir,
        currentDirection: ndir === 1 ? 'clockwise' : 'counterclockwise',
      })
      const advance = pc === 2 ? 2 * ndir : ndir
      return setTurn(base2, mod(base.dealer + advance, pc))
    }

    default:
      return setTurn(base, mod(base.dealer + dir, pc))
  }
}

function drawTo(s: Round, p: number, n = 1): [void, Round] {
  let state = s

  for (let i = 0; i < n; i++) {
    let [card, nd] = deckDeal(state.drawDeck)

    // If draw deck is empty, reshuffle discard (minus top) into draw
    if (!card) {
      const top = deckTop(state.discardDeck)
      const underDeck = deckUnderTop(state.discardDeck)
      const under = deckToArray(underDeck)

      if (under.length === 0) throw new Error('No cards left to draw')

      let reshuffled = createDeckWithCards(under)
      if (state.shuffler) reshuffled = deckShuffle(reshuffled, state.shuffler)
      ;[card, nd] = deckDeal(reshuffled)
      if (!card) throw new Error('No cards left to draw')

      state = setDiscardDeck(
        state,
        top ? deckPutTop(createEmptyDeck<Card>(), top) : createEmptyDeck<Card>()
      )
    }

    state = setDrawDeck(state, nd)
    state = updatePlayerHand(state, p, (h) => handAdd(h, card!))
  }

  return [undefined, state]
}

export function player(state: Round, ix: number): string {
  if (ix < 0 || ix >= state.playerCount) {
    throw new Error('The player index is out of bounds')
  }
  return state.players[ix]
}

export function getHand(state: Round, ix: number): readonly Card[] {
  const hand = state.playerHands.get(ix)
  if (!hand) throw new Error('Hand not found')
  return handToArray(hand)
}

export function discardPile(state: Round): Deck<Card> {
  return state.discardDeck
}

export function drawPile(state: Round): Deck<Card> {
  return state.drawDeck
}

export function topOfDiscard(state: Round): Card | undefined {
  return deckTop(discardPile(state))
}

export function canPlayAny(state: Round): boolean {
  if (winner(state) !== undefined) return false
  const p = state.playerInTurn
  if (p === undefined) return false
  return getHand(state, p).some((_, ix) => canPlay(ix, state))
}

export function canPlay(cardIx: number, state: Round): boolean {
  if (winner(state) !== undefined) return false

  const p = state.playerInTurn ?? state.currentPlayerIndex
  const hand = state.playerHands.get(p)
  const size = hand ? hand.size() : 0
  if (cardIx < 0 || cardIx >= size) return false

  const top = deckTop(state.discardDeck)
  const played = getHand(state, p)[cardIx]

  const effectiveColor: Color | undefined =
    state.currentColor || (top && isColored(top) ? top.color : undefined)

  if (isColored(played)) {
    switch (top!.type) {
      case 'NUMBERED':
        if (played.type === 'NUMBERED') {
          const sameNumber =
          played.type === 'NUMBERED' &&
          isColored(top!) &&
          top!.type === 'NUMBERED' &&
          played.number === top!.number

        return played.color === effectiveColor || sameNumber
        }
        return played.color === effectiveColor
      case 'SKIP':
        return played.color === effectiveColor || played.type === 'SKIP'
      case 'DRAW':
        return played.color === effectiveColor || played.type === 'DRAW'
      case 'REVERSE':
        return played.color === effectiveColor || played.type === 'REVERSE'
      case 'WILD':
      case 'WILD_DRAW':
        return played.color === effectiveColor
    }
  } else {
    if (played.type === 'WILD') return true

    if (played.type === 'WILD_DRAW') {
      // must NOT have a card of the effective color
      if (!effectiveColor) {
        // no known color, be strict: only allow if hand has zero colored cards
        const hasAnyColored = handToArray(state.playerHands.get(p)!).some(
          isColored
        )
        return !hasAnyColored
      }
      const hasColor = handToArray(state.playerHands.get(p)!).some(
        (c) => isColored(c) && c.color === effectiveColor
      )
      return !hasColor
    }
  }
  return false
}

export function play(
  cardIx: number,
  askedColor: Color | undefined,
  state: Round
): Round {
  let s = ensureUnoState(state)
  if (winner(s) !== undefined)
    throw new Error('Cannot play after having a winner')

  const p = s.playerInTurn
  if (p === undefined) throw new Error("It's not any player's turn")

  const handArr = getHand(s, p)
  const handSizeNow = handArr.length

  if (handSizeNow === 0 || cardIx < 0 || cardIx >= handSizeNow) {
    throw new Error('Illegal play index')
  }

  if (s.pendingUnoAccused !== null && p !== s.pendingUnoAccused) {
    s = withState(s, { pendingUnoAccused: null, unoProtectedForWindow: false })
  }

  if (s.lastUnoSayer !== null && s.lastUnoSayer !== p) {
    s = withState(s, { lastUnoSayer: null })
  }

  const playedCard = handArr[cardIx]
  const wild = isWild(playedCard)

  if (askedColor && !wild) {
    throw new Error('Illegal play: Cannot ask for color on a colored card')
  }
  if (!askedColor && wild) {
    throw new Error(
      'Illegal play: Must choose a color when playing a wild card'
    )
  }

  if (!canPlay(cardIx, s)) {
    const top = deckTop(s.discardDeck)
    throw new Error(
      `Illegal play:\n${JSON.stringify(playedCard)}\n${JSON.stringify(top)}`
    )
  }

  if (handSizeNow === 2) {
    s = withState(s, {
      pendingUnoAccused: p,
      unoProtectedForWindow: s.unoSayersSinceLastAction.has(p),
      lastUnoSayer: null,
    })
  }

  // remove from hand
  s = updatePlayerHand(s, p, (h) => handRemove(h, playedCard))
  s = withState(s, { resolving: true })

  // push to discard and set color
  s = setDiscardDeck(s, deckPutTop(s.discardDeck, playedCard))
  s = withState(s, {
    currentColor: isColored(playedCard) ? playedCard.color : (askedColor ?? ''),
  })

  // Apply effects and advance
  const pc = s.playerCount
  const dir = s.direction
  const topNow = deckTop(s.discardDeck)!

  switch (topNow.type) {
    case 'NUMBERED':
    case 'WILD': {
      s = setTurn(s, mod(p + dir, pc))
      break
    }
    case 'DRAW': {
      const target = mod(p + dir, pc)
      const [, s2] = drawTo(s, target, 2)
      s = setTurn(s2, mod(target + dir, pc))
      break
    }
    case 'SKIP': {
      s = setTurn(s, mod(p + 2 * dir, pc))
      break
    }
    case 'REVERSE': {
      const ndir = -dir as Direction
      s = withState(s, {
        direction: ndir,
        currentDirection: ndir === 1 ? 'clockwise' : 'counterclockwise',
      })
      if (pc === 2) {
        s = setTurn(s, mod(p + 2 * ndir, pc))
      } else {
        s = setTurn(s, mod(p + ndir, pc))
      }
      break
    }
    case 'WILD_DRAW': {
      const target = mod(p + dir, pc)
      const [, s2] = drawTo(s, target, 4)
      s = setTurn(s2, mod(target + dir, pc))
      break
    }
  }

  s = withState(s, {
    lastActor: p,
    resolving: false,
    unoSayersSinceLastAction: new Set<number>(),
  })

  const w = winner(s)
  if (w !== undefined) {
    s = withState(s, {
      playerInTurn: undefined,
      currentPlayerIndex: -1 as unknown as number,
      resolving: false,
      unoSayersSinceLastAction: new Set<number>(),
      scored: false,
    })
  }
  return s
}

export function draw(state: Round): Round {
  let s = ensureUnoState(state)

  if (s.pendingUnoAccused !== null && s.playerInTurn !== s.pendingUnoAccused) {
    s = withState(s, { pendingUnoAccused: null, unoProtectedForWindow: false })
  }
  if (s.lastUnoSayer !== null && s.lastUnoSayer !== s.playerInTurn) {
    s = withState(s, { lastUnoSayer: null })
  }

  if (winner(s) !== undefined || s.playerInTurn === undefined)
    throw new Error('Cannot draw after having a winner')

  const p = s.playerInTurn

  let card: Card | undefined
  let rest: Deck<Card>
  ;[card, rest] = deckDeal(s.drawDeck)

  if (!card) {
    const top = deckTop(s.discardDeck)
    const underTop = deckUnderTop(s.discardDeck)
    if (deckSize(underTop) === 0) throw new Error('No cards left to draw')

    const reshuffled = s.shuffler ? deckShuffle(underTop, s.shuffler) : underTop
    ;[card, rest] = deckDeal(reshuffled)

    s = setDiscardDeck(
      s,
      top ? deckPutTop(createEmptyDeck<Card>(), top) : createEmptyDeck<Card>()
    )

    if (!card) throw new Error('No cards left to draw')
  }

  s = setDrawDeck(s, rest)
  s = updatePlayerHand(s, p, (h) => handAdd(h, card!))
  s = withState(s, { resolving: true, lastActor: p })

  if (deckSize(s.drawDeck) === 0) {
    const top = deckTop(s.discardDeck)
    const underTop = deckUnderTop(s.discardDeck)
    if (deckSize(underTop) > 0) {
      const reshuffled = s.shuffler
        ? deckShuffle(underTop, s.shuffler)
        : underTop
      s = setDiscardDeck(
        s,
        top ? deckPutTop(createEmptyDeck<Card>(), top) : createEmptyDeck<Card>()
      )
      s = setDrawDeck(s, reshuffled)
    }
  }

  const justDrawnIx = s.playerHands.get(p)!.size() - 1
  if (!canPlay(justDrawnIx, s)) {
    s = setTurn(s, mod(p + s.direction, s.playerCount))
  }

  s = withState(s, {
    resolving: false,
    unoSayersSinceLastAction: new Set<number>(),
  })

  return s
}

function ensureUnoState(state: Round): Round {
  return withState(state, {
    pendingUnoAccused: state.pendingUnoAccused ?? null,
    unoProtectedForWindow: state.unoProtectedForWindow ?? false,
    lastUnoSayer: state.lastUnoSayer ?? null,
    lastActor: state.lastActor ?? null,
    unoSayersSinceLastAction:
      state.unoSayersSinceLastAction ?? new Set<number>(),
  })
}

export function winner(state: Round): number | undefined {
  for (let i = 0; i < state.playerHands.size; i++) {
    const hand = withHandView(state.playerHands.get(i)!)
    if (hand.size() === 0) return i
  }
  return undefined
}

export function hasEnded(state: Round): boolean {
  return state.playerHands.some((h) => withHandView(h).size() === 0)
}

export function score(state: Round): number | undefined {
  const w = winner(state)
  if (w === undefined) return undefined

  let total = 0
  for (let i = 0; i < state.playerHands.size; i++) {
    if (i === w) continue
    const hand = state.playerHands.get(i)!
    total += handToArray(hand).reduce((acc: number, curr: Card) => {
      switch (curr.type) {
        case 'NUMBERED':
          return acc + curr.number
        case 'SKIP':
        case 'REVERSE':
        case 'DRAW':
          return acc + 20
        case 'WILD':
        case 'WILD_DRAW':
          return acc + 50
      }
    }, 0)
  }
  return total
}

export function sayUno(playerIx: number, state: Round): Round {
  let s = ensureUnoState(state)

  if (winner(s) !== undefined) {
    throw new Error('Cannot say UNO after having a winner')
  }
  if (playerIx < 0 || playerIx >= s.playerCount) {
    throw new Error('Player index out of bounds')
  }

  const updatedUnoSayers = new Set<number>(s.unoSayersSinceLastAction)
  updatedUnoSayers.add(playerIx)

  s = withState(s, {
    lastUnoSayer: playerIx,
    unoSayersSinceLastAction: updatedUnoSayers,
  })

  if (s.pendingUnoAccused === playerIx) {
    s = withState(s, { unoProtectedForWindow: true })
  }

  return s
}


export function catchUnoFailure(
  { accuser, accused }: { accuser: number; accused: number },
  state: Round
): Round {
  if (!checkUnoFailure({ accuser, accused }, state)) {
    return state
  }

  const [, afterDraw] = drawTo(state, accused, 4)

  return withState(afterDraw, {
    pendingUnoAccused: null,
    unoProtectedForWindow: false,
  })
}

export function checkUnoFailure(
  { accuser, accused }: { accuser: number; accused: number },
  state: Round
): boolean {
  if (accused < 0) throw new Error('Accused cannot be negative')
  if (accused >= state.playerCount)
    throw new Error('Accused cannot be beyond the player count')

  if (state.pendingUnoAccused !== accused || state.pendingUnoAccused === null)
    return false
  if (state.unoProtectedForWindow) return false
  if (state.playerHands.get(accused)!.size() !== 1) return false

  return true
}
