import { Shuffler } from "../utils/random_utils";
import { List } from "immutable";
import { Deck, Card, Color, isColored, createInitialDeck, createEmptyDeck, isWild } from "./deck";
import { PlayerHand } from "./player_hand";
import { mod } from "../utils/mod";
import { withState } from "../utils/updater";

export type Direction = 1 | -1;
export type Round = Readonly<{
  playerCount: number;
  players: ReadonlyArray<string>;
  currentPlayerIndex: number;
  discardDeck: Deck;
  drawDeck: Deck;
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
}>;

export function createRound(
  players: string[],
  dealer: number,
  shuffler: Shuffler<Card>,
  cardsPerPlay: number): Round {
  const initialState = makeRoundState(players, dealer, shuffler, cardsPerPlay)
  return resolveStart(initialState)
}
function setTurn(s: Round, idx: number): Round {
  return withState(s, { currentPlayerIndex: idx, playerInTurn: idx });
}

function makeRoundState(
  players: string[],
  dealer: number,
  shuffler: Shuffler<Card>,
  cardsPerPlay: number
): Round {
  if (players.length < 2) throw new Error("A Round requires at least 2 players")
  if (players.length > 10) throw new Error("A Round allows at most 10 players")

  let drawDeck = createInitialDeck().shuffle(shuffler);
  const discardDeck = createEmptyDeck();
  let playerHands = List<PlayerHand>(Array.from({ length: players.length }, () => new PlayerHand(List())));

  // deal cards to all players
  for (let p = 0; p < players.length; p++) {
    for (let j = 0; j < (cardsPerPlay ?? 7); j++) {
      const [c, nd] = drawDeck.deal();
      if (!c) throw new Error("Not enough cards");
      drawDeck = nd;
      playerHands = playerHands.update(p, h => (h ?? new PlayerHand(List())).add(c));
    }
  }

  // flip non-wild starter
  let top: Card | undefined;
  while (true) {
    const [card, rest] = drawDeck.deal();
    if (!card) throw new Error("Not enough cards");

    if (isWild(card)) {
      drawDeck = rest.putCardOnTop(card).shuffle(shuffler);
      continue;
    }

    top = card;
    drawDeck = rest;
    break;
  }
  const seededDiscard = discardDeck.putCardOnTop(top!);
  const currentColor = isColored(top!) ? top!.color : "";

  return {
    players,
    playerCount: players.length,
    currentPlayerIndex: dealer, // this is only for the creation, the currentPlayerIndex will change in the first action
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
  const top = s.discardDeck.top()!;
  const pc = s.playerCount;
  const dir = s.direction;

  const base = withState(s, {
    startResolved: true,
    currentColor: isColored(top) ? top.color : s.currentColor,
  });

  switch (top.type) {
    case "DRAW": {
      const target = mod(base.dealer + dir, pc);
      const [, s2] = drawTo(base, target, 2);
      return setTurn(s2, mod(target + dir, pc));
    }
    case "SKIP":
      return setTurn(base, mod(base.dealer + 2 * dir, pc));
    case "REVERSE": {
      const ndir = (-dir) as Direction;
      return setTurn(withState(base, {
        direction: ndir,
        currentDirection: ndir === 1 ? "clockwise" : "counterclockwise",
      }), mod(base.dealer + ndir, pc));
    }
    default:
      return setTurn(base, mod(base.dealer + dir, pc));
  }
}


function drawTo(s: Round, p: number, n = 1): [void, Round] {
  let state = s
  for (let i = 0; i < n; i++) {
    let [card, nd] = state.drawDeck.deal()
    if (!card) {
      const top = state.discardDeck.top()
      const underDeck = state.discardDeck.getDeckUnderTop()
      const under = underDeck.getDeck()
      if (!under || under.size === 0) throw new Error("No cards left to draw")
      let reshuffled = new Deck(under)
      if (state.shuffler) reshuffled = reshuffled.shuffle(state.shuffler)
        ;[card, nd] = reshuffled.deal()
      if (!card) throw new Error("No cards left to draw")
      state = withState(state, { discardDeck: new Deck(top ? List([top]) : List()) })
    }
    state = withState(state, {
      drawDeck: nd,
      playerHands: state.playerHands.update(p, h => (h ?? new PlayerHand(List())).add(card!)),
    })
  }
  return [undefined, state]
}

export function player(state: Round, ix: number): string {
  if (ix < 0 || ix >= state.playerCount) {
    throw new Error("The player index is out of bounds")
  }
  return state.players[ix]
}

export function playerHand(state: Round, ix: number|undefined): Card[] {
  return state.playerHands.get(ix!)?.getPlayerHand().toArray()!
}

export function discardPile(state: Round): Deck {
  return state.discardDeck;
}

export function drawPile(state: Round): Deck {
  return state.drawDeck;
}

export function topOfDiscard(state: Round): Card | undefined {
  return discardPile(state).top()
}

export function canPlayAny(state: Round): boolean {
  if (winner(state) !== undefined) {
    return false
  }
  const p = state.playerInTurn;
  if (p === undefined) return false;
  return playerHand(state, p).some((_, ix) => canPlay(ix, state));
}
export function canPlay(cardIx: number, state: Round): boolean {
  if (winner(state) !== undefined) {
    return false
  }
  const p = state.currentPlayerIndex;
  const hand = state.playerHands.get(p)
  const size = hand?.size() ?? 0
  if (cardIx < 0 || cardIx >= size!) return false;
  const top = state.discardDeck.top()
  const played = playerHand(state, p)[cardIx]
  const effectiveColor = state.currentColor

  if (isColored(played)) {
    switch (top!.type) {
      case 'NUMBERED':
        if (played.type === 'NUMBERED') {
          return played.color === effectiveColor || played.number === (isColored(top!) ? top.number : -1);
        }
        return played.color === effectiveColor;

      case 'SKIP':
        return played.color === effectiveColor || played.type === 'SKIP';

      case 'DRAW':
        return played.color === effectiveColor || played.type === 'DRAW';

      case 'REVERSE':
        return played.color === effectiveColor || played.type === 'REVERSE';

      case 'WILD':
      case 'WILD DRAW':
        return played.color === effectiveColor;
    }
  } else {
    if (played.type === 'WILD') {
      return true;
    }
    if (played.type === 'WILD DRAW') {
      if (effectiveColor) {
        return !hand!.hasColor(effectiveColor);
      }
      return true;
    }
  }
  return false;
}

export function play(cardIx: number, askedColor: Color | undefined, state: Round): Round {
  let s = ensureUnoState(state);

  if (winner(s) !== undefined) {
    throw new Error("Cannot play after having a winner");
  }

  const p = s.playerInTurn;
  if(p===undefined){
    throw new Error("It's not any player's turn");
  }
  const handArr = playerHand(s, p);
  const handSize = handArr.length;

  if (handSize === 0 || cardIx < 0 || cardIx >= handSize) {
    throw new Error("Illegal play index");
  }

  if (s.pendingUnoAccused !== null && p !== s.pendingUnoAccused) {
    s = withState(s, { pendingUnoAccused: null, unoProtectedForWindow: false });
  }

  if (s.lastUnoSayer !== null && s.lastUnoSayer !== p) {
    s = withState(s, { lastUnoSayer: null });
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
    const top = s.discardDeck.top();
    throw new Error(`Illegal play:\n${JSON.stringify(playedCard)}\n${JSON.stringify(top)}`);
  }

  if (handSize === 2) {
    s = withState(s, {
      pendingUnoAccused: p,
      unoProtectedForWindow: s.unoSayersSinceLastAction.has(p),
      lastUnoSayer: null,
    });
  }

  s = withState(s, {
    playerHands: s.playerHands.update(p, h => (h ?? new PlayerHand(List())).remove(playedCard)),
    resolving: true,
  });

  s = withState(s, {
    discardDeck: s.discardDeck.putCardOnTop(playedCard),
    currentColor: isColored(playedCard) ? playedCard.color : (askedColor ?? ""),
  });

  // Applying card effects and advance turn
  const pc = s.playerCount;
  const dir = s.direction;
  const topNow = s.discardDeck.top()!;

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
      s = withState(s, {
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
    case "WILD DRAW": {
      const target = mod(p + dir, pc);
      const [, s2] = drawTo(s, target, 4);
      s = setTurn(s2, mod(target + dir, pc));
      break;
    }
  }

  s = withState(s, {
    lastActor: p,
    resolving: false,
    unoSayersSinceLastAction: new Set<number>(),
  });

  const w = winner(s);
  if (w !== undefined) {
    s = withState(s, { playerInTurn: undefined, resolving: false, unoSayersSinceLastAction: new Set<number>() });
    return s;
  }
  return s;
}

export function draw(state: Round): Round {
  let s = ensureUnoState(state);

  if (s.pendingUnoAccused !== null && s.playerInTurn !== s.pendingUnoAccused) {
    s = withState(s, { pendingUnoAccused: null, unoProtectedForWindow: false });
  }
  if (s.lastUnoSayer !== null && s.lastUnoSayer !== s.playerInTurn) {
    s = withState(s, { lastUnoSayer: null });
  }

  if (winner(s) !== undefined || s.playerInTurn===undefined) throw new Error("Cannot draw after having a winner");

  const p = s.playerInTurn;

  // ---- 1) Try to deal; if empty-before-deal, reshuffle-under-top, then deal ----
  let card: Card | undefined;
  let rest: Deck<Card>;
  [card, rest] = s.drawDeck.deal();

  if (!card) {
    const top = s.discardDeck.top();
    const underTop = s.discardDeck.getDeckUnderTop();
    if (underTop.length === 0) throw new Error("No cards left to draw");

    const reshuffled = s.shuffler ? underTop.shuffle(s.shuffler) : underTop;
    [card, rest] = reshuffled.deal();

    s = withState(s, {
      discardDeck: top ? createEmptyDeck().putCardOnTop(top) : createEmptyDeck(),
    });

    if (!card) throw new Error("No cards left to draw");
  }

  s = withState(s, {
    drawDeck: rest,
    playerHands: s.playerHands.update(p, h => (h ?? new PlayerHand(List())).add(card!)),
    resolving: true,
    lastActor: p,
  });

  // ---- 2) If we just drew the last card, pre-reshuffle for the NEXT player ----
  if (s.drawDeck.size === 0) {
    const top = s.discardDeck.top();
    const underTop = s.discardDeck.getDeckUnderTop();
    if (underTop.length > 0) {
      const reshuffled = s.shuffler ? underTop.shuffle(s.shuffler) : underTop;
      s = withState(s, {
        discardDeck: top ? createEmptyDeck().putCardOnTop(top) : createEmptyDeck(),
        drawDeck: reshuffled,
      });
    }
  }

  const justDrawnIx = s.playerHands.get(p)!.size() - 1;
  if (!canPlay(justDrawnIx, s)) {
    s = setTurn(s, mod(p + s.direction, s.playerCount));
  }

  s = withState(s, {
    resolving: false,
    unoSayersSinceLastAction: new Set<number>(),
  });

  return s;
}



function ensureUnoState(state: Round): Round {
  return withState(state, {
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
    if (hand!.size() == 0) {
      return i
    }
  }
  return undefined
}

export function hasEnded(state: Round): boolean {
  return state.playerHands.some(h => h.size() === 0)
}

export function score(state: Round): number | undefined {
  const w = winner(state)
  if (w === undefined) return undefined
  let total = 0
  for (let i = 0; i < state.playerHands.size; i++) {
    if (i === w) continue
    const hand = state.playerHands.get(i)
    total += hand!.getPlayerHand().reduce((acc, curr) => {
      switch (curr.type) {
        case 'NUMBERED':
          return acc + curr.number
        case 'SKIP':
        case 'REVERSE':
        case 'DRAW':
          return acc + 20
        case 'WILD':
        case 'WILD DRAW':
          return acc + 50
      }
    }, 0)
  }
  return total
}

export function sayUno(playerIx: number, state: Round): Round {
  let s = ensureUnoState(state);

  if (winner(s) !== undefined) {
    throw new Error("Cannot say UNO after having a winner");
  }
  if (playerIx < 0 || playerIx >= s.playerCount) {
    throw new Error("Player index out of bounds");
  }

  s = withState(s, {
    lastUnoSayer: playerIx,
    unoSayersSinceLastAction: new Set<number>([...s.unoSayersSinceLastAction, playerIx])
  })
  if (s.pendingUnoAccused === playerIx) {
    s = withState(s, {
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

  return withState(afterDraw, {
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
  if (state.playerHands.get(accused)!.size() !== 1) return false;

  return true;
}