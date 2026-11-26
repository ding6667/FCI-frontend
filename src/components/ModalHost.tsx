import { Icon } from '@/components/Icon'
import { ModalFoot, ModalHead, ModalShell } from '@/components/ModalShell'
import { BatchCutModal, BatchDiscountModal, BatchWasteModal } from '@/features/expiry/modals'
import { BatchTraceModal, ReplenishModal } from '@/features/inventory/modals'
import { IssueCouponModal, MemberDetailModal, MemberRegisterModal } from '@/features/members/modals'
import { OrderDetailModal, PickModal } from '@/features/orders/modals'
import { CashModal, CouponPickerModal, MemberPickerModal, ReceiptModal, ScanModal } from '@/features/pos/modals'
import { ShiftModal } from '@/features/shift/ShiftModal'
import { useAppStore } from '@/store/useAppStore'

/** 全局弹窗宿主：由 store 中的判别联合驱动，替代原型的 openModal(html) */
export default function ModalHost() {
  const modal = useAppStore((s) => s.modal)

  if (!modal) return null

  switch (modal.type) {
    case 'logout':
      return <LogoutModal />
    case 'clearTicket':
      return <ClearTicketModal />
    case 'shift':
      return <ShiftModal />
    case 'memberPicker':
      return <MemberPickerModal />
    case 'couponPicker':
      return <CouponPickerModal />
    case 'cash':
      return <CashModal />
    case 'scan':
      return <ScanModal />
    case 'receipt':
      return <ReceiptModal />
    case 'batch':
      return modal.mode === 'discount' ? (
        <BatchDiscountModal key={modal.id} id={modal.id} />
      ) : modal.mode === 'cut' ? (
        <BatchCutModal key={modal.id} id={modal.id} />
      ) : (
        <BatchWasteModal key={modal.id} id={modal.id} />
      )
    case 'pick':
      return <PickModal key={modal.no} no={modal.no} />
    case 'orderDetail':
      return <OrderDetailModal key={modal.no} no={modal.no} />
    case 'replenish':
      return <ReplenishModal key={modal.id} id={modal.id} />
    case 'batchTrace':
      return <BatchTraceModal key={modal.id} id={modal.id} />
    case 'memberDetail':
      return <MemberDetailModal key={modal.id} id={modal.id} />
    case 'issueCoupon':
      return <IssueCouponModal key={modal.id} id={modal.id} />
    case 'memberRegister':
      return <MemberRegisterModal />
    default:
      return null
  }
}

function LogoutModal() {
  const closeModal = useAppStore((s) => s.closeModal)
  const signOut = useAppStore((s) => s.signOut)
  const showToast = useAppStore((s) => s.showToast)

  return (
    <ModalShell onClose={closeModal} width="min(480px,100%)">
      <ModalHead
        kicker="SIGN OUT"
        title="退出门店台？"
        sub="未完成的购物单会保留在当前班次，下次登录可继续。"
        onClose={closeModal}
      />
      <div className="modal-body">
        <div className="notice soft">
          <Icon name="i-shield" />
          <span>敏感操作（改价、报损、退款、手工改重）均按授权额度留痕，退出不会清除操作记录。</span>
        </div>
      </div>
      <ModalFoot>
        <button className="btn btn-ghost" onClick={closeModal}>
          继续当班
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            signOut()
            showToast('已退出门店台')
          }}
        >
          退出登录
        </button>
      </ModalFoot>
    </ModalShell>
  )
}

function ClearTicketModal() {
  const closeModal = useAppStore((s) => s.closeModal)
  const clearTicket = useAppStore((s) => s.clearTicket)

  return (
    <ModalShell onClose={closeModal} width="min(480px,100%)">
      <ModalHead
        kicker="CANCEL TICKET"
        title="清空当前购物单？"
        sub="尚未收款，清空不会影响库存与会员资产。"
        onClose={closeModal}
      />
      <div className="modal-body">
        <div className="notice amber">
          <Icon name="i-warn" />
          <span>若顾客只是暂时离开，可先「挂单」，稍后取回继续结算。</span>
        </div>
      </div>
      <ModalFoot>
        <button className="btn btn-ghost" onClick={closeModal}>
          取消
        </button>
        <button className="btn btn-danger" onClick={clearTicket}>
          确认清空
        </button>
      </ModalFoot>
    </ModalShell>
  )
}
