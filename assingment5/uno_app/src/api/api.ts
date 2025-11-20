import { apollo } from '../apollo'
import { 
  CreateGameData, 
  GetGameData, 
  WaitingGamesData, 
  StartRoundData,
  StandardMutationData,
  HandData,
  PlayableData,
  AuthUser
} from '@uno/domain'
import { from_graphql_game, parseCard } from '@uno/domain'
import { IndexedGame } from '@uno/domain'
import { 
    CREATE_GAME, 
    GET_GAME, 
    WAITING_GAMES, 
    START_ROUND, 
    PLAY_CARD, 
    HAND, 
    PLAYABLE,
    ADD_PLAYER,
    DRAW_CARD,
    SAY_UNO,
    ACCUSE_UNO
} from '../graphql/ops'
import { LOGIN, REGISTER } from '../graphql/ops_auth'
import type { Card, LoginData, RegisterData } from '@uno/domain'


// --- AUTH API ---

export async function login(input: { username: string; password: string }): Promise<AuthUser> {
  const { data } = await apollo.mutate<LoginData>({
    mutation: LOGIN,
    variables: { input },
  })
  
  const user = data?.login
  if (!user) throw new Error('Login failed')
  
  return { 
    id: user.id as string, 
    username: user.username as string 
  }
}

export async function register(input: { username: string; password: string }): Promise<AuthUser> {
  const { data } = await apollo.mutate<RegisterData>({
    mutation: REGISTER,
    variables: { input },
  })
  
  const user = data?.createUser
  if (!user) throw new Error('Register failed')
  
  return { 
    id: user.id as string, 
    username: user.username as string 
  }
}


// --- LOBBY API ---
export async function createGame(input: {
  players: string[]
  targetScore: number
  cardsPerPlayer: number
  userId: string
}): Promise<IndexedGame> {
  const { data } = await apollo.mutate<CreateGameData>({
    mutation: CREATE_GAME,
    variables: { input },
  })
  const rawGame = data?.createGame?.game
  if (!rawGame) throw new Error('createGame failed')
  return from_graphql_game(rawGame)
}

export async function getGame(gameId: string): Promise<IndexedGame> {
  const { data } = await apollo.query<GetGameData>({
    query: GET_GAME,
    variables: { gameId },
    fetchPolicy: 'no-cache',
  })
  if (!data?.game) throw new Error('Game not found')
  return from_graphql_game(data.game)
}

export async function getWaitingGames(): Promise<IndexedGame[]> {
  const { data } = await apollo.query<WaitingGamesData>({
    query: WAITING_GAMES,
    fetchPolicy: 'no-cache',
  })
  const rawGames = data?.waitingGames ?? []
  return rawGames.map(from_graphql_game)
}

export async function addPlayer(gameId: string, name: string, userId: string): Promise<IndexedGame> {
  // Using StandardMutationData since addPlayer returns a game
  const { data } = await apollo.mutate<StandardMutationData>({
    mutation: ADD_PLAYER,
    variables: { gameId, name, userId },
  })
  if (!data?.addPlayer) throw new Error('addPlayer failed')
  return from_graphql_game(data.addPlayer)
}

// --- GAMEPLAY API ---

export async function startRound(gameId: string, userId: string): Promise<IndexedGame> {
  const { data } = await apollo.mutate<StartRoundData>({
    mutation: START_ROUND,
    variables: { input: { gameId, userId } },
  })
  if (!data?.startRound) throw new Error('startRound failed')
  return from_graphql_game(data.startRound)
}

export async function getHand(gameId: string, playerIndex: number): Promise<Card[]> {
  const { data } = await apollo.query<HandData>({
    query: HAND,
    variables: { gameId, playerIndex },
    fetchPolicy: 'no-cache',
  })
  const rawCards = data?.hand ?? []
  return rawCards.map(parseCard)
}

export async function getPlayable(gameId: string, playerIndex: number): Promise<number[]> {
  const { data } = await apollo.query<PlayableData>({
    query: PLAYABLE,
    variables: { gameId, playerIndex },
    fetchPolicy: 'no-cache',
  })
  return data?.playableIndexes ?? []
}

export async function playCard(input: any): Promise<IndexedGame> {
  const { data } = await apollo.mutate<StandardMutationData>({
    mutation: PLAY_CARD,
    variables: { input },
  })
  if (!data?.playCard) throw new Error('playCard failed')
  return from_graphql_game(data.playCard)
}

export async function drawCard(input: any): Promise<IndexedGame> {
  const { data } = await apollo.mutate<StandardMutationData>({
    mutation: DRAW_CARD,
    variables: { input },
  })
  if (!data?.drawCard) throw new Error('drawCard failed')
  return from_graphql_game(data.drawCard)
}

export async function sayUno(input: any): Promise<IndexedGame> {
  const { data } = await apollo.mutate<StandardMutationData>({
    mutation: SAY_UNO,
    variables: { input },
  })
  if (!data?.sayUno) throw new Error('sayUno failed')
  return from_graphql_game(data.sayUno)
}

export async function accuseUno(input: any): Promise<IndexedGame> {
  const { data } = await apollo.mutate<StandardMutationData>({
    mutation: ACCUSE_UNO,
    variables: { input },
  })
  if (!data?.accuseUno) throw new Error('accuseUno failed')
  return from_graphql_game(data.accuseUno)
}