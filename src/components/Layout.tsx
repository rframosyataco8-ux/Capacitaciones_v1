import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import M365Header from './M365Header'

export default function Layout() {
  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg)' }}>
      <M365Header />
      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
