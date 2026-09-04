/* ============================================================
   amap-route.js - 高德驾车真实路径规划
   ============================================================ */

const AmapRoute = (function () {
    const API = 'https://restapi.amap.com/v3/direction/driving';
    const cache = new Map();
    const dayPolylines = [];
    let enabled = false;
    let abortCtrl = null;
    let overlayLayer = null;

    function ensureLayer() {
        const map = MapManager.getMap();
        if (!map) return null;
        if (!overlayLayer) {
            overlayLayer = L.layerGroup();
            overlayLayer.addTo(map);
        }
        return overlayLayer;
    }

    function setEnabled(on) { enabled = on; }
    function isEnabled() { return enabled; }

    function cacheKey(origin, dest) {
        return `${origin.lat.toFixed(6)},${origin.lng.toFixed(6)}|${dest.lat.toFixed(6)},${dest.lng.toFixed(6)}`;
    }

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
                points.push([lng / 1e6, lat / 1e6]);
        }
        return points;
    }

    async function fetchSegment(origin, destination) {
        const key = (window.CONFIG.AMAP_KEY || '').trim();
        if (!key) throw new Error('未配置 API Key');
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
        let resp;
        try {
            resp = await fetch(url, { signal: abortCtrl && abortCtrl.signal });
        } catch (e) {
            throw new Error('网络失败: ' + e.message);
        }
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        let json;
        try {
            json = await resp.json();
        } catch (e) {
            throw new Error('JSON 解析失败: ' + e.message);
        }
        if (json.status !== '1') {
            const code = json.infocode;
            const errMap = {
                '10001': 'Key 不正确或过期',
                '10003': 'Key 未启用「Web 服务」平台',
                '10004': 'Key 域名白名单限制,请在控制台加上 xiao-xuyu.github.io',
                '10005': 'Key IP 白名单限制',
                '10006': 'Key 余额不足',
                '10007': 'Key 已删除',
                '10008': 'Key 已冻结',
                '10009': 'Key 未开通该 API 服务',
                '30000': '请求超出配额',
                '30100': '请求路径不存在(两地过远)'
            };
            throw new Error((errMap[code] || json.info) + ' (' + code + ')');
        }
        const path = json.route && json.route.paths && json.route.paths[0];
        if (!path) throw new Error('未返回路径');
        return {
            coords: decodePolyline(path.polyline),
            distance: parseInt(path.distance, 10),
            duration: parseInt(path.duration, 10)
        };
    }

    async function getSegment(origin, destination) {
        const k = cacheKey(origin, destination);
        if (cache.has(k)) return cache.get(k);
        const seg = await fetchSegment(origin, destination);
        cache.set(k, seg);
        return seg;
    }

    function abortPending() {
        if (abortCtrl) abortCtrl.abort();
        abortCtrl = new AbortController();
    }

    function clearAll() {
        if (overlayLayer) overlayLayer.clearLayers();
        dayPolylines.length = 0;
        cache.clear();
    }

    function setStatus(text, level) {
        if (window.UI && UI.setAmapStatus) UI.setAmapStatus(text, level || 'err');
    }

    async function drawDay(day, color, errSink) {
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
                if (errSink && errSink.length < 3) {
                    errSink.push(a.name + '→' + b.name + ': ' + err.message);
                }
                console.warn('[AmapRoute]', a.name, '→', b.name, err.message);
            }
        }
        const merged = [].concat(...segs.map(s => s.coords));
        const totalDist = segs.reduce((s, x) => s + x.distance, 0);
        const totalDur = segs.reduce((s, x) => s + x.duration, 0);
        if (merged.length > 0) {
            const layer = ensureLayer();
            if (!layer) return;
            const poly = L.polyline(merged.map(p => [p[1], p[0]]), {
                color: c, weight: 5, opacity: 0.9
            }).addTo(layer);
            const km = (totalDist / 1000).toFixed(0);
            const hr = (totalDur / 3600).toFixed(1);
            poly.bindTooltip(day.name + ' · 驾车 ' + km + 'km / ' + hr + 'h', { sticky: true });
            dayPolylines.push(poly);
        }
    }

    async function drawAll(days) {
        if (!enabled) return;
        clearAll();
        abortPending();
        const palette = ['#f39c12','#e74c3c','#9b59b6','#3498db','#1abc9c','#27ae60','#e67e22','#34495e','#16a085'];
        const errors = [];
        setStatus('⏳ 正在请求高德驾车路径(共 ' + days.length + ' 段,可能需 5-15 秒)…', 'ok');
        for (let i = 0; i < days.length; i++) {
            await drawDay(days[i], palette[i % palette.length], errors);
        }
        const okCount = dayPolylines.length;
        const fail = days.length - okCount;
        if (fail === 0) {
            setStatus('✅ 高德真实路径已叠加(' + okCount + ' 段)', 'ok');
        } else {
            // 诊断:9 段全失败几乎都是 Key 未授权 Web 服务 或域名白名单
            const sample = errors.length ? errors.slice(0, 3).join(' | ') : '见 console';
            const isAllFail = fail === days.length;
            const hint = isAllFail
                ? ' · 请确认:①高德控制台已勾选「Web 服务」 ②已加上域名白名单 xiao-xuyu.github.io'
                : '';
            setStatus('⚠️ 失败 ' + fail + '/' + days.length + ' · ' + sample + hint, 'err');
        }
    }

    async function drawOnlyDay(days, dayIdx) {
        if (!enabled) return;
        clearAll();
        abortPending();
        const palette = ['#f39c12','#e74c3c','#9b59b6','#3498db','#1abc9c','#27ae60','#e67e22','#34495e','#16a085'];
        setStatus('⏳ 正在请求高德路径 D' + (dayIdx + 1) + ' …', 'ok');
        await drawDay(days[dayIdx], palette[dayIdx % palette.length]);
        setStatus('✅ 高德真实路径 D' + (dayIdx + 1) + ' 已叠加', 'ok');
    }

    function clearOverlayOnly() {
        if (overlayLayer) overlayLayer.clearLayers();
        dayPolylines.length = 0;
    }

    async function testKey(key) {
        key = (key || window.CONFIG.AMAP_KEY || '').trim();
        if (!key) return { ok: false, stage: 'key', msg: '未填写 Key' };
        if (key.length < 16) return { ok: false, stage: 'key', msg: 'Key 长度不对(应 32 位)' };
        const url = API + '?key=' + encodeURIComponent(key) + '&origin=116.397,39.908&destination=116.508,39.919&strategy=0&extensions=base&output=json';
        let resp, json, txt;
        try {
            resp = await fetch(url);
        } catch (e) {
            return { ok: false, stage: 'network', msg: '网络请求失败:' + e.message };
        }
        try {
            txt = await resp.text();
            json = JSON.parse(txt);
        } catch (e) {
            return { ok: false, stage: 'response', msg: '返回非 JSON:' + (txt || '').slice(0, 80) };
        }
        if (json.status !== '1') {
            const code = json.infocode;
            const errMap = {
                '10001': 'Key 不正确或过期,请去 lbs.amap.com 检查',
                '10003': 'Key 未启用 Web 服务,请在控制台勾选「Web 服务」',
                '10004': 'Key 域名白名单限制,请在控制台加上 xiao-xuyu.github.io',
                '10005': 'Key IP 白名单限制',
                '10006': 'Key 余额不足',
                '10007': 'Key 已删除',
                '10008': 'Key 已冻结',
                '10009': 'Key 未开通该 API 服务',
                '20000': '请求参数错误:' + json.info,
                '30000': '请求超出配额'
            };
            return { ok: false, stage: 'api', msg: errMap[code] || (json.info || code) };
        }
        if (!json.route || !json.route.paths || !json.route.paths[0]) {
            return { ok: false, stage: 'api', msg: '接口返回成功但无路径数据' };
        }
        return {
            ok: true,
            stage: 'ok',
            msg: 'Key 有效 · 北京测试点距离 ' + (json.route.paths[0].distance/1000).toFixed(1) + 'km'
        };
    }

    return {
        setEnabled, isEnabled,
        drawAll, drawOnlyDay, clearAll, clearOverlayOnly,
        testKey, ensureLayer
    };
})();

window.AmapRoute = AmapRoute;