import { useEffect, useState } from 'react'
import { currentUser, subscribeAuth, type AuthUser } from '../lib/auth'

interface State {
  user: AuthUser | null
  loading: boolean
}

export function useAuthUser(): State {
  const [state, setState] = useState<State>({ user: currentUser(), loading: true })

  useEffect(() => {
    const unsub = subscribeAuth((u) => setState({ user: u, loading: false }))
    return unsub
  }, [])

  return state
}
