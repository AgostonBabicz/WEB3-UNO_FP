
import { getAuthCookie } from '@/lib/auth'
import * as api from '@/src/api/api'
import ReduxHydrator from '@/src/components/ReduxHydrator'
import { redirect } from 'next/navigation'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthCookie()
  if (!user) redirect('/login')

  const waitingGames = await api.getWaitingGamesDTO()

  return (
    <ReduxHydrator user={user} waitingGames={waitingGames}>
      {children}
    </ReduxHydrator>
  )
}