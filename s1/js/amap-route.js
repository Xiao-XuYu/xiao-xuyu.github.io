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

    function clearAll() {
        if (overlayLayer) overlayLayer.clearLayers();
        dayPolylines.length = 0;
        cache.clear();
    }

    function setStatus(text, level) {
        if (window.UI && UI.setAmapStatus) UI.setAmapStatus(text, level || 'err');
    }

    function clearOverlayOnly() {
        if (overlayLayer) overlayLayer.clearLayers();
        dayPolylines.length = 0;
    }

    return {
        setEnabled, isEnabled,
        drawAll: function(){}, drawOnlyDay: function(){}, clearAll, clearOverlayOnly,
        ensureLayer
    };
})();

window.AmapRoute = AmapRoute;
console.log('[amap-route] loaded');