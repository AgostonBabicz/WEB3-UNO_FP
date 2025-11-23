import GameView from "@/src/views/GameView"

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams

  const botNumber = Number(params.botNumber ?? '1') || 1
  const playerName =
    typeof params.playerName === 'string' ? params.playerName : 'You'
  const cardsPerPlayer = Number(params.cardsPerPlayer ?? '7') || 7
  const targetScore = Number(params.targetScore ?? '500') || 500

  return (
    <GameView
      botNumber={botNumber}
      playerName={playerName}
      cardsPerPlayer={cardsPerPlayer}
      targetScore={targetScore}
    />
  )
}