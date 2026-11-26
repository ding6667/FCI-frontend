# 果链智联 · 门店台（FCI Frontend）

智能零售门店一体化作业前端：收银、临期处置、订单履约、库存批次、会员运营。
本仓库为立项书（2611378）对应前端工程，页面视觉依据门店台原型 `store-pos.html` 1:1 还原，后续按接口设计方案对接真实服务端。

## 技术栈

| 领域 | 选型 | 说明 |
| --- | --- | --- |
| 框架 | React 19 + TypeScript 7 | 函数组件 + Hooks |
| 构建 | Vite 8 | 开发秒级热更，按需分包 |
| UI 组件库 | Ant Design 6 | 全局 `ConfigProvider` 对齐门店台设计令牌（主色 `#2F6B49`、卡片白 `#FFFFFF`、页面底 `#EDEFEB`），中文语言包 |
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
| `/app/admin/approvals` | 审批中心 | 待审 / 已通过 / 已驳回分段，按业务类型筛选与单号搜索，通过 / 驳回裁决（驳回必填理由），业务快照与审批时间线 |
| `/app/admin/employees` | 员工管理 | 档案检索（状态 / 岗位 / 关键字）、入职、编辑、重置密码、冻结解冻、离职停用、调整审批额度、分配角色 |
| `/app/admin/roles` | 角色授权 | 角色列表、新建 / 编辑 / 删除（内置角色禁删）、勾选权限树授权 |
| `/app/admin/permissions` | 权限点 | 19 个权限点按业务域只读总览，标注权限码、类型与接口路径 |
| `/app/admin/logs` | 操作日志 | 按模块 / 动作筛选，变更前后 JSON 对比，只读不可删 |

侧栏按「一级系统 → 二级页面」两级组织，点一级名称进入该系统的落地页并自动展开，右侧箭头单独控制折叠：

| 一级（侧栏） | 二级页面 | 权限点 |
| --- | --- | --- |
| 工作台（`/app/dashboard`） | 收银台、临期处置、订单履约、库存批次 | 临期处置需 `art:price:change`，其余无 |
| 人员 | 会员、员工 | 员工需 `sys:employee:list` |
| 审批中心（`/app/admin/approvals`） | 待办审批、角色授权、权限点、操作日志 | 依次需 `sys:approval:list`、`sys:role:list`、`sys:perm:list`、`sys:log:list` |

一个子项都没有权限时整组隐藏（如普通收银员看不到审批中心）。工作台总览顶部另有「SUBSYSTEMS」入口条，与侧栏工作台下的四个二级页一一对应，可直接点进。

## 目录结构

```
src/
├─ api/            # axios 实例与 SYS 域接口层（auth / approval / sys / token / types）
├─ components/     # Icon、IconSprite、ModalShell（portal 挂 body）、ModalHost、Feedback(Toast/CountUp)
├─ data/
│  ├─ mock.ts      # 作业台演示数据：商品、批次、订单、库存、会员、券、活动
│  └─ adminMock.ts # 管理台演示数据：员工、角色、权限树、审批单、操作日志
├─ features/       # 按业务域拆分的弹窗与局部组件（pos / expiry / orders / inventory / members / shift / admin）
├─ hooks/          # useNow 等通用 hooks
├─ layouts/        # StoreLayout：侧栏两级导航（工作台 / 人员 / 审批中心）+ 顶栏 + 离线横幅
├─ lib/            # catalog（图标/色板）、format（金额/数量）、pricing（会员价、券、合计）、approvalFlow（审批流）
├─ pages/          # 六大业务页面 + 登录页；pages/admin/ 下为五个管理台页面
├─ store/          # useAppStore（作业台）+ useAdminStore（管理台），均为 Zustand
├─ styles/         # store-pos.css（原型迁移，类名不改）+ admin.css（管理台专用形状）
└─ types/          # 领域模型类型定义
```

## 设计还原约定

