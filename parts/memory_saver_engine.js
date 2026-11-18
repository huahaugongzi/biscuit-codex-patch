//#region codexMemorySaverV1 (injected)
// 内存优化程序：闲置后台标签页会被卸载（webview 重建，partition 不变，登录态保留）
const CODEX_MEM_STORAGE_KEY = 'biscuitMemorySaverMode';
const CODEX_MEM_MODES = ['off', 'minimal', 'balanced', 'max'];
const CODEX_MEM_TIMEOUT_MS = { minimal: 0, balanced: 30 * 60 * 1000, max: 5 * 60 * 1000 };
const codexMemEpoch = {};
const codexMemLastActive = {};
const codexMemSubscribers = new Set();
const codexMemReadMode = () => {
    try {
        const raw = window.localStorage.getItem(CODEX_MEM_STORAGE_KEY);
        return CODEX_MEM_MODES.indexOf(raw) >= 0 ? raw : 'balanced';
    }
    catch (e) {
        return 'balanced';
    }
};
const codexMemWriteMode = (mode) => {
    try {
        window.localStorage.setItem(CODEX_MEM_STORAGE_KEY, CODEX_MEM_MODES.indexOf(mode) >= 0 ? mode : 'balanced');
    }
    catch (e) {
        /* ignore */
    }
    codexMemSubscribers.forEach((fn) => {
        try {
            fn();
        }
        catch (e) {
            /* ignore */
        }
    });
};
const codexMemTouch = (sourceId) => {
    if (sourceId) {
        codexMemLastActive[sourceId] = Date.now();
    }
};
// 选中时刷新活跃时间；任意 webview 首次渲染时登记一次，之后按闲置时长判断
const codexMemEpochOf = (sourceId, selected) => {
    const epoch = codexMemEpoch[sourceId] || 0;
    if (selected) {
        codexMemTouch(sourceId);
    }
    else if (!codexMemLastActive[sourceId]) {
        codexMemLastActive[sourceId] = Date.now();
    }
    return epoch;
};
// 永不卸载的标签页
const codexMemIsProtected = (tab) => {
    if (!tab) {
        return true;
    }
    if (tab.notificationCount > 0) {
        return true;
    }
    return false;
};
const codexMemFindTab = (sourceId) => {
    try {
        const state = Store_1.default.getState();
        const groups = (state.groupList && state.groupList.tabGroups) || [];
        for (let gi = 0; gi < groups.length; gi += 1) {
            const tabs = groups[gi].tabs || [];
            for (let ti = 0; ti < tabs.length; ti += 1) {
                const tab = tabs[ti];
                if (tab.id === sourceId) {
                    return tab;
                }
                const childTabs = tab.childTabs || [];
                for (let ci = 0; ci < childTabs.length; ci += 1) {
                    if (childTabs[ci].id === sourceId) {
                        return childTabs[ci];
                    }
                }
            }
        }
    }
    catch (e) {
        /* ignore */
    }
    return undefined;
};
const codexMemGroups = () => {
    try {
        const state = Store_1.default.getState();
        return (state.groupList && state.groupList.tabGroups) || [];
    }
    catch (e) {
        return [];
    }
};
const codexMemSelectedTabId = () => {
    try {
        return Store_1.default.getState().groupList.selectedTabId;
    }
    catch (e) {
        return undefined;
    }
};
const codexMemDiscard = (sourceId) => {
    codexMemEpoch[sourceId] = (codexMemEpoch[sourceId] || 0) + 1;
    codexMemLastActive[sourceId] = Date.now();
};
// 该 source 是否正在被查看（父标签选中，或作为子标签被选中）
const codexMemIsActive = (sourceId) => {
    if (sourceId === codexMemSelectedTabId()) {
        return true;
    }
    for (let gi = 0; gi < codexMemGroups().length; gi += 1) {
        const tabs = codexMemGroups()[gi].tabs || [];
        for (let ti = 0; ti < tabs.length; ti += 1) {
            if (tabs[ti].selectedChildTabId === sourceId) {
                return true;
            }
        }
    }
    return false;
};
// 立即释放所有可卸载的后台标签页，返回释放数量
const codexMemReleaseNow = () => {
    let released = 0;
    Object.keys(codexMemLastActive).forEach((sourceId) => {
        if (codexMemIsActive(sourceId)) {
            return;
        }
        const tab = codexMemFindTab(sourceId);
        if (!tab || codexMemIsProtected(tab)) {
            return;
        }
        codexMemDiscard(sourceId);
        released += 1;
    });
    return released;
};
const codexMemSweep = () => {
    const mode = codexMemReadMode();
    if (mode === 'off' || mode === 'minimal') {
        return 0;
    }
    const timeout = CODEX_MEM_TIMEOUT_MS[mode];
    const now = Date.now();
    let released = 0;
    Object.keys(codexMemLastActive).forEach((sourceId) => {
        const lastActive = codexMemLastActive[sourceId];
        if (!lastActive || now - lastActive < timeout || codexMemIsActive(sourceId)) {
            return;
        }
        const tab = codexMemFindTab(sourceId);
        if (!tab || codexMemIsProtected(tab)) {
            return;
        }
        codexMemDiscard(sourceId);
        released += 1;
    });
    return released;
};
const codexMemStartSweeper = () => {
    if (window.__codexMemorySaverTimer) {
        return;
    }
    window.__codexMemorySaverTimer = setInterval(() => {
        try {
            codexMemSweep();
        }
        catch (e) {
            /* ignore */
        }
    }, 60 * 1000);
    try {
        Store_1.default.subscribe(() => {
            try {
                codexMemTouch(codexMemSelectedTabId());
            }
            catch (e) {
                /* ignore */
            }
        });
    }
    catch (e) {
        /* ignore */
    }
};
codexMemStartSweeper();
window.__codexMemorySaver = {
    modes: CODEX_MEM_MODES,
    readMode: codexMemReadMode,
    writeMode: codexMemWriteMode,
    subscribe: (fn) => {
        codexMemSubscribers.add(fn);
        return () => codexMemSubscribers.delete(fn);
    },
    touch: codexMemTouch,
    releaseNow: codexMemReleaseNow,
    sweep: codexMemSweep,
};
//#endregion codexMemorySaverV1
