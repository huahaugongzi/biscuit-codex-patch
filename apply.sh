#!/bin/bash
# 重新注入 Biscuit 自定义补丁（升级后使用）
#
# 用法:
#   ~/.biscuit-patch/apply.sh /Applications/biscuit-日常.app            # 直接打补丁
#   ~/.biscuit-patch/apply.sh /Applications/biscuit-日常.app --dry-run  # 只检查锚点，不写文件
#   ~/.biscuit-patch/apply.sh /Applications/biscuit-日常.app --verify   # 只报告当前是否已打补丁
#
# 补丁内容:
#   1) 自定义折叠小组（树形嵌套 + 折叠 + 拖拽 + 右键菜单 + 未分组）
#   2) 左侧栏中部折叠把手
#   3) 隐藏侧栏底部 AddGroup / Notification / Donate
#
# 两套配方:
#   2.1.x  -> 整模块替换 TabGroupRow / TabRow，把手注入 SidebarSeparator
#   2.2.x+ -> 追加式：把「小组引擎」作为独立代码块插进 TabGroupRow 模块，
#             只改 4 个锚点，不整块覆盖组件（保留新版右键菜单等新功能）
#
# 所有定位都基于锚点文本，不依赖行号；锚点找不到就停，绝不写半截文件。

set -euo pipefail

APP="${1:-}"
MODE="${2:-apply}"
OUT="${3:-}"
# 素材目录：优先用脚本同级的 parts/（仓库可直接用），否则退回 ~/.biscuit-patch/parts
SELF_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -d "$SELF_DIR/parts" ]; then
  PARTS="$SELF_DIR/parts"
else
  PARTS="$HOME/.biscuit-patch/parts"
fi

if [ -z "$APP" ]; then
  echo "用法: $0 /Applications/Biscuit.app [--dry-run|--verify|--out 输出路径]" >&2
  echo "  --out  只生成打好补丁的 app.asar 到指定路径，不写安装目录（用于目录被系统保护时）" >&2
  exit 2
fi
[ "$MODE" = "--out" ] || OUT=""
if [ "$MODE" = "--out" ] && [ -z "$OUT" ]; then
  echo "--out 需要一个输出路径，例如 /tmp/app.asar" >&2
  exit 2
fi
APP="${APP%/}"
ASAR="$APP/Contents/Resources/app.asar"

[ -f "$ASAR" ] || { echo "找不到 $ASAR" >&2; exit 1; }
[ -d "$PARTS" ] || { echo "缺少素材目录 $PARTS" >&2; exit 1; }

VER=$(/usr/libexec/PlistBuddy -c "Print CFBundleShortVersionString" "$APP/Contents/Info.plist" 2>/dev/null || echo "?")
echo "目标: $APP (版本 $VER)"

WORK=$(mktemp -d "${TMPDIR:-/tmp}/biscuit-patch.XXXXXX")
trap 'rm -rf "$WORK"' EXIT

echo "解包 app.asar ..."
npx --yes @electron/asar extract "$ASAR" "$WORK/app" >/dev/null

IDX="$WORK/app/js/renderer/index.js"
MAIN="$WORK/app/js/main/main.js"
[ -f "$IDX" ] || { echo "app.asar 里没有 js/renderer/index.js，结构可能变了" >&2; exit 1; }

if [ "$MODE" = "--verify" ]; then
  echo "自定义小组: $(grep -c 'codexCustomSections' "$IDX" || true) 处标记"
  echo "折叠把手:   $(grep -c 'ToggleSidebarButton' "$IDX" || true) 处标记"
  echo "页脚隐藏:   $(grep -c 'codexHideSidebarFooter' "$IDX" || true) 处标记"
  echo "（每项 >0 即为已打补丁）"
  exit 0
fi

echo "运行 Python 注入器 ..."
python3 - "$IDX" "$MAIN" "$PARTS" "$MODE" <<'PYEOF'
import sys, pathlib

idx_path = pathlib.Path(sys.argv[1])
main_path = pathlib.Path(sys.argv[2])
parts = pathlib.Path(sys.argv[3])
mode = sys.argv[4]
src = idx_path.read_text()
main_src = main_path.read_text() if main_path.is_file() else None
orig_len = len(src)
report = []

def die(msg):
    print("ERROR: " + msg, file=sys.stderr)
    sys.exit(1)

def module_body(text, module_path):
    marker = '/***/ "%s":' % module_path
    if text.count(marker) != 1:
        die(f"找不到唯一模块 {module_path}")
    start = text.index(marker)
    body_start = text.index('/***/ (function(module, exports, __webpack_require__) {', start)
    body_start += len('/***/ (function(module, exports, __webpack_require__) {')
    body_end = text.index('/***/ }),', body_start)
    return body_start, body_end

def edit_module(text, module_path, fn, label):
    b, e = module_body(text, module_path)
    body = text[b:e]
    new_body = fn(body)
    report.append(f"{label}: {module_path}")
    return text[:b] + new_body + text[e:]

def need(body, needle, label):
    n = body.count(needle)
    if n != 1:
        die(f"锚点《{label}》在模块内命中 {n} 次（应为 1），版本结构可能又变了，已停止")
    return body.index(needle)

