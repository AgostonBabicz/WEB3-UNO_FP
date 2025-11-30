import { Shuffler } from "../utils/random_utils";
import { List } from "immutable";
import { Deck, Card, Color, isColored, createInitialDeck, createEmptyDeck, isWild, createDeckWithCards, shuffle, deal, putCardOnTop,top, getDeckUnderTop,toArray  } from "./deck";
import { add, createHand, PlayerHand, toCardsArray, remove } from "./player_hand";
import { mod } from "../utils/mod";
import { shallowCopy } from "../utils/updater";

export type Direction = 1 | -1;
export type Round = Readonly<{
  playerCount: number;
  players: ReadonlyArray<string>;
  currentPlayerIndex: number;
  discardDeck: Deck<Card>;
  drawDeck: Deck<Card>;
  playerHands: List<PlayerHand>;
  dealer: number;
  shuffler?: Shuffler<Card>;
  cardsPerPlay?: number;
  startResolved: boolean;
  currentDirection: "clockwise" | "counterclockwise";
  direction: Direction;
  currentColor: "" | Color;
  resolving: boolean;
  lastActor: number | null;
  lastUnoSayer: number | null;
  pendingUnoAccused: number | null;
  unoProtectedForWindow: boolean;
  unoSayersSinceLastAction: Set<number>;
  playerInTurn: number | undefined;
  scored?: boolean; 
}>;

export function createRound(
  players: ReadonlyArray<string>,
  dealer: number,
  shuffler: Shuffler<Card>,
  cardsPerPlay: number): Round {
  const initialState = wrapRound(players, dealer, shuffler, cardsPerPlay)
  return resolveStart(initialState)
}

function setTurn(s: Round, idx: number): Round {
  return shallowCopy(s, { currentPlayerIndex: idx, playerInTurn: idx });
}

function wrapRound(
  players: ReadonlyArray<string>,
  dealer: number,
  shuffler: Shuffler<Card>,
  cardsPerPlay: number
): Round {
  // if (players.length < 2) throw new Error("A Round requires at least 2 players")
  if (players.length > 10) throw new Error("A Round allows at most 10 players")

  let drawDeck = createInitialDeck();
  drawDeck = shuffle(drawDeck, shuffler)
  const discardDeck = createEmptyDeck();
  let playerHands = List<PlayerHand>(Array.from({ length: players.length }, () => createHand()));

  for (let p = 0; p < players.length; p++) {
    for (let j = 0; j < (cardsPerPlay ?? 7); j++) {
      const [c, nd] = deal(drawDeck);
      if (!c) throw new Error("Not enough cards");
      drawDeck = nd;
      playerHands = playerHands.update(p, h => add(h as PlayerHand, c));
    }
  }

  let top: Card | undefined;
  while (true) {
    const [card, rest] = deal(drawDeck);
    if (!card) throw new Error("Not enough cards");

    if (isWild(card)) {
      drawDeck = putCardOnTop(rest,card)
      drawDeck = shuffle(drawDeck,shuffler)
      continue;
    }

    top = card;
    drawDeck = rest;
    break;
  }
  const seededDiscard = putCardOnTop(discardDeck,top!)
  const currentColor = isColored(top!) ? top!.color : "";

  return {
    players,
    playerCount: players.length,
    currentPlayerIndex: dealer, 
    discardDeck: seededDiscard,
    drawDeck,
    playerHands,
    dealer,
    shuffler,
    cardsPerPlay,
    startResolved: false,
    currentDirection: "clockwise",
    direction: 1,
    currentColor,
    resolving: false,
    lastActor: null,
    lastUnoSayer: null,
    pendingUnoAccused: null,
    unoProtectedForWindow: false,
    unoSayersSinceLastAction: new Set<number>(),
    playerInTurn: dealer,
  };
}

function resolveStart(s: Round): Round {
  if (s.startResolved) return s;
  const topCard = top(s.discardDeck)!;
  const pc = s.playerCount;
  const dir = s.direction;

  const base = shallowCopy(s, {
    startResolved: true,
    currentColor: isColored(topCard) ? topCard.color : s.currentColor,
  });

  switch (topCard.type) {
    case "DRAW": {
      const target = mod(base.dealer + dir, pc);
      const [, s2] = drawTo(base, target, 2);
      return setTurn(s2, mod(target + dir, pc));
    }
    case "SKIP":
      return setTurn(base, mod(base.dealer + 2 * dir, pc));

    case "REVERSE": {
      const ndir = (-dir) as Direction;
      const base2 = shallowCopy(base, {
        direction: ndir,
        currentDirection: ndir === 1 ? "clockwise" : "counterclockwise",
      });
      const advance = pc === 2 ? 2 * ndir : ndir;
      return setTurn(base2, mod(base.dealer + advance, pc));
    }

    default:
      return setTurn(base, mod(base.dealer + dir, pc));
  }
}



