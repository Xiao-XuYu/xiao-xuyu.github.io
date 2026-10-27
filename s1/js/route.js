/* ============================================================
   route.js - 本地环线路线(虚线)绘制与每日切换
   职责:
     - 绘制本地折线(虚线、每段独立色)
     - 高亮某 Day(其他段淡化)
     - 暴露切换接口给 main
     - setVisible(on) 用于和「驾车真实路径」开关互斥:
       开 → 显示本地虚线,关 → 隐藏(让位给高德实线)
   ============================================================ */

const RouteManager = (function () {
    const palette = ['#f39c12','#e74c3c','#9b59b6','#3498db','#1abc9c','#27ae60','#e67e22','#34495e','#16a085'];
    const routeLayer = L.layerGroup();
    let currentDayPolylines = [];   // 每个 day 的 polyline
    let highlightIdx = -1;
    let visible = true;

    function init() {
        routeLayer.addTo(MapManager.getLayer('route'));
    }

    function clear() {
        routeLayer.clearLayers();
        currentDayPolylines = [];
        highlightIdx = -1;
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
        // 应用当前可见性
        applyVisibility();
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
    }

    function setVisible(on) {
        visible = !!on;
        applyVisibility();
    }

    function applyVisibility() {
        if (currentDayPolylines.length === 0) return;
        const layer = MapManager.getLayer('route');
        if (!layer) return;
        if (visible) {
            if (!layer.hasLayer(routeLayer)) layer.addLayer(routeLayer);
        } else {
            if (layer.hasLayer(routeLayer)) layer.removeLayer(routeLayer);
        }
    }

    function getDays() {
        return Object.values(window.AppData.dayRoutes)[0] || [];
    }

    function isVisible() { return visible; }

    return { init, drawDays, setHighlight, setVisible, isVisible, getDays };
})();

window.RouteManager = RouteManager;
