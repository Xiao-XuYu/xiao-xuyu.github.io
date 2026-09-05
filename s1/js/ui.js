/* ============================================================
   ui.js - 侧边面板交互(搜索/筛选/每日列表/抽屉/统计/开关/Key配置)
   职责:
     - 渲染分类筛选列表
     - 渲染每日路线列表(可点击)
     - 搜索框绑定
     - 移动端抽屉开关
     - 统计条数据更新
     - 高德路线开关 UI 与状态
     - 高德 API Key 输入、保存(localStorage)、清空
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

        refreshAmapAvailability();
        syncSwitchFromConfig();

        if (window.CONFIG.AMAP_DEFAULT_ON && hasKey()) sw.classList.add('on');

        sw.addEventListener('click', () => {
            if (sw.hasAttribute('disabled')) return;
            if (!hasKey()) {
                // 没 Key 时点开关 → 提示并聚焦输入框
                setAmapStatus('⚠️ 请先在上方填入高德 API Key 并保存', 'err');
                document.getElementById('amapKeyInput').focus();
                return;
            }
            sw.classList.toggle('on');
            const on = sw.classList.contains('on');
            onAmapToggle(on);
            status.className = 'amap-status ' + (on ? 'ok' : 'err');
            status.textContent = on ? '🛣 已开启:叠加高德驾车真实路径' : '已关闭:仅显示本地简化路线';
        });
    }

    function hasKey() {
        const k = (window.CONFIG.AMAP_KEY || '').trim();
        return k.length >= 16;       // 高德 Key 一般 32 位
    }

    function refreshAmapAvailability() {
        const sw = document.getElementById('amapSwitch');
        const status = document.getElementById('amapStatus');
        if (!hasKey()) {
            sw.classList.remove('on');
            sw.setAttribute('disabled', 'disabled');
            status.className = 'amap-status';
            status.textContent = '请先在上方填入 API Key,驾车真实路径才能启用';
        } else {
            sw.removeAttribute('disabled');
            status.className = 'amap-status ok';
            status.textContent = '✅ Key 已加载,可开启驾车路径';
        }
    }

    function syncSwitchFromConfig() {
        // CONFIG.AMAP_KEY 已从 localStorage 读取后再调用本方法
        refreshAmapAvailability();
    }

    /* ---------- 高德 Key 配置面板 ---------- */
    function initAmapKeyPanel() {
        const input = document.getElementById('amapKeyInput');
        const jscodeInput = document.getElementById('amapJscodeInput');
        const saveBtn = document.getElementById('amapKeySave');
        const clearBtn = document.getElementById('amapKeyClear');
        const maskToggle = document.getElementById('amapKeyMask');
        const jscodeMaskToggle = document.getElementById('amapJscodeMask');
        const lsKey = window.CONFIG.LS_KEY_NAME;
        const lsJscode = window.CONFIG.LS_JSCODE_NAME;

        // 载入已保存的 Key(只显示前 4 后 4 中间 ****)
        const saved = localStorage.getItem(lsKey);
        if (saved) {
            window.CONFIG.AMAP_KEY = saved;
            input.value = maskKey(saved);
            input.placeholder = '已保存 Key · 点击「修改」可更换';
            clearBtn.style.display = '';
        }

        // 载入已保存的 jscode
        const savedJscode = localStorage.getItem(lsJscode);
        if (savedJscode) {
            window.CONFIG.AMAP_SECURITY_JSCODE = savedJscode;
            jscodeInput.value = maskKey(savedJscode);
            jscodeInput.placeholder = '已保存 jscode · 点击可修改';
        }

        // 输入框聚焦时清空,允许输入完整 Key
        input.addEventListener('focus', () => {
            if (input.value.includes('*')) input.value = '';
        });
        jscodeInput.addEventListener('focus', () => {
            if (jscodeInput.value.includes('*')) jscodeInput.value = '';
        });

        // 保存
        saveBtn.addEventListener('click', () => {
            const v = input.value.trim();
            if (!v) {
                setAmapStatus('Key 不能为空', 'err');
                return;
            }
            if (v.length < 16) {
                setAmapStatus('Key 长度不对,请检查是否完整复制', 'err');
                return;
            }
            localStorage.setItem(lsKey, v);
            window.CONFIG.AMAP_KEY = v;
            input.value = maskKey(v);
            input.blur();

            // 同时保存 jscode(可空)
            const jsv = jscodeInput.value.trim();
            if (jsv) {
                localStorage.setItem(lsJscode, jsv);
                window.CONFIG.AMAP_SECURITY_JSCODE = jsv;
                jscodeInput.value = maskKey(jsv);
                jscodeInput.blur();
            }

            clearBtn.style.display = '';
            // 清缓存让 amap-route 用新 Key 重新请求
            if (window.AmapRoute && AmapRoute.clearAll) AmapRoute.clearAll();
            refreshAmapAvailability();
            const jscodeHint = jsv ? '(已含 jscode)' : '(无 jscode,如仍失败请补填)';
            setAmapStatus('✅ 已保存 ' + jscodeHint + ',可点开关启用驾车路径', 'ok');
        });

        // 清空
        clearBtn.addEventListener('click', () => {
            if (!confirm('确定要清除已保存的 Key 和安全密钥?')) return;
            localStorage.removeItem(lsKey);
            localStorage.removeItem(lsJscode);
            window.CONFIG.AMAP_KEY = '';
            window.CONFIG.AMAP_SECURITY_JSCODE = '';
            input.value = '';
            input.placeholder = '粘贴从高德开放平台申请的 Web 端 Key';
            jscodeInput.value = '';
            jscodeInput.placeholder = '仅当 Key 启用了安全密钥时才需要填写';
            clearBtn.style.display = 'none';
            AmapRoute.clearOverlayOnly();
            refreshAmapAvailability();
            setAmapStatus('已清除 Key 与 jscode', 'err');
        });

        // 显隐切换
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

        // 测试 Key
        const testBtn = document.getElementById('amapKeyTest');
        if (testBtn) {
            testBtn.addEventListener('click', async () => {
                const v = input.value.trim();
                // 如果输入框是掩码(包含 *),就用当前保存的 Key
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
                    if (r.ok) {
                        setAmapStatus('✅ ' + r.msg, 'ok');
                    } else {
                        setAmapStatus('❌ ' + r.msg, 'err');
                    }
                } catch (e) {
                    setAmapStatus('❌ 测试失败:' + e.message, 'err');
                } finally {
                    testBtn.disabled = false;
                    testBtn.textContent = oldText;
                }
            });
        }
    }

    function maskKey(k) {
        if (!k) return '';
        if (k.length <= 8) return '*'.repeat(k.length);
        return k.slice(0, 4) + '*'.repeat(Math.max(4, k.length - 8)) + k.slice(-4);
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
        initAmapKeyPanel();      // 先加载 Key 到 CONFIG
        initAmapToggle();        // 再检查开关状态
    }

    return {
        init, updateStats, renderDayList, setCallbacks, setAmapStatus
    };
})();

window.UI = UI;