def replace_once(body, needle, repl, label):
    need(body, needle, label)
    return body.replace(needle, repl, 1)

# ==================== 新配方（2.2.x 起）====================
NEW_MARK = 'codexCustomSectionsV10'
LEGACY_MARK = 'biscuitCustomSectionsV9SortFix'
SIDE_MOD = './ts/renderer/components/SidebarSeparator.tsx'
GROUP_MOD = './ts/renderer/components/TabGroupRow.tsx'
ROW_MOD = './ts/renderer/components/TabRow.tsx'
WEBVIEW_MOD = './ts/renderer/components/WebView.tsx'
ADV_MOD = './ts/renderer/components/settings/AdvancedSettings.tsx'
EXT_MOD = './ts/renderer/components/settings/ExtensionSettings.tsx'
WIN_MOD = './ts/renderer/components/Window.tsx'

def is_new_layout(text):
    try:
        b, e = module_body(text, GROUP_MOD)
    except SystemExit:
        return False
    g = text[b:e]
    return 'const tabs = group.tabs;' in g and 'tabListElems' in g and 'class MouseState' not in text

TOGGLE_STYLE_RUN = r'''
const ToggleSidebarButton = styled_components_1.default.button `BT`
    position: fixed;
    top: 50%;
    left: $D{p => (p.sidebar.visible === false || p.sidebar.width === 0) ? '0px' : `BD${p.x - 8}px`BT};
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 44px;
    padding: 0;
    border: 1px solid rgba(0, 0, 0, 0.18);
    border-radius: 6px;
    background: rgba(120, 120, 120, 0.42);
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    line-height: 1;
    z-index: 20;
    cursor: pointer;
    -webkit-app-region: no-drag;
    transition: left 180ms ease, background 140ms ease, opacity 140ms ease;
    &:hover {
        background: rgba(100, 100, 100, 0.62);
    }
`BT`;
// codexSidebarToggleV1
'''
TOGGLE_STYLE = (TOGGLE_STYLE_RUN.replace('`BT`', '`')
                .replace('$D{', '${')
                .replace('`BD', '`')
                .replace('`BT}', '`}'))

TOGGLE_VIEW = '''react_1.default.createElement(SidebarSeparator_1.SidebarSeparator, { sidebar: sidebar, preferredWidth: preferredSidebar.width }),
                react_1.default.createElement(ToggleSidebarButton, {
                    x: sidebar.visible ? sidebar.width : 0,
                    sidebar: sidebar,
                    type: 'button',
                    title: sidebar.visible ? '折叠左侧栏' : '展开左侧栏',
                    'aria-label': sidebar.visible ? '折叠左侧栏' : '展开左侧栏',
                    onClick: () => Store_1.default.dispatch((0, GroupActionCreators_1.createToggleSidebarAction)(Store_1.default)),
                }, sidebar.visible ? '<' : '>'),'''

SECTION_HEADER_MENU = '''
        this.showSectionMenu = (section, event) => {
            const { group } = this.props;
            const { Menu } = remote;
            event.preventDefault();
            event.stopPropagation();
            const ctx = buildCustomSectionContext(group);
            const target = ctx.byId.get(section.id);
            if (!target) {
                return;
            }
            const menu = new Menu();
            menu.append(new remote.MenuItem({
                label: target.opened === false ? '展开小组' : '收起小组',
                click: () => {
                    target.opened = target.opened === false;
                    saveCustomSectionState(ctx.state);
                    this.forceUpdate();
                },
            }));
            menu.append(new remote.MenuItem({
                label: '新建子文件夹',
                click: () => {
                    ctx.createSection(target, false);
                    this.forceUpdate();
                },
            }));
            menu.append(new remote.MenuItem({
                label: '把未分组 App 放入这里',
                click: () => {
                    const claimed = new Set();
                    ctx.sections.forEach((it) => (it.tabIds || []).forEach((id) => claimed.add(id)));
                    group.tabs.forEach((tab) => {
                        if (!claimed.has(tab.id) && (target.tabIds || []).indexOf(tab.id) === -1) {
                            target.tabIds = target.tabIds || [];
                            target.tabIds.push(tab.id);
                        }
                    });
                    target.opened = true;
                    saveCustomSectionState(ctx.state);
                    this.forceUpdate();
                },
            }));
            menu.append(new remote.MenuItem({
                label: '把本文件夹 App 移到未分组',
                click: () => {
                    ctx.deepTabIds(target).forEach((tabId) =>
                        ctx.sections.forEach((it) => (it.tabIds = (it.tabIds || []).filter((id) => id !== tabId))));
                    target.tabIds = [];
                    ctx.descendants(target).forEach((child) => (child.tabIds = []));
                    saveCustomSectionState(ctx.state);
                    this.forceUpdate();
                },
            }));
            menu.append(new remote.MenuItem({ type: 'separator' }));
            menu.append(new remote.MenuItem({
                label: '重命名文件夹',
                click: () => {
                    codexRenamingSectionId = target.id;
                    this.forceUpdate();
                },
            }));
            menu.append(new remote.MenuItem({
                label: '删除文件夹（App 回到未分组）',
                click: () => {
                    ctx.removeSection(target);
                    this.forceUpdate();
                },
            }));
            menu.popup({ window: remote.getCurrentWindow() });
        };
        this.commitSectionRename = (sectionId, value) => {
            const next = (value || '').trim();
            codexRenamingSectionId = null;
            if (next) {
                const ctx = buildCustomSectionContext(this.props.group);
                const target = ctx.byId.get(sectionId);
                if (target && target.name !== next) {
                    target.name = next;
                    saveCustomSectionState(ctx.state);
                }
            }
            this.forceUpdate();
        };
        this.showCustomSectionMenu = (event) => {
            const { group } = this.props;
            event.preventDefault();
            event.stopPropagation();
            const ctx = buildCustomSectionContext(group);
            const menu = new remote.Menu();
            menu.append(new remote.MenuItem({
                label: '新建小组',
                click: () => {
                    ctx.createSection(null, false);
                    this.forceUpdate();
                },
            }));
            menu.append(new remote.MenuItem({
                label: '把未分组 App 全部收进新小组',
                click: () => {
                    ctx.createSection(null, true);
                    this.forceUpdate();
                },
            }));
            menu.popup({ window: remote.getCurrentWindow() });
        };
        this.onTabDropOnSection = (sectionId, event) => {
            const tabId = event.dataTransfer && event.dataTransfer.getData('text/plain');
            if (!tabId) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            moveTabIntoSection(this.props.group, tabId, sectionId);
            this.forceUpdate();
        };
'''

