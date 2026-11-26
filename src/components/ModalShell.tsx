import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'

interface ModalShellProps {
  children: ReactNode
  onClose: () => void
  /** 覆盖 .modal 默认 760px 宽度 */
  width?: string
  className?: string
}

/**
 * 弹窗外壳：沿用设计稿的 .modal-layer / .modal 结构与动效，
 * 同时补齐 Esc 关闭与背景点击关闭。
 *
 * 必须用 portal 挂到 body：`.page` 的入场动画（pageIn…both）播完后
 * Chrome 仍保留一个单位矩阵 transform，会让 position:fixed 的弹窗改为
 * 相对该页面区块定位，弹窗高于区块时上下被裁切。挂到 body 后不受影响。
 */
export function ModalShell({ children, onClose, width, className = '' }: ModalShellProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="modal-layer open" aria-hidden="false">
      <div className="modal-backdrop" onClick={onClose} />
      <div className={`modal ${className}`.trim()} style={width ? { width } : undefined} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>,
    document.body,
  )
}

interface ModalHeadProps {
  kicker: string
  title: string
  sub?: ReactNode
  onClose: () => void
}

export function ModalHead({ kicker, title, sub, onClose }: ModalHeadProps) {
  return (
    <div className="modal-head">
      <div>
        <div className="modal-kicker">{kicker}</div>
        <h3 className="modal-title">{title}</h3>
        {sub ? <p className="modal-sub">{sub}</p> : null}
      </div>
      <button className="modal-close" onClick={onClose} aria-label="关闭">
        <Icon name="i-close" />
      </button>
    </div>
  )
}

interface ModalFootProps {
  children: ReactNode
  note?: ReactNode
}

export function ModalFoot({ children, note }: ModalFootProps) {
  return (
    <div className="modal-foot">
      {note ? <span className="spacer">{note}</span> : null}
      {children}
    </div>
  )
}
