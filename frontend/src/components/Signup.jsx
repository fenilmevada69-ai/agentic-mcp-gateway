import { useState } from 'react'
import { registerUser } from '../services/api'

export default function Signup({ onNavigateLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!username || !password || !confirmPassword) {
      setError('All fields are required.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const response = await registerUser(username, password)
      if (response.data.success) {
        setSuccess('Account created! Redirecting to login...')
        setTimeout(() => onNavigateLogin(), 2000)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Try again.')
      setLoading(false)
    }
  }

  const eyeToggleStyle = {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    cursor: 'pointer',
    fontSize: '18px',
    userSelect: 'none',
    color: 'var(--text-sec)'
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
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px 0' }}>
            Join Agentic Gateway
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-sec)', margin: 0 }}>
            Create your account to start orchestrating workflows.
          </p>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              Choose Username
            </label>
            <input
              type="text"
              placeholder="E.g., fenil_m"
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
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
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
                  boxSizing: 'border-box'
                }}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={eyeToggleStyle}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: '#F9FAFB',
                  fontSize: '14px',
                  color: 'var(--text-main)',
                  boxSizing: 'border-box'
                }}
              />
              <span
                onClick={() => setShowConfirm(!showConfirm)}
                style={eyeToggleStyle}
                title={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? '🙈' : '👁️'}
              </span>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              background: '#FEF2F2',
              color: 'var(--error)',
              fontSize: '13px',
              border: '1px solid #FECACA'
            }}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              background: '#ECFDF5',
              color: 'var(--success)',
              fontSize: '13px',
              border: '1px solid #A7F3D0'
            }}>
              ✅ {success}
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
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-sec)' }}>
          Already have an account?{' '}
          <span 
            onClick={onNavigateLogin} 
            style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, cursor: 'pointer' }}
          >
            Login here
          </span>
        </div>
      </div>
    </div>
  )
}
