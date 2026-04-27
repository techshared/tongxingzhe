import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cycleApi, userApi } from '../api'
import { useAuth } from '../App'
import Layout from '../components/Layout'

const CYCLE_POSITIONS = ['冲击期', '低迷期', '调整期', '重建期', '重生期']

export default function HomePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const res = await cycleApi.getDashboard()
      setDashboard(res.data)
    } catch (e) {
      console.error('Dashboard load failed:', e)
    } finally {
      setLoading(false)
    }
    // Demo tasks
    setTasks([
      { id: 1, title: '送一句鼓励', icon: '💬', points: 5, type: 'quick_win' },
      { id: 2, title: '发布一条动态', icon: '📝', points: 10, type: 'social' },
      { id: 3, title: '完成循环诊断', icon: '🔍', points: 20, type: 'diagnosis', path: '/diagnosis' },
      { id: 4, title: '完善个人资料', icon: '📋', points: 15, type: 'profile', path: '/profile' },
    ])
  }

  const completeTask = async (task) => {
    try {
      if (task.path) {
        navigate(task.path)
        return
      }
      await cycleApi.completeTask(task.id)
      setTasks(tasks.filter(t => t.id !== task.id))
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div className="loading">加载中...</div>

  const level = dashboard?.current_level || 'R1'
  const levelLabel = dashboard?.current_level_label || '入门阶段'
  const position = dashboard?.cycle_position || 0
  const positionLabel = CYCLE_POSITIONS[position] || '冲击期'

  return (
    <Layout>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.appTitle}>同行者</h1>
          <p style={styles.welcomeText}>欢迎，{user?.nickname || '同行者'}</p>
        </div>
        <Link to="/profile">
          <div style={styles.avatar}>{user?.nickname?.[0] || '我'}</div>
        </Link>
      </div>

      {/* Cycle Dashboard Card */}
      <div style={styles.cycleCard}>
        <div style={styles.cycleHeader}>
          <h2 style={styles.cycleTitle}>🔄 循环仪表盘</h2>
          <span style={styles.levelBadge}>R级</span>
        </div>

        <div style={styles.cycleVisual}>
          <div style={styles.cycleRing}>
            <div style={styles.cycleCenter}>
              <span style={styles.levelLarge}>{level}</span>
              <span style={styles.levelLabel}>{levelLabel}</span>
            </div>
          </div>
        </div>

        <div style={styles.cycleStatus}>
          <div style={styles.statusRow}>
            <span style={styles.statusLabel}>📍 当前循环位置</span>
            <span style={styles.statusValue}>{positionLabel} ({position + 1}/5)</span>
          </div>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${(position + 1) * 20}%` }} />
          </div>
        </div>

        <div style={styles.cycleActions}>
          <Link to="/diagnosis">
            <button className="btn-secondary" style={{ flex: 1 }}>查看详情</button>
          </Link>
          <Link to="/firstday">
            <button className="btn-primary" style={{ flex: 1 }}>开始干预</button>
          </Link>
        </div>
      </div>

      {/* Today's Tasks */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>🔥 今日任务</h3>
        <div style={styles.taskGrid}>
          {tasks.map(task => (
            <div key={task.id} style={styles.taskCard} onClick={() => completeTask(task)}>
              <span style={styles.taskIcon}>{task.icon}</span>
              <span style={styles.taskTitle}>{task.title}</span>
              <span style={styles.taskPoints}>+{task.points}分</span>
            </div>
          ))}
        </div>
        {tasks.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--color-text-light)', padding: 20 }}>
            今日任务已全部完成 🎉 明天再来吧！
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>💡 快捷入口</h3>
        <div style={styles.quickActions}>
          <Link to="/firstday" style={styles.quickBtn}>
            <span style={styles.quickIcon}>🌟</span>
            <span>首日价值</span>
          </Link>
          <Link to="/diagnosis" style={styles.quickBtn}>
            <span style={styles.quickIcon}>🔍</span>
            <span>循环诊断</span>
          </Link>
          <Link to="/profile" style={styles.quickBtn}>
            <span style={styles.quickIcon}>👤</span>
            <span>个人主页</span>
          </Link>
        </div>
      </div>
    </Layout>
  )
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 20px 16px',
    background: 'white',
  },
  appTitle: { fontSize: 20, fontWeight: 700, color: 'var(--color-secondary)' },
  welcomeText: { fontSize: 14, color: 'var(--color-text-light)', marginTop: 4 },
  avatar: {
    width: 44, height: 44, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--color-primary), var(--color-process))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontSize: 18, fontWeight: 700,
  },
  cycleCard: {
    margin: '0 16px 16px',
    background: 'white',
    borderRadius: 16,
    padding: 20,
    boxShadow: 'var(--shadow)',
  },
  cycleHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  cycleTitle: { fontSize: 17, fontWeight: 700, color: 'var(--color-secondary)' },
  levelBadge: {
    background: 'var(--color-process)', color: 'var(--color-secondary)',
    padding: '2px 10px', borderRadius: 20, fontSize: 13, fontWeight: 600,
  },
  cycleVisual: {
    display: 'flex', justifyContent: 'center', marginBottom: 16,
  },
  cycleRing: {
    width: 120, height: 120, borderRadius: '50%',
    border: '6px solid var(--color-process)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  cycleCenter: {
    textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  levelLarge: { fontSize: 32, fontWeight: 800, color: 'var(--color-secondary)' },
  levelLabel: { fontSize: 12, color: 'var(--color-text-light)', marginTop: 2 },
  cycleStatus: { marginBottom: 16 },
  statusRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 14, marginBottom: 8,
  },
  statusLabel: { color: 'var(--color-text-light)' },
  statusValue: { fontWeight: 600, color: 'var(--color-secondary)' },
  progressBar: {
    height: 6, borderRadius: 3, background: 'var(--color-border)', overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 3,
    background: 'linear-gradient(90deg, var(--color-primary), var(--color-process))',
    transition: 'width 0.3s',
  },
  cycleActions: {
    display: 'flex', gap: 12,
  },
  section: { margin: '0 16px 16px' },
  sectionTitle: {
    fontSize: 16, fontWeight: 700, color: 'var(--color-secondary)',
    marginBottom: 12, paddingLeft: 4,
  },
  taskGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12,
  },
  taskCard: {
    background: 'white', borderRadius: 12, padding: 16,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: 'var(--shadow)', textAlign: 'center',
  },
  taskIcon: { fontSize: 28 },
  taskTitle: { fontSize: 14, fontWeight: 600, color: 'var(--color-secondary)' },
  taskPoints: {
    fontSize: 12, color: 'var(--color-accent)', fontWeight: 600,
    background: '#F0FFF4', padding: '2px 8px', borderRadius: 10,
  },
  quickActions: {
    display: 'flex', gap: 12,
  },
  quickBtn: {
    flex: 1, background: 'white', borderRadius: 12, padding: 16,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    boxShadow: 'var(--shadow)', transition: 'transform 0.15s',
  },
  quickIcon: { fontSize: 24 },
}