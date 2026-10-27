/* ============================================================
   main.js - 应用入口
   流程:
     1. 初始化地图 + 路线
     2. 渲染所有标记
     3. 注册 UI 回调
     4. 按持久化的 mode 渲染默认路线
        - 'local': 显示本地虚线(默认)
        - 'amap':  调用高德实线并隐藏本地虚线
     5. 多次 invalidateSize 解决移动端白屏
   ============================================================ */

(function () {
    let currentDay = -1;
    let currentMode = 'local';

    function getDays() {
        return Object.values(window.AppData.dayRoutes)[0] || [];
    }

    function applyDays(dayIdx = -1) {
        currentDay = dayIdx;
        const days = getDays();

        Markers.buildDayIndex(days);
        Markers.renderAll();
        RouteManager.drawDays(days);
        RouteManager.setHighlight(dayIdx);

        UI.updateStats(days);
        UI.renderDayList(days, dayIdx);
        Markers.closeAllPopups();

        // 按当前 mode 决定显示哪套路线
        applyMode();
    }

    // 模式应用:'local' 显示本地虚线;'amap' 显示高德实线、隐藏虚线
    async function applyMode() {
        const days = getDays();
        if (currentMode === 'local') {
            RouteManager.setVisible(true);
            AmapRoute.setEnabled(false);
            AmapRoute.clearOverlayOnly();
        } else {
            RouteManager.setVisible(false);
            AmapRoute.setEnabled(true);
            if (currentDay === -1) {
                await AmapRoute.drawAll(days);
            } else {
                await AmapRoute.drawOnlyDay(days, currentDay);
            }
        }
    }

    function boot() {
        // 1. 地图与路线层
        MapManager.init('map');
        RouteManager.init();

        // 2. UI 回调
        UI.setCallbacks({
            onDay: idx => {
                applyDays(idx);
                const days = getDays();
                const pts = days[idx].points;
                Markers.flyToBounds(Markers.boundsFromPoints(pts), [60, 60]);
            },
            onAll: () => {
                applyDays(-1);
                const days = getDays();
                const allPts = days.flatMap(d => d.points);
                Markers.flyToBounds(Markers.boundsFromPoints(allPts), [40, 40]);
            },
            onMode: (mode) => {
                currentMode = mode;
                applyMode();
            }
        });

        // 3. UI 初始化(读取 localStorage 中的 Key / mode / filter 状态)
        UI.init();
        currentMode = UI.bootstrapMode();   // 优先用持久化 mode

        // 4. 首屏
        applyDays(-1);

        // 5. 多次重算地图尺寸(移动端首屏白屏修复)
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
