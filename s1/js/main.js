/* ============================================================
   main.js - 应用入口
   流程:
     1. 初始化地图
     2. 注册 UI 回调
     3. 渲染所有标记
     4. 绘制默认路线
     5. 多次 invalidateSize 解决移动端白屏
   ============================================================ */

(function () {
    let currentDay = -1;

    function applyDays(dayIdx = -1) {
        currentDay = dayIdx;
        const days = Object.values(window.AppData.dayRoutes)[0];

        Markers.buildDayIndex(days);
        Markers.renderAll();
        RouteManager.drawDays(days);
        RouteManager.setHighlight(dayIdx);

        UI.updateStats(days);
        UI.renderDayList(days, dayIdx);
        Markers.closeAllPopups();
    }

    function boot() {
        // 1. 地图
        MapManager.init('map');
        RouteManager.init();

        // 2. UI 回调
        UI.setCallbacks({
            onDay: idx => {
                applyDays(idx);
                const days = Object.values(window.AppData.dayRoutes)[0];
                const pts = days[idx].points;
                Markers.flyToBounds(Markers.boundsFromPoints(pts), [60, 60]);
            },
            onAll: () => {
                applyDays(-1);
                const days = Object.values(window.AppData.dayRoutes)[0];
                const allPts = days.flatMap(d => d.points);
                Markers.flyToBounds(Markers.boundsFromPoints(allPts), [40, 40]);
            },
            onAmap: async (on) => {
                AmapRoute.setEnabled(on);
                const days = Object.values(window.AppData.dayRoutes)[0];
                if (on) {
                    if (currentDay === -1) await AmapRoute.drawAll(days);
                    else await AmapRoute.drawOnlyDay(days, currentDay);
                } else {
                    AmapRoute.clearOverlayOnly();
                }
            }
        });

        // 3. UI 初始化 + 首屏
        UI.init();
        applyDays(-1);

        // 4. 多次重算地图尺寸(移动端首屏白屏修复)
        [50, 300, 800].forEach(t => setTimeout(() => MapManager.invalidate(), t));
        window.addEventListener('resize', () => MapManager.invalidate());
        window.addEventListener('orientationchange', () => setTimeout(() => MapManager.invalidate(), 200));
    }

    // 等 Leaflet 加载完成再启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();