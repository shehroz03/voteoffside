import TopNav from './TopNav.jsx'
import BottomNav from './BottomNav.jsx'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-surface">
      <TopNav />
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 lg:pb-12">{children}</main>
      <BottomNav />
    </div>
  )
}
