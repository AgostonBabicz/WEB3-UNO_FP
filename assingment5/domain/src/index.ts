import { parseCard, parseEvent, parseGame, parseRound, toDomainCard, toDomainGame } from './model/common'

export * from './model/common'
export type { 
  Game, 
  Props,

} from './model/uno'

export type { 
  Round, 
  Direction 
} from './model/round'

export type { 
  CardNumber,
  Type,
  Card, 
  Color, 
  Deck, 
  NumberCard, 
  SpecialCard, 
  WildCard,
  ColoredCard
} from './model/deck'

export type { 
  PlayerHand 
} from './model/player_hand'

export * from './model/gameResolverTypes'
export * from './model/events'
export * from './model/dtos'

export {
  createGame,
  play as gamePlay,
  createGame as createModelGame,
  play as applyRoundStep,
  startNewRound as startNewRoundModel,
  resolveRoundEnd,
  player as getGamePlayerName 
} from './model/uno'

export {
  createRound,
  getHand as roundGetHand,
  draw as roundDraw,
  play as roundPlay,
  sayUno as roundSayUno,
  catchUnoFailure as roundCatchUnoFailure,
  hasEnded as roundHasEnded,
  canPlay as roundCanPlay,
  discardPile as roundDiscardPile,
  drawPile as roundDrawPile,
  topOfDiscard as roundTopOfDiscard,
  winner as roundWinner,
  score as roundScore,
  checkUnoFailure,
  catchUnoFailure
} from './model/round'

export {
  createInitialDeck,
  createEmptyDeck,
  createDeckWithCards,
  isColored,
  isWild,
  shuffle as deckShuffle,
  top as deckTop,
  deckSize as deckSize,
  deal as deckDeal,
  toArray as deckToArray
} from './model/deck'


export {
  createHand,
  add as handAdd,
  remove as handRemove,
  toCardsArray as handToArray
} from './model/player_hand'

export {
  parseCard,
  parseRound,
  parseGame,
  parseEvent,
  toDomainCard,
  toDomainGame
}