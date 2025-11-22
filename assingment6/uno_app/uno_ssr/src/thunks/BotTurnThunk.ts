import { 
  roundGetHand, 
  roundCanPlay, 
  checkUnoFailure 
} from '@uno/domain'
import type { Game, Round, Color, Card } from '@uno/domain'
import { unoGameActions } from '../slices/unoGameSlice'
import type { AppDispatch, RootState } from '../stores/store'
import { randomDelay } from '@/src/utils/randomDelay'


function currentRound(game: Game | null): Round | undefined {
  return game?.currentRound
}

function currentPlayerIndex(r: Round): number | undefined {
  return r.playerInTurn ?? r.currentPlayerIndex
}

function isBot(opts: any, ix: number): boolean {
  if (!opts) return false
  return ix >= 0 && ix < opts.players.length - 1
}

function chooseWildColor(r: Round, ix: number): Color {
  const hand = roundGetHand(r, ix)
  const counts: Record<Color, number> = { RED: 0, YELLOW: 0, GREEN: 0, BLUE: 0 }
  
  for (const c of hand) {
    if ('color' in c) counts[c.color as Color]++
  }
  
  let best: Color = 'RED'
  let bestN = -1
  for (const k of Object.keys(counts) as Color[]) {
    if (counts[k] > bestN) {
      best = k
      bestN = counts[k]
    }
  }
  return best
}


const botTakeTurn = () => async (dispatch: AppDispatch, getState: () => RootState) => {
  const root = getState()
  const slice = root.unoGame
  const g = slice.game as Game | null
  const r = currentRound(g)

  if (!g || !r) return false
  if (g.winner !== undefined) return false

  const ix = currentPlayerIndex(r)
  if (ix == null || !isBot(slice.opts, ix)) return false

  await new Promise((res) => setTimeout(res, randomDelay()))
  let s2 = getState().unoGame
  let g2 = s2.game as Game | null
  let r2 = currentRound(g2)

  if (!g2 || !r2) return false
  if (g2.winner !== undefined) return false

  const currentIx = currentPlayerIndex(r2)
  if (currentIx !== ix || !isBot(s2.opts, currentIx)) return false

  const opts = s2.opts

  if (opts) {
    for (let t = 0; t < opts.players.length; t++) {
      if (t === ix) continue
      if (checkUnoFailure({ accuser: ix, accused: t }, r2)) {
        dispatch(unoGameActions.accuse({ accuser: ix, accused: t }))
        dispatch(unoGameActions.setMessage({
            title: 'You are accused!',
            message: `${opts.players[ix]} accuses ${opts.players[t]} of not saying UNO! Now Draw 4`,
        }))
        break
      }
    }
  }

  const hand = roundGetHand(r2, ix)
  let played = false

  for (let i = 0; i < hand.length; i++) {
    if (roundCanPlay(i, r2)) {
      const card = hand[i]
      if (card.type === 'WILD' || card.type === 'WILD_DRAW') {
        const color = chooseWildColor(r2, ix)
        dispatch(unoGameActions.setMessage({
            title: 'Bot plays',
            message: `Bot ${opts?.players[ix]} plays ${card.type} and chooses ${color}`,
        }))
        dispatch(unoGameActions.playCard({ cardIx: i, askedColor: color }))
      } else {
        dispatch(unoGameActions.playCard({ cardIx: i }))
      }
      played = true
      break
    }
  }

  if (!played) {
    dispatch(unoGameActions.draw())
  }

  s2 = getState().unoGame
  g2 = s2.game as Game | null
  r2 = currentRound(g2)
  if (!g2 || !r2 || g2.winner !== undefined) return true

  const handAfter = roundGetHand(r2, ix)
  if (handAfter.length === 1 && Math.random() > 0.5) {
    dispatch(unoGameActions.setMessage({
        title: 'Bot says UNO!',
        message: `Bot ${s2.opts?.players[ix]} says UNO!`,
    }))
    dispatch(unoGameActions.sayUno(ix))
  }

  return true
}

export default botTakeTurn