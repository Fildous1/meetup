import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { LangProvider } from './context/LangContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import EventPage from './pages/EventPage'
import ResultsPage from './pages/ResultsPage'
import RespondPage from './pages/RespondPage'

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/:code" element={<EventPage />} />
            <Route path="/:code/respond" element={<RespondPage />} />
            <Route path="/:code/results" element={<ResultsPage />} />
          </Routes>
        </Layout>
      </LangProvider>
    </ThemeProvider>
  )
}