SECTION_RENDER = '''        const tabs = group.tabs;
        const containsSelectedTab = tabs.some((tab) => tab.id === selectedTabId);
        // codexCustomSectionsV10: 按小组树生成扁平、有序的行列表
        const sectionView = buildSectionFlatList(group);
        let flatIndex = 0;
        const tabListElems = sectionView.flat.map((item, itemIndex) => {
            if (item.kind === 'section') {
                const section = item.section;
                const count = sectionView.ctx.deepTabIds(section).length;
                return (react_1.default.createElement('div', {
                    key: 'section_' + section.id,
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: `2px 10px 2px ${4 + item.depth * 12}px`,
                        margin: '1px 0',
                        boxSizing: 'border-box',
                        width: '100%',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        borderRadius: '4px',
                        fontSize: '15px',
                        fontWeight: 600,
                        color: 'var(--chrome-top-tab-text, rgba(0,0,0,0.62))',
                        cursor: 'pointer',
                        userSelect: 'none',
                        WebkitAppRegion: 'no-drag',
                    },
                    draggable: true,
                    onDragOver: (event) => event.preventDefault(),
                    onDrop: (event) => this.onTabDropOnSection(section.id, event),
                    onClick: () => {
                        section.opened = section.opened === false;
                        saveCustomSectionState(sectionView.ctx.state);
                        this.forceUpdate();
                    },
                    onContextMenu: (event) => this.showSectionMenu(section, event),
                },
                    react_1.default.createElement('span', null, section.opened === false ? '▸' : '▾'),
                    codexRenamingSectionId === section.id
                        ? react_1.default.createElement('input', {
                            key: 'rename_' + section.id,
                            defaultValue: section.name,
                            autoFocus: true,
                            onClick: (event) => event.stopPropagation(),
                            onKeyDown: (event) => {
                                if (event.key === 'Enter') {
                                    this.commitSectionRename(section.id, event.currentTarget.value);
                                }
                                else if (event.key === 'Escape') {
                                    codexRenamingSectionId = null;
                                    this.forceUpdate();
                                }
                                event.stopPropagation();
                            },
                            onBlur: (event) => this.commitSectionRename(section.id, event.currentTarget.value),
                            style: {
                                flex: '1 1 auto',
                                minWidth: 0,
                                fontSize: '15px',
                                fontWeight: 600,
                                fontFamily: 'inherit',
                                color: 'inherit',
                                background: 'rgba(120,120,120,0.18)',
                                border: '1px solid rgba(120,120,120,0.45)',
                                borderRadius: '3px',
                                padding: '0 3px',
                                outline: 'none',
                                WebkitAppRegion: 'no-drag',
                            },
                        })
                        : react_1.default.createElement('span', { style: { flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, section.name),
                    react_1.default.createElement('span', { style: { flex: '0 0 auto', marginLeft: 'auto', opacity: 0.55 } }, '(' + count + ')')));
            }
            if (item.kind === 'ungrouped') {
                // 不显示「未分组」标题，直接接后面的 tab 行
                return null;
            }
            const it = item.tab;
            const tabIndex = flatIndex;
            flatIndex += 1;
            const audiable = (0, ISessionState_1.isAudibleParentTab)(this.props.sessionState.audibleSourceIds, it);
            return (react_1.default.createElement('div', {
                key: it.id,
                style: item.depth > 1 ? { paddingLeft: (item.depth - 1) * 12 + 'px' } : undefined,
            }, react_1.default.createElement(TabRow_1.default, { tab: it, tabGroup: group, group: group, selectedTabId: selectedTabId, index: tabIndex, sidebar: sidebar, audible: audiable, notificationsSetting: notificationsSetting, ...it })));
        });'''

