import { Card } from '../types/deck.types'
import { Round } from '../types/round.types'
import { Props, Game } from '../types/uno.types'
import { Randomizer, Shuffler, standardRandomizer, standardShuffler } from '../utils/random_utils'
import { createRound, winner, score } from './round'

type RoundStep = (r: Round) => Round

export function createGame(props: Partial<Props>): Game {
  const players = props.players ?? ['A', 'B']
  const targetScore = props.targetScore ?? 500
  const cardsPerPlayer = props.cardsPerPlayer ?? 7
  const randomizer: Randomizer = props.randomizer ?? standardRandomizer
  const shuffler: Shuffler<Card> = props.shuffler ?? standardShuffler

  if (targetScore <= 0) throw new Error('A Game requires a target score of more than 0')
  if (cardsPerPlayer <= 0) throw new Error('A Game requires dealing at least 1 card per player')

  const playerCount = players.length
  const scores: ReadonlyArray<number> = Array(playerCount).fill(0)

  const dealer = randomizer(playerCount)

  return {
    playerCount,
    targetScore,
    players,
    scores,
    currentRound: null,
    randomizer,
    shuffler,
    cardsPerPlayer,
    winner: undefined,
  } as const
}

export function player(ix: number, g: Game): string {
  if (ix < 0 || ix >= g.playerCount) throw new Error('Player index is out of bounds')
  return g.players[ix]
}

export function resolveRoundEnd(g: Game): Game {
  const r = g.currentRound
  if (!r) return g

  const w = winner(r)
  if (w === undefined) return g
  if ((r as any).scored) return g

  const pts = score(r) ?? 0
  const newScores = g.scores.map((s, i) => (i === w ? s + pts : s))
  const scoredRound = { ...r, scored: true } as Round

  if (newScores[w] >= g.targetScore) {
    return { ...g, scores: newScores, currentRound: undefined, winner: w }
  }
  return startNewRound({ ...g, scores: newScores, currentRound: scoredRound })
}

export function play(step: RoundStep, g: Game): Game {
  if (!g.currentRound) throw new Error('No active round to play')
  const nextRound = step(g.currentRound)
  return resolveRoundEnd({ ...g, currentRound: nextRound })
}

export function startNewRound(g: Game): Game {
  const dealer = g.randomizer(g.playerCount)
  const newRound = createRound([...g.players], dealer, g.shuffler, g.cardsPerPlayer)
  return { ...g, currentRound: newRound }
}
