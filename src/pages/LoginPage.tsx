import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { useAppStore } from '@/store/useAppStore'

const STORES = ['望江路店 · A01', '玉林路店 · B02', '春熙路店 · C01']
const PHONE_RE = /^1[3-9]\d{9}$/

export default function LoginPage() {
  const loggedIn = useAppStore((s) => s.loggedIn)
  const login = useAppStore((s) => s.login)
  const showToast = useAppStore((s) => s.showToast)
  const navigate = useNavigate()

  const [mode, setMode] = useState<'login' | 'activate'>('login')

  /* 员工登录 */
  const [staffId, setStaffId] = useState('')
  const [password, setPassword] = useState('')
  const [store, setStore] = useState(STORES[0])
  const [agree, setAgree] = useState(false)
  const [errors, setErrors] = useState<{ id?: string; pwd?: string; form?: string }>({})

  /* 员工激活 */
  const [act, setAct] = useState({ id: '', name: '', phone: '', code: '', store: STORES[0], role: '收银员', agree: false })
  const [actErrors, setActErrors] = useState<Record<string, string>>({})
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = window.setTimeout(() => setCountdown((v) => v - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown])

  if (loggedIn) return <Navigate to="/app/dashboard" replace />

  const switchAuth = (next: 'login' | 'activate') => {
    setMode(next)
    setErrors({})
    setActErrors({})
  }

  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const result = login(staffId.trim(), password)
    if (!result.ok) {
      setErrors({
        id: result.field === 'id' ? result.message : undefined,
        pwd: result.field === 'pwd' ? result.message : undefined,
        form: result.field === 'form' ? result.message : undefined,
      })
      return
    }
    showToast('早班已开启，王芳。今日 4 单待履约')
    navigate('/app/dashboard', { replace: true })
  }

  const sendCode = () => {
    if (!PHONE_RE.test(act.phone.trim())) {
      setActErrors((v) => ({ ...v, phone: '请输入正确的 11 位手机号' }))
      showToast('请先填写正确的手机号', true)
      return
    }
    setActErrors((v) => ({ ...v, phone: '' }))
    setCountdown(60)
    showToast('激活验证码已发送，演示码 123456')
  }

  const submitActivate = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    const id = act.id.trim()
    const name = act.name.trim()
    const phone = act.phone.trim()
    const code = act.code.trim()

    if (!id) next.id = '请输入工号'
    else if (id === '1001') next.id = '该工号已激活，请直接登录'
    if (!name) next.name = '请输入姓名'
    if (!phone) next.phone = '请输入手机号'
    else if (!PHONE_RE.test(phone)) next.phone = '请输入正确的 11 位手机号'
    if (!code) next.code = '请输入验证码'
    else if (code !== '123456') next.code = '验证码错误或已过期（演示码 123456）'
    if (!act.agree) next.form = '请先确认信息并同意开通权限'

    setActErrors(next)
    if (Object.keys(next).length) return

    showToast('员工账号已提交激活，请使用工号登录')
    setMode('login')
    setStaffId(id)
  }

  const fillDemo = () => {
    setStaffId('1001')
    setPassword('123456')
    setStore(STORES[0])
    setErrors({})
    showToast('演示账号已填入，点击「进入门店作业台」')
  }

  return (
    <section className="login-screen">
      <div className="login-art">
        <div className="login-brand">
          <div className="brand-lockup">
            <div className="brand-leaf">
              <Icon name="i-leaf" />
            </div>
            <div>
              <div className="brand-name">果链智联</div>
              <div className="brand-sub">STORE COUNTER · 门店台</div>
            </div>
          </div>
          <div className="edition">
            OPS V1.0
            <br />
            2026.11.03
          </div>
        </div>

        <div className="login-hero">
          <div className="login-kicker">TODAY'S COUNTER · A01</div>
          <h1>
            回到
            <br />
            <em>柜台。</em>
          </h1>
          <p className="login-lead">称重、会员、临期与收款都在同一张单据上。按下 F2 就能收款，每一笔都能追溯。</p>
          <div className="login-stats">
            <div className="login-stat">
              <span>TODAY SALES</span>
              <b>
                ¥12,486<small>.50</small>
              </b>
            </div>
            <div className="login-stat">
              <span>ORDERS</span>
              <b>
                186<small>单</small>
              </b>
            </div>
            <div className="login-stat">
              <span>NEAR EXPIRY</span>
              <b>
                6<small>批</small>
              </b>
            </div>
          </div>
        </div>

        <div className="login-ticker">
          <span className="dot-live" />
          门店在线 <span className="sep">/</span> 06:00 到仓 <span className="sep">/</span> 电子秤 03 已连接{' '}
          <span className="sep">/</span> 近效期优先
        </div>

        <svg className="login-fruit" viewBox="0 0 300 220" aria-hidden="true">
          <ellipse cx="155" cy="198" rx="118" ry="15" fill="#071A11" opacity=".5" />
          <use href="#fruit-strawberry" x="46" y="66" width="142" height="142" />
          <use href="#fruit-cherry" x="160" y="24" width="100" height="100" />
          <use href="#fruit-apple" x="182" y="112" width="96" height="96" />
          <path d="M66 196h180l-14-36H80Z" fill="#D8B57B" stroke="#24382A" strokeWidth="2.5" />
        </svg>
      </div>

      <div className="login-panel">
        <div className="login-card">
          <p className="eyebrow">STORE ACCESS · EMPLOYEE ONLY</p>
          <h2 className="login-title">员工通道。</h2>
          <p className="login-desc">登录后按岗位权限进入作业台；改价、报损、退款等敏感操作需值班经理授权。</p>

          <div className="auth-tabs">
            <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => switchAuth('login')}>
              员工登录
            </button>
            <button className={`auth-tab ${mode === 'activate' ? 'active' : ''}`} onClick={() => switchAuth('activate')}>
              员工激活
            </button>
          </div>

          {mode === 'login' ? (
            <form className="login-form" onSubmit={submitLogin} noValidate>
              <label className="login-field">
                <span className="login-label">
                  工号 / 手机号 <em>EMPLOYEE ID</em>
                </span>
                <input
                  className="login-input"
                  placeholder="输入工号 1001 或手机号"
                  autoComplete="username"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                />
                <span className="field-err">{errors.id}</span>
              </label>
              <label className="login-field">
                <span className="login-label">
                  登录密码 <em>PASSWORD</em>
                </span>
                <input
                  className="login-input"
                  type="password"
                  placeholder="输入密码"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span className="field-err">{errors.pwd}</span>
              </label>
              <label className="login-field">
                <span className="login-label">
                  当班门店 <em>STORE</em>
                </span>
                <span className="select-wrap">
                  <select className="login-input" value={store} onChange={(e) => setStore(e.target.value)}>
                    {STORES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </span>
              </label>

              <div className="login-agree">
                <button
                  type="button"
                  className={`check-box ${agree ? 'on' : ''}`}
                  onClick={() => setAgree((v) => !v)}
                  aria-pressed={agree}
                >
                  <Icon name="i-check" />
                </button>
                <span>登录即代表已阅读《员工操作规范》，敏感操作将按授权额度留痕。</span>
              </div>

              <span className="field-err">{errors.form}</span>
              <button className="btn btn-primary login-submit" type="submit">
                进入门店作业台 <Icon name="i-arrow" />
              </button>

              <div className="login-demo">
                <p>
                  <b>DEMO · 工号 1001 / 密码 123456</b>
                  值班店长王芳，A 班 07:00–15:00
                </p>
                <button type="button" onClick={fillDemo}>
                  填入演示账号 →
                </button>
              </div>
              <p className="login-help">遇到账号问题请联系区域管理员 · 密码错误 5 次锁定 10 分钟</p>
            </form>
          ) : (
            <form className="login-form" onSubmit={submitActivate} noValidate>
              <div className="login-row">
                <label className="login-field">
                  <span className="login-label">工号</span>
                  <input
                    className="login-input"
                    placeholder="例：1002"
                    value={act.id}
                    onChange={(e) => setAct({ ...act, id: e.target.value })}
                  />
                  <span className="field-err">{actErrors.id}</span>
                </label>
                <label className="login-field">
                  <span className="login-label">姓名</span>
                  <input
                    className="login-input"
                    placeholder="真实姓名"
                    value={act.name}
                    onChange={(e) => setAct({ ...act, name: e.target.value })}
                  />
                  <span className="field-err">{actErrors.name}</span>
                </label>
              </div>
              <label className="login-field">
                <span className="login-label">手机号</span>
                <div className="code-line">
                  <input
                    className="login-input"
                    inputMode="numeric"
                    maxLength={11}
                    placeholder="接收激活验证码"
                    value={act.phone}
                    onChange={(e) => setAct({ ...act, phone: e.target.value })}
                  />
                  <button className="code-btn" type="button" onClick={sendCode} disabled={countdown > 0}>
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
                <span className="field-err">{actErrors.phone}</span>
              </label>
              <div className="login-row">
                <label className="login-field">
                  <span className="login-label">门店</span>
                  <span className="select-wrap">
                    <select
                      className="login-input"
                      value={act.store}
                      onChange={(e) => setAct({ ...act, store: e.target.value })}
                    >
                      {STORES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </span>
                </label>
                <label className="login-field">
                  <span className="login-label">岗位</span>
                  <span className="select-wrap">
                    <select
                      className="login-input"
                      value={act.role}
                      onChange={(e) => setAct({ ...act, role: e.target.value })}
                    >
                      <option>收银员</option>
                      <option>值班店长</option>
                      <option>仓管员</option>
                    </select>
                  </span>
                </label>
              </div>
              <label className="login-field">
                <span className="login-label">激活验证码</span>
                <input
                  className="login-input"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="演示验证码 123456"
                  value={act.code}
                  onChange={(e) => setAct({ ...act, code: e.target.value })}
                />
                <span className="field-err">{actErrors.code}</span>
              </label>

              <div className="login-agree">
                <button
                  type="button"
                  className={`check-box ${act.agree ? 'on' : ''}`}
                  onClick={() => setAct({ ...act, agree: !act.agree })}
                  aria-pressed={act.agree}
                >
                  <Icon name="i-check" />
                </button>
                <span>我确认以上信息真实有效，并同意按岗位模板开通权限。</span>
              </div>

              <span className="field-err">{actErrors.form}</span>
              <button className="btn btn-primary login-submit" type="submit">
                激活员工账号 <Icon name="i-arrow" />
              </button>
              <p className="login-help">激活后由门店管理员复核；改价、报损等敏感操作仍需授权额度。</p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