function drawTo(s: Round, p: number, n = 1): [void, Round] {
  let currentState = s;

  for (let i = 0; i < n; i++) {
    let card: Card | undefined;
    let nd: Deck<Card>;

    [card, nd] = deal(currentState.drawDeck);

    if (!card) {
      const topCard = top(currentState.discardDeck);
      const underDeck = getDeckUnderTop(currentState.discardDeck);

      if (underDeck.size === 0) throw new Error("No cards left to draw");

      let reshuffled = createDeckWithCards(toArray(underDeck));
      if (currentState.shuffler) reshuffled = shuffle(reshuffled, currentState.shuffler);

      [card, nd] = deal(reshuffled); 

      if (!card) throw new Error("No cards left to draw");

      currentState = shallowCopy(currentState, {
        discardDeck: topCard ? putCardOnTop(createEmptyDeck(), topCard) : createEmptyDeck(),
        drawDeck: nd
      });
    } else {
      currentState = shallowCopy(currentState, { drawDeck: nd });
    }

    currentState = shallowCopy(currentState, {
      playerHands: currentState.playerHands.update(
        p,
        h => add(h as PlayerHand, card!)
      ),
    });
  }

  return [undefined, currentState];
}

export function player(state: Round, ix: number): string {
  if (ix < 0 || ix >= state.playerCount) {
    throw new Error("The player index is out of bounds")
  }
  return state.players[ix]
}


export function getHand(state: Round, ix: number): readonly Card[] {
  const hand = state.playerHands.get(ix);
  if (!hand) throw new Error("Hand not found");
  return toCardsArray(hand);
}


export function discardPile(state: Round): Deck<Card> {
  return state.discardDeck;
}

export function drawPile(state: Round): Deck<Card> {
  return state.drawDeck;
}

export function topOfDiscard(state: Round): Card | undefined {
  return top(discardPile(state))
}

export function canPlayAny(state: Round): boolean {
  if (winner(state) !== undefined) return false;
  const p = state.playerInTurn;
  if (p === undefined) return false;
  return getHand(state, p).some((_, ix) => canPlay(ix, state));
}

export function canPlay(cardIx: number, state: Round): boolean {
  if (winner(state) !== undefined) return false;

  const p = state.playerInTurn ?? state.currentPlayerIndex;

  const hand = state.playerHands.get(p);
  const size = toCardsArray(hand!).length;
  if (cardIx < 0 || cardIx >= size) return false;

  const topCard = top(state.discardDeck);
  const played = getHand(state, p)[cardIx]; 
  const effectiveColor = state.currentColor;
  const tCard = topCard!;

  if (isColored(played)) {
    switch (tCard.type) {
      case 'NUMBERED':
        if (played.type === 'NUMBERED') {
          return (
            played.color === effectiveColor ||
            (tCard.type === 'NUMBERED' && played.number === tCard.number)
          );
        }
        return played.color === effectiveColor;

      case 'SKIP':    return played.color === effectiveColor || played.type === 'SKIP';
      case 'DRAW':    return played.color === effectiveColor || played.type === 'DRAW';
      case 'REVERSE': return played.color === effectiveColor || played.type === 'REVERSE';
      case 'WILD':
      case 'WILD_DRAW':
        return played.color === effectiveColor;
    }
  } else {
    if (played.type === 'WILD') return true

    if (played.type === 'WILD_DRAW') {
      if (!effectiveColor) {
        const hasAnyColored = toCardsArray(state.playerHands.get(p)!).some(
          isColored
        )
        return !hasAnyColored
      }
      const hasColor = toCardsArray(state.playerHands.get(p)!).some(
        (c) => isColored(c) && c.color === effectiveColor
      )
      return !hasColor
    }
  }
  return false;
}



