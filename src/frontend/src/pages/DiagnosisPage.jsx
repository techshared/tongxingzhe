import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { cycleApi } from '../api'
import Layout from '../components/Layout'

const DIMENSIONS = ['自我认知', '社交关系', '职业技能', '经济状况']

export default function DiagnosisPage() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    try {
      const res = await cycleApi.getDiagnosisQuestions()
      setQuestions(res.data?.questions || [])
    } catch (e) {
      // Demo questions if API fails
      setQuestions([
        { id: '1', dimension: '自我认知', question: '近一个月，你是否会经常感到自我怀疑？', options: [{ value: 0, label: '从不' }, { value: 1, label: '偶尔' }, { value: 2, label: '有时' }, { value: 3, label: '经常' }, { value: 4, label: '总是' }] },
        { id: '2', dimension: '社交关系', question: '你多久主动联系一次朋友或同事？', options: [{ value: 0, label: '每天' }, { value: 1, label: '每周' }, { value: 2, label: '每月' }, { value: 3, label: '很少' }, { value: 4, label: '从不' }] },
        { id: '3', dimension: '职业技能', question: '你对未来职业方向有多清晰？', options: [{ value: 4, label: '非常清晰' }, { value: 3, label: '比较清晰' }, { value: 2, label: '有些模糊' }, { value: 1, label: '比较模糊' }, { value: 0, label: '完全不清楚' }] },
        { id: '4', dimension: '经济状况', question: '你的储蓄能维持多久的基本生活？', options: [{ value: 4, label: '1年以上' }, { value: 3, label: '6-12个月' }, { value: 2, label: '3-6个月' }, { value: 1, label: '1-3个月' }, { value: 0, label: '不到1个月' }] },
        { id: '5', dimension: '自我认知', question: '你平均每天花多少时间在求职上？', options: [{ value: 4, label: '4小时以上' }, { value: 3, label: '2-4小时' }, { value: 2, label: '1-2小时' }, { value: 1, label: '不到1小时' }, { value: 0, label: '几乎不' }] },
        { id: '6', dimension: '社交关系', question: '你周围有多少人可以提供职业帮助？', options: [{ value: 4, label: '5人以上' }, { value: 3, label: '3-5人' }, { value: 2, label: '1-2人' }, { value: 1, label: '只有家人' }, { value: 0, label: '几乎没有' }] },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      return
    }
    setSubmitting(true)
    try {
      const res = await cycleApi.submitDiagnosis(
        Object.entries(answers).map(([qId, val]) => ({ question_id: qId, value: val }))
      )
      setResult(res.data)
    } catch (e) {
      setResult({ cycle_position: 1, cycle_position_label: '低迷期' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="loading">加载中...</div>

  if (result) {
    return (
      <Layout>
        <div style={styles.resultContainer}>
          <div style={styles.resultCard}>
            <div style={styles.resultEmoji}>🔍</div>
            <h2 style={styles.resultTitle}>诊断结果</h2>
            <div style={styles.resultBadge}>
              <span style={styles.resultPosition}>{result.cycle_position_label}</span>
              <span style={styles.resultPositionNum}>循环位置 {result.cycle_position + 1}/5</span>
            </div>
            <p style={styles.resultDesc}>
              根据你的回答，你目前处于「{result.cycle_position_label}」阶段。
              这是一个正常的心理过渡期，通过参与社群活动和完成首日价值任务，
              你可以逐步走出困境，建立新的人际网络。
            </p>
            <div style={styles.resultActions}>
              <button className="btn-primary" onClick={() => navigate('/firstday')}>
                开启首日价值
              </button>
              <button className="btn-secondary" onClick={() => navigate('/')}>
                返回首页
              </button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const q = questions[current]
  const progress = ((current + 1) / questions.length) * 100

  return (
    <Layout>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>← 返回</button>
          <h2 style={styles.title}>循环诊断</h2>
          <span style={{ width: 50 }} />
        </div>

        {/* Progress */}
        <div style={styles.progressSection}>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>
          <p style={styles.progressText}>{current + 1} / {questions.length}</p>
        </div>

        {/* Question */}
        {q && (
          <div style={styles.questionCard}>
            <div style={styles.dimensionBadge}>{q.dimension}</div>
            <h3 style={styles.questionText}>{q.question}</h3>
            <div style={styles.options}>
              {q.options?.map(opt => (
                <div
                  key={opt.value}
                  style={{
                    ...styles.option,
                    ...(answers[q.id] === opt.value ? styles.optionSelected : {}),
                  }}
                  onClick={() => setAnswers({ ...answers, [q.id]: opt.value })}
                >
                  <span style={styles.optionRadio}>
                    {answers[q.id] === opt.value ? '✓' : ''}
                  </span>
                  <span>{opt.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={styles.navButtons}>
          {current > 0 && (
            <button style={styles.prevBtn} onClick={() => setCurrent(current - 1)}>
              ← 上一题
            </button>
          )}
          {current < questions.length - 1 ? (
            <button
              style={styles.nextBtn}
              onClick={() => setCurrent(current + 1)}
              disabled={answers[q?.id] === undefined}
            >
              下一题 →
            </button>
          ) : (
            <button
              className="btn-primary"
              style={{ flex: 1 }}
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length < questions.length}
            >
              {submitting ? '提交中...' : '查看结果'}
            </button>
          )}
        </div>
      </div>
    </Layout>
  )
}

const styles = {
  container: { padding: 16 },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: { background: 'none', border: 'none', fontSize: 16, color: 'var(--color-text-light)', cursor: 'pointer' },
  title: { fontSize: 18, fontWeight: 700 },
  progressSection: { marginBottom: 24 },
  progressBar: { height: 4, borderRadius: 2, background: 'var(--color-border)', overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 2, background: 'var(--color-primary)', transition: 'width 0.3s' },
  progressText: { fontSize: 13, color: 'var(--color-text-light)', textAlign: 'center' },
  questionCard: { background: 'white', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: 'var(--shadow)' },
  dimensionBadge: {
    display: 'inline-block', background: '#F0FFF4', color: 'var(--color-accent)',
    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, marginBottom: 12,
  },
  questionText: { fontSize: 17, fontWeight: 700, lineHeight: 1.6, marginBottom: 20 },
  options: { display: 'flex', flexDirection: 'column', gap: 10 },
  option: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px', border: '1.5px solid var(--color-border)', borderRadius: 12,
    cursor: 'pointer', transition: 'all 0.15s', fontSize: 15,
  },
  optionSelected: {
    borderColor: 'var(--color-primary)', background: '#FFF0E6',
    color: 'var(--color-primary)',
  },
  optionRadio: {
    width: 22, height: 22, borderRadius: '50%', border: '2px solid var(--color-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, flexShrink: 0,
  },
  navButtons: {
    display: 'flex', gap: 12,
  },
  prevBtn: {
    padding: '14px 20px', background: 'white', border: '1.5px solid var(--color-border)',
    borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', color: 'var(--color-text-light)',
  },
  nextBtn: {
    flex: 1, padding: '14px 20px', background: 'white', border: '1.5px solid var(--color-primary)',
    borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', color: 'var(--color-primary)',
  },
  resultContainer: { padding: 16 },
  resultCard: {
    background: 'white', borderRadius: 16, padding: 32, marginTop: 16,
    textAlign: 'center', boxShadow: 'var(--shadow-lg)',
  },
  resultEmoji: { fontSize: 64, marginBottom: 16 },
  resultTitle: { fontSize: 24, fontWeight: 800, marginBottom: 16, color: 'var(--color-secondary)' },
  resultBadge: { marginBottom: 20 },
  resultPosition: {
    display: 'block', fontSize: 28, fontWeight: 800, color: 'var(--color-primary)',
    marginBottom: 4,
  },
  resultPositionNum: { fontSize: 14, color: 'var(--color-text-light)' },
  resultDesc: { fontSize: 15, lineHeight: 1.7, color: 'var(--color-text-light)', marginBottom: 24 },
  resultActions: { display: 'flex', flexDirection: 'column', gap: 12 },
}