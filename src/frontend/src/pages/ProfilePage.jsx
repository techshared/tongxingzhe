import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userApi } from '../api'
import { useAuth } from '../App'
import Layout from '../components/Layout'

const CYCLE_POSITIONS = ['冲击期', '低迷期', '调整期', '重建期', '重生期']

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    nickname: user?.nickname || '',
    bio: user?.bio || '',
    avatar_url: user?.avatar_url || '',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setMsg('')
    try {
      const res = await userApi.updateMe(form)
      updateUser(res.data)
      setEditing(false)
      setMsg('保存成功')
      setTimeout(() => setMsg(''), 2000)
    } catch (e) {
      setMsg('保存失败: ' + (e.message || ''))
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const level = user?.r_level || 'R1'
  const position = user?.cycle_position || 0
  const positionLabel = CYCLE_POSITIONS[position] || '冲击期'

  return (
    <Layout>
      <div style={styles.container}>
        {/* Profile Header */}
        <div style={styles.profileHeader}>
          <div style={styles.avatarLarge}>
            {user?.nickname?.[0] || '我'}
          </div>
          <div style={styles.profileInfo}>
            <h2 style={styles.name}>{user?.nickname || '未设置昵称'}</h2>
            <p style={styles.phone}>{user?.phone || ''}</p>
            <p style={styles.bio}>{user?.bio || '这个人很懒，什么都没写'}</p>
          </div>
          <button style={styles.editBtn} onClick={() => setEditing(!editing)}>
            {editing ? '取消' : '编辑资料'}
          </button>
        </div>

        {/* Edit Form */}
        {editing && (
          <div style={styles.editForm}>
            <div style={styles.formGroup}>
              <label style={styles.label}>昵称</label>
              <input
                className="input-field"
                value={form.nickname}
                onChange={e => setForm({ ...form, nickname: e.target.value })}
                placeholder="输入昵称"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>个人简介</label>
              <input
                className="input-field"
                value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                placeholder="介绍一下自己"
              />
            </div>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存修改'}
            </button>
            {msg && <p style={{ ...styles.msg, color: msg.includes('失败') ? 'var(--color-error)' : 'var(--color-accent)' }}>{msg}</p>}
          </div>
        )}

        {/* Cycle Status */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📊 循环状态</h3>
          <div style={styles.cycleDisplay}>
            <div style={styles.levelCircle}>
              <span style={styles.levelNum}>{level}</span>
            </div>
            <div style={styles.cycleInfo}>
              <p style={styles.cycleName}>当前阶段</p>
              <p style={styles.cycleValue}>{positionLabel}</p>
            </div>
          </div>
          <div style={styles.progressSection}>
            <div style={styles.progressLabel}>
              <span>回收进度</span>
              <span>{Math.round((position + 1) * 20)}%</span>
            </div>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${(position + 1) * 20}%` }} />
            </div>
          </div>
          <div style={styles.cycleSteps}>
            {['回收', '链接', '重建', '重生', '反哺'].map((step, i) => (
              <span
                key={step}
                style={{
                  ...styles.step,
                  color: i <= position ? 'var(--color-primary)' : 'var(--color-border)',
                  fontWeight: i === position ? 700 : 500,
                }}
              >
                {step}
                {i < position && <span style={styles.stepCheck}>✓</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div style={styles.menuList}>
          <div style={styles.menuItem} onClick={() => navigate('/diagnosis')}>
            <span style={styles.menuIcon}>🔍</span>
            <span style={styles.menuText}>循环诊断</span>
            <span style={styles.menuArrow}>›</span>
          </div>
          <div style={styles.menuItem} onClick={() => navigate('/firstday')}>
            <span style={styles.menuIcon}>🌟</span>
            <span style={styles.menuText}>首日价值</span>
            <span style={styles.menuArrow}>›</span>
          </div>
          <div style={styles.menuItem}>
            <span style={styles.menuIcon}>📋</span>
            <span style={styles.menuText}>我的技能</span>
            <span style={styles.menuArrow}>›</span>
          </div>
          <div style={styles.menuItem}>
            <span style={styles.menuIcon}>🔗</span>
            <span style={styles.menuText}>人脉图谱</span>
            <span style={styles.menuArrow}>›</span>
          </div>
        </div>

        {/* Logout */}
        <button style={styles.logoutBtn} onClick={handleLogout}>
          退出登录
        </button>
      </div>
    </Layout>
  )
}

const styles = {
  container: { padding: 16 },
  profileHeader: {
    display: 'flex', alignItems: 'flex-start', gap: 16,
    padding: 20, background: 'white', borderRadius: 16, marginBottom: 16, boxShadow: 'var(--shadow)',
  },
  avatarLarge: {
    width: 64, height: 64, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--color-primary), var(--color-process))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontSize: 26, fontWeight: 700, flexShrink: 0,
  },
  profileInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  phone: { fontSize: 13, color: 'var(--color-text-light)', marginBottom: 4 },
  bio: { fontSize: 14, color: 'var(--color-text-light)' },
  editBtn: {
    background: 'none', border: '1.5px solid var(--color-primary)',
    color: 'var(--color-primary)', padding: '6px 14px', borderRadius: 20,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
  },
  editForm: {
    background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: 'var(--shadow)',
  },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 },
  msg: { fontSize: 14, textAlign: 'center', marginTop: 12 },
  card: {
    background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: 'var(--shadow)',
  },
  cardTitle: { fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--color-secondary)' },
  cycleDisplay: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 },
  levelCircle: {
    width: 56, height: 56, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--color-primary), var(--color-process))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  levelNum: { fontSize: 22, fontWeight: 800, color: 'white' },
  cycleInfo: {},
  cycleName: { fontSize: 13, color: 'var(--color-text-light)' },
  cycleValue: { fontSize: 18, fontWeight: 700, color: 'var(--color-secondary)' },
  progressSection: { marginBottom: 12 },
  progressLabel: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 13, color: 'var(--color-text-light)', marginBottom: 6,
  },
  progressBar: {
    height: 6, borderRadius: 3, background: 'var(--color-border)', overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 3,
    background: 'linear-gradient(90deg, var(--color-primary), var(--color-process))',
  },
  cycleSteps: {
    display: 'flex', justifyContent: 'space-between', position: 'relative',
  },
  step: { fontSize: 12, textAlign: 'center', position: 'relative' },
  stepCheck: { fontSize: 8, position: 'absolute', top: -8, right: '50%', transform: 'translateX(4px)' },
  menuList: {
    background: 'white', borderRadius: 16, overflow: 'hidden', marginBottom: 16, boxShadow: 'var(--shadow)',
  },
  menuItem: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
    cursor: 'pointer', transition: 'background 0.15s',
  },
  menuIcon: { fontSize: 22 },
  menuText: { flex: 1, fontSize: 15, fontWeight: 600 },
  menuArrow: { fontSize: 20, color: 'var(--color-border)' },
  logoutBtn: {
    width: '100%', padding: 16, border: '1.5px solid var(--color-error)',
    color: 'var(--color-error)', background: 'white', borderRadius: 12,
    fontSize: 16, fontWeight: 600, cursor: 'pointer',
  },
}