/* ============================================================
   config.js - 配置项
   高德 Web 端 JS API Key:
     1. 打开 https://lbs.amap.com/dev/key/app
     2. 创建应用 - 类型选「Web 端(JS API)」
     3. 复制 Key,填入下方 AMAP_KEY
     4. 「服务平台」勾选「Web 端 JS API」与「Web 服务」
     5. 「IP 白名单」可留空或填 * 用于测试
   ============================================================ */

const CONFIG = {
    AMAP_KEY: 'YOUR_AMAP_KEY',
    AMAP_SECURITY_JSCODE: '',  // 可选:密钥校验码,不需要可留空

    // 驾车路线策略:0-最快 1-最省钱 2-最短距离 3-避开拥堵
    AMAP_STRATEGY: 0,

    // 是否默认开启高德真实路线
    AMAP_DEFAULT_ON: false
};

window.CONFIG = CONFIG;