ROW_MENU = '''            menu.append(deleteItem);
            menu.append(new MenuItem({ type: 'separator' }));
            // codexCustomSectionsV11: 移动到折叠小组（group 可能没被 props 带进来，先兜底解析）
            const codexSectionApi = window.__codexCustomSections;
            if (codexSectionApi) {
                let codexGroup = this.props.group || this.props.tabGroup;
                if (!codexGroup) {
                    try {
                        const codexState = Store_1.default.getState();
                        const codexGroups = (codexState.groupList && codexState.groupList.tabGroups) || [];
                        codexGroup = codexGroups.find((it) => it && (it.tabs || []).some((t) => t.id === tab.id)) || codexGroups[0];
                    }
                    catch (e) {
                        codexGroup = undefined;
                    }
                }
                try {
                    if (codexGroup) {
                        const sectionCtx = codexSectionApi.buildCustomSectionContext(codexGroup);
                        const sectionRoots = sectionCtx.children(null);
                        if (sectionRoots.length > 0) {
                            const sectionSubmenu = sectionRoots.map((section) => ({
                                label: section.name,
                                click: () => codexSectionApi.moveTabIntoSection(codexGroup, tab.id, section.id),
                            }));
                            menu.append(new MenuItem({ label: '移动到折叠小组', submenu: sectionSubmenu }));
                        }
                        const owner = sectionCtx.sections.find((section) => (section.tabIds || []).indexOf(tab.id) !== -1);
                        if (owner) {
                            menu.append(new MenuItem({
                                label: '移出折叠小组',
                                click: () => codexSectionApi.moveTabIntoSection(codexGroup, tab.id, null),
                            }));
                        }
                    }
                }
                catch (e) {
                    console.error('codexCustomSections row menu failed', e);
                }
            }'''

ROW_MENU_ANCHOR = '''            menu.append(deleteItem);
            menu.append(new MenuItem({ type: 'separator' }));'''

# 旧版（V10）注入块，升级时整段替换，避免重复插入
ROW_MENU_OLD_START = '''            // codexCustomSectionsV10: 移动到折叠小组
            const sectionApi = window.__codexCustomSections;'''
ROW_MENU_OLD_END = '''                if (owner) {
                    menu.append(new MenuItem({
                        label: '移出折叠小组',
                        click: () => sectionApi.moveTabIntoSection(this.props.group, tab.id, null),
                    }));
                }
            }'''

CACHE_MOD = './ts/main/MainIpcHandlers.ts'
CACHE_IPC = '''
    // codexCacheMenuV1: 硬刷新 / 清理本站数据（不删 cookie）
    electron_1.ipcMain.handle('codex-clear-cache', async (event, persistId, action, origin) => {
        if (typeof persistId !== 'string' || !persistId) {
            return false;
        }
        const main = getMain();
        if (!main || event.sender !== main.window.webContents || event.senderFrame !== event.sender.mainFrame) {
            return false;
        }
        const partition = 'persist:' + persistId;
        const ses = electron_1.session.fromPartition(partition);
        if (action === 'hardReload' || action === 'clearAndReload') {
            electron_1.webContents.getAllWebContents().forEach((wc) => {
                if (!wc.isDestroyed() && wc.session === ses && wc.getType() === 'webview') {
                    wc.reloadIgnoringCache();
                }
            });
        }
        if (action === 'clearSite' || action === 'clearAndReload') {
            await ses.clearCache();
            await ses.clearStorageData({
                storages: ['serviceworkers', 'cachestorage', 'shadercache', 'codecache'],
                origin: typeof origin === 'string' && origin ? origin : undefined,
            });
        }
        return true;
    });
'''

ROW_MENU_CACHE = '''
            // codexCacheMenuV1: 强制刷新 / 清理本站缓存
            try {
                const codexCacheTabGroup = (this.props.group || this.props.tabGroup || (function () {
                    try {
                        const st = Store_1.default.getState();
                        const gs = (st.groupList && st.groupList.tabGroups) || [];
                        return gs.find((it) => it && (it.tabs || []).some((t) => t.id === tab.id)) || gs[0];
                    }
                    catch (e) {
                        return undefined;
                    }
                })());
                const codexCacheUrl = (this.props.tab && this.props.tab.url) || (source && source.url);
                if (codexCacheTabGroup && codexCacheUrl) {
                    const codexPersistId = (0, ITabGroup_1.getPersistId)(codexCacheTabGroup, tab);
                    let codexOrigin;
                    try {
                        codexOrigin = new URL(codexCacheUrl).origin;
                    }
                    catch (e) {
                        codexOrigin = undefined;
                    }
                    menu.append(new MenuItem({ type: 'separator' }));
                    menu.append(new MenuItem({
                        label: '强制刷新（忽略缓存）',
                        click: () => electron_1.ipcRenderer.invoke('codex-clear-cache', codexPersistId, 'hardReload'),
                    }));
                    menu.append(new MenuItem({
                        label: '清理本站缓存并刷新',
                        click: () => electron_1.ipcRenderer.invoke('codex-clear-cache', codexPersistId, 'clearAndReload', codexOrigin),
                    }));
                }
            }
            catch (e) {
                console.error('codex cache menu failed', e);
            }'''

