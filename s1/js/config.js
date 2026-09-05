/* ============================================================
   config.js - 配置项(只放非敏感默认配置)
   高德 API Key 不在此文件存储,改为运行时由用户在面板中输入,
   保存到 localStorage(`amap_key`)。这样部署到 GitHub 也不会泄露 Key。
   Key 申请:https://lbs.amap.com/dev/key/app
     - 应用类型:Web 端(JS API)
     - 服务平台:勾选「Web 端 JS API」+「Web 服务」
   ============================================================ */

const CONFIG = {
    // 运行时由 ui.js 从 localStorage 注入,此处仅作占位
    AMAP_KEY: '',
    // 安全密钥(可选):当高德 Key 启用了「安全密钥」时必须填写
    // 获取:高德控制台 → 我的应用 → 编辑 Key → 安全密钥
    // 注意:Web 服务 REST 接口(/v3/direction/*)实际上不校验 jscode,
    // 但为了完整兼容 JS API 的本地签名场景,这里也提供字段
    AMAP_SECURITY_JSCODE: '',

    // 驾车路线策略:0-最快 1-最省钱 2-最短距离 3-避开拥堵
    AMAP_STRATEGY: 0,

    // 是否默认开启高德真实路线
    AMAP_DEFAULT_ON: false,

    // localStorage 中保存 Key 的键名
    LS_KEY_NAME: 'amap_key',
    LS_JSCODE_NAME: 'amap_jscode'
};

window.CONFIG = CONFIG;