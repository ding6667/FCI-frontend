import type { Batch, InventoryRow, Member, Order, PosCoupon, Product } from '@/types'

/**
 * 演示数据 —— 接口方案落地前的 mock 数据源。
 * 结构与 src/types 中的领域模型一致，接入后端后可平滑替换为 src/api 请求结果。
 */

export const MEMBERS: Member[] = [
  { id: 'm1', name: '苏小满', phone: '13800132046', mask: '138****2046', level: 'GOLD', points: 1280, coupons: 4, growth: 1620, monthOrders: 6, monthSpend: 426.8, tags: ['高频到店', '浆果偏好'], last: '今天 09:52', joined: '2025-03-12' },
  { id: 'm2', name: '陈望', phone: '13600185521', mask: '136****5521', level: 'PLATINUM', points: 3260, coupons: 6, growth: 2680, monthOrders: 9, monthSpend: 1286.5, tags: ['高价值', '礼盒偏好'], last: '昨天 18:40', joined: '2024-08-06' },
  { id: 'm3', name: '李文博', phone: '13900188812', mask: '139****8812', level: 'SILVER', points: 460, coupons: 2, growth: 520, monthOrders: 2, monthSpend: 168, tags: ['价格敏感', '晚市'], last: '10-30 19:20', joined: '2025-09-18' },
  { id: 'm4', name: '周岚', phone: '13700133097', mask: '137****3097', level: 'NORMAL', points: 120, coupons: 1, growth: 120, monthOrders: 1, monthSpend: 86, tags: ['新会员'], last: '10-28 10:12', joined: '2026-10-20' },
  { id: 'm5', name: '何雨桐', phone: '13500331126', mask: '135****1126', level: 'GOLD', points: 980, coupons: 3, growth: 1240, monthOrders: 4, monthSpend: 312, tags: ['果切偏好', '办公区'], last: '今天 08:36', joined: '2025-01-24' },
  { id: 'm6', name: '陈建国', phone: '13300987742', mask: '133****7742', level: 'SILVER', points: 520, coupons: 2, growth: 610, monthOrders: 3, monthSpend: 205, tags: ['柑橘偏好', '周末'], last: '11-01 16:08', joined: '2025-06-11' },
]

export const PRODUCTS: Product[] = [
  { id: 'apple', name: '红富士苹果', cat: '时令', price: 8.8, loose: true, tare: 0.02, batch: 'B20261101-02', remain: 7, stock: '39.4kg', icon: 'apple', pinyin: 'hongfushi hfs', barcode: '690100100001' },
  { id: 'strawberry', name: '丹东草莓', cat: '浆果', price: 19.9, loose: false, batch: 'B20261102-01', remain: 4, stock: '26 盒', icon: 'strawberry', pinyin: 'dandongcaomei ddcm', barcode: '690100100002' },
  { id: 'cherry', name: '智利车厘子', cat: '浆果', price: 39.9, loose: false, batch: 'B20261031-01', remain: 6, stock: '18 盒', icon: 'cherry', pinyin: 'zhilichelezi zlclz', barcode: '690100100003' },
  { id: 'mango', name: '海南小台芒', cat: '时令', price: 12.9, loose: false, batch: 'B20261101-04', remain: 5, stock: '32 盒', icon: 'mango', pinyin: 'xiaotaimang xtm', barcode: '690100100004' },
  { id: 'orange', name: '赣南脐橙', cat: '柑橘', price: 6.9, loose: true, tare: 0.015, batch: 'B20261030-02', remain: 9, stock: '51.2kg', icon: 'orange', pinyin: 'gannanqicheng gnqc', barcode: '690100100005' },
  { id: 'grape', name: '阳光玫瑰', cat: '浆果', price: 25.9, loose: false, batch: 'B20261030-07', remain: 1, stock: '9 盒', icon: 'grape', pinyin: 'yangguangmeigui ygmg', barcode: '690100100006', nearExpiry: true },
  { id: 'watermelon', name: '麒麟西瓜', cat: '瓜果', price: 3.9, loose: true, tare: 0, batch: 'B20261101-05', remain: 6, stock: '25 份', icon: 'watermelon', pinyin: 'qilinxigua qlxg', barcode: '690100100007' },
  { id: 'blueberry', name: '云南蓝莓', cat: '浆果', price: 15.9, loose: false, batch: 'B20261029-11', remain: 3, stock: '15 盒', icon: 'blueberry', pinyin: 'yunnanlanmei ynlm', barcode: '690100100008' },
  { id: 'cut', name: '每日果切拼盘', cat: '果切', price: 24.1, loose: false, batch: 'B20261028-09', remain: 2, stock: '6 盒', icon: 'cut', pinyin: 'guoqie gq', barcode: '690100100009', nearExpiry: true },
  { id: 'durian', name: '金枕榴莲肉', cat: '果切', price: 49.9, loose: false, batch: 'B20261101-09', remain: 4, stock: '0 盒', icon: 'durian', pinyin: 'liulianrou llr', barcode: '690100100010' },
  { id: 'pear', name: '秋月梨', cat: '时令', price: 9.9, loose: true, tare: 0.02, batch: 'B20261031-03', remain: 8, stock: '18.4kg', icon: 'pear', pinyin: 'qiuyueli qyl', barcode: '690100100011' },
  { id: 'gift', name: '果链鲜果礼盒', cat: '礼盒', price: 128, loose: false, batch: 'B20261102-08', remain: 5, stock: '11 盒', icon: 'gift', pinyin: 'xianguolihe xglh', barcode: '690100100012' },
]

