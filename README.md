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
| 请求 | Axios | `src/api/http.ts` 统一实例、拦截器、错误提示（已接入员工域） |
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
├─ api/            # axios 实例与 SYS 域接口层（auth / approval / sys / token / types）
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

## 与后端对接（员工系统 SYS · employee-api.md v1.0）

### 运行模式

通过 `.env` 的 `VITE_API_MODE` 切换，参考 `.env.example`：

| 模式 | 说明 |
| --- | --- |
| `mock`（默认） | 不依赖后端，登录与全部业务数据走内置演示数据，便于评审与演示 |
| `api` | 登录、会话、权限、审批走 pig-boot（`http://localhost:9999/admin`），业务数据仍为演示数据 |

```bash
cp .env.example .env
# 改 VITE_API_MODE=api 即接入真实后端；开发期 /admin 由 vite 代理到 9999 端口
```

### 已对接的接口

| 能力 | 文件 | 接口 |
| --- | --- | --- |
| 登录 / 刷新 / 注销 / 当前身份 / 权限查询 | `src/api/auth.ts` | #1 `POST /oauth2/token`、#2 `GET /auth/me`、#3 `GET /employees/{empId}:permissions`、`DELETE /token/logout` |
| 审批提交 / 裁决 / 校验 / 列表 / 待办数 | `src/api/approval.ts` | #19 ~ #22 |
| 员工、角色、权限树、审计 | `src/api/sys.ts` | #4 ~ #18、#23（供后续管理页复用，暂无页面） |
| 统一请求层 | `src/api/http.ts` | 令牌注入、`Number(code)===0` 判定、401 单次刷新重放、错误码归一 |
| 令牌存储 | `src/api/token.ts` | **sessionStorage**（门店共用终端禁止 localStorage，规范 §1.3） |

### 关键约定（务必遵守）

1. **成功判定**用 `Number(res.code) === 0`——成功是数字 `0`，业务失败是字符串 `"SYS_00x"`。
2. **登录失败**：`bad_credentials` 与 `username_not_found` 统一提示「账号或口令错误」，不得暴露账号是否存在；`user_locked` 需禁用登录 30 分钟倒计时（登录页已实现）。
3. **权限**：登录后从 `/auth/me` 的 `permissions` 构建集合，用 store 的 `can(code)` 控制入口；不要把权限码硬编码进页面。演示模式返回 19 个权限点全集。
4. **写接口不传 `operatorEmpId`**，由服务端从登录态取。
5. **审批快照** `snapshotJson` 必须是 `JSON.stringify(obj)` 后的字符串；`REJECT` 时 `remark` 必填。

### 审批链路（S4 折价 / S6 报损）

金额触发的动作统一走 `src/lib/approvalFlow.ts`，后端只有一套审批能力，前端只有一处封装：

| 动作 | bizType | applyAmount | 结果 |
| --- | --- | --- | --- |
| 临期折价（低于成本线） | `PRICE` | 让利合计 =（原价 − 折后价）× 在库 | 额度内自动通过 → 批次 `已折价`；超额度 → `审批中` |
| 报损 | `WASTE` | 损耗金额 = 成本 × 在库 | 同上，通过后才落损耗台账 |
| 转果切 / 高于成本线的折价 | — | — | 不走审批，直接生效 |

- 提交前先算 `applyAmount ≤ 当前员工 approvalLimit`，弹窗内直接告诉收银员「会自动通过」还是「需店长审批」。
- 单号回填到处置记录（`AP + yyyyMMdd + 流水`），演示模式下本地生成，真实模式取 #19 返回值。
- `bizType + bizId` 幂等，失败可放心重试；`bizId` 目前由批次号派生（`deriveBizId`），拿到 STK 域批次主键后替换。

### 打包与分包

六个业务页走 `React.lazy` 路由级分包，首屏仅加载登录页与当前页；切换页面时内容区显示同色系 loading
（`StoreLayout` 内 `Suspense`），侧栏与顶栏保持可操作。

`vite.config.ts` 再用 rolldown 的 `codeSplitting.groups`（**不是** rollup 的 `manualChunks`，v8 已不支持对象写法）
把 `react` / `antd` 拆成稳定 vendor chunk。当前产物：`antd` 317 kB、`index` 172 kB、`react` 39 kB，
六页各 4–15 kB，不再触发 500 kB 提示，且改动业务代码时用户无需重下 antd。

### 尚未接入（等其他域接口）

- 收银台的商品/会员/订单/支付（ART / MEM / OMS 域）
- 临期批次、库存、补货（STK / PUR 域）——审批链路已通，等真实批次主键与成本线接口替换 `deriveBizId`
- 报表 KPI 与销售曲线（报表域）

