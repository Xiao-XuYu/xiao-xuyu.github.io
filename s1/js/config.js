/* ============================================================
   config.js - 配置项 + localStorage 键名
   高德 API Key / 路线模式 / 分类筛选 等用户偏好均持久化到 localStorage,
   部署到 GitHub Pages 也不会泄露 Key,且刷新页面能记住用户选择。
   Key 申请:https://lbs.amap.com/dev/key/app
     - 应用类型:Web 端(JS API)
     - 服务平台:勾选「Web 端 JS API」+「Web 服务」
   ============================================================ */

const CONFIG = {
    // 运行时由 ui.js 从 localStorage 注入,此处仅作占位
    AMAP_KEY: '',
    // 安全密钥(可选):当高德 Key 启用了「安全密钥」时必须填写
    // Web 服务 REST 接口(/v3/direction/*)实际上不校验 jscode
    AMAP_SECURITY_JSCODE: '',

    // 驾车路线策略:0-最快 1-最省钱 2-最短距离 3-避开拥堵
    AMAP_STRATEGY: 0,

    // localStorage 中各用户偏好的键名
    LS_KEY_NAME:        'amap_key',
    LS_JSCODE_NAME:     'amap_jscode',
    LS_ROUTE_MODE:      'route_mode',     // 'local' | 'amap'
    LS_FILTER_STATE:    'filter_state'    // { salt_lake: bool, city: bool, scenic: bool }
};

window.CONFIG = CONFIG;