- `src/styles/store-pos.css` 由原型 `store-pos.html` 的 `<style>` 整段迁移而来，**类名不改**，因此新增页面请复用原型类名（`page-head`、`filter-chip`、`data-table`、`tag`、`modal-*` 等），避免样式分叉。
- 图标使用原型内联 SVG 雪碧图（`IconSprite` + `<Icon name="i-xxx" />`），不引入图标字体。
- 交互态（hover / active / 禁用 / 离线）与文案均按原型保留，Mock 数据集中在 `src/data/mock.ts`，便于替换为接口数据。
- 底色与原型不同：原型用沙黄纸感（`--paper #EFE7D7` / `--surface #FCF8EE`），本项目改为**灰白页面 + 纯白卡片**（`--paper #EDEFEB` / `--surface #FFFFFF` / `--surface-2 #F5F7F4`），靠 1px 冷灰描边与柔和投影形成层次，其余设计令牌（森林绿、赭橙、衬线标题、等宽数字）不变。

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
| 员工、角色、权限树、审计 | `src/api/sys.ts` | #4 ~ #18、#23 |
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

### 管理台（SYS 后台 · 员工 / 角色 / 权限 / 审批 / 日志）

五个页面共用 `src/store/useAdminStore.ts`。与作业台拆开的原因：管理台数据量大、筛选分页频繁，
放进 `useAppStore` 会让收银台每次改 UI 都跟着重算；管理台是「临时进入」的二级场景，独立 store 便于按需卸载。

双模式行为一致，区别只在数据来源：

| 模式 | 写操作 | 读 |
| --- | --- | --- |
| `mock` | 直接改内存数组，并补一条操作日志，断网也能演示完整闭环 | `src/data/adminMock.ts` |
| `api` | 调 `sys.ts` / `approval.ts` 对应接口 | 成功后 `refresh()` 重新拉取，以服务端为准 |

- 提交审批（S4 折价、S6 报损）后会调用 `recordApproval` 把单据插进审批中心，不用刷新就能在待审里看到；
- 演示模式下每个写操作都会追加一条日志（`EMP_UPDATE`、`QUOTA_CHANGE`、`ROLE_PERM_ASSIGN`、`APPROVAL_DECIDE`…），
  日志页能立刻看到「变更前 / 变更后」的差异，真实模式由服务端写入、前端不重复上报。

### 弹窗必须 portal 到 body

`.page` 的入场动画是 `pageIn .25s ease-out both`。动画播完后 Chrome 仍把计算值保留为单位矩阵 `transform`，
而**任何非 `none` 的 transform 都会让后代 `position:fixed` 改为相对该页面区块定位**——弹窗比区块高时上下会被裁掉
（本次在权限树弹窗上暴露，实际收银台的收款弹窗也受影响）。

`src/components/ModalShell.tsx` 已改为 `createPortal(..., document.body)`，弹窗层恢复相对视口定位，
Esc 关闭与背景点击关闭保持不变。

### 打包与分包

六个业务页与五个管理台页面都走 `React.lazy` 路由级分包，首屏仅加载登录页与当前页；切换页面时内容区显示同色系 loading
（`StoreLayout` 内 `Suspense`），侧栏与顶栏保持可操作。

`vite.config.ts` 再用 rolldown 的 `codeSplitting.groups`（**不是** rollup 的 `manualChunks`，v8 已不支持对象写法）
把 `react` / `antd` 拆成稳定 vendor chunk。当前产物：`antd` 317 kB、`index` 114 kB、`react` 39 kB，
各业务页 4–15 kB、管理台 4–8 kB，不再触发 500 kB 提示，且改动业务代码时用户无需重下 antd。

### 尚未接入（等其他域接口）

- 收银台的商品/会员/订单/支付（ART / MEM / OMS 域）
- 临期批次、库存、补货（STK / PUR 域）——审批链路已通，等真实批次主键与成本线接口替换 `deriveBizId`
- 报表 KPI 与销售曲线（报表域）
- 管理台写接口的**组织架构/门店树**（当前门店为演示常量，等 STK/门店主数据接口）