export const POS_COUPONS: PosCoupon[] = [
  { id: 'pos1', title: '满 49 减 5', amount: 5, threshold: 49, scope: '门店收银台 · 全场通用' },
  { id: 'pos2', title: '满 99 减 12', amount: 12, threshold: 99, scope: '小程序专享券', locked: '仅限小程序渠道使用（MKT_005）' },
  { id: 'pos3', title: '临期商品 9 折', rate: 0.9, threshold: 0, scope: '临期批次专用', locked: '与临期折价互斥，不可叠加（MKT_004）' },
  { id: 'pos4', title: '生日券 8 元', amount: 8, threshold: 0, scope: '生日月专享', locked: '该顾客本月未命中生日权益' },
]

export const BATCHES: Batch[] = [
  { id: 'b1', batch: 'B20261028-09', name: '每日果切拼盘', icon: 'cut', remain: 2, stock: 6, unit: '盒', price: 24.1, cost: 12.2, suggest: '7 折', status: '待处置' },
  { id: 'b2', batch: 'B20261030-07', name: '阳光玫瑰', icon: 'grape', remain: 1, stock: 12, unit: '盒', price: 25.9, cost: 14.5, suggest: '5 折需审批', status: '待处置' },
  { id: 'b3', batch: 'B20261029-11', name: '云南蓝莓', icon: 'blueberry', remain: 3, stock: 15, unit: '盒', price: 15.9, cost: 8.6, suggest: '转果切', status: '待处置' },
  { id: 'b4', batch: 'B20261031-04', name: '海南小台芒', icon: 'mango', remain: 2, stock: 20, unit: '盒', price: 12.9, cost: 6.1, suggest: '7 折', status: '待处置' },
  { id: 'b5', batch: 'B20261101-05', name: '麒麟西瓜', icon: 'watermelon', remain: 3, stock: 28, unit: '份', price: 3.9, cost: 1.8, suggest: '转果切', status: '待处置' },
  { id: 'b6', batch: 'B20261028-03', name: '丹东草莓', icon: 'strawberry', remain: 2, stock: 8, unit: '盒', price: 19.9, cost: 9.8, suggest: '7 折', status: '待处置' },
]