DRAG_WRAP = '''        this.onDragEndTabGroupAndTab = (result) => {
            const { source, destination } = result;
            const codexApi = window.__codexCustomSections;
            if (!destination) {
                this.draggedCustomTabId = null;
                return;
            }
            // codexCustomSectionsV13: 只有 TAB 拖到分组列表(组内行)时才按小组树落位；
            // TAB_GROUP 是分组自身在排序，必须交给 createMoveGroupAction。
            if (result.type === 'TAB' && destination.droppableId === 'tabGroup') {
                const dropTabId = destination.draggableId;
                const group = this.props.tabGroups.find((it) => it.tabs.some((tab) => tab.id === dropTabId));
                const draggedTabId = this.draggedCustomTabId;
                if (group && draggedTabId) {
                    if (codexApi && codexApi.moveTabToFlatIndex(group, draggedTabId, destination.index)) {
                        this.draggedCustomTabId = null;
                        this.forceUpdate();
                    }
                }
                return;
            }
            if (source.droppableId === destination.droppableId
                && source.index === destination.index) {
                this.draggedCustomTabId = null;
                return;
            }
            if (result.type === 'TAB_GROUP') {
                Store_1.default.dispatch((0, GroupActionCreators_1.createMoveGroupAction)(source.index, destination.index, Store_1.default));
            }
            else if (result.type === 'TAB') {
                const group = this.props.tabGroups.find((it) => it.id === destination.droppableId);
                const draggedTabId = this.draggedCustomTabId;
                if (group && draggedTabId) {
                    const belongs = group.tabs.some((tab) => tab.id === draggedTabId);
                    if (!belongs) {
                        // codexCustomSectionsV13: 跨分组拖动。先让原生 move action 把 tab 换到目标组，
                        // 再把落点位置记进目标组的小组树；否则 tab 会被留在原组。
                        let dropTarget = null;
                        try {
                            if (codexApi) {
                                dropTarget = codexApi.resolveFlatDropTarget(group, destination.index);
                            }
                        }
                        catch (e) {
                            dropTarget = null;
                        }
                        Store_1.default.dispatch((0, GroupActionCreators_1.createMoveTabAction)(source.droppableId, source.index, destination.droppableId, destination.index, Store_1.default));
                        if (codexApi && dropTarget && dropTarget.sectionId) {
                            codexApi.moveTabIntoSection(group, draggedTabId, dropTarget.sectionId, dropTarget.beforeTabId);
                        }
                        this.draggedCustomTabId = null;
                        this.forceUpdate();
                        return;
                    }
                    if (codexApi && codexApi.moveTabToFlatIndex(group, draggedTabId, destination.index)) {
                        this.draggedCustomTabId = null;
                        this.forceUpdate();
                        return;
                    }
                }
                Store_1.default.dispatch((0, GroupActionCreators_1.createMoveTabAction)(source.droppableId, source.index, destination.droppableId, destination.index, Store_1.default));
            }
            this.draggedCustomTabId = null;
        };
        this.onDragStartTab = (start) => {
            this.draggedCustomTabId = start && start.draggableId ? start.draggableId : null;
        };'''

