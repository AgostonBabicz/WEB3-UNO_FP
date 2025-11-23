import GameOverView from '@/src/views/GameOverView'

export default async function Page({ searchParams}: {params: Promise<{id: string}>,   searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const query = await searchParams

  const winner = typeof query.winner === 'string' ? query.winner : 'Unknown'

  return (
      <GameOverView winner={winner} />
  )
}