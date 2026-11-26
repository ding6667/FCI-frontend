import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/Icon'
import { PRODUCTS } from '@/data/mock'
import { ProductGrid } from '@/features/pos/ProductGrid'
import { TicketPanel } from '@/features/pos/TicketPanel'
import { WeighCard } from '@/features/pos/WeighCard'
import { productById } from '@/lib/pricing'
import { useAppStore } from '@/store/useAppStore'

const CATEGORIES = ['全部', ...Array.from(new Set(PRODUCTS.map((p) => p.cat)))]

export default function PosPage() {
  const grossRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [searchText, setSearchText] = useState('')

  const category = useAppStore((s) => s.posCategory)
  const setPosCategory = useAppStore((s) => s.setPosCategory)
  const setPosSearch = useAppStore((s) => s.setPosSearch)
  const lines = useAppStore((s) => s.posLines)
  const pay = useAppStore((s) => s.posPay)
  const modal = useAppStore((s) => s.modal)
  const openModal = useAppStore((s) => s.openModal)
  const addLine = useAppStore((s) => s.addLine)
  const setCurrentLoose = useAppStore((s) => s.setCurrentLoose)
  const holdTicket = useAppStore((s) => s.holdTicket)
  const showToast = useAppStore((s) => s.showToast)

  const startPayment = useCallback(() => {
    if (!lines.length) {
      showToast('购物单为空，先加点商品', true)
      return
    }
    openModal({ type: pay === 'cash' ? 'cash' : 'scan' })
  }, [lines.length, pay, openModal, showToast])

  /** 快捷键：F2 收款 / F3 聚焦搜索 / F4 挂单，与设计稿标注一致 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modal) return
      if (e.key === 'F2') {
        e.preventDefault()
        startPayment()
      }
      if (e.key === 'F3') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'F4') {
        e.preventDefault()
        holdTicket()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modal, startPayment, holdTicket])

  const handlePick = (pid: string) => {
    const p = productById(pid)
    if (!p) return
    if (String(p.stock).startsWith('0')) {
      showToast('该商品门店缺货，已生成补货建议', true)
      return
    }
    if (p.loose) {
      setCurrentLoose(pid)
      grossRef.current?.focus()
      showToast(`请将「${p.name}」放上电子秤，确认毛重后加入清单`)
      return
    }
    addLine(pid, 1)
    showToast(`${p.name} ×1 已加入清单`)
  }

  return (
    <section className="page active">
      <div className="pos-head">
        <div>
          <p className="eyebrow">COUNTER · A01 · SHIFT A</p>
          <h1 className="page-title">收银台。</h1>
          <p className="page-desc">称重 → 识别会员 → 优惠计算 → 收款 → 出小票。离线现金可收，联网后自动补传。</p>
        </div>
        <div className="pos-status">
          <span className="status-pill">
            <span className="dot" />
            电子秤 03 已检定
          </span>
          <span className="status-pill">
            <span className="dot" />
            小票机在线
          </span>
          <span className="status-pill warn">
            <span className="dot" />
            近效期优先
          </span>
        </div>
      </div>

      <div className="pos-grid">
        <div className="pos-left">
          <div className="pos-toolbar">
            <div className="search-field pos-search">
              <Icon name="i-search" />
              <input
                ref={searchRef}
                className="field"
                placeholder="搜索商品 / 拼音码 / 扫码枪输入"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value)
                  setPosSearch(e.target.value)
                }}
              />
            </div>
            <div className="pos-cats">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  className={`cat-chip ${category === c ? 'active' : ''}`}
                  onClick={() => setPosCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <span className="scan-hint">
              <span className="kbd">F3</span> 聚焦搜索
            </span>
          </div>

          <WeighCard grossRef={grossRef} />
          <ProductGrid onPick={handlePick} />
        </div>

        <TicketPanel onStartPayment={startPayment} />
      </div>
    </section>
  )
}
