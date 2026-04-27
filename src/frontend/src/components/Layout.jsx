import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../App'

const tabs = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/firstday', label: '首日价值', icon: '🌟' },
  { path: '/diagnosis', label: '诊断', icon: '🔍' },
  { path: '/profile', label: '我的', icon: '👤' },
]

export default function Layout({ children }) {
  const location = useLocation()
  const { logout } = useAuth()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
      <div style={{ flex: 1, paddingBottom: 70 }}>
        {children}
      </div>

      {/* Bottom Nav */}
      <nav style={styles.nav}>
        {tabs.map(tab => {
          const active = location.pathname === tab.path
          return (
            <Link
              key={tab.path}
              to={tab.path}
              style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}
            >
              <span style={styles.navIcon}>{tab.icon}</span>
              <span style={{ ...styles.navLabel, color: active ? 'var(--color-primary)' : 'var(--color-text-light)' }}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

const styles = {
  nav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    background: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTop: '1px solid var(--color-border)',
    zIndex: 100,
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    padding: '6px 16px',
    borderRadius: 8,
    transition: 'all 0.2s',
  },
  navItemActive: {
    background: '#FFF0E6',
  },
  navIcon: { fontSize: 22 },
  navLabel: { fontSize: 11, fontWeight: 600 },
}