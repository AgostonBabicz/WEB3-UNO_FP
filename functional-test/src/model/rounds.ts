import { Shuffler } from "../utils/random_utils";
import { List } from "immutable";
import { Deck, Card, Color, isColored, createInitialDeck } from "./deck";
import { PlayerHand } from "./player_hand";
import { mod } from "../utils/mod";
import { withState } from "../utils/updater";

export type Direction = 1 | -1;
export type RoundState = Readonly<{
  players: ReadonlyArray<string>;
  playerCount: number;
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
}>;


function makeRoundState(
  players: string[],
  dealer: number,
  shuffler: Shuffler<Card>,
  cardsPerPlay: number
): RoundState {
  if (players.length < 2) throw new Error("A Round requires at least 2 players")
  if (players.length > 10) throw new Error("A Round allows at most 10 players")

  let drawDeck = createInitialDeck().shuffle(shuffler);
  const discardDeck = new Deck(List<Card>());
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
    const deal = drawDeck.deal();
    if (!deal[0]) throw new Error("Not enough cards");
    [top, drawDeck] = deal;
    if (top!.type === "WILD" || top!.type === "WILD DRAW") {
      drawDeck = new Deck(drawDeck.getDeck().unshift(top!)).shuffle(shuffler);
      continue;
    }
    break;
  }
  const seededDiscard = new Deck(discardDeck.getDeck().unshift(top!));
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
  };
}

function resolveStart(s: RoundState): RoundState {
  if (s.startResolved) return s
  const top = s.discardDeck.top()!
  const pc = s.playerCount
  const dir = s.direction

  const base = withState(s, {
    startResolved: true,
    currentColor: isColored(top) ? top.color : s.currentColor,
  })

  switch (top.type) {
    case "DRAW": {
      const target = mod(base.dealer + dir, pc)
      const [, s2] = drawTo(base, target, 2)
      return withState(s2, { currentPlayerIndex: mod(target + dir, pc) })
    }
    case "SKIP":
      return withState(base, { currentPlayerIndex: mod(base.dealer + 2 * dir, pc) })
    case "REVERSE": {
      const ndir = -dir as Direction
      return withState(base, {
        direction: ndir,
        currentDirection: ndir === 1 ? "clockwise" : "counterclockwise",
        currentPlayerIndex: mod(base.dealer + ndir, pc),
      })
    }
    default:
      return withState(base, { currentPlayerIndex: mod(base.dealer + dir, pc) })
  }
}

function drawTo(s: RoundState, p: number, n = 1): [void, RoundState] {
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
      playerHands: state.playerHands.update(p, h => h.add(card!)),
    })
  }
  return [undefined, state]
}