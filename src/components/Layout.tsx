import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="h-full flex bg-[#f8f9fa]">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  )
}
