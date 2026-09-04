/* ============================================================
   markers.js - 标记与弹窗
   职责:
     - 统一创建 Marker(图标 + 弹窗 + Tooltip)
     - 收集 allMarkers 列表供搜索使用
     - 提供 setOpacity / flyTo / closePopup 等工具
   ============================================================ */

const Markers = (function () {
    let allMarkers = [];
    let allItems = [];
    let dayIndexMap = {};

    function buildDayIndex(days) {
        dayIndexMap = {};
        days.forEach(day => {
            const first = day.points[0], last = day.points[day.points.length - 1];
            const label = `${first.name} → ${last.name}`;
            day.points.forEach(p => { dayIndexMap[p.name] = { day: day.name, label }; });
        });
    }

    function createMarker(item, catKey) {
        const cat = window.AppData.categories[catKey];
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background:${cat.color};width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 4px rgba(0,0,0,.6);"></div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9]
        });

        const dayInfo = dayIndexMap[item.name];
        const dayLabel = dayInfo ? `${dayInfo.day} · ${dayInfo.label}` : '';

        const popupContent = `
            ${item.img ? `<img src="${item.img}" class="popup-img" loading="lazy" onerror="this.style.display='none'">` : ''}
            <div class="popup-body">
                <div class="popup-title">
                    ${item.name}
                    <span class="popup-cat" style="background:${cat.color};">${cat.name}</span>
                </div>
                ${dayLabel ? `<div style="font-size:11px;color:var(--accent);margin-bottom:6px;font-weight:500;">📅 ${dayLabel}</div>` : ''}
                <div class="popup-desc">${item.desc}</div>
                <div class="popup-meta">
                    <div class="popup-meta-row"><span class="ico">🎫</span><span class="val">${item.ticket || '—'}</span></div>
                    <div class="popup-meta-row"><span class="ico">🗓️</span><span class="val">${item.best || '—'}</span></div>
                </div>
                ${item.tip ? `<div style="margin-top:10px;padding:8px 10px;background:#fff8e6;border-radius:6px;font-size:11.5px;color:#8a6d3b;line-height:1.5;">💡 ${item.tip}</div>` : ''}
                <div class="popup-actions">
                    <a class="popup-btn primary" target="_blank"
                       href="https://uri.amap.com/marker?position=${item.lng},${item.lat}&name=${encodeURIComponent(item.name)}&src=mapp">高德地图</a>
                    <a class="popup-btn" target="_blank"
                       href="https://www.google.com/maps?q=${item.lat},${item.lng}">Google Maps</a>
                </div>
            </div>`;

        return L.marker([item.lat, item.lng], { icon, title: item.name })
            .bindPopup(popupContent, { maxWidth: 280, minWidth: 240 })
            .bindTooltip(item.name, {
                permanent: true, direction: 'right', offset: [10, 0],
                className: 'marker-label'
            });
    }

    function renderAll() {
        allMarkers = [];
        allItems = [
            ...window.AppData.saltLakes.map(x => ({ ...x, cat: 'salt_lake' })),
            ...window.AppData.cities.map(x => ({ ...x, cat: 'city' })),
            ...window.AppData.scenics.map(x => ({ ...x, cat: 'scenic' }))
        ];
        const map = MapManager.getMap();
        allItems.forEach(item => {
            const m = createMarker(item, item.cat);
            m.addTo(MapManager.getLayer(item.cat));
            m._data = item;
            allMarkers.push(m);
        });
        return allItems;
    }

    function setSearchHighlight(query) {
        const q = (query || '').trim().toLowerCase();
        if (!q) {
            allMarkers.forEach(m => m.setOpacity(1));
            return;
        }
        allMarkers.forEach(m => {
            const hit = m._data.name.toLowerCase().includes(q) ||
                        (m._data.desc && m._data.desc.toLowerCase().includes(q));
            m.setOpacity(hit ? 1 : 0.15);
        });
    }

    function closeAllPopups() { allMarkers.forEach(m => m.closePopup()); }

    function flyToBounds(bounds, padding = [40, 40]) {
        const map = MapManager.getMap();
        if (bounds.isValid()) map.flyToBounds(bounds, { padding, duration: 0.6 });
    }

    function boundsFromPoints(points) {
        return L.latLngBounds(points.map(p => [p.lat, p.lng]));
    }

    return {
        renderAll, buildDayIndex,
        setSearchHighlight, closeAllPopups,
        flyToBounds, boundsFromPoints,
        get allItems() { return allItems; },
        get allMarkers() { return allMarkers; }
    };
})();

window.Markers = Markers;