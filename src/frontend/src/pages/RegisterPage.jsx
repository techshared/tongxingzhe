import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../api'
import { useAuth } from '../App'

export default function RegisterPage() {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [step, setStep] = useState('phone') // 'phone' | 'code'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  const { login } = useAuth()
  const navigate = useNavigate()

  const sendCode = async () => {
    if (phone.length !== 11) {
      setError('请输入11位手机号')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authApi.sendSms(phone, 'register')
      setStep('code')
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(timer); return 0 }
          return c - 1
        })
      }, 1000)
    } catch (e) {
      setError(e.message || '发送失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!nickname.trim()) {
      setError('请输入昵称')
      return
    }
    if (code.length !== 6) {
      setError('请输入6位验证码')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await authApi.register({ phone, code, nickname: nickname.trim() })
      login(res.data.access_token, res.data.user)
      navigate('/firstday')
    } catch (e) {
      setError(e.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.logoArea}>
        <div style={styles.logo}>🌤️</div>
        <h1 style={styles.title}>同行者</h1>
        <p style={styles.subtitle}>加入我们，一起前行</p>
      </div>

      <div style={styles.card}>
        {step === 'phone' ? (
          <>
            <h2 style={styles.cardTitle}>注册</h2>
            <div style={styles.inputGroup}>
              <label style={styles.label}>手机号</label>
              <input
                className="input-field"
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                maxLength={11}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>昵称</label>
              <input
                className="input-field"
                type="text"
                placeholder="给自己起个名字"
                value={nickname}
                onChange={e => setNickname(e.target.value.slice(0, 20))}
                maxLength={20}
              />
            </div>
            <button className="btn-primary" onClick={sendCode} disabled={loading}>
              {loading ? '发送中...' : '获取验证码'}
            </button>
          </>
        ) : (
          <>
            <h2 style={styles.cardTitle}>输入验证码</h2>
            <p style={styles.codeHint}>验证码已发送至 {phone}</p>
            <div style={styles.inputGroup}>
              <label style={styles.label}>验证码</label>
              <input
                className="input-field"
                type="text"
                placeholder="请输入6位验证码"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                autoFocus
              />
              <div style={styles.codeHint}>
                {countdown > 0 ? (
                  <span style={{ color: 'var(--color-text-light)' }}>{countdown}s后可重新发送</span>
                ) : (
                  <span style={{ color: 'var(--color-primary)', cursor: 'pointer' }} onClick={sendCode}>
                    重新发送验证码
                  </span>
                )}
              </div>
            </div>
            <button className="btn-primary" onClick={handleRegister} disabled={loading}>
              {loading ? '注册中...' : '注册'}
            </button>
            <button
              style={{ ...styles.textBtn, marginTop: 12 }}
              onClick={() => { setStep('phone'); setCode('') }}
            >
              ← 返回修改信息
            </button>
          </>
        )}

        {error && <p className="error-msg" style={{ textAlign: 'center', marginTop: 12 }}>{error}</p>}
      </div>

      <p style={styles.footer}>
        已有账号？<Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>立即登录</Link>
      </p>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    background: 'linear-gradient(180deg, #FFF8F0 0%, #F7FAFC 100%)',
  },
  logoArea: { textAlign: 'center', marginBottom: 32 },
  logo: { fontSize: 64, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 700, color: 'var(--color-secondary)', marginBottom: 8 },
  subtitle: { fontSize: 15, color: 'var(--color-text-light)' },
  card: { width: '100%', maxWidth: 380, background: 'white', borderRadius: 16, padding: 32, boxShadow: 'var(--shadow-lg)' },
  cardTitle: { fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 24, color: 'var(--color-secondary)' },
  inputGroup: { marginBottom: 20 },
  label: { display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--color-secondary)' },
  codeHint: { fontSize: 13, color: 'var(--color-text-light)', marginTop: 8, textAlign: 'center' },
  textBtn: { background: 'none', border: 'none', color: 'var(--color-text-light)', fontSize: 14, cursor: 'pointer', display: 'block', margin: '0 auto' },
  footer: { marginTop: 24, fontSize: 14, color: 'var(--color-text-light)' },
}