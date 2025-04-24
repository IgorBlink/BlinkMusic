import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AlbumsPage from './pages/AlbumsPage'
import TrackPage from './pages/TrackPage'
import Layout from './components/layout/Layout'
import { PlayerProvider } from './context/PlayerContext'
import './App.css'

// =)
const SearchPage = () => <div className="container"><h1>Поиск</h1></div>
const ForYouPage = () => <div className="container"><h1>Для вас</h1></div>
const TrendsPage = () => <div className="container"><h1>Тренды</h1></div>
const LibraryPage = () => <div className="container"><h1>Библиотека</h1></div>
const LyricsPage = () => <div className="container"><h1>Текст песни</h1></div>

function App() {
  return (
    <PlayerProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/for-you" element={<ForYouPage />} />
            <Route path="/trends" element={<TrendsPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/albums" element={<AlbumsPage />} />
            <Route path="/lyrics/:id" element={<LyricsPage />} />
            <Route path="/track/:id" element={<TrackPage />} />
          </Routes>
        </Layout>
      </Router>
    </PlayerProvider>
  )
}

export default App