def recipe_new(text):
    engine = (parts / 'sections_engine.js').read_text()
    MEM_SETTINGS_FN = (parts / 'memory_settings_item.js').read_text()

    # 1) 小组引擎插入 TabGroupRow 模块
    def add_engine(body):
        anchor = 'class TabGroupRow extends react_1.default.Component {'
        need(body, anchor, 'TabGroupRow 类声明')
        return body.replace(anchor, engine + '\n' + anchor, 1)
    if NEW_MARK not in text:
        text = edit_module(text, GROUP_MOD, add_engine, '小组引擎')

        # 2) TabGroupRow：扁平有序渲染 + 小组头部菜单
        def add_render(body):
            old_start = need(body, '        const tabs = group.tabs;', 'TabGroupRow 渲染头')
            old_end = body.index('        return (react_1.default.createElement(react_beautiful_dnd_1.Draggable, { type: "TAB_GROUP"', old_start)
            body = body[:old_start] + SECTION_RENDER + '\n' + body[old_end:]
            anchor = '        this.onClickMore = (e) => {'
            need(body, anchor, 'onClickMore')
            return body.replace(anchor, SECTION_HEADER_MENU + anchor, 1)
        text = edit_module(text, GROUP_MOD, add_render, '小组树渲染')

        # 2b) TabGroupRow 组右键菜单加「新建分组」
        def add_group_menu(body):
            return replace_once(body,
                """            menu.append(addAppItem);
            menu.append(new MenuItem({ type: 'separator' }));""",
                """            menu.append(addAppItem);
            menu.append(new remote.MenuItem({
                label: '新建分组',
                click: () => {
                    const sectionCtx = buildCustomSectionContext(this.props.group);
                    sectionCtx.createSection(null, false);
                    this.forceUpdate();
                },
            }));
            menu.append(new remote.MenuItem({
                label: '新建分组并收入未分组 App',
                click: () => {
                    const sectionCtx = buildCustomSectionContext(this.props.group);
                    sectionCtx.createSection(null, true);
                    this.forceUpdate();
                },
            }));
            menu.append(new MenuItem({ type: 'separator' }));""",
                'TabGroupRow addAppItem 锚点')
        text = edit_module(text, GROUP_MOD, add_group_menu, '组菜单新建分组')
    else:
        # 已打过旧版引擎：整段替换成本次脚本里的版本（V13 跨组拖拽）
        def swap_engine(body):
            start = need(body, '//#region codexCustomSectionsV10', '小组引擎起始')
            tail = '//#endregion codexCustomSectionsV10'
            end = body.index(tail, start) + len(tail)
            return body[:start] + engine.rstrip('\n') + body[end:]
        text = edit_module(text, GROUP_MOD, swap_engine, '小组引擎升级')

    # 2c) 内存优化程序：WebView 模块插入休眠引擎，并让 webview key 随 epoch 变化
    if 'codexMemorySaverV1' not in text:
        mem_engine = (parts / 'memory_saver_engine.js').read_text()

        def add_mem(body):
            anchor = 'class WebView extends react_1.default.Component {'
            need(body, anchor, 'WebView 类声明')
            body = body.replace(anchor, mem_engine + '\n' + anchor, 1)
            key_anchor = "        const webviewElementKey = source.id + '/' + persistId + '/' + attributes.preload;"
            return replace_once(body, key_anchor,
                "        const webviewElementKey = source.id + '/' + persistId + '/' + attributes.preload\n"
                "            + '/' + (typeof codexMemEpochOf === 'function' ? codexMemEpochOf(source.id, selected) : 0);",
                'webview key')
        text = edit_module(text, WEBVIEW_MOD, add_mem, '内存优化引擎')
    else:
        report.append("内存优化引擎: 已存在，跳过")

    # 2d) 设置 → 高级：内存优化器四档
    if 'codexMemoryListItem' not in text:
        def add_mem_settings(body):
            anchor = 'function AdvancedSettings() {'
            need(body, anchor, 'AdvancedSettings 函数')
            body = body.replace(anchor, MEM_SETTINGS_FN + anchor, 1)
            return replace_once(body,
                'react_1.default.createElement(HardwareAccelerationListItem, null)));',
                'react_1.default.createElement(HardwareAccelerationListItem, null),\n        react_1.default.createElement(codexMemoryListItem, null)));',
                'AdvancedSettings 内容')
        text = edit_module(text, ADV_MOD, add_mem_settings, '内存优化设置')
    else:
        report.append("内存优化设置: 已存在，跳过")

    # 2e) 设置 → 扩展：已解压扩展的安装 / 移除
    if 'codexExtensionListItem' not in text:
        EXT_SETTINGS_FN = (parts / 'extension_settings_item.js').read_text()

        def add_ext_settings(body):
            anchor = 'function ExtensionSettings(props) {'
            need(body, anchor, 'ExtensionSettings 函数')
            # 在原 settingGroup 的 div 里追加一个兄弟子元素，不需要改任何括号
            host = 'react_1.default.createElement("div", { className: classes.settingGroup },'
            replace_once(body, host, host + '\n        react_1.default.createElement(codexExtensionListItem, null),', 'ExtensionSettings 内容')
            return body.replace(anchor, EXT_SETTINGS_FN + '\n' + anchor, 1)
        text = edit_module(text, EXT_MOD, add_ext_settings, '扩展设置')
    else:
        report.append("扩展设置: 已存在，跳过")

    # 3) TabRow 右键菜单加「移动到折叠小组」
    if 'codexCacheMenuV1' in text:
        report.append("行菜单: 已存在，跳过")
    else:
        def add_row_menu(body):
            if 'codexCustomSectionsV11' in body:
                tail = ROW_MENU.rstrip('\n').split('\n')[-1]
                return replace_once(body, tail, tail + '\n' + ROW_MENU_CACHE, 'TabRow 缓存菜单锚点')
            if ROW_MENU_OLD_START in body:
                s = body.index(ROW_MENU_OLD_START)
                e = body.index(ROW_MENU_OLD_END, s) + len(ROW_MENU_OLD_END)
                line_start = body.rfind('\n', 0, s) + 1
                return body[:line_start] + ROW_MENU + '\n' + ROW_MENU_CACHE + body[e:]
            return replace_once(body, ROW_MENU_ANCHOR, ROW_MENU + '\n' + ROW_MENU_CACHE, 'TabRow deleteItem 锚点')
        text = edit_module(text, ROW_MOD, add_row_menu, '行菜单')



    # 4) Window.tsx：折叠把手 + 页脚隐藏 + 拖拽落位
    if 'ToggleSidebarButton' not in text:
        def add_toggle(body):
            i = body.find('const TabGroupList = ')
            if i < 0:
                die('Window.tsx 里找不到 TabGroupList 样式锚点')
            line_start = body.rfind('\n', 0, i) + 1
            body = body[:line_start] + TOGGLE_STYLE + '\n' + body[line_start:]
            return replace_once(body,
                'react_1.default.createElement(SidebarSeparator_1.SidebarSeparator, { sidebar: sidebar, preferredWidth: preferredSidebar.width }),',
                TOGGLE_VIEW, 'SidebarSeparator 渲染锚点')
        text = edit_module(text, WIN_MOD, add_toggle, '折叠把手')
    else:
        report.append("折叠把手: 已存在，跳过")

    if 'codexHideSidebarFooterV1' not in text:
        def hide_footer(body):
            footer = """                            groupListElems,
                            provided.placeholder)))),
                    react_1.default.createElement(AddTabGroup_1.AddTabGroup, { name: "", sidebar: sidebar }),
                    react_1.default.createElement(NotificationButton_1.NotificationButton, { sidebar: sidebar, settings: settings }),
                    react_1.default.createElement(SupportButton_1.SupportButton, { sidebar: sidebar }),"""
            return replace_once(body, footer, """                            groupListElems,
                            provided.placeholder)))),
                    react_1.default.createElement(AddTabGroup_1.AddTabGroup, { name: "", sidebar: sidebar }),
                    null, // codexHideSidebarFooterV1: hide Notification / Donate footer controls.
                    null,""", '页脚三件套')
        text = edit_module(text, WIN_MOD, hide_footer, '页脚隐藏')
    else:
        report.append("页脚隐藏: 已存在，跳过")

    # V12/V13：分组排序曾被旧分支吞掉，跨组拖拽也被告成了组内排序——已打过旧版的包原地替换
    if 'codexCustomSectionsV13: 只有 TAB 拖到分组列表' not in text:
        def add_drag(body):
            start = need(body, '        this.onDragEndTabGroupAndTab = (result) => {', 'onDragEndTabGroupAndTab')
            end = body.index('        this.onDragEndChildTab = (result) => {', start)
            return body[:start] + DRAG_WRAP + '\n' + body[end:]
        text = edit_module(text, WIN_MOD, add_drag, '拖拽落位')

        def add_drag_start(body):
            if 'onDragStart: this.onDragStartTab, onDragEnd: this.onDragEndTabGroupAndTab' in body:
                return body
            return replace_once(body,
                'react_1.default.createElement(react_beautiful_dnd_1.DragDropContext, { onDragEnd: this.onDragEndTabGroupAndTab },',
                'react_1.default.createElement(react_beautiful_dnd_1.DragDropContext, { onDragStart: this.onDragStartTab, onDragEnd: this.onDragEndTabGroupAndTab },',
                'DragDropContext 锚点')
        text = edit_module(text, WIN_MOD, add_drag_start, '拖拽开始')
    else:
        report.append("拖拽落位: 已存在，跳过")

    return text

# ==================== 旧配方（2.1.x）====================
def recipe_legacy(text):
    engine = (parts / 'sections_engine.js').read_text()

    def swap(body):
        return engine + '\n' + body
    # 自定义小组引擎：整模块替换（2.1.1 手工版）
    for mod, part, label in [
        (GROUP_MOD, 'TabGroupRow.module.js', '自定义小组-树'),
        (ROW_MOD, 'TabRow.module.js', '自定义小组-行'),
    ]:
        f = parts / part
        if not f.is_file():
            die(f"2.1.x 配方需要素材 {part}，但文件不存在；请用 2.2.x 版本或补齐素材")
        b, e = module_body(text, mod)
        text = text[:b] + f.read_text() + text[e:]
        report.append(f"{label}: 整模块替换 {mod}")

    # 折叠把手（2.1.1 的 SidebarSeparator 结构）
    b, e = module_body(text, SIDE_MOD)
    body = text[b:e]
    btn_style = TOGGLE_STYLE.replace('// codexSidebarToggleV1', '')
    body = replace_once(body, 'class MouseState {', btn_style + '\nclass MouseState {', 'ToggleSidebarButton 样式')
    body = replace_once(body,
        "this.state = {\n            mouseState: new NormalMouseState(this),",
        "this.onToggleSidebar = () => {\n            Store_1.default.dispatch((0, GroupActionCreators_1.createToggleSidebarAction)(Store_1.default));\n        };\n        this.state = {\n            mouseState: new NormalMouseState(this),",
        'mouseState 初始化')
    body = replace_once(body,
        "left: ${(p) => `${p.x - 3}px`};",
        "left: ${(p) => p.mouseState instanceof NormalMouseState\n    && (p.sidebar.visible === false || p.sidebar.width === 0) ? '0px' : `${p.x - 3}px`};",
        'Separator left')
    body = replace_once(body, """    render() {
        const { sidebar } = this.props;
        return (react_1.default.createElement(Container, null,""", """    render() {
        const { sidebar } = this.props;
        const isSidebarExpanded = sidebar.visible !== false && sidebar.width > 0;
        return (react_1.default.createElement(Container, null,
            react_1.default.createElement(ToggleSidebarButton, { x: this.state.x, sidebar: sidebar, type: "button", onClick: this.onToggleSidebar, title: isSidebarExpanded ? '折叠左侧栏' : '展开左侧栏', "aria-label": isSidebarExpanded ? '折叠左侧栏' : '展开左侧栏' }, isSidebarExpanded ? '<' : '>'),""", 'SidebarSeparator.render')
    text = text[:b] + body + text[e:]
    report.append(f"折叠把手: 注入 {SIDE_MOD}")

    # 页脚隐藏
    b, e = module_body(text, WIN_MOD)
    body = text[b:e]
    footer = """                            groupListElems,
                            provided.placeholder)))),
                    react_1.default.createElement(AddTabGroup_1.AddTabGroup, { name: "", sidebar: sidebar }),
                    null, // codexHideSidebarFooterV1: hide Notification / Donate footer controls.
                    null,"""
    body = replace_once(body, footer, """                            groupListElems,
                            provided.placeholder)))),
                    null, // codexHideSidebarFooterV1: hide Add Group / Notification / Donate footer controls.
                    null,
                    null,""", '页脚三件套')
    text = text[:b] + body + text[e:]
    report.append(f"页脚隐藏: 注入 {WIN_MOD}")
    return text

# ==================== 分流 ====================
main_done = (main_src is None
             or ("ipcMain.handle('codex-clear-cache'" in main_src
                 and 'codexExtensionsV1: 扩展加载器' in main_src))
if (NEW_MARK in src and 'ToggleSidebarButton' in src and 'codexHideSidebarFooterV1' in src
        and main_done and 'codexCustomSectionsV13: 只有 TAB 拖到分组列表' in src
        and 'codexExtensionListItem' in src):
    print("补丁已全部在位，无需重复注入。")
    sys.exit(0)

if is_new_layout(src):
    print("  识别为 2.2.x 起的新结构，使用追加式配方")
    src = recipe_new(src)
else:
    print("  识别为 2.1.x 旧结构，使用整模块配方")
    if LEGACY_MARK in src:
        print("补丁已在位，无需重复注入。")
        sys.exit(0)
    src = recipe_legacy(src)

# 3b) 主进程（main.js）：硬刷新 / 清理本站缓存 IPC
if main_src is not None:
    if "ipcMain.handle('codex-clear-cache'" in main_src:
        report.append("缓存菜单 IPC: 已存在，跳过")
    else:
        a = "    electron_1.ipcMain.on('close-window'"
        if main_src.count(a) != 1:
            die('main.js 里找不到唯一 close-window 锚点')
        main_src = main_src.replace(a, CACHE_IPC + a, 1)
        report.append(f"缓存菜单 IPC: {CACHE_MOD}")

# 3c) 主进程：扩展加载器
if main_src is not None and 'codexExtensionsV1: 扩展加载器' not in main_src:
    EXT_LOADER = (parts / 'extension_loader_main.js').read_text()
    a = "    electron_1.ipcMain.on('close-window'"
    if main_src.count(a) != 1:
        die('main.js 里找不到唯一 close-window 锚点（扩展加载器）')
    main_src = main_src.replace(a, EXT_LOADER + a, 1)
    report.append("扩展加载器: main.js")
elif main_src is not None:
    report.append("扩展加载器: 已存在，跳过")

for line in report:
    print("  - " + line)

if mode == "--dry-run":
    print("\n[dry-run] 所有锚点匹配成功，未写入。")
    sys.exit(0)

idx_path.write_text(src)
if main_src is not None:
    main_path.write_text(main_src)
print(f"\n写入完成: {orig_len} -> {len(src)} 字节")
PYEOF

if [ "$MODE" = "--dry-run" ]; then
  exit 0
fi

if command -v node >/dev/null 2>&1; then
  echo "语法检查 ..."
  node --check "$IDX" >/dev/null || { echo "语法错误，放弃回包" >&2; exit 1; }
  if [ -f "$MAIN" ]; then
    node --check "$MAIN" >/dev/null || { echo "main.js 语法错误，放弃回包" >&2; exit 1; }
  fi
fi

if [ -n "$OUT" ]; then
  # 只输出补丁包，不写安装目录（安装目录被 macOS App 管理保护时用）
  case "$OUT" in
    */*) OUT_DIR="${OUT%/*}"; OUT_NAME="${OUT##*/}" ;;
    *)   OUT_DIR="."; OUT_NAME="$OUT" ;;
  esac
  echo "生成补丁包 -> $OUT"
  npx --yes @electron/asar pack "$WORK/app" "$OUT" >/dev/null
  echo
  echo "完成。请用管理员权限写回安装目录，然后重启 Biscuit："
  echo "  sudo cp \"$OUT\" \"$ASAR\""
  echo "回滚: 用升级包原始 app.asar 覆盖回去即可（脚本未改动原文件）"
  exit 0
fi

BACKUP="$APP/Contents/Resources/app.asar.backup-before-repatch-$(date +%Y%m%d%H%M%S)"
cp "$ASAR" "$BACKUP"
echo "原包已备份: $(basename "$BACKUP")"

echo "回包 app.asar ..."
npx --yes @electron/asar pack "$WORK/app" "$ASAR" >/dev/null

echo
echo "完成。重启 Biscuit 生效。"
echo "回滚: cp \"$APP/Contents/Resources/$(basename "$BACKUP")\" \"$ASAR\""