export const ORDERS: Order[] = [
  {
    no: 'O20261103-0186', channel: '小程序', status: '待拣货', customer: '苏小满', memberLevel: '金卡', time: '09:42', promise: '10:25', amount: 64.62, fulfillment: '即时配送',
    items: [
      { name: '丹东草莓', icon: 'strawberry', qty: 2, batch: 'B20261102-01', loc: 'A-03', loose: false },
      { name: '红富士苹果', icon: 'apple', qty: 1, batch: 'B20261101-02', loc: 'B-01', loose: true, est: 1.2, weight: 1.24 },
    ],
  },
  {
    no: 'O20261103-0185', channel: '美团', status: '待拣货', customer: '李文博', memberLevel: '银卡', time: '09:38', promise: '10:15', amount: 43.7, fulfillment: '即时配送',
    items: [
      { name: '海南小台芒', icon: 'mango', qty: 2, batch: 'B20261101-04', loc: 'A-05', loose: false },
      { name: '赣南脐橙', icon: 'orange', qty: 1, batch: 'B20261030-02', loc: 'B-02', loose: true, est: 1.0, weight: 1.08 },
    ],
  },
  {
    no: 'O20261103-0184', channel: '饿了么', status: '待拣货', customer: '陈建国', memberLevel: '银卡', time: '09:36', promise: '10:40', amount: 74.7, fulfillment: '即时配送',
    items: [
      { name: '智利车厘子', icon: 'cherry', qty: 1, batch: 'B20261031-01', loc: 'A-01', loose: false },
      { name: '云南蓝莓', icon: 'blueberry', qty: 2, batch: 'B20261029-11', loc: 'A-02', loose: false },
    ],
  },
  {
    no: 'O20261103-0181', channel: '小程序', status: '待打包', customer: '何雨桐', memberLevel: '金卡', time: '09:21', promise: '10:30', amount: 128.0, fulfillment: '到店自提',
    items: [{ name: '果链鲜果礼盒', icon: 'gift', qty: 1, batch: 'B20261102-08', loc: 'C-01', loose: false }],
  },
  {
    no: 'O20261103-0176', channel: '饿了么', status: '配送中', customer: '周岚', memberLevel: '普通', time: '09:05', promise: '10:05', amount: 28.9, fulfillment: '即时配送',
    items: [{ name: '阳光玫瑰', icon: 'grape', qty: 1, batch: 'B20261030-07', loc: 'A-04', loose: false }],
  },
  {
    no: 'O20261103-0170', channel: '小程序', status: '已完成', customer: '陈望', memberLevel: '铂金', time: '08:48', promise: '09:30', amount: 77.0, fulfillment: '即时配送',
    items: [
      { name: '金枕榴莲肉', icon: 'durian', qty: 1, batch: 'B20261101-09', loc: 'C-02', loose: false },
      { name: '每日果切拼盘', icon: 'cut', qty: 1, batch: 'B20261028-09', loc: 'C-03', loose: false },
    ],
  },
]

export const INVENTORY: InventoryRow[] = [
  { id: 'i1', name: '丹东草莓', batch: 'B20261028-03', icon: 'strawberry', onHand: 8, locked: 2, safety: 10, unit: '盒', status: '临期', channel: { mp: 4, mt: 2, ele: 0 }, sync: '待同步', transit: 0 },
  { id: 'i2', name: '智利车厘子', batch: 'B20261031-01', icon: 'cherry', onHand: 26, locked: 4, safety: 15, unit: '盒', status: '正常', channel: { mp: 12, mt: 6, ele: 4 }, sync: '已同步', transit: 0 },
  { id: 'i3', name: '红富士苹果', batch: 'B20261101-02', icon: 'apple', onHand: 42.6, locked: 3.2, safety: 30, unit: 'kg', status: '正常', channel: { mp: 12, mt: 8, ele: 6 }, sync: '已同步', transit: 0 },
  { id: 'i4', name: '阳光玫瑰', batch: 'B20261030-07', icon: 'grape', onHand: 12, locked: 3, safety: 10, unit: '盒', status: '临期', channel: { mp: 6, mt: 3, ele: 2 }, sync: '已同步', transit: 0 },
  { id: 'i5', name: '云南蓝莓', batch: 'B20261029-11', icon: 'blueberry', onHand: 15, locked: 0, safety: 8, unit: '盒', status: '临期', channel: { mp: 8, mt: 4, ele: 3 }, sync: '待同步', transit: 0 },
  { id: 'i6', name: '麒麟西瓜', batch: 'B20261101-05', icon: 'watermelon', onHand: 30, locked: 5, safety: 20, unit: '份', status: '正常', channel: { mp: 12, mt: 6, ele: 5 }, sync: '已同步', transit: 0 },
  { id: 'i7', name: '金枕榴莲肉', batch: 'B20261101-09', icon: 'durian', onHand: 0, locked: 0, safety: 6, unit: '盒', status: '缺货', channel: { mp: 0, mt: 0, ele: 0 }, sync: '已同步', transit: 6 },
  { id: 'i8', name: '秋月梨', batch: 'B20261031-03', icon: 'pear', onHand: 18.4, locked: 1.2, safety: 15, unit: 'kg', status: '正常', channel: { mp: 8, mt: 4, ele: 3 }, sync: '已同步', transit: 0 },
]
