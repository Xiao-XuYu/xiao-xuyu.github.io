/* ============================================================
   route.js - 路线绘制与每日切换
   职责:
     - 绘制本地折线(虚线、每段独立色)
     - 高亮某 Day(其他段淡化)
     - 暴露切换接口给 main
   ============================================================ */

const RouteManager = (function () {
    const palette = ['#f39c12','#e74c3c','#9b59b6','#3498db','#1abc9c','#27ae60','#e67e22','#34495e','#16a085'];
    const routeLayer = L.layerGroup();
    let currentDayPolylines = [];   // 每个 day 的 polyline
    let highlightIdx = -1;

    function init() {
        routeLayer.addTo(MapManager.getLayer('route'));
    }

    function clear() {
        routeLayer.clearLayers();
        currentDayPolylines = [];
        highlightIdx = -1;
        // 同时清掉高德叠加
        if (window.AmapRoute && window.AmapRoute.clearAll) window.AmapRoute.clearAll();
    }

    function drawDays(days) {
        clear();
        days.forEach((day, idx) => {
            const coords = day.points.map(p => [p.lat, p.lng]);
            const color = palette[idx % palette.length];
            const poly = L.polyline(coords, {
                color, weight: 4, opacity: 0.75, dashArray: '8, 6'
            }).addTo(routeLayer);
            poly.bindTooltip(`${day.name} · ${day.km}km`, { sticky: true });
            poly._dayIndex = idx;
            poly._dayName = day.name;
            currentDayPolylines.push(poly);
        });
    }

    function setHighlight(idx) {
        highlightIdx = idx;
        currentDayPolylines.forEach((poly, i) => {
            if (idx === -1) {
                poly.setStyle({ weight: 4, opacity: 0.75 });
            } else if (i === idx) {
                poly.setStyle({ weight: 7, opacity: 0.95 });
            } else {
                poly.setStyle({ weight: 3, opacity: 0.35 });
            }
        });
        // 高德驾车路线联动
        if (window.AmapRoute && window.AmapRoute.isEnabled && window.AmapRoute.isEnabled()) {
            const days = Object.values(window.AppData.dayRoutes)[0];
            if (idx === -1) window.AmapRoute.drawAll(days);
            else window.AmapRoute.drawDay(days[idx]);
        }
    }

    function getDays() {
        return Object.values(window.AppData.dayRoutes)[0] || [];
    }

    return { init, drawDays, setHighlight, getDays };
})();

window.RouteManager = RouteManager;