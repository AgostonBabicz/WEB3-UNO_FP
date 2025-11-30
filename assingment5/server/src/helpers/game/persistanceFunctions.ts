
import type { Card, Game } from '@uno/domain'
import Domain from '@uno/domain'
const { roundGetHand } = Domain
import { GameRepository } from '../../repository/gameRepository.js'
import { RoundRepository } from '../../repository/roundRepository.js'


export type PersistScoreRow = {
  userId: string | null
  name: string
  roundPoints: number
}

function computePointsFromHands(hands: Card[][], winnerIx: number): { perPlayer: number[] } {
  const perPlayer = hands.map(() => 0)
  for (let i = 0; i < hands.length; i++) {
    if (i === winnerIx) continue
    let sum = 0
    for (const c of hands[i]) {
      switch (c.type) {
        case 'NUMBERED':
          sum += c.number
          break
        case 'SKIP':
        case 'REVERSE':
        case 'DRAW':
          sum += 20
          break
        case 'WILD':
        case 'WILD_DRAW':
          sum += 50
          break
      }
    }
    perPlayer[i] = sum
  }
  return { perPlayer }
}

export async function persistGameCreate(
  gameId: string,
  game: Game,
  hostUserId: string | null,
): Promise<void> {
  const grepo = new GameRepository()

  await grepo
    .create({
      id: gameId,
      targetScore: game.targetScore,
      cardsPerPlayer: game.cardsPerPlayer,
    })
    .catch(console.error)

  if (hostUserId) {
    await grepo
      .playerJoinsGame({
        gameId,
        userId: hostUserId,
        seatIndex: 0,
      })
      .catch(console.error)
  }
}

export async function persistPlayerJoin(
  gameId: string,
  userId: string | null,
  seatIndex: number,
): Promise<void> {
  if (!userId) return
  const grepo = new GameRepository()
  await grepo
    .playerJoinsGame({
      gameId,
      userId,
      seatIndex,
    })
    .catch(console.error)
}

export async function persistRoundStart(
  gameId: string,
  roundNo: number,
  startedAtISO: string = new Date().toISOString(),
): Promise<string | undefined> {
  const rrepo = new RoundRepository()
  const row = await rrepo
    .start({
      gameId,
      number: roundNo,
      startedAt: startedAtISO,
    })
    .catch((e) => {
      console.error(e)
      return undefined
    })
  return row?.id
}

export async function persistRoundFinish(
  gameId: string,
  game: Game,
  winnerIx: number,
  roundRowId?: string,
  userIds: Array<string | null> = [],
): Promise<void> {
  const round = game.currentRound
  if (!round) return

  const hands: Card[][] = Array.from(
    { length: game.playerCount },
    (_, i) => roundGetHand(round, i) as Card[],
  )

  const rp = computePointsFromHands(hands, winnerIx)

  const scores: PersistScoreRow[] = game.players.map((name, i) => ({
    userId: userIds[i] ?? null,
    name,
    roundPoints: rp.perPlayer[i] ?? 0,
  }))

  const winnerUserId = userIds[winnerIx] ?? null
  const rrepo = new RoundRepository()

  try {
    if (roundRowId) {
      await rrepo.finish({
        id: roundRowId,
        winnerUserId: winnerUserId ?? null,
        scores,
        endedAt: new Date().toISOString(),
      })
    } else {
      const started = await rrepo.start({
        gameId,
        number: 1,
        startedAt: new Date().toISOString(),
      })
      if (started) {
        await rrepo.finish({
          id: started.id,
          winnerUserId: winnerUserId ?? null,
          scores,
          endedAt: new Date().toISOString(),
        })
      }
    }
  } catch (e) {
    console.error(e)
  }
}
