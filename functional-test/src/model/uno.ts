import { Randomizer, Shuffler, standardRandomizer, standardShuffler } from "../utils/random_utils";
import { Card } from "./deck";
import { createRound, hasEnded, Round, score, winner } from "./round";

export type Game = Readonly<{
  readonly playerCount: number
  readonly targetScore: number
  readonly players: ReadonlyArray<string>;   
  readonly scores: ReadonlyArray<number>;          
  readonly currentRound: Round | undefined
  readonly randomizer: Randomizer
  readonly shuffler: Shuffler<Card>
  readonly cardsPerPlayer: number
  readonly winner: number | undefined  // index, not name
}>

export type Props = Readonly<{
  readonly players: ReadonlyArray<string>;
  readonly targetScore: number
  readonly randomizer: Randomizer
  readonly shuffler: Shuffler<Card>
  readonly cardsPerPlayer: number
}>

type RoundStep = (r: Round) => Round;

export function createGame(props: Partial<Props>): Game {
  const players = props.players ?? ['A', 'B'];
  const targetScore = props.targetScore ?? 500;
  const cardsPerPlayer = props.cardsPerPlayer ?? 7;
  const randomizer: Randomizer = props.randomizer ?? standardRandomizer;
  const shuffler: Shuffler<Card> = props.shuffler ?? standardShuffler;

  if (players.length < 2) throw new Error("A Game requires at least 2 players");
  if (targetScore <= 0) throw new Error("A Game requires a target score of more than 0");
  if (cardsPerPlayer <= 0) throw new Error("A Game requires dealing at least 1 card per player");

  const playerCount = players.length;
  const scores: ReadonlyArray<number> = Array(playerCount).fill(0);

  const dealer = randomizer(playerCount);
  const currentRound = createRound([...players], dealer, shuffler, cardsPerPlayer);

  return {
    playerCount,
    targetScore,
    players,
    scores,
    currentRound,
    randomizer,
    shuffler,
    cardsPerPlayer,
    winner: undefined
  } as const;
}

export function player(ix: number, g: Game): string {
  if (ix < 0 || ix >= g.playerCount) throw new Error("Player index is out of bounds");
  return g.players[ix];
}

// uno.ts
export function resolveRoundEnd(g: Game): Game {
  const r = g.currentRound;
  if (!r) return g;

  const w = winner(r);
  if (w === undefined) return g;
  if (r.scored) return g;

  const pts = score(r) ?? 0;
  const newScores = g.scores.map((s, i) => (i === w ? s + pts : s));

  const scoredRound = { ...r, scored: true } as Round;

  if (newScores[w] >= g.targetScore) {
    return { ...g, scores: newScores, currentRound: undefined, winner: w };
  }

  return startNewRound({ ...g, scores: newScores, currentRound: scoredRound });
}



export function play(step: RoundStep, g: Game): Game {
  if (!g.currentRound) throw new Error("No active round to play");
  const nextRound = step(g.currentRound);
  return resolveRoundEnd({ ...g, currentRound: nextRound });
}

export function startNewRound(g: Game): Game {
  const dealer = g.randomizer(g.playerCount);
  const newRound = createRound([...g.players], dealer, g.shuffler, g.cardsPerPlayer);
  return { ...g, currentRound: newRound };
}
