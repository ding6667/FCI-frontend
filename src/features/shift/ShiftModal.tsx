import { Icon } from '@/components/Icon'
import { ModalFoot, ModalHead, ModalShell } from '@/components/ModalShell'
import { useAppStore } from '@/store/useAppStore'

export function ShiftModal() {
  const held = useAppStore((s) => s.held)
  const closeModal = useAppStore((s) => s.closeModal)
  const showToast = useAppStore((s) => s.showToast)
  const hasHeld = !!held

  return (
    <ModalShell onClose={closeModal} width="min(480px,100%)">
      <ModalHead
        kicker="SHIFT CLOSE · A01"
        title="交班日结"
        sub="A 班 07:00 — 15:00 · 收银员 王芳 · 开班备用金 ¥500.00"
        onClose={closeModal}
      />
      <div className="modal-body">
        <div className="member-detail-grid">
          <div className="member-detail-stat">
            <span>现金应收</span>
            <b>¥8,640.00</b>
          </div>
          <div className="member-detail-stat">
            <span>扫码应收</span>
            <b>¥3,846.50</b>
          </div>
          <div className="member-detail-stat">
            <span>会员余额</span>
            <b>¥0.00</b>
          </div>
          <div className="member-detail-stat">
            <span>长短款差异</span>
            <b style={{ color: 'var(--green)' }}>¥0.00</b>
          </div>
        </div>

        <div className="money-summary">
          <div className="money-row">
            <span>现金实点</span>
            <b>¥9,140.00</b>
          </div>
          <div className="money-row">
            <span>减：备用金</span>
            <b>- ¥500.00</b>
          </div>
          <div className="money-row total">
            <span>现金应收核对</span>
            <b>¥8,640.00</b>
          </div>
        </div>

        <div className={`notice ${hasHeld ? 'amber' : 'green'}`}>
          <Icon name={hasHeld ? 'i-warn' : 'i-check'} />
          <span>
            {hasHeld
              ? '有 1 笔挂单未取，跨班次必须显式处理，不能静默结转。'
              : '无未取挂单；设备状态正常，电子秤检定有效。'}
          </span>
        </div>
        <div className="notice soft" style={{ marginTop: 8 }}>
          <Icon name="i-shield" />
          <span>日结包含手工改重、无码商品与离线补传异常清单；差异超阈值将锁定并追责。</span>
        </div>
      </div>
      <ModalFoot note="日结单将推送财务对账">
        <button className="btn btn-ghost" onClick={closeModal}>
          再核对一下
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            closeModal()
            showToast('交班完成：日结单已生成并推送财务对账')
          }}
        >
          交班并打印日结
        </button>
      </ModalFoot>
    </ModalShell>
  )
}
