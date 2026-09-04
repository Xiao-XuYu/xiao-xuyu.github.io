/* ============================================================
   amap-route.js - 高德驾车真实路径规划(简化测试版)
   ============================================================ */

const AmapRoute = (function () {
    function testKey(key) {
        return Promise.resolve({ ok: !!key, msg: key ? 'tested:' + key.slice(0,4) : 'empty' });
    }
    function setEnabled(on) { return on; }
    function isEnabled() { return false; }
    function drawAll() { return Promise.resolve(); }
    function drawOnlyDay() { return Promise.resolve(); }
    function clearAll() {}
    function clearOverlayOnly() {}
    function ensureLayer() { return null; }
    return { setEnabled, isEnabled, drawAll, drawOnlyDay, clearAll, clearOverlayOnly, testKey, ensureLayer };
})();

window.AmapRoute = AmapRoute;
console.log('[amap-route] loaded, AmapRoute =', typeof window.AmapRoute);