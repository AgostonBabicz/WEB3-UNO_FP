import GameOverView from '@/src/views/GameOverView'

export default async function Page({params}: {params: Promise<{id: string}>}) {
  const { id } = await params
  return (
      <GameOverView winner={id} />
  )
}