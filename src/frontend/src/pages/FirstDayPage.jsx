import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

const QUICK_WINS = [
  { id: 1, title: '完善个人资料', desc: '让更多人了解你', icon: '📋', points: 15, action: 'profile' },
  { id: 2, title: '添加技能标签', desc: '展示你的核心能力', icon: '💪', points: 10, action: 'skills' },
  { id: 3, title: '发布第一条动态', desc: '分享你的故事', icon: '📝', points: 20, action: 'post' },
  { id: 4, title: '加入社群', desc: '找到同路人', icon: '👥', points: 15, action: 'community' },
]

const MATCHES = [
  { id: 1, name: '王老师', title: '资深产品经理', skills: ['产品规划', '用户研究'], needs: ['前端开发'], match: 92 },
  { id: 2, name: '李创业者', title: '连续创业者', skills: ['融资', '团队管理'], needs: ['技术合伙人'], match: 88 },
  { id: 3, name: '张设计师', title: 'UI设计师', skills: ['UI设计', '品牌设计'], needs: ['前端开发'], match: 85 },
]

export default function FirstDayPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('quickwin') // 'quickwin' | 'match'

  return (
    <Layout>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>🌟 首日价值</h1>
          <p style={styles.subtitle}>在这里开启你的改变之旅</p>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(tab === 'quickwin' ? styles.tabActive : {}) }}
            onClick={() => setTab('quickwin')}
          >
            Quick Win
          </button>
          <button
            style={{ ...styles.tab, ...(tab === 'match' ? styles.tabActive : {}) }}
            onClick={() => setTab('match')}
          >
            同路人匹配
          </button>
        </div>

        {/* Content */}
        {tab === 'quickwin' ? (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>🚀 快速开始</h2>
              <span style={styles.sectionSubtitle}>完成这些小事，建立信心</span>
            </div>

            <div style={styles.cardList}>
              {QUICK_WINS.map(item => (
                <div key={item.id} style={styles.card}>
                  <div style={styles.cardIcon}>{item.icon}</div>
                  <div style={styles.cardContent}>
                    <h3 style={styles.cardTitle}>{item.title}</h3>
                    <p style={styles.cardDesc}>{item.desc}</p>
                  </div>
                  <div style={styles.cardPoints}>+{item.points}</div>
                </div>
              ))}
            </div>

            <div style={styles.tipCard}>
              <span style={styles.tipIcon}>💡</span>
              <div>
                <p style={styles.tipTitle}>今日推荐</p>
                <p style={styles.tipText}>先从「完善个人资料」开始，让系统更好地为你推荐同路人！</p>
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>🤝 你可能遇到的人</h2>
              <span style={styles.sectionSubtitle}>基于你的技能和需求智能推荐</span>
            </div>

            <div style={styles.matchList}>
              {MATCHES.map(person => (
                <div key={person.id} style={styles.matchCard}>
                  <div style={styles.matchHeader}>
                    <div style={styles.matchAvatar}>{person.name[0]}</div>
                    <div style={styles.matchInfo}>
                      <h3 style={styles.matchName}>{person.name}</h3>
                      <p style={styles.matchTitle}>{person.title}</p>
                    </div>
                    <div style={styles.matchScore}>
                      <span style={styles.matchPercent}>{person.match}%</span>
                      <span style={styles.matchLabel}>匹配度</span>
                    </div>
                  </div>

                  <div style={styles.matchTags}>
                    <span style={styles.tagLabel}>🟢 可提供</span>
                    {person.skills.map(skill => (
                      <span key={skill} style={styles.tag}>{skill}</span>
                    ))}
                  </div>
                  <div style={styles.matchTags}>
                    <span style={styles.tagLabel}>🟠 需要</span>
                    {person.needs.map(need => (
                      <span key={need} style={{ ...styles.tag, background: '#FFF3E0', color: '#E65100' }}>{need}</span>
                    ))}
                  </div>

                  <button style={styles.connectBtn}>发送连接请求</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

const styles = {
  container: { paddingBottom: 20 },
  header: { textAlign: 'center', padding: '24px 16px', background: 'linear-gradient(180deg, #FFF8F0 0%, #fff 100%)' },
  title: { fontSize: 26, fontWeight: 800, marginBottom: 8 },
  subtitle: { fontSize: 15, color: 'var(--color-text-light)' },
  tabs: { display: 'flex', padding: '0 16px', gap: 12, marginBottom: 16 },
  tab: {
    flex: 1, padding: '12px 0', background: 'white', border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 600, color: 'var(--color-text-light)', cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: { background: 'var(--color-primary)', color: 'white' },
  section: { padding: '0 16px' },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: 'var(--color-text-light)' },
  cardList: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 },
  card: {
    display: 'flex', alignItems: 'center', gap: 14,
    background: 'white', borderRadius: 14, padding: 16,
    boxShadow: 'var(--shadow)', cursor: 'pointer', transition: 'transform 0.15s',
  },
  cardIcon: { fontSize: 32 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: 700, marginBottom: 2 },
  cardDesc: { fontSize: 13, color: 'var(--color-text-light)' },
  cardPoints: {
    background: '#F0FFF4', color: 'var(--color-accent)',
    padding: '4px 10px', borderRadius: 20,
    fontSize: 13, fontWeight: 700,
  },
  tipCard: {
    display: 'flex', alignItems: 'flex-start', gap: 12,
    background: '#FFF8E1', borderRadius: 12, padding: 14,
  },
  tipIcon: { fontSize: 24 },
  tipTitle: { fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#B7791F' },
  tipText: { fontSize: 13, color: '#92400E', lineHeight: 1.5 },
  matchList: { display: 'flex', flexDirection: 'column', gap: 16 },
  matchCard: {
    background: 'white', borderRadius: 14, padding: 16,
    boxShadow: 'var(--shadow)',
  },
  matchHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  matchAvatar: {
    width: 48, height: 48, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--color-primary), var(--color-process))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontSize: 20, fontWeight: 700,
  },
  matchInfo: { flex: 1 },
  matchName: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  matchTitle: { fontSize: 13, color: 'var(--color-text-light)' },
  matchScore: { textAlign: 'center' },
  matchPercent: { display: 'block', fontSize: 20, fontWeight: 800, color: 'var(--color-accent)' },
  matchLabel: { fontSize: 11, color: 'var(--color-text-light)' },
  matchTags: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tagLabel: { fontSize: 12, color: 'var(--color-text-light)', marginRight: 4 },
  tag: {
    background: '#E8F5E9', color: '#2E7D32',
    padding: '3px 10px', borderRadius: 15, fontSize: 12, fontWeight: 600,
  },
  connectBtn: {
    width: '100%', padding: '12px 0', background: 'var(--color-primary)',
    color: 'white', border: 'none', borderRadius: 10,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
}