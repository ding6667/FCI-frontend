import { Icon } from '@/components/Icon'
import { PRODUCTS } from '@/data/mock'
import { tint } from '@/lib/catalog'
import { useAppStore } from '@/store/useAppStore'

interface ProductGridProps {
  onPick: (pid: string) => void
}

/** 商品选择区：分类 + 关键词（名称 / 拼音码 / 条码）过滤 */
export function ProductGrid({ onPick }: ProductGridProps) {
  const category = useAppStore((s) => s.posCategory)
  const keyword = useAppStore((s) => s.posSearch)

  const list = PRODUCTS.filter((p) => {
    const catOK = category === '全部' || p.cat === category
    const kwOK = !keyword || p.name.toLowerCase().includes(keyword) || p.pinyin.includes(keyword) || p.barcode.includes(keyword)
    return catOK && kwOK
  })

  if (!list.length) {
    return (
      <div
        className="table-empty"
        style={{
          gridColumn: '1/-1',
          background: 'var(--surface)',
          border: '1px dashed var(--line-strong)',
          borderRadius: 9,
        }}
      >
        没有匹配的商品，换个关键词或分类试试。
      </div>
    )
  }

  return (
    <div className="pos-grid-products">
      {list.map((p) => {
        const soldOut = String(p.stock).startsWith('0')
        return (
          <article
            className="pos-product"
            key={p.id}
            onClick={() => onPick(p.id)}
            style={soldOut ? { opacity: 0.58 } : undefined}
          >
            <div className="pp-art" style={{ background: tint(p.icon) }}>
              <Icon name={`fruit-${p.icon}`} />
              <span className="pp-type">{p.loose ? '散称' : p.cat}</span>
              {p.nearExpiry ? <span className="pp-remain">临期 {p.remain} 天</span> : null}
            </div>
            <div className="pp-body">
              <div className="pp-name">{p.name}</div>
              <div className="pp-meta">
                <span className="pp-price">
                  <small>¥</small>
                  {p.price.toFixed(1)}
                  <small>/{p.loose ? '500g' : '件'}</small>
                </span>
                <span className="pp-stock">
                  {p.stock}
                  <br />
                  {p.loose ? '点击称重' : '现货'}
                </span>
              </div>
            </div>
            <span className="pp-add">
              <Icon name="i-plus" />
            </span>
          </article>
        )
      })}
    </div>
  )
}
