/* ============================================================
   ui.js - 侧边面板交互(搜索/筛选/每日列表/抽屉/统计/开关)
   职责:
     - 渲染分类筛选列表
     - 渲染每日路线列表(可点击)
     - 搜索框绑定
     - 移动端抽屉开关
     - 统计条数据更新
     - 高德路线开关 UI 与状态
   ============================================================ */

const UI = (function () {
    let onDayClick = () => {};
    let onAllRouteClick = () => {};
    let onAmapToggle = (on) => {};

    function updateStats(days) {
        const totalKm = days.reduce((s, d) => s + d.km, 0);
        document.getElementById('statDistance').textContent = totalKm.toLocaleString();
        document.getElementById('statDays').textContent = days.length;
        document.getElementById('statSpots').textContent =
            window.AppData.saltLakes.length + window.AppData.scenics.length;
        document.getElementById('statLakes').textContent = window.AppData.saltLakes.length;
    }

    function renderFilters() {
        const { categories, saltLakes, cities, scenics } = window.AppData;
        const container = document.getElementById('filters');
        container.innerHTML = '';
        Object.entries(categories).forEach(([key, cat]) => {
            const div = document.createElement('div');
            div.className = 'filter-item';
            div.innerHTML = `
                <input type="checkbox" id="filter-${key}" checked>
                <div class="check"></div>
                <div class="legend-dot" style="background:${cat.color};"></div>
                <span>${cat.name}</span>
                <span class="filter-count">${
                    key === 'salt_lake' ? saltLakes.length :
                    key === 'city' ? cities.length :
                    key === 'scenic' ? scenics.length : ''
                }</span>`;
            div.querySelector('input').addEventListener('change', e => {
                if (e.target.checked) MapManager.getMap().addLayer(MapManager.getLayer(key));
                else MapManager.getMap().removeLayer(MapManager.getLayer(key));
            });
            div.addEventListener('click', e => {
                if (e.target.tagName !== 'INPUT') {
                    const cb = div.querySelector('input');
                    cb.checked = !cb.checked;
                    cb.dispatchEvent(new Event('change'));
                }
            });
            container.appendChild(div);
        });
    }

    function renderDayList(days, activeIdx) {
        const list = document.getElementById('dayList');
        list.innerHTML = '';

        const allItem = document.createElement('div');
        allItem.className = 'day-item' + (activeIdx === -1 ? ' active' : '');
        allItem.innerHTML = `
            <div class="day-badge" style="background:#6b7785;">∑</div>
            <div class="day-info">
                <div class="day-name">全部路线</div>
                <div class="day-meta">${days.reduce((s,d)=>s+d.km,0)} km · ${days.length} 天</div>
            </div>`;
        allItem.addEventListener('click', () => onAllRouteClick());
        list.appendChild(allItem);

        const palette = ['#f39c12','#e74c3c','#9b59b6','#3498db','#1abc9c','#27ae60','#e67e22','#34495e','#16a085'];
        days.forEach((d, i) => {
            const div = document.createElement('div');
            div.className = 'day-item' + (activeIdx === i ? ' active' : '');
            div.style.borderLeftColor = palette[i % palette.length];
            div.style.borderLeftWidth = '4px';
            div.innerHTML = `
                <div class="day-badge" style="background:${palette[i % palette.length]};">${i+1}</div>
                <div class="day-info">
                    <div class="day-name">${d.name}</div>
                    <div class="day-meta">${d.km} km · ${d.points.length} 站</div>
                </div>`;
            div.addEventListener('click', () => onDayClick(i));
            list.appendChild(div);
        });
    }

    function renderTripSummary() {
        const s = window.AppData.tripSummary;
        const html = `
            <div>📅 出发:<b>${s.startDate}</b></div>
            <div>🚗 路线:${s.route}</div>
            <div>⏱ ${s.duration}</div>
            <div>🌊 ${s.features}</div>
            <div style="margin-top:8px;padding:8px 10px;background:#fff8e6;border-radius:6px;color:#8a6d3b;">
                ${s.tips.map(t => `✅ ${t}<br>`).join('')}
            </div>`;
        const el = document.getElementById('tripSummary');
        if (el) el.innerHTML = html;
    }

    function initSearch() {
        const input = document.getElementById('searchInput');
        const clear = document.getElementById('searchClear');
        input.addEventListener('input', e => {
            const v = e.target.value;
            clear.classList.toggle('visible', v.length > 0);
            Markers.setSearchHighlight(v);
        });
        clear.addEventListener('click', () => {
            input.value = '';
            Markers.setSearchHighlight('');
            input.focus();
        });
    }

    function initPanelDrawer() {
        const panel = document.getElementById('panel');
        const toggle = document.getElementById('panelToggle');
        const closeBtn = document.getElementById('panelClose');
        const backdrop = document.getElementById('panelBackdrop');

        const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
        const open = () => {
            panel.classList.add('open');
            if (isMobile()) {
                backdrop.classList.add('show');
                document.body.classList.add('panel-open');
            }
            setTimeout(() => MapManager.invalidate(), 280);
        };
        const close = () => {
            panel.classList.remove('open');
            backdrop.classList.remove('show');
            document.body.classList.remove('panel-open');
            setTimeout(() => MapManager.invalidate(), 280);
        };
        toggle.addEventListener('click', e => {
            e.stopPropagation(); e.preventDefault();
            if (panel.classList.contains('open')) close(); else open();
        });
        closeBtn.addEventListener('click', close);
        backdrop.addEventListener('click', close);
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && panel.classList.contains('open')) close();
        });
    }

    function initAmapToggle() {
        const sw = document.getElementById('amapSwitch');
        const status = document.getElementById('amapStatus');
        const key = window.CONFIG.AMAP_KEY;

        if (!key || key === 'YOUR_AMAP_KEY') {
            sw.classList.remove('on');
            sw.setAttribute('disabled', 'disabled');
            status.className = 'amap-status err';
            status.textContent = '⚠️ 请先在 js/config.js 填入高德 API Key,驾车真实路线功能才能启用。';
            return;
        }

        // 默认状态
        if (window.CONFIG.AMAP_DEFAULT_ON) sw.classList.add('on');

        sw.addEventListener('click', () => {
            if (sw.hasAttribute('disabled')) return;
            sw.classList.toggle('on');
            const on = sw.classList.contains('on');
            onAmapToggle(on);
            status.className = 'amap-status ' + (on ? 'ok' : 'err');
            status.textContent = on ? '🛣 已开启:叠加高德驾车真实路径' : '已关闭:仅显示本地简化路线';
        });
    }

    function setCallbacks({ onDay, onAll, onAmap }) {
        onDayClick = onDay || (() => {});
        onAllRouteClick = onAll || (() => {});
        onAmapToggle = onAmap || (() => {});
    }

    function setAmapStatus(text, level = 'err') {
        const status = document.getElementById('amapStatus');
        status.className = 'amap-status ' + level;
        status.textContent = text;
    }

    function init() {
        renderFilters();
        renderTripSummary();
        initSearch();
        initPanelDrawer();
        initAmapToggle();
    }

    return {
        init, updateStats, renderDayList, setCallbacks, setAmapStatus
    };
})();

window.UI = UI;