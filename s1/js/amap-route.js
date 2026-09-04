/* ============================================================
   amap-route.js - 高德驾车真实路径规划
   实现方式:
     - 直接调用高德 Web 服务 REST API(/v3/direction/driving)
     - 无需加载 AMap JS SDK,纯 fetch + JSON 解析
     - 将返回 polyline 字符串解码为 [lat, lng] 数组并画在 Leaflet
   限制:
     - 单段 < 2 点(origin/destination 不含 waypoints 时)
     - 9 天路线多为 2~4 点,逐段调用
     - 高德限制:经纬度小数点不超过 6 位,坐标系 GCJ-02
       Leaflet 的 L.latLng 默认 WGS-84,存在 ~50-500m 偏移(中国境内)
       本项目地图已使用高德瓦片(GCJ-02 系),坐标已对齐,可直接叠加
   ============================================================ */

const AmapRoute = (function () {
    const API = 'https://restapi.amap.com/v3/direction/driving';
    const cache = new Map();           // key -> polyline coords
    const dayPolylines = [];           // 按 day 存储高德 polyline
    let enabled = false;
    let abortCtrl = null;
    const overlayLayer = L.layerGroup(); // 不放进 categories 的独立层

    overlayLayer.addTo(MapManager.getMap());

    function setEnabled(on) { enabled = on; }

    function isEnabled() { return enabled; }

    function cacheKey(origin, dest) {
        return `${origin.lat.toFixed(6)},${origin.lng.toFixed(6)}|${dest.lat.toFixed(6)},${dest.lng.toFixed(6)}`;
    }

    /** 高德 polyline 字符串 → [[lng, lat], ...] */
    function decodePolyline(str) {
        if (!str) return [];
        const points = [];
        let idx = 0, lat = 0, lng = 0;
        while (idx < str.length) {
            let b, shift = 0, result = 0;
            do {
                b = str.charCodeAt(idx++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += dlat;
            shift = 0; result = 0;
            do {
                b = str.charCodeAt(idx++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lng += dlng;
            points.push([lng / 1e6, lat / 1e6]);   // 注意:高德返回 [lng, lat]
        }
        return points;
    }

    /** 调用 Web 服务驾车路径规划(origin -> destination) */
    async function fetchSegment(origin, destination) {
        const key = window.CONFIG.AMAP_KEY;
        const strategy = window.CONFIG.AMAP_STRATEGY;
        const params = new URLSearchParams({
            key,
            origin: `${origin.lng},${origin.lat}`,
            destination: `${destination.lng},${destination.lat}`,
            strategy: String(strategy),
            extensions: 'base',
            output: 'json'
        });
        const url = `${API}?${params.toString()}`;
        const resp = await fetch(url, { signal: abortCtrl && abortCtrl.signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        if (json.status !== '1') {
            throw new Error(json.info || json.infocode || '未知错误');
        }
        const path = json.route && json.route.paths && json.route.paths[0];
        if (!path) throw new Error('未返回路径');
        return {
            coords: decodePolyline(path.polyline),
            distance: parseInt(path.distance, 10),   // 米
            duration: parseInt(path.duration, 10)    // 秒
        };
    }

    /** 获取单段(带缓存) */
    async function getSegment(origin, destination) {
        const k = cacheKey(origin, destination);
        if (cache.has(k)) return cache.get(k);
        const seg = await fetchSegment(origin, destination);
        cache.set(k, seg);
        return seg;
    }

    /** 取消进行中的请求 */
    function abortPending() {
        if (abortCtrl) abortCtrl.abort();
        abortCtrl = new AbortController();
    }

    /** 清空高德叠加层 */
    function clearAll() {
        overlayLayer.clearLayers();
        dayPolylines.length = 0;
    }

    function setStatus(text, level = 'err') {
        if (window.UI && UI.setAmapStatus) UI.setAmapStatus(text, level);
    }

    /** 绘制某一天的驾车路径(逐段拼接) */
    async function drawDay(day, color) {
        if (!enabled) return;
        const segs = [];
        const c = color || '#1e88e5';

        for (let i = 0; i < day.points.length - 1; i++) {
            const a = day.points[i], b = day.points[i + 1];
            try {
                const seg = await getSegment(a, b);
                segs.push(seg);
            } catch (err) {
                if (err.name === 'AbortError') return;
                console.warn('[AmapRoute]', a.name, '→', b.name, err.message);
            }
        }

        // 拼接所有段,绘制一条带颜色的实线
        const merged = [].concat(...segs.map(s => s.coords));
        const totalDist = segs.reduce((s, x) => s + x.distance, 0);
        const totalDur = segs.reduce((s, x) => s + x.duration, 0);

        if (merged.length > 0) {
            const poly = L.polyline(merged.map(p => [p[1], p[0]]), {
                color: c, weight: 5, opacity: 0.9
            }).addTo(overlayLayer);
            const km = (totalDist / 1000).toFixed(0);
            const hr = (totalDur / 3600).toFixed(1);
            poly.bindTooltip(`${day.name} · 驾车 ${km}km / ${hr}h`, { sticky: true });
            dayPolylines.push(poly);
        }
    }

    /** 绘制所有天数(全部路线时) */
    async function drawAll(days) {
        if (!enabled) return;
        clearAll();
        abortPending();
        const palette = ['#f39c12','#e74c3c','#9b59b6','#3498db','#1abc9c','#27ae60','#e67e22','#34495e','#16a085'];
        setStatus('⏳ 正在请求高德驾车路径(共 ' + days.length + ' 段,可能需 5-15 秒)…', 'ok');
        for (let i = 0; i < days.length; i++) {
            await drawDay(days[i], palette[i % palette.length]);
        }
        const ok = dayPolylines.length;
        const fail = days.length - ok;
        if (fail === 0) {
            setStatus(`✅ 高德真实路径已叠加(${ok} 段)`, 'ok');
        } else {
            setStatus(`⚠️ 已叠加 ${ok} 段,有 ${fail} 段高德返回失败(已回退到原虚线)`, 'err');
        }
    }

    /** 仅绘制某一天 */
    async function drawOnlyDay(days, dayIdx) {
        if (!enabled) return;
        clearAll();
        abortPending();
        const palette = ['#f39c12','#e74c3c','#9b59b6','#3498db','#1abc9c','#27ae60','#e67e22','#34495e','#16a085'];
        setStatus('⏳ 正在请求高德路径 D' + (dayIdx + 1) + ' …', 'ok');
        await drawDay(days[dayIdx], palette[dayIdx % palette.length]);
        setStatus(`✅ 高德真实路径 D${dayIdx + 1} 已叠加`, 'ok');
    }

    function clearOverlayOnly() {
        overlayLayer.clearLayers();
        dayPolylines.length = 0;
    }

    return {
        setEnabled, isEnabled,
        drawAll, drawOnlyDay, clearAll, clearOverlayOnly
    };
})();

window.AmapRoute = AmapRoute;