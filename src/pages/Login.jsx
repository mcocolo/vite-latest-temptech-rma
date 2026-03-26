import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const LOGO_URL = 'https://edddvxqlvwgexictsnmn.supabase.co/storage/v1/object/public/Imagenes/Imagen-Corporativa/Temptech_LogoHorizontal.png'

const T = {
  bg:       '#222222',
  surface:  '#2b2b2b',
  surface2: '#333333',
  border:   '#444444',
  grad:     'linear-gradient(135deg,#e8215a,#8b2fc9,#4a6cf7)',
  text:     '#ffffff',
  text2:    '#cccccc',
  text3:    '#888888',
  red:      '#ff5577',
  redDim:   'rgba(255,85,119,0.15)',
  font:     "'Inter', -apple-system, sans-serif",
  radius:   '10px',
  radiusLg: '16px',
}

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/admin')
    })
  }, [navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/admin')
  }

  const inputStyle = {
    background: T.surface2,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius,
    padding: '11px 14px',
    color: T.text,
    fontSize: 14,
    outline: 'none',
    width: '100%',
    fontFamily: T.font,
    transition: 'border .2s',
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: T.font, position: 'relative' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      {/* Fondo decorativo */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(42,69,201,0.12) 0%, transparent 70%)' }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={LOGO_URL} alt="TEMPTECH" style={{ height: 38, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} onError={e => e.currentTarget.style.display = 'none'} />
        </div>

        {/* Línea degradado */}
        <div style={{ height: 3, background: T.grad, borderRadius: '3px 3px 0 0', marginBottom: -1 }} />

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: `0 0 ${T.radiusLg} ${T.radiusLg}`, padding: '32px 28px' }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: T.text, margin: '0 0 6px', letterSpacing: '-0.3px' }}>
            Panel Administrador
          </h2>
          <p style={{ fontSize: 13, color: T.text3, marginBottom: 24 }}>
            Ingresá con tu cuenta de administrador
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.text2, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 6 }}>Email</label>
              <input
                type="email"
                placeholder="admin@temptech.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#4a6cf7'}
                onBlur={e => e.target.style.borderColor = T.border}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.text2, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 6 }}>Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#4a6cf7'}
                onBlur={e => e.target.style.borderColor = T.border}
              />
            </div>

            {error && (
              <div style={{ background: T.redDim, border: `1px solid ${T.red}40`, color: T.red, padding: '10px 14px', borderRadius: T.radius, fontSize: 13 }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? T.surface2 : T.grad,
                border: 'none', borderRadius: T.radius,
                padding: '12px', color: '#fff',
                fontSize: 14, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                fontFamily: T.font,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 4, transition: 'opacity .2s',
              }}
            >
              {loading && <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: T.text3 }}>
          © {new Date().getFullYear()} TEMPTECH · Sistema de Gestión de Reclamos
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input::placeholder { color: ${T.text3}; }
      `}</style>
    </div>
  )
}