export function play(cardIx: number, askedColor: Color | undefined, state: Round): Round {
  let s = ensureUnoState(state);
  if (winner(s) !== undefined) throw new Error("Cannot play after having a winner");

  const p = s.playerInTurn;
  if (p === undefined) throw new Error("It's not any player's turn");

  const handArr = getHand(s, p);
  const handSize = handArr.length;

  if (handSize === 0 || cardIx < 0 || cardIx >= handSize) {
    throw new Error("Illegal play index");
  }

  if (s.pendingUnoAccused !== null && p !== s.pendingUnoAccused) {
    s = shallowCopy(s, { pendingUnoAccused: null, unoProtectedForWindow: false });
  }

  if (s.lastUnoSayer !== null && s.lastUnoSayer !== p) {
    s = shallowCopy(s, { lastUnoSayer: null });
  }

  const playedCard = handArr[cardIx];
  const wild = isWild(playedCard);

  if (askedColor && !wild) {
    throw new Error("Illegal play: Cannot ask for color on a colored card");
  }
  if (!askedColor && wild) {
    throw new Error("Illegal play: Must choose a color when playing a wild card");
  }

  if (!canPlay(cardIx, s)) {
    const topCard = top(s.discardDeck)
    throw new Error(`Illegal play:\n${JSON.stringify(playedCard)}\n${JSON.stringify(topCard)}`);
  }

  if (handSize === 2) {
    s = shallowCopy(s, {
      pendingUnoAccused: p,
      unoProtectedForWindow: s.unoSayersSinceLastAction.has(p),
      lastUnoSayer: null,
    });
  }

  s = shallowCopy(s, {
    playerHands: s.playerHands.update(p, h => remove(h as PlayerHand, playedCard)),
    resolving: true,
  });

  s = shallowCopy(s, {
    discardDeck: putCardOnTop(s.discardDeck,playedCard),
    currentColor: isColored(playedCard) ? playedCard.color : (askedColor),
  });

  const pc = s.playerCount;
  const dir = s.direction;
  const topNow = top(s.discardDeck)!;

  switch (topNow.type) {
    case "NUMBERED":
    case "WILD": {
      s = setTurn(s, mod(p + dir, pc));
      break;
    }
    case "DRAW": {
      const target = mod(p + dir, pc);
      const [, s2] = drawTo(s, target, 2);
      s = setTurn(s2, mod(target + dir, pc));
      break;
    }
    case "SKIP": {
      s = setTurn(s, mod(p + 2 * dir, pc));
      break;
    }
    case "REVERSE": {
      const ndir = (-dir) as Direction;
      s = shallowCopy(s, {
        direction: ndir,
        currentDirection: ndir === 1 ? "clockwise" : "counterclockwise",
      });
      if (pc === 2) {
        s = setTurn(s, mod(p + 2 * ndir, pc));
      } else {
        s = setTurn(s, mod(p + ndir, pc));
      }
      break;
    }
    case "WILD_DRAW": {
      const target = mod(p + dir, pc);
      const [, s2] = drawTo(s, target, 4);
      s = setTurn(s2, mod(target + dir, pc));
      break;
    }
  }

  s = shallowCopy(s, {
    lastActor: p,
    resolving: false,
    unoSayersSinceLastAction: new Set<number>(),
  });

  const w = winner(s);
  if (w !== undefined) {
    s = shallowCopy(s, {
      playerInTurn: undefined,
      currentPlayerIndex: -1 as unknown as number,
      resolving: false,
      unoSayersSinceLastAction: new Set<number>(),
      scored: false,
    });
  }
  return s;
}

