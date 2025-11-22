'use server'

import { cookies } from 'next/headers'

export type UserSession = {
  id: string
  username: string
}

export async function getAuthCookie(): Promise<UserSession | undefined> {
  const cookieStore = cookies()
  const value = (await cookieStore).get('user')?.value
  return value ? JSON.parse(value) : undefined
}

export async function setAuthCookie(user: UserSession) {
  const cookieStore = cookies()
  ;(await cookieStore).set('user', JSON.stringify(user), { 
    maxAge: 60 * 60 * 24,
    path: '/' 
  })
}

export async function clearAuthCookie() {
  (await cookies()).delete('user')
}