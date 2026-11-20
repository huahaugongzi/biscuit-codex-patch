//#region codexExtensionsV1 (injected)
// 扩展管理：把「已解压的 Chrome 扩展」加载进每个 persist 会话
const codexExtState = { list: [], loaded: false, busy: false, error: '' };
const codexExtSubscribers = new Set();
const codexExtNotify = () => {
    codexExtSubscribers.forEach((fn) => {
        try {
            fn();
        }
        catch (e) {
            /* ignore */
        }
    });
};
const codexExtRefresh = async () => {
    try {
        const res = await electron_1.ipcRenderer.invoke('codex-ext-list');
        if (res && Array.isArray(res.items)) {
            codexExtState.list = res.items;
            codexExtState.error = res.error || '';
        }
    }
    catch (e) {
        codexExtState.error = String(e && e.message ? e.message : e);
    }
    codexExtState.loaded = true;
    codexExtNotify();
};
const codexExtAdd = async () => {
    if (codexExtState.busy) {
        return;
    }
    codexExtState.busy = true;
    codexExtState.error = '';
    codexExtNotify();
    try {
        const res = await electron_1.ipcRenderer.invoke('codex-ext-add');
        if (res && res.error) {
            codexExtState.error = res.error;
        }
    }
    catch (e) {
        codexExtState.error = String(e && e.message ? e.message : e);
    }
    codexExtState.busy = false;
    await codexExtRefresh();
};
const codexExtRemove = async (id) => {
    try {
        await electron_1.ipcRenderer.invoke('codex-ext-remove', id);
    }
    catch (e) {
        codexExtState.error = String(e && e.message ? e.message : e);
    }
    await codexExtRefresh();
};
function codexExtensionListItem() {
    const [, forceRender] = react_1.useState(0);
    react_1.useEffect(() => {
        const fn = () => forceRender((n) => n + 1);
        codexExtSubscribers.add(fn);
        if (!codexExtState.loaded) {
            codexExtRefresh();
        }
        return () => codexExtSubscribers.delete(fn);
    }, []);
    const items = codexExtState.list;
    const rowStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '6px 0',
        fontSize: '13px',
        lineHeight: '1.4',
    };
    return react_1.default.createElement('div', { className: 'settingGroup' },
        react_1.default.createElement('div', { style: { padding: '4px 0 8px' } },
            react_1.default.createElement('div', { style: { fontSize: '15px', fontWeight: 600 } }, '扩展'),
            react_1.default.createElement('div', { style: { fontSize: '12px', opacity: 0.6, marginTop: '2px' } },
                '加载已解压的 Chrome 扩展（只支持内容脚本类，界面按钮与部分 API 不可用）')),
        items.length === 0
            ? react_1.default.createElement('div', { style: { ...rowStyle, opacity: 0.6 } }, '尚未安装扩展')
            : items.map((it) => react_1.default.createElement('div', { key: it.id, style: rowStyle },
                react_1.default.createElement('span', { style: { flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
                    it.name || it.id,
                    ' ',
                    react_1.default.createElement('span', { style: { opacity: 0.55 } }, it.version || '')),
                react_1.default.createElement('span', {
                    role: 'button',
                    tabIndex: 0,
                    style: { cursor: 'pointer', opacity: 0.55, fontSize: '12px', flex: '0 0 auto' },
                    onClick: () => codexExtRemove(it.id),
                    onKeyDown: (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            codexExtRemove(it.id);
                        }
                    },
                }, '移除'))),
        react_1.default.createElement('div', { style: { ...rowStyle, paddingTop: '10px' } },
            react_1.default.createElement('span', {
                role: 'button',
                tabIndex: 0,
                style: {
                    cursor: codexExtState.busy ? 'default' : 'pointer',
                    padding: '5px 14px',
                    borderRadius: '6px',
                    border: '1px solid rgba(0,0,0,0.25)',
                    fontSize: '13px',
                    opacity: codexExtState.busy ? 0.5 : 1,
                },
                onClick: codexExtAdd,
                onKeyDown: (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        codexExtAdd();
                    }
                },
            }, codexExtState.busy ? '正在加载…' : '安装扩展（选择解压目录）')),
        codexExtState.error
            ? react_1.default.createElement('div', { style: { ...rowStyle, color: '#d64545', fontSize: '12px' } }, codexExtState.error)
            : null);
}
//#endregion codexExtensionsV1