export function draw(state: Round): Round {
  let s = ensureUnoState(state);

  if (s.pendingUnoAccused !== null && s.playerInTurn !== s.pendingUnoAccused) {
    s = shallowCopy(s, { pendingUnoAccused: null, unoProtectedForWindow: false });
  }
  if (s.lastUnoSayer !== null && s.lastUnoSayer !== s.playerInTurn) {
    s = shallowCopy(s, { lastUnoSayer: null });
  }

  if (winner(s) !== undefined || s.playerInTurn === undefined) throw new Error("Cannot draw after having a winner");

  const p = s.playerInTurn;

  let card: Card | undefined;
  let rest: Deck<Card>;
  [card, rest] = deal(s.drawDeck)

  if (!card) {
    const topCard = top(s.discardDeck);
    const underTop = getDeckUnderTop(s.discardDeck)
    if (underTop.size === 0) throw new Error("No cards left to draw");

    let reshuffled = s.shuffler ? shuffle(underTop,s.shuffler) : underTop;
    [card, rest] = deal(reshuffled)

    s = shallowCopy(s, {
      discardDeck: topCard ? putCardOnTop(createEmptyDeck(),topCard) : createEmptyDeck(),
      drawDeck:rest
    });

    if (!card) throw new Error("No cards left to draw");
  }

  s = shallowCopy(s, {
    drawDeck: rest,
    playerHands: s.playerHands.update(p, h => add(h as PlayerHand, card!)),
    resolving: true,
    lastActor: p,
  });

  if (s.drawDeck.size === 0) {
    const topCard = top(s.discardDeck)
    const underTop = getDeckUnderTop(s.discardDeck);
    if (underTop.size > 0) {
      const reshuffled = s.shuffler ? shuffle(underTop,s.shuffler) : underTop;
      s = shallowCopy(s, {
        discardDeck: topCard ? putCardOnTop(createEmptyDeck(),topCard) : createEmptyDeck(),
        drawDeck: reshuffled,
      });
    }
  }

  const justDrawnIx = toCardsArray(s.playerHands.get(p)!).length - 1;
  if (!canPlay(justDrawnIx, s)) {
    s = setTurn(s, mod(p + s.direction, s.playerCount));
  }

  s = shallowCopy(s, {
    resolving: false,
    unoSayersSinceLastAction: new Set<number>(),
  });

  return s;
}



function ensureUnoState(state: Round): Round {
  return shallowCopy(state, {
    pendingUnoAccused: state.pendingUnoAccused ?? null,
    unoProtectedForWindow: state.unoProtectedForWindow ?? false,
    lastUnoSayer: state.lastUnoSayer ?? null,
    lastActor: state.lastActor ?? null,
    unoSayersSinceLastAction: state.unoSayersSinceLastAction ?? new Set<number>(),
  });
}

export function winner(state: Round): number | undefined {
  for (let i = 0; i < state.playerHands.size; i++) {
    const hand: PlayerHand | undefined = state.playerHands.get(i)
    if (toCardsArray(hand!).length === 0) {
      return i
    }
  }
  return undefined
}

export function hasEnded(state: Round): boolean {
  return state.playerHands.some(h => toCardsArray(h).length === 0);
}

export function score(state: Round): number | undefined {
  const w = winner(state);
  if (w === undefined) return undefined;

  let total = 0;
  for (let i = 0; i < state.playerHands.size; i++) {
    if (i === w) continue;
    const hand = state.playerHands.get(i)!;
    total += toCardsArray(hand).reduce((acc, curr) => {
      switch (curr.type) {
        case 'NUMBERED':  return acc + curr.number;
        case 'SKIP':
        case 'REVERSE':
        case 'DRAW':      return acc + 20;
        case 'WILD':
        case 'WILD_DRAW': return acc + 50;
      }
    }, 0);
  }
  return total;
}


export function sayUno(playerIx: number, state: Round): Round {
  let s = ensureUnoState(state);

  if (winner(s) !== undefined) {
    throw new Error("Cannot say UNO after having a winner");
  }
  if (playerIx < 0 || playerIx >= s.playerCount) {
    throw new Error("Player index out of bounds");
  }

  const newSet = new Set(s.unoSayersSinceLastAction).add(playerIx);

  s = shallowCopy(s, {
    lastUnoSayer: playerIx,
    unoSayersSinceLastAction: newSet 
  })
  if (s.pendingUnoAccused === playerIx) {
    s = shallowCopy(s, {
      unoProtectedForWindow: true
    })
  }
  return s
}


export function catchUnoFailure({ accuser, accused }: { accuser: number; accused: number }, state: Round): Round {
  if (!checkUnoFailure({ accuser, accused }, state)) {
    return state;
  }

  const [, afterDraw] = drawTo(state, accused, 4);

  return shallowCopy(afterDraw, {
    pendingUnoAccused: null,
    unoProtectedForWindow: false,
  });
}


export function checkUnoFailure({ accuser, accused }: { accuser: number, accused: number }, state: Round): boolean {
  if (accused < 0) {
    throw new Error("Accused cannot be negative");
  }
  if (accused >= state.playerCount) {
    throw new Error("Accused cannot be beyond the player count")
  }

  if (state.pendingUnoAccused !== accused || state.pendingUnoAccused === null) return false;
  if (state.unoProtectedForWindow) return false;
  if (toCardsArray(state.playerHands.get(accused)!).length !== 1) return false;

  return true;
}