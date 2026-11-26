import { useEffect } from 'react'
import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { BrowserRouter } from 'react-router-dom'
import { UNAUTHORIZED_EVENT } from '@/api/http'
import { Toast } from '@/components/Feedback'
import { IconSprite } from '@/components/IconSprite'
import AppRoutes from '@/router'
import { useAppStore } from '@/store/useAppStore'

dayjs.locale('zh-cn')

/** Ant Design 主题令牌与门店台设计稿对齐，后续表单/日期/上传等组件可直接沿用 */
const theme = {
  token: {
    colorPrimary: '#2F6B49',
    colorSuccess: '#2F6B49',
    colorWarning: '#D69B22',
    colorError: '#C23A28',
    colorInfo: '#2F6B49',
    colorTextBase: '#1B2A20',
    colorBgBase: '#FCF8EE',
    colorBgContainer: '#FCF8EE',
    colorBorder: '#BCB09A',
    borderRadius: 8,
    fontFamily: '"PingFang SC","Microsoft YaHei","Hiragino Sans GB",sans-serif',
    fontSize: 13,
    controlHeight: 40,
    wireframe: false,
  },
  components: {
    Table: { headerBg: '#F7F1E3', borderColor: '#D9CFBC' },
    Modal: { borderRadiusLG: 13 },
    Tooltip: { colorBgSpotlight: '#102E22' },
  },
}

export default function App() {
  useEffect(() => {
    document.documentElement.lang = 'zh-CN'

    // 刷新页面后用 sessionStorage 里的令牌恢复身份（employee-api.md §1.3）
    void useAppStore.getState().restoreSession()

    // 任一请求 401 且刷新失败 → 清空登录态并跳回 S1；已登出时忽略，避免重复触发
    const onUnauthorized = () => {
      if (useAppStore.getState().loggedIn) useAppStore.getState().signOut()
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <AntdApp>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toast />
        <IconSprite />
      </AntdApp>
    </ConfigProvider>
  )
}
