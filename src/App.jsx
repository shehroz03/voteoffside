import { Suspense, lazy } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/Layout.jsx'
import { PageTransition } from './motion.jsx'

const Home          = lazy(() => import('./pages/Home.jsx'))
const Schedule      = lazy(() => import('./pages/Schedule.jsx'))
const Live          = lazy(() => import('./pages/Live.jsx'))
const Predictions   = lazy(() => import('./pages/Predictions.jsx'))
const Teams         = lazy(() => import('./pages/Teams.jsx'))
const TeamProfile   = lazy(() => import('./pages/TeamProfile.jsx'))
const Players       = lazy(() => import('./pages/Players.jsx'))
const PlayerProfile = lazy(() => import('./pages/PlayerProfile.jsx'))
const Compare       = lazy(() => import('./pages/Compare.jsx'))
const Leaderboard   = lazy(() => import('./pages/Leaderboard.jsx'))
const About         = lazy(() => import('./pages/About.jsx'))
const Privacy       = lazy(() => import('./pages/Privacy.jsx'))
const Contact       = lazy(() => import('./pages/Contact.jsx'))
const Disclaimer    = lazy(() => import('./pages/Disclaimer.jsx'))
const NotFound      = lazy(() => import('./pages/NotFound.jsx'))
const Admin         = lazy(() => import('./pages/Admin.jsx'))

function Loader() {
  return (
    <div className="flex items-center justify-center py-24 text-muted">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand" />
    </div>
  )
}

function AppRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/"            element={<PageTransition><Home /></PageTransition>} />
        <Route path="/schedule"    element={<PageTransition><Schedule /></PageTransition>} />
        <Route path="/live"        element={<PageTransition><Live /></PageTransition>} />
        <Route path="/predictions" element={<PageTransition><Predictions /></PageTransition>} />
        <Route path="/teams"       element={<PageTransition><Teams /></PageTransition>} />
        <Route path="/teams/:code" element={<PageTransition><TeamProfile /></PageTransition>} />
        <Route path="/players"     element={<PageTransition><Players /></PageTransition>} />
        <Route path="/players/:id" element={<PageTransition><PlayerProfile /></PageTransition>} />
        <Route path="/compare"     element={<PageTransition><Compare /></PageTransition>} />
        <Route path="/leaderboard" element={<PageTransition><Leaderboard /></PageTransition>} />
        <Route path="/about"       element={<PageTransition><About /></PageTransition>} />
        <Route path="/privacy"     element={<PageTransition><Privacy /></PageTransition>} />
        <Route path="/contact"     element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/disclaimer"  element={<PageTransition><Disclaimer /></PageTransition>} />
        <Route path="/admin"       element={<PageTransition><Admin /></PageTransition>} />
        <Route path="*"            element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<Loader />}>
        <AppRoutes />
      </Suspense>
    </Layout>
  )
}
