import { notFound } from 'next/navigation'
import GameServerView from '@/src/views/GameServerView'
import * as api from '@/src/api/api'
import ReduxHydrator from '@/src/components/ReduxHydrator'
import { getAuthCookie } from '@/lib/auth'

type Props = {
  params: { id: string }
}

export default async function Page({params}: {params: Promise<{id: string}>}) {
  const { id } = await params
  const user = await getAuthCookie()
  let game
  try {
    game = await api.getGameDTO(id)
  } catch (e) {
    return notFound()
  }

  return (
    <ReduxHydrator user={user} activeGame={game}>
      <GameServerView />
    </ReduxHydrator>
  )
}