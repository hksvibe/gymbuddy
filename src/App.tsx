import { Route, Routes, Navigate } from 'react-router-dom'
import Welcome from './pages/Welcome'
import Onboarding from './pages/Onboarding'
import Today from './pages/Today'
import WeeklyReview from './pages/WeeklyReview'
import Progress from './pages/Progress'
import MyGym from './pages/MyGym'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/today" element={<Today />} />
      <Route path="/week" element={<WeeklyReview />} />
      <Route path="/progress" element={<Progress />} />
      <Route path="/gym" element={<MyGym />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
