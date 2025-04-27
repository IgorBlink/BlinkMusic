import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AlbumsPage from './pages/AlbumsPage'
import TrackPage from './pages/TrackPage'
import AuthPage from './pages/AuthPage'
import LandingPage from './pages/LandingPage'
import Layout from './components/layout/Layout'
import { PlayerProvider } from './context/PlayerContext'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import './App.css'

// =)
const SearchPage = () => <div className="container"><h1>Поиск</h1></div>
const ForYouPage = () => <div className="container"><h1>Для вас</h1></div>
const TrendsPage = () => <div className="container"><h1>Тренды</h1></div>
const LibraryPage = () => <div className="container"><h1>Библиотека</h1></div>
const LyricsPage = () => <div className="container"><h1>Текст песни</h1></div>
const ForgotPasswordPage = () => <div className="container"><h1>Восстановление пароля</h1></div>

function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <Router>
          <Routes>
         
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/welcome" element={<LandingPage />} />
            
            
            {/* Защищенные маршруты (требуют авторизации) */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <HomePage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/search" element={
              <ProtectedRoute>
                <Layout>
                  <SearchPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/for-you" element={
              <ProtectedRoute>
                <Layout>
                  <ForYouPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/trends" element={
              <ProtectedRoute>
                <Layout>
                  <TrendsPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/library" element={
              <ProtectedRoute>
                <Layout>
                  <LibraryPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/albums" element={
              <ProtectedRoute>
                <Layout>
                  <AlbumsPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/lyrics/:id" element={
              <ProtectedRoute>
                <Layout>
                  <LyricsPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/track/:id" element={
              <ProtectedRoute>
                <Layout>
                  <TrackPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Перенаправление для неизвестных маршрутов */}
          </Routes>
        </Router>
      </PlayerProvider>
    </AuthProvider>
  )
}

export default App
