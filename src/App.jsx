import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'

const Home = lazy(() => import('./pages/Home.jsx'))
const Schedule = lazy(() => import('./pages/Schedule.jsx'))
const Live = lazy(() => import('./pages/Live.jsx'))
const Predictions = lazy(() => import('./pages/Predictions.jsx'))
const Teams = lazy(() => import('./pages/Teams.jsx'))
const TeamProfile = lazy(() => import('./pages/TeamProfile.jsx'))
const Players = lazy(() => import('./pages/Players.jsx'))
const PlayerProfile = lazy(() => import('./pages/PlayerProfile.jsx'))
const Compare = lazy(() => import('./pages/Compare.jsx'))
const Leaderboard = lazy(() => import('./pages/Leaderboard.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

function Loader() {
  return (
    <div className="flex items-center justify-center py-24 text-muted">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand" />
    </div>
  )
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/live" element={<Live />} />
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/:code" element={<TeamProfile />} />
          <Route path="/players" element={<Players />} />
          <Route path="/players/:id" element={<PlayerProfile />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}
