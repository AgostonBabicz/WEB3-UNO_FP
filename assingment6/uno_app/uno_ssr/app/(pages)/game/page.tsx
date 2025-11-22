import GameView from "@/src/views/GameView"

type Props = {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function Page({ searchParams }: Props) {
  const botNumber = Number(searchParams.botNumber ?? '1') || 1
  const playerName = typeof searchParams.playerName === 'string' ? searchParams.playerName : 'You'
  const cardsPerPlayer = Number(searchParams.cardsPerPlayer ?? '7') || 7
  const targetScore = Number(searchParams.targetScore ?? '500') || 500

  return (
    <GameView 
      botNumber={botNumber}
      playerName={playerName}
      cardsPerPlayer={cardsPerPlayer}
      targetScore={targetScore}
    />
  )
}