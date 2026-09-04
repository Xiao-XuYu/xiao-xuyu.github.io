/* ============================================================
   map.js - 地图与瓦片初始化
   职责:
     - 创建 Leaflet 地图实例
     - 注册瓦片图层(高德优先 + OSM 兜底)
     - 暴露各 layerGroup(盐湖/城市/景点/路线)
     - 提供 invalidateSize 包装
   ============================================================ */

const MapManager = (function () {
    let map = null;
    const tileLayers = [];
    const layers = {};
    let onRouteLayer = null;

    function init(mapId = 'map') {
        // 国内移动端:关闭 fadeAnimation 提升性能;tap 启用避免 300ms 延迟
        map = L.map(mapId, {
            zoomControl: false,
            tap: true,
            fadeAnimation: false,
            zoomAnimation: true
        }).setView([35.5, 100.5], 5);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // 瓦片源:高德矢量瓦片优先,失败回退 OSM
        const gaode = L.tileLayer(
            'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
            {
                subdomains: ['1', '2', '3', '4'],
                attribution: '© 高德地图',
                maxZoom: 18,
                detectRetina: false
            }
        );
        const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 18
        });
        gaode.addTo(map);
        gaode.on('tileerror', () => {
            try { map.removeLayer(gaode); } catch (e) {}
            try { osm.addTo(map); } catch (e) {}
        });
        tileLayers.push(gaode, osm);

        // 初始化各分类图层组
        const { categories } = window.AppData;
        Object.keys(categories).forEach(k => {
            layers[k] = L.layerGroup().addTo(map);
        });

        return map;
    }

    function getMap() { return map; }
    function getLayer(key) { return layers[key]; }
    function setRouteLayer(layer) { onRouteLayer = layer; }
    function getRouteLayer() { return onRouteLayer; }

    function invalidate() { if (map) map.invalidateSize(); }

    return { init, getMap, getLayer, setRouteLayer, getRouteLayer, invalidate };
})();

window.MapManager = MapManager;