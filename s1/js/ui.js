/* ============================================================
   ui.js - 侧边面板交互 + 全部用户偏好持久化
   职责:
     - 渲染分类筛选(checkbox 状态写入 localStorage)
     - 渲染每日路线列表
     - 搜索框
     - 抽屉/移动端
     - 「环湖路线」开关(默认开,本地虚线)
     - 「驾车真实路径」开关(默认关,需 Key;与前者互斥)
     - 高德 API Key 输入 / 保存 / 清空(localStorage)
     - 路线模式 localStorage 持久化
   ============================================================ */

const UI = (function () {
    let onDayClick = () => {};
    let onAllRouteClick = () => {};
    let onModeChange = (mode) => {};   // 'local' | 'amap'

    // ---------- localStorage 工具 ----------
    function lsGet(key, def) {
        try { const v = localStorage.getItem(key); return v == null ? def : v; }
        catch (e) { return def; }
    }
    function lsSet(key, val) {
        try { localStorage.setItem(key, val); } catch (e) {}
    }
    function lsGetJSON(key, def) {
        const v = lsGet(key, null);
        if (!v) return def;
        try { return JSON.parse(v); } catch (e) { return def; }
    }
    function lsSetJSON(key, obj) { lsSet(key, JSON.stringify(obj)); }

    // ---------- 统计 ----------
    function updateStats(days) {
        const totalKm = days.reduce((s, d) => s + d.km, 0);
        document.getElementById('statDistance').textContent = totalKm.toLocaleString();
        document.getElementById('statDays').textContent = days.length;
        document.getElementById('statSpots').textContent =
            window.AppData.saltLakes.length + window.AppData.scenics.length;
        document.getElementById('statLakes').textContent = window.AppData.saltLakes.length;
    }

    // ---------- 分类筛选(checkbox 持久化) ----------
    function renderFilters() {
        const { categories, saltLakes, cities, scenics } = window.AppData;
        const container = document.getElementById('filters');
        container.innerHTML = '';
        const saved = lsGetJSON(window.CONFIG.LS_FILTER_STATE, null) || {};
        Object.entries(categories).forEach(([key, cat]) => {
            // 默认全开,用户显式关闭过的才记 false
            const checked = (key in saved) ? !!saved[key] : true;

            const div = document.createElement('div');
            div.className = 'filter-item';
            div.innerHTML = `
                <input type="checkbox" id="filter-${key}" ${checked ? 'checked' : ''}>
                <div class="check"></div>
                <div class="legend-dot" style="background:${cat.color};"></div>
                <span>${cat.name}</span>
                <span class="filter-count">${
                    key === 'salt_lake' ? saltLakes.length :
                    key === 'city' ? cities.length :
                    key === 'scenic' ? scenics.length : ''
                }</span>`;

            const cb = div.querySelector('input');
            // 初次渲染按持久化状态同步图层显隐
            if (!checked) {
                const layer = MapManager.getLayer(key);
                if (layer) MapManager.getMap().removeLayer(layer);
            }
            cb.addEventListener('change', () => {
                if (cb.checked) MapManager.getMap().addLayer(MapManager.getLayer(key));
                else MapManager.getMap().removeLayer(MapManager.getLayer(key));
                // 写回 localStorage
                const cur = lsGetJSON(window.CONFIG.LS_FILTER_STATE, {}) || {};
                cur[key] = cb.checked;
                lsSetJSON(window.CONFIG.LS_FILTER_STATE, cur);
            });
            div.addEventListener('click', e => {
                if (e.target.tagName !== 'INPUT') {
                    cb.checked = !cb.checked;
                    cb.dispatchEvent(new Event('change'));
                }
            });
            container.appendChild(div);
        });
    }

    // ---------- 每日路线列表 ----------
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

    // ---------- 行程摘要 ----------
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

    // ---------- 搜索 ----------
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

    // ---------- 抽屉 ----------
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

    // ---------- Key 工具 ----------
    function hasKey() {
        const k = (window.CONFIG.AMAP_KEY || '').trim();
        return k.length >= 16;
    }
    function maskKey(k) {
        if (!k) return '';
        if (k.length <= 8) return '*'.repeat(k.length);
        return k.slice(0, 4) + '*'.repeat(Math.max(4, k.length - 8)) + k.slice(-4);
    }

    // ---------- 双开关(互斥) ----------
    // mode = 'local' 显示本地虚线;mode = 'amap' 显示高德实线
    function getMode() {
        const v = lsGet(window.CONFIG.LS_ROUTE_MODE, 'local');
        return v === 'amap' ? 'amap' : 'local';
    }
    function setMode(mode) {
        lsSet(window.CONFIG.LS_ROUTE_MODE, mode);
    }

    function setSwitchesVisual(mode) {
        const localSw = document.getElementById('localRouteSwitch');
        const amapSw  = document.getElementById('amapSwitch');
        if (localSw) localSw.classList.toggle('on', mode === 'local');
        if (amapSw)  amapSw.classList.toggle('on', mode === 'amap');
    }

    function setAmapStatus(text, level = 'err') {
        const status = document.getElementById('amapStatus');
        status.className = 'amap-status ' + level;
        status.textContent = text;
    }

    function initSwitches() {
        const localSw = document.getElementById('localRouteSwitch');
        const amapSw  = document.getElementById('amapSwitch');
        const status  = document.getElementById('amapStatus');

        // 初始视觉
        const mode = getMode();
        setSwitchesVisual(mode);
        if (mode === 'local') {
            status.className = 'amap-status';
            status.textContent = '当前:环湖虚线 · 点上面开关可切换';
        } else {
            status.className = 'amap-status ' + (hasKey() ? 'ok' : 'err');
            status.textContent = hasKey()
                ? '✅ 已开启驾车真实路径'
                : '⚠️ 请先在上方填入高德 API Key 并保存';
        }

        // 环湖虚线开关
        localSw.addEventListener('click', () => {
            const cur = getMode();
            if (cur === 'local') return; // 已经是 local,无须切换
            setMode('local');
            setSwitchesVisual('local');
            onModeChange('local');
            status.className = 'amap-status';
            status.textContent = '已切换:环湖虚线';
        });

        // 驾车实线开关
        amapSw.addEventListener('click', () => {
            const cur = getMode();
            if (cur === 'amap') return;
            if (!hasKey()) {
                setAmapStatus('⚠️ 请先在上方填入高德 API Key 并保存', 'err');
                document.getElementById('amapKeyInput').focus();
                return;
            }
            setMode('amap');
            setSwitchesVisual('amap');
            onModeChange('amap');
            status.className = 'amap-status ok';
            status.textContent = '🛣 已开启:叠加高德驾车真实路径';
        });
    }

    // ---------- 高德 Key 配置面板(持久化已在 ui.js 内部完成) ----------
    function initAmapKeyPanel() {
        const input = document.getElementById('amapKeyInput');
        const jscodeInput = document.getElementById('amapJscodeInput');
        const saveBtn = document.getElementById('amapKeySave');
        const clearBtn = document.getElementById('amapKeyClear');
        const maskToggle = document.getElementById('amapKeyMask');
        const jscodeMaskToggle = document.getElementById('amapJscodeMask');
        const lsKey = window.CONFIG.LS_KEY_NAME;
        const lsJscode = window.CONFIG.LS_JSCODE_NAME;

        const saved = lsGet(lsKey, '');
        if (saved) {
            window.CONFIG.AMAP_KEY = saved;
            input.value = maskKey(saved);
            input.placeholder = '已保存 Key · 点击可修改';
            clearBtn.style.display = '';
        }

        const savedJscode = lsGet(lsJscode, '');
        if (savedJscode) {
            window.CONFIG.AMAP_SECURITY_JSCODE = savedJscode;
            jscodeInput.value = maskKey(savedJscode);
            jscodeInput.placeholder = '已保存 jscode · 点击可修改';
        }

        input.addEventListener('focus', () => {
            if (input.value.includes('*')) input.value = '';
        });
        jscodeInput.addEventListener('focus', () => {
            if (jscodeInput.value.includes('*')) jscodeInput.value = '';
        });

        saveBtn.addEventListener('click', () => {
            const v = input.value.trim();
            if (!v) { setAmapStatus('Key 不能为空', 'err'); return; }
            if (v.length < 16) { setAmapStatus('Key 长度不对,请检查是否完整复制', 'err'); return; }
            lsSet(lsKey, v);
            window.CONFIG.AMAP_KEY = v;
            input.value = maskKey(v);
            input.blur();

            const jsv = jscodeInput.value.trim();
            if (jsv) {
                lsSet(lsJscode, jsv);
                window.CONFIG.AMAP_SECURITY_JSCODE = jsv;
                jscodeInput.value = maskKey(jsv);
                jscodeInput.blur();
            }

            clearBtn.style.display = '';
            if (window.AmapRoute && AmapRoute.clearAll) AmapRoute.clearAll();

            const jscodeHint = jsv ? '(已含 jscode)' : '(无 jscode,如仍失败请补填)';
            if (hasKey() && getMode() === 'amap') {
                // 当前已经在驾车模式,直接重画
                const days = window.RouteManager && window.RouteManager.getDays();
                if (days) {
                    window.AmapRoute.setEnabled(true);
                    window.AmapRoute.drawAll(days);
                }
                setAmapStatus('✅ 已保存 ' + jscodeHint + ',已重画驾车路径', 'ok');
            } else {
                setAmapStatus('✅ 已保存 ' + jscodeHint + ',可点上面开关切换到驾车路径', 'ok');
            }
        });

        clearBtn.addEventListener('click', () => {
            if (!confirm('确定要清除已保存的 Key 和安全密钥?')) return;
            lsSet(lsKey, '');
            lsSet(lsJscode, '');
            window.CONFIG.AMAP_KEY = '';
            window.CONFIG.AMAP_SECURITY_JSCODE = '';
            input.value = '';
            input.placeholder = '粘贴从高德开放平台申请的 Web 端 Key';
            jscodeInput.value = '';
            jscodeInput.placeholder = '仅当 Key 启用了安全密钥时才需要填写';
            clearBtn.style.display = 'none';
            AmapRoute.clearOverlayOnly();
            setAmapStatus('已清除 Key 与 jscode', 'err');
        });

        maskToggle.addEventListener('click', () => {
            if (input.type === 'password') {
                input.type = 'text';
                maskToggle.textContent = '🙈';
                if (window.CONFIG.AMAP_KEY) input.value = maskKey(window.CONFIG.AMAP_KEY);
            } else {
                input.type = 'password';
                maskToggle.textContent = '👁';
                if (window.CONFIG.AMAP_KEY) input.value = maskKey(window.CONFIG.AMAP_KEY);
            }
        });
        if (jscodeMaskToggle) {
            jscodeMaskToggle.addEventListener('click', () => {
                if (jscodeInput.type === 'password') {
                    jscodeInput.type = 'text';
                    jscodeMaskToggle.textContent = '🙈';
                    if (window.CONFIG.AMAP_SECURITY_JSCODE) jscodeInput.value = maskKey(window.CONFIG.AMAP_SECURITY_JSCODE);
                } else {
                    jscodeInput.type = 'password';
                    jscodeMaskToggle.textContent = '👁';
                    if (window.CONFIG.AMAP_SECURITY_JSCODE) jscodeInput.value = maskKey(window.CONFIG.AMAP_SECURITY_JSCODE);
                }
            });
        }

        const testBtn = document.getElementById('amapKeyTest');
        if (testBtn) {
            testBtn.addEventListener('click', async () => {
                const v = input.value.trim();
                const keyToTest = v.includes('*') ? window.CONFIG.AMAP_KEY : v;
                if (!keyToTest) {
                    setAmapStatus('请先填写或保存 Key', 'err');
                    input.focus();
                    return;
                }
                testBtn.disabled = true;
                const oldText = testBtn.textContent;
                testBtn.textContent = '测试中…';
                setAmapStatus('⏳ 正在调用高德接口测试 Key…', 'ok');
                try {
                    const r = await AmapRoute.testKey(keyToTest);
                    if (r.ok) setAmapStatus('✅ ' + r.msg, 'ok');
                    else setAmapStatus('❌ ' + r.msg, 'err');
                } catch (e) {
                    setAmapStatus('❌ 测试失败:' + e.message, 'err');
                } finally {
                    testBtn.disabled = false;
                    testBtn.textContent = oldText;
                }
            });
        }
    }

    function setCallbacks({ onDay, onAll, onMode }) {
        onDayClick = onDay || (() => {});
        onAllRouteClick = onAll || (() => {});
        onModeChange = onMode || (() => {});
    }

    function init() {
        renderFilters();
        renderTripSummary();
        initSearch();
        initPanelDrawer();
        initAmapKeyPanel();
        initSwitches();
    }

    // 暴露给 main.js 用于启动时按持久化模式初始化
    function bootstrapMode() { return getMode(); }

    return {
        init, updateStats, renderDayList, setCallbacks, setAmapStatus,
        bootstrapMode, hasKey
    };
})();

window.UI = UI;
