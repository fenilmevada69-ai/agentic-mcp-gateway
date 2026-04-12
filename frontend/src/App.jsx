// App entry point with safe routing
import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import Signup from './components/Signup'
import './index.css'

function App() {
  const [page, setPage] = useState('loading')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is already logged in
    const apiKey = localStorage.getItem('apiKey')
    if (apiKey) {
      setIsAuthenticated(true)
      setPage('dashboard')
    } else {
      // Check the URL hash for navigation
      const hash = window.location.hash.replace('#', '') || ''
      if (hash === 'signup') {
        setPage('signup')
      } else {
        setPage('login')
      }
    }

    // Listen for hash changes
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash === 'signup') setPage('signup')
      else if (hash === 'login') setPage('login')
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    setPage('dashboard')
    window.location.hash = ''
  }

  const handleLogout = () => {
    localStorage.removeItem('apiKey')
    localStorage.removeItem('username')
    setIsAuthenticated(false)
    setPage('login')
  }

  const navigateTo = (target) => {
    window.location.hash = target
    setPage(target)
  }

  if (page === 'loading') {
    return <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }} />
  }

  if (!isAuthenticated && page === 'signup') {
    return <Signup onNavigateLogin={() => navigateTo('login')} />
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} onNavigateSignup={() => navigateTo('signup')} />
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Dashboard onLogout={handleLogout} />
    </div>
  )
}

export default App