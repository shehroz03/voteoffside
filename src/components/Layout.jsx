import TopNav from './TopNav.jsx'
import BottomNav from './BottomNav.jsx'
import Footer from './Footer.jsx'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-surface">
      <TopNav />
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-8 lg:pb-14 lg:pt-10">
        {children}
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
