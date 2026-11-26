import { useEffect } from 'react'
import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { BrowserRouter } from 'react-router-dom'
import { Toast } from '@/components/Feedback'
import { IconSprite } from '@/components/IconSprite'
import AppRoutes from '@/router'

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
