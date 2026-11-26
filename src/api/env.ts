/**
 * 运行模式开关（.env 的 VITE_API_MODE）
 *
 * - `mock`（默认）：不依赖后端，页面使用 src/data/mock.ts 的演示数据，方便设计与联调前演示
 * - `api`：登录与审批走 pig-boot，业务数据仍待 ART/OMS/STK/MEM 域接口到位后接入
 */
export const API_MODE = ((import.meta.env.VITE_API_MODE as string | undefined) ?? 'mock') as 'mock' | 'api'

export const IS_API_MODE = API_MODE === 'api'
