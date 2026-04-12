import { useState } from 'react'
import { loginUser } from '../services/api'

export default function Login({ onLoginSuccess, onNavigateSignup }) {
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!username || !password) {
      setError('Username and Password are required.')
      return
    }

    setLoading(true)
    try {
      const response = await loginUser(username, password)
      
      if (response.data.success) {
        localStorage.setItem('apiKey', response.data.api_key)
        localStorage.setItem('username', response.data.username)
        onLoginSuccess()
      }
    } catch (err) {
      localStorage.removeItem('apiKey')
      localStorage.removeItem('username')
      setError(err.response?.data?.detail || 'Invalid credentials. Access Denied.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-main)',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        padding: '48px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        width: '100%',
        maxWidth: '440px',
        border: '1px solid var(--border)'
      }}>
        
        {/* Header section */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px', height: '56px',
            background: 'var(--primary)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            margin: '0 auto 20px auto'
          }}>⚡</div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 700, 
            color: 'var(--text-main)', 
            margin: '0 0 8px 0' 
          }}>
            Agentic Gateway
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: 'var(--text-sec)', 
            margin: 0 
          }}>
            Enter your credentials to access the orchestrator.
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              Username
            </label>
            <input
              type="text"
              placeholder="Your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: '#F9FAFB',
                fontSize: '14px',
                color: 'var(--text-main)',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: '#F9FAFB',
                  fontSize: '14px',
                  color: 'var(--text-main)',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  fontSize: '18px',
                  userSelect: 'none',
                  color: 'var(--text-sec)'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </span>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: 'var(--error)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#93C5FD' : 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px',
              transition: 'background 0.2s',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
            }}
          >
            {loading ? 'Authenticating...' : 'Authorize Login'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '14px', color: 'var(--text-sec)' }}>
          New user?{' '}
          <span 
            onClick={onNavigateSignup} 
            style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, cursor: 'pointer' }}
          >
            Create an account
          </span>
        </div>
      </div>
    </div>
  )
}
