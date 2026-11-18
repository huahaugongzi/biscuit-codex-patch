function codexMemoryListItem() {
    const [mode, setMode] = react_1.useState(() => (window.__codexMemorySaver ? window.__codexMemorySaver.readMode() : 'balanced'));
    const [released, setReleased] = react_1.useState(undefined);
    (0, react_1.useEffect)(() => {
        if (!window.__codexMemorySaver) {
            return undefined;
        }
        return window.__codexMemorySaver.subscribe(() => setMode(window.__codexMemorySaver.readMode()));
    }, []);
    const options = [
        ['off', '不做优化', '不卸载任何标签页'],
        ['minimal', '最小优化', '只对后台标签页抑制定时器，不卸载'],
        ['balanced', '均衡优化', '后台闲置 30 分钟后卸载，重新点击时按原地址载入'],
        ['max', '最大优化', '后台闲置 5 分钟后卸载'],
    ];
    return (react_1.default.createElement('div', { id: 'setting-memory-optimizer', style: { padding: '8px 0' } },
        react_1.default.createElement('div', { style: { fontWeight: 600, fontSize: '15px', marginBottom: '4px' } }, '内存优化器'),
        react_1.default.createElement('div', { style: { fontSize: '13px', opacity: 0.72, lineHeight: 1.5, marginBottom: '6px' } }, '通过卸载不活动的标签页来释放内存。内存优化程序会在标签页处于非活动状态一段时间后卸载它们。正在播放音频、有未读通知、以及当前选中的标签页不会被卸载；登录状态与网页数据会保留。'),
        react_1.default.createElement('div', { role: 'radiogroup', 'aria-label': '内存优化器' }, options.map((option) => (react_1.default.createElement('div', {
            key: option[0],
            role: 'radio',
            tabIndex: 0,
            'aria-checked': mode === option[0],
            onClick: () => {
                if (window.__codexMemorySaver) {
                    window.__codexMemorySaver.writeMode(option[0]);
                    setMode(option[0]);
                }
            },
            onKeyDown: (e) => {
                if (e.key !== 'Enter' && e.key !== ' ') {
                    return;
                }
                e.preventDefault();
                if (window.__codexMemorySaver) {
                    window.__codexMemorySaver.writeMode(option[0]);
                    setMode(option[0]);
                }
            },
            style: { display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '6px 4px', cursor: 'pointer', borderRadius: '4px' },
        },
            react_1.default.createElement('span', { style: { flex: '0 0 auto', width: '16px', height: '16px', marginTop: '2px', borderRadius: '50%', border: mode === option[0] ? '5px solid #4263eb' : '1.5px solid rgba(0,0,0,0.35)', boxSizing: 'border-box' } }),
            react_1.default.createElement('span', null,
                react_1.default.createElement('span', { style: { display: 'block', fontSize: '14px' } }, option[1]),
                react_1.default.createElement('span', { style: { display: 'block', fontSize: '12px', opacity: 0.62 } }, option[2])))))),
        react_1.default.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' } },
            react_1.default.createElement('button', {
                type: 'button',
                onClick: () => {
                    if (window.__codexMemorySaver) {
                        setReleased(window.__codexMemorySaver.releaseNow());
                    }
                },
                style: { fontSize: '13px', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' },
            }, '立即释放后台标签'),
            released !== undefined
                ? react_1.default.createElement('span', { role: 'status', style: { fontSize: '12px', opacity: 0.7 } }, '已释放 ' + released + ' 个')
                : null)));
}
