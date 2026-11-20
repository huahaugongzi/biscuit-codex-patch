    //#region codexExtensionsV1: 扩展加载器（已解压的 Chrome 扩展）
    (() => {
        const fs = require('node:fs');
        const path = require('node:path');
        const EXT_STORE = path.join(electron_1.app.getPath('userData'), 'codex-extensions.json');
        const extState = { items: [] };
        let extLoadError = '';
        const extReadJson = (file) => {
            try {
                return JSON.parse(fs.readFileSync(file, 'utf8'));
            }
            catch (e) {
                return null;
            }
        };
        // 从 manifest 里取显示名（支持 __MSG_ 占位）
        const extDisplayName = (manifest, dir) => {
            let name = manifest.name || path.basename(dir);
            const m = /^__MSG_(.+)__$/.exec(name);
            if (m) {
                const locales = path.join(dir, '_locales');
                let lang = 'en';
                try {
                    const prefs = extReadJson(path.join(electron_1.app.getPath('userData'), 'config.json'));
                    void prefs;
                }
                catch (e) {
                    /* ignore */
                }
                for (const cand of [lang, 'zh_CN', 'en_US']) {
                    const msgFile = path.join(locales, cand, 'messages.json');
                    if (fs.existsSync(msgFile)) {
                        const msgs = extReadJson(msgFile) || {};
                        const key = Object.keys(msgs).find((k) => k.toLowerCase() === m[1].toLowerCase());
                        if (key && msgs[key] && msgs[key].message) {
                            name = msgs[key].message;
                            break;
                        }
                    }
                }
            }
            return name;
        };
        const extNormalizeDir = (dir) => {
            let cur = path.resolve(dir);
            for (let i = 0; i < 4; i += 1) {
                if (fs.existsSync(path.join(cur, 'manifest.json'))) {
                    return cur;
                }
                const subs = fs.readdirSync(cur, { withFileTypes: true }).filter((d) => d.isDirectory());
                if (subs.length !== 1) {
                    return '';
                }
                cur = path.join(cur, subs[0].name);
            }
            return fs.existsSync(path.join(cur, 'manifest.json')) ? cur : '';
        };
        const extLoadStore = () => {
            const data = extReadJson(EXT_STORE);
            if (data && Array.isArray(data.items)) {
                extState.items = data.items.filter((it) => it && typeof it.path === 'string');
            }
        };
        const extSaveStore = () => {
            try {
                fs.writeFileSync(EXT_STORE, JSON.stringify({ items: extState.items }, null, 2));
            }
            catch (e) {
                console.error('[codex-ext] 保存扩展列表失败', e);
            }
        };
        // 把某个扩展加载进一个 session；失败只记日志，不影响启动
        const extLoadInto = async (ses, item) => {
            try {
                await ses.loadExtension(item.path, { allowFileAccess: true });
            }
            catch (e) {
                const msg = String((e && e.message) || e);
                if (!/already loaded|已加载/i.test(msg)) {
                    console.error('[codex-ext] 加载失败', item.name || item.path, msg);
                    extLoadError = (item.name || '扩展') + ': ' + msg;
                }
            }
        };
        const extLoadAllInto = async (ses) => {
            for (const item of extState.items) {
                if (item.enabled === false) {
                    continue;
                }
                await extLoadInto(ses, item);
            }
        };
        // 每个新会话（含 webview 的 persist: 分区）自动挂载
        electron_1.app.on('session-created', (ses) => {
            void extLoadAllInto(ses);
        });
        extLoadStore();
        // 启动时已存在的会话
        try {
            extLoadAllInto(electron_1.session.defaultSession);
        }
        catch (e) {
            /* ignore */
        }
        electron_1.ipcMain.handle('codex-ext-list', async () => {
            extState.items = extState.items.map((it) => {
                const manifest = extReadJson(path.join(it.path, 'manifest.json')) || {};
                return {
                    id: it.path,
                    path: it.path,
                    name: extDisplayName(manifest, it.path),
                    version: manifest.version || '',
                    manifestVersion: manifest.manifest_version || 0,
                    enabled: it.enabled !== false,
                };
            });
            return { items: extState.items, error: extLoadError };
        });
        electron_1.ipcMain.handle('codex-ext-add', async (event) => {
            const main = getMain();
            if (!main || event.sender !== main.window.webContents) {
                return { error: '非法调用' };
            }
            const picked = await electron_1.dialog.showOpenDialog(main.window, {
                title: '选择已解压的扩展目录（含 manifest.json）',
                properties: ['openDirectory'],
                message: '选择解压后的扩展文件夹，例如 1.35.2_0 或者其上一层都可以',
            });
            if (picked.canceled || !picked.filePaths || !picked.filePaths.length) {
                return {};
            }
            const dir = extNormalizeDir(picked.filePaths[0]);
            if (!dir) {
                return { error: '这个目录里没有 manifest.json' };
            }
            const manifest = extReadJson(path.join(dir, 'manifest.json'));
            if (!manifest) {
                return { error: 'manifest.json 解析失败' };
            }
            if (extState.items.some((it) => it.path === dir)) {
                return { error: '这个扩展已经添加过了' };
            }
            const item = { path: dir, enabled: true };
            extState.items.push(item);
            extSaveStore();
            extLoadError = '';
            // 立刻挂到所有已存在的会话（包括 webview 分区）
            try {
                for (const ses of electron_1.session.getAllSessions ? electron_1.session.getAllSessions() : [electron_1.session.defaultSession]) {
                    await extLoadInto(ses, item);
                }
            }
            catch (e) {
                /* ignore */
            }
            // webview 分区是懒创建的，补一遍当前已打开的 webContents
            electron_1.webContents.getAllWebContents().forEach((wc) => {
                if (!wc.isDestroyed() && wc.session) {
                    void extLoadInto(wc.session, item);
                }
            });
            return { ok: true, path: dir };
        });
        electron_1.ipcMain.handle('codex-ext-remove', async (event, id) => {
            const main = getMain();
            if (!main || event.sender !== main.window.webContents || typeof id !== 'string') {
                return false;
            }
            const idx = extState.items.findIndex((it) => it.path === id);
            if (idx < 0) {
                return false;
            }
            const item = extState.items[idx];
            extState.items.splice(idx, 1);
            extSaveStore();
            // 真正卸载：从所有会话里摘掉
            const all = electron_1.session.getAllSessions ? electron_1.session.getAllSessions() : [electron_1.session.defaultSession];
            for (const ses of all) {
                try {
                    for (const ext of ses.getAllExtensions()) {
                        if (ext.path === item.path) {
                            ses.removeExtension(ext.id);
                        }
                    }
                }
                catch (e) {
                    /* ignore */
                }
            }
            return true;
        });
    })();
    //#endregion codexExtensionsV1
