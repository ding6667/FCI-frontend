import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { ModalFoot, ModalHead, ModalShell } from '@/components/ModalShell'
import { LEVELS, LEVEL_ORDER } from '@/lib/catalog'
import { money } from '@/lib/format'
import { levelOf } from '@/lib/pricing'
import { useAppStore } from '@/store/useAppStore'

/* ============================ 会员详情 ============================ */

export function MemberDetailModal({ id }: { id: string }) {
  const members = useAppStore((s) => s.members)
  const openModal = useAppStore((s) => s.openModal)
  const closeModal = useAppStore((s) => s.closeModal)
  const showToast = useAppStore((s) => s.showToast)

  const m = members.find((x) => x.id === id)
  if (!m) return null

  const level = levelOf(m)
  const nextKey = LEVEL_ORDER[Math.min(LEVEL_ORDER.length - 1, LEVEL_ORDER.indexOf(m.level) + 1)]
  const next = LEVELS[nextKey]
  const pct = Math.min(100, Math.round((m.growth / (next.threshold || 1)) * 100))

  const coupons = [
    { amount: '¥5', title: '满 49 减 5', scope: '门店 / 小程序' },
    { amount: '¥12', title: '满 99 减 12', scope: '小程序专享' },
    { amount: '9折', title: '浆果 9 折', scope: '与会员价互斥' },
  ].slice(0, Math.min(3, m.coupons))

  return (
    <ModalShell onClose={closeModal}>
      <ModalHead
        kicker={`MEMBER PROFILE · ${m.mask}`}
        title="会员详情"
        sub="线上线下共用同一账户；等级变更即时影响会员价与积分倍率。"
        onClose={closeModal}
      />
      <div className="modal-body">
        <div className="member-detail-head">
          <div className="md-avatar">{m.name.slice(0, 1)}</div>
          <div className="md-main">
            <h3>
              {m.name} <span className={`level ${level.cls}`}>{level.short}</span>
            </h3>
            <p>
              NO. FL-{m.phone.slice(-4)}-{m.id.slice(1).padStart(4, '0')} · 注册于 {m.joined}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="tag tag-green">
              {level.discount < 1 ? `${(level.discount * 10).toFixed(1)} 折` : '无折扣'}
            </span>
            <span className="sub">积分倍率 ×{level.pointsRate}</span>
          </div>
        </div>

        <div className="member-detail-grid">
          <div className="member-detail-stat">
            <span>积分余额</span>
            <b>{m.points}</b>
          </div>
          <div className="member-detail-stat">
            <span>优惠券</span>
            <b>{m.coupons} 张</b>
          </div>
          <div className="member-detail-stat">
            <span>近 30 天消费</span>
            <b>¥{money(m.monthSpend)}</b>
          </div>
          <div className="member-detail-stat">
            <span>近 30 天订单</span>
            <b>{m.monthOrders} 单</b>
          </div>
        </div>

        <div className="growth-mini">
          <div className="gm-line">
            <span>
              成长值 {m.growth} / {next.threshold} · 距 {next.short} 还差 {Math.max(0, next.threshold - m.growth)}
            </span>
            <b>{pct}%</b>
          </div>
          <div className="growth-track">
            <i style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <span className="field-label">会员标签</span>
          <div className="tag-row">
            {m.tags.map((t) => (
              <span className="tag-mini" key={t}>
                {t}
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <span className="field-label">券包 · {m.coupons} 张</span>
          {m.coupons > 0 ? (
            <>
              <div className="coupon-mini-list">
                {coupons.map((c) => (
                  <div className="coupon-mini" key={c.title}>
                    <b>{c.amount}</b>
                    <span>
                      {c.title}
                      <br />
                      {c.scope}
                    </span>
                  </div>
                ))}
              </div>
              {m.coupons > 3 ? <p className="coupon-rule">另有 {m.coupons - 3} 张券未展示</p> : null}
            </>
          ) : (
            <div className="notice soft" style={{ marginTop: 6 }}>
              券包暂无可用券
            </div>
          )}
        </div>

        <div className="notice soft" style={{ marginTop: 10 }}>
          <Icon name="i-info" />
          <span>最近到店：{m.last}；会员价、积分、券与售后权益线上线下通用。</span>
        </div>
      </div>
      <ModalFoot note="敏感操作留痕 ≥ 3 年">
        <button className="btn btn-ghost" onClick={() => showToast('已生成回访任务（演示）')}>
          发起回访
        </button>
        <button className="btn btn-primary" onClick={() => openModal({ type: 'issueCoupon', id: m.id })}>
          发放优惠券
        </button>
      </ModalFoot>
    </ModalShell>
  )
}

/* ============================ 发放优惠券 ============================ */

const COUPON_TEMPLATES = [
  { title: '满 49 减 5', desc: '全场通用 · 30 天' },
  { title: '满 99 减 12', desc: '全场通用 · 30 天' },
  { title: '浆果 9 折', desc: '品类券 · 与会员价互斥' },
]

export function IssueCouponModal({ id }: { id: string }) {
  const members = useAppStore((s) => s.members)
  const issueCoupon = useAppStore((s) => s.issueCoupon)
  const closeModal = useAppStore((s) => s.closeModal)
  const [selected, setSelected] = useState(COUPON_TEMPLATES[0].title)

  const m = members.find((x) => x.id === id)
  if (!m) return null

  return (
    <ModalShell onClose={closeModal} width="min(480px,100%)">
      <ModalHead
        kicker="ISSUE COUPON"
        title={`发放优惠券 · ${m.name}`}
        sub="券进入会员券包，状态“未使用”；核销时校验门槛、渠道与叠加规则。"
        onClose={closeModal}
      />
      <div className="modal-body">
        <div className="radio-cards" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          {COUPON_TEMPLATES.map((t) => (
            <button
              className={`radio-card ${selected === t.title ? 'active' : ''}`}
              key={t.title}
              onClick={() => setSelected(t.title)}
            >
              <b>{t.title}</b>
              <span>{t.desc}</span>
            </button>
          ))}
        </div>
        <div className="notice soft" style={{ marginTop: 10 }}>
          <Icon name="i-ticket" />
          <span>券与活动叠加关系由模板声明；券成本计入营销费用，供应商共担部分进入对账。</span>
        </div>
      </div>
      <ModalFoot note={`当前券包 ${m.coupons} 张`}>
        <button className="btn btn-ghost" onClick={closeModal}>
          取消
        </button>
        <button className="btn btn-primary" onClick={() => issueCoupon(m.id, selected)}>
          确认发放
        </button>
      </ModalFoot>
    </ModalShell>
  )
}

/* ============================ 代客注册 ============================ */

export function MemberRegisterModal() {
  const registerMember = useAppStore((s) => s.registerMember)
  const closeModal = useAppStore((s) => s.closeModal)
  const showToast = useAppStore((s) => s.showToast)

  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  const sendCode = () => {
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      showToast('请先填写正确的手机号', true)
      return
    }
    setCountdown(60)
    showToast('验证码已发送，演示码 123456')
    const timer = window.setInterval(() => {
      setCountdown((v) => {
        if (v <= 1) {
          window.clearInterval(timer)
          return 0
        }
        return v - 1
      })
    }, 1000)
  }

  const submit = () => {
    setError('')
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      setError('请输入正确的 11 位手机号')
      return
    }
    if (code.trim() !== '123456') {
      setError('验证码错误或已过期（演示码 123456）')
      return
    }
    const err = registerMember({ phone: phone.trim(), name: name.trim() })
    if (err) setError(err)
  }

  return (
    <ModalShell onClose={closeModal} width="min(480px,100%)">
      <ModalHead
        kicker="MEMBER REGISTER · STORE"
        title="代客注册"
        sub="门店渠道由收银员录入手机号并让顾客确认，绑定当班门店与推荐员工工号。"
        onClose={closeModal}
      />
      <div className="modal-body">
        <div className="form-grid">
          <label className="full">
            <span className="field-label">手机号 *</span>
            <input
              className="field"
              inputMode="numeric"
              maxLength={11}
              placeholder="11 位手机号，全局唯一"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoFocus
            />
          </label>
          <label className="full">
            <span className="field-label">顾客昵称 *</span>
            <input
              className="field"
              maxLength={50}
              placeholder="1–50 字，不过滤表情"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            <span className="field-label">注册渠道</span>
            <input className="field" value="STORE · 望江路店" readOnly />
          </label>
          <label>
            <span className="field-label">推荐工号</span>
            <input className="field" value="1001 · 王芳" readOnly />
          </label>
          <label className="full">
            <span className="field-label">短信验证码 *</span>
            <div className="code-line">
              <input
                className="field"
                inputMode="numeric"
                maxLength={6}
                placeholder="演示验证码 123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <button type="button" className="code-btn" onClick={sendCode} disabled={countdown > 0}>
                {countdown > 0 ? `${countdown}s` : '获取验证码'}
              </button>
            </div>
          </label>
        </div>
        <span className="field-err">{error}</span>
        <div className="notice soft" style={{ marginTop: 10 }}>
          <Icon name="i-info" />
          <span>注册后自动发放 2 张新人尝鲜券；手机号已存在时引导识别会员，不重复建号（MBR_002）。</span>
        </div>
      </div>
      <ModalFoot note="需顾客当面确认手机号">
        <button className="btn btn-ghost" onClick={closeModal}>
          取消
        </button>
        <button className="btn btn-primary" onClick={submit}>
          注册会员
        </button>
      </ModalFoot>
    </ModalShell>
  )
}
