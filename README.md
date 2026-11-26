# 果链智联 · 门店台（FCI Frontend）

智能零售门店一体化作业前端：收银、临期处置、订单履约、库存批次、会员运营。
本仓库为立项书（2611378）对应前端工程，页面视觉依据门店台原型 `store-pos.html` 1:1 还原，后续按接口设计方案对接真实服务端。

## 技术栈

| 领域 | 选型 | 说明 |
| --- | --- | --- |
| 框架 | React 19 + TypeScript 7 | 函数组件 + Hooks |
| 构建 | Vite 8 | 开发秒级热更，按需分包 |
| UI 组件库 | Ant Design 6 | 全局 `ConfigProvider` 对齐门店台设计令牌（主色 `#2F6B49`、米色底 `#FCF8EE`），中文语言包 |
| 状态管理 | Zustand 5 | 单 store + 领域切面，避免 Redux 样板代码 |
| 路由 | React Router 7 | `/app/*` 受保护路由，未登录跳 `/login` |
| 样式 | 原生 CSS（原型迁移）+ Tailwind 4 | Tailwind 作为工具层备用，像素还原以 `store-pos.css` 为准 |
| 请求 | Axios | `src/api/http.ts` 统一实例、拦截器、错误提示（当前为占位） |
| 时间/金额 | dayjs + 自研格式化 | `src/lib/format.ts` 统一分/元、重量、折扣展示 |

## 快速开始

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # tsc --noEmit
npm run build      # 产出 dist/
npm run preview
```

演示账号：工号 `1001` / 密码 `123456`（登录页「填入演示账号」可一键填充）。

## 路由与页面

| 路由 | 页面 | 主要能力 |
| --- | --- | --- |
| `/login` | 员工通道 | 员工登录 / 员工激活双 Tab，门店选择，演示账号填充 |
| `/app/dashboard` | 工作台 | 今日 KPI（销售额、单量、客单价、损耗率）、每小时销售曲线、晨会三件事、临期批次清单、履约队列 |
| `/app/pos` | 收银台 | 商品搜索与分类、称重计价、购物车、会员识别、优惠券试算、现金/线上收款、小票 |
| `/app/expiry` | 临期处置 | 临期批次清单、折价（7 折 / 5 折需审批）、转果切、报损、处置记录 |
| `/app/orders` | 订单履约 | 待拣货 / 待打包 / 配送中 / 已完成四列看板，拣货、交接出库、确认送达、异常上报 |
| `/app/inventory` | 库存批次 | 在库 / 锁定 / 可用量 / 安全线 / 渠道可售矩阵、补货申请、批次追溯 |
| `/app/members` | 会员 | 会员检索、等级与积分、券包、近 30 天消费、发券、注册 |

## 目录结构

```
src/
├─ api/            # axios 实例与接口层（待接入接口方案）
├─ components/     # Icon、IconSprite、ModalShell、ModalHost、Feedback(Toast/CountUp)
├─ data/mock.ts    # 演示数据：商品、批次、订单、库存、会员、券、活动
├─ features/       # 按业务域拆分的弹窗与局部组件（pos / expiry / orders / inventory / members / shift）
├─ hooks/          # useNow 等通用 hooks
├─ layouts/        # StoreLayout：侧边导航 + 顶栏 + 离线横幅
├─ lib/            # catalog（图标/色板）、format（金额/数量）、pricing（会员价、券、合计）
├─ pages/          # 六大业务页面 + 登录页
├─ store/          # useAppStore（Zustand）：auth / ui / pos / expiry / orders / inventory / members
├─ styles/         # store-pos.css：原型样式原样迁移，类名与原型保持一致
└─ types/          # 领域模型类型定义
```

## 设计还原约定

- `src/styles/store-pos.css` 由原型 `store-pos.html` 的 `<style>` 整段迁移而来，**类名不改**，因此新增页面请复用原型类名（`page-head`、`filter-chip`、`data-table`、`tag`、`modal-*` 等），避免样式分叉。
- 图标使用原型内联 SVG 雪碧图（`IconSprite` + `<Icon name="i-xxx" />`），不引入图标字体。
- 交互态（hover / active / 禁用 / 离线）与文案均按原型保留，Mock 数据集中在 `src/data/mock.ts`，便于替换为接口数据。

## 与后端对接

1. `src/api/http.ts` 已封装 Axios 实例（baseURL 读取 `VITE_API_BASE_URL`，默认 `/api`；统一注入 Bearer Token，预留 401 与业务错误码处理）。
2. 接口方案确定后，在 `src/api/` 下按域新增 `pos.ts`、`expiry.ts`、`orders.ts`、`inventory.ts`、`members.ts`，页面通过 store action 调用，保持组件层不直接依赖请求。
3. Store 中的 mock 初始态替换为服务端返回，`offline` 离线演示开关保留（本地缓存价签与券、联网后补传）。
