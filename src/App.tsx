import { useSyncExternalStore } from 'react'
import { HomePage } from './pages/HomePage'
import { CardPageById } from './pages/CardPage'

function useHashRoute() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('hashchange', cb)
      return () => window.removeEventListener('hashchange', cb)
    },
    () => window.location.hash,
  )
}

export default function App() {
  const hash = useHashRoute()
  const m = hash.match(/^#\/card\/([^?]+)(?:\?(.*))?$/)
  if (m) {
    const open = new URLSearchParams(m[2] ?? '').get('open')
    const openStages = open ? open.split(',').map((s) => Number(s)) : []
    return <CardPageById id={decodeURIComponent(m[1])} openStages={openStages} />
  }
  return <HomePage />
}
