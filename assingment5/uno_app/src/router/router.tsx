import React from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  useSearchParams,
} from 'react-router-dom'

import AuthView from '../views/AuthView'
import GameHomeView from '../views/GameHomeView'
import GameView from '../views/GameView'
import GameServerView from '../views/GameServerView'
import GameOverView from '../views/GameOverView'
import LobbiesView from '../views/LobbiesView'

const GameRoute: React.FC = () => {
  const [searchParams] = useSearchParams()

  const botNumber = Number(searchParams.get('botNumber') ?? '1') || 1
  const playerName = searchParams.get('playerName') || 'You'
  const cardsPerPlayer = Number(searchParams.get('cardsPerPlayer') ?? '7') || 7
  const targetScore = Number(searchParams.get('targetScore') ?? '500') || 500

  return (
    <GameView
      botNumber={botNumber}
      playerName={playerName}
      cardsPerPlayer={cardsPerPlayer}
      targetScore={targetScore}
    />
  )
}

const GameServerRoute: React.FC = () => {
  const [searchParams] = useSearchParams()
  const gameId = searchParams.get('gameId') || ''
  console.log('GameServer gameId (from URL):', gameId)
  return <GameServerView />
}

const GameOverRoute: React.FC = () => {
  const [searchParams] = useSearchParams()
  const winner = searchParams.get('winner') || 'Unknown'
  return <GameOverView winner={winner} />
}

const AppRouter: React.FC = () => {
  const basename =
    (import.meta as any)?.env?.BASE_URL && (import.meta as any).env.BASE_URL !== '/'
      ? (import.meta as any).env.BASE_URL
      : '/'

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<AuthView />} />

        <Route path="/home" element={<GameHomeView />} />

        <Route path="/game" element={<GameRoute />} />

        <Route path="/lobbies" element={<LobbiesView />} />

        <Route path="/game-server" element={<GameServerRoute />} />

        <Route path="/game-over" element={<GameOverRoute />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
