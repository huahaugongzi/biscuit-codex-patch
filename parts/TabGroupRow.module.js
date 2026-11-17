/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const remote = __importStar(__webpack_require__(/*! @electron/remote */ "./node_modules/@electron/remote/renderer/index.js"));
const react_1 = __importDefault(__webpack_require__(/*! react */ "./node_modules/react/index.js"));
const react_beautiful_dnd_1 = __webpack_require__(/*! react-beautiful-dnd */ "./node_modules/react-beautiful-dnd/dist/react-beautiful-dnd.esm.js");
const lucide_react_1 = __webpack_require__(/*! lucide-react */ "./node_modules/lucide-react/dist/cjs/lucide-react.js");
const styled_components_1 = __importDefault(__webpack_require__(/*! styled-components */ "./node_modules/styled-components/dist/styled-components.browser.esm.js"));
const GroupActionCreators_1 = __webpack_require__(/*! ../actions/GroupActionCreators */ "./ts/renderer/actions/GroupActionCreators.ts");
const i18n_1 = __importDefault(__webpack_require__(/*! ../i18n */ "./ts/renderer/i18n/index.ts"));
const ISessionState_1 = __webpack_require__(/*! ../states/ISessionState */ "./ts/renderer/states/ISessionState.ts");
const ISidebar_1 = __webpack_require__(/*! ../states/ISidebar */ "./ts/renderer/states/ISidebar.ts");
const Store_1 = __importDefault(__webpack_require__(/*! ../Store */ "./ts/renderer/Store.ts"));
const PostMessageActions_1 = __webpack_require__(/*! ../utils/PostMessageActions */ "./ts/renderer/utils/PostMessageActions.ts");
const EditTabGroupDialog_1 = __webpack_require__(/*! ./EditTabGroupDialog */ "./ts/renderer/components/EditTabGroupDialog.tsx");
const TabRow_1 = __importDefault(__webpack_require__(/*! ./TabRow */ "./ts/renderer/components/TabRow.tsx"));
const msg = i18n_1.default.get().app;
//#region styled
const Container = styled_components_1.default.li `
    padding: 5px 0px 15px 10px;
    -webkit-app-region: ${(p) => p.isCursorOnSideberTop ? 'drag' : 'none'};
`;
const MoreButton = styled_components_1.default.div `
    flex: 0;
    display: none;
    margin-right: ${(p) => p.sidebar.width <= ISidebar_1.sidebarMinWidth ? '0px' : '10px'};
    color: var(--chrome-top-tab-icon);
    & > svg {
        display: block;
    }
`;
const TabGroupBodyWrapper = styled_components_1.default.div `
    outline: none;
`;
const TabGroupBody = styled_components_1.default.div `
    display: flex;
    align-items: center;
    cursor: pointer;
    min-height: 18px;
    &:hover ${MoreButton} {
        display: block;
    }
`;
const TabGroupName = styled_components_1.default.div `
    flex: 1;
    font-size: ${(p) => p.sidebar.width <= ISidebar_1.sidebarMinWidth ? '9px' : '13px'};
    font-weight: 500;
    line-height: 18px;
    overflow: hidden;
    white-space: nowrap;
`;
const CountOfTabs = styled_components_1.default.span `
    display: ${(p) => !p.opened ? 'inline' : 'none'};
`;
const TabList = styled_components_1.default.ul `
    margin-top: 1em;
    margin-left: 0;
    padding-left: 0;
    padding-right: 10px;
    list-style: none;
    display: ${(p) => p.opened ? 'block' : 'none'};
`;
const CustomSectionHeader = styled_components_1.default.li `
    box-sizing: border-box;
    display: flex;
    align-items: center;
    min-height: 22px;
    margin: 7px 0 3px 4px;
    padding: 3px 7px;
    color: color-mix(in srgb, var(--chrome-tab-text) 62%, transparent);
    background: color-mix(in srgb, var(--chrome-tab-text) 5%, transparent);
    border: 1px solid color-mix(in srgb, var(--chrome-tab-text) 9%, transparent);
    border-radius: 8px;
    font-size: 11px;
    font-weight: 600;
    line-height: 14px;
    cursor: pointer;
    user-select: none;
    -webkit-app-region: none;
    &:hover {
        color: color-mix(in srgb, var(--chrome-tab-text) 82%, transparent);
        background: color-mix(in srgb, var(--chrome-tab-text) 9%, transparent);
    }
`;
const CustomSectionArrow = styled_components_1.default.span `
    width: 14px;
    flex: 0 0 14px;
    opacity: 0.72;
`;
const CustomSectionName = styled_components_1.default.span `
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
`;
const CustomSectionCount = styled_components_1.default.span `
    flex: 0;
    margin-left: 6px;
    opacity: 0.56;
`;
const CUSTOM_SECTION_STORAGE_KEY = 'biscuitCustomSectionsV1';
const CUSTOM_SECTION_PATCH_VERSION = 'biscuitCustomSectionsV2';
const CUSTOM_SECTION_PROMPTLESS_CREATE = 'biscuitCustomSectionsV3';
const CUSTOM_SECTION_INLINE_RENAME = 'biscuitCustomSectionsV4';
const CUSTOM_SECTION_BULK_MOVE = 'biscuitCustomSectionsV5';
const CUSTOM_SECTION_TREE = 'biscuitCustomSectionsV6';
const CUSTOM_SECTION_DRAG_DROP = 'biscuitCustomSectionsV7DragDrop';
const CUSTOM_SECTION_MOVE_FIX = 'biscuitCustomSectionsV8MoveFix';
const CUSTOM_SECTION_SORT_FIX = 'biscuitCustomSectionsV9SortFix';
const loadCustomSectionState = () => {
    try {
        const raw = window.localStorage.getItem(CUSTOM_SECTION_STORAGE_KEY);
        if (!raw) {
            return { groups: {} };
        }
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || !parsed.groups || typeof parsed.groups !== "object") {
            return { groups: {} };
        }
        return parsed;
    }
    catch (e) {
        return { groups: {} };
    }
};
const saveCustomSectionState = (state) => {
    try {
        window.localStorage.setItem(CUSTOM_SECTION_STORAGE_KEY, JSON.stringify(state));
    }
    catch (e) {
        /* ignore */
    }
};
const getCustomGroupState = (state, groupId) => {
    if (!state.groups) {
        state.groups = {};
    }
    if (!state.groups[groupId]) {
        state.groups[groupId] = { sections: [] };
    }
    if (!Array.isArray(state.groups[groupId].sections)) {
        state.groups[groupId].sections = [];
    }
    return state.groups[groupId];
};
const normalizeCustomGroupState = (state, group) => {
    const groupState = getCustomGroupState(state, group.id);
    const validTabIds = new Set(group.tabs.map((tab) => tab.id));
    const usedTabIds = new Set();
    let changed = false;
    groupState.sections = groupState.sections.filter((section) => {
        if (!section || typeof section !== "object") {
            changed = true;
            return false;
        }
        if (!section.id) {
            section.id = `section_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            changed = true;
        }
        if (!section.name) {
            section.name = "未命名";
            changed = true;
        }
        if (!Array.isArray(section.tabIds)) {
            section.tabIds = [];
            changed = true;
        }
        const nextTabIds = [];
        section.tabIds.forEach((tabId) => {
            if (validTabIds.has(tabId) && !usedTabIds.has(tabId)) {
                usedTabIds.add(tabId);
                nextTabIds.push(tabId);
            }
            else {
                changed = true;
            }
        });
        if (nextTabIds.length !== section.tabIds.length) {
            section.tabIds = nextTabIds;
            changed = true;
        }
        section.opened = section.opened !== false;
        return true;
    });
    if (changed) {
        saveCustomSectionState(state);
    }
    return groupState;
};
const assignTabToCustomSection = (groupId, tabId, sectionId) => {
    const state = loadCustomSectionState();
    const groupState = getCustomGroupState(state, groupId);
    groupState.sections.forEach((section) => {
        section.tabIds = (section.tabIds || []).filter((id) => id !== tabId);
    });
    if (sectionId) {
        const section = groupState.sections.find((it) => it.id === sectionId);
        if (section) {
            section.tabIds = section.tabIds || [];
            section.tabIds.push(tabId);
            section.opened = true;
        }
    }
    saveCustomSectionState(state);
};
var Mode;
(function (Mode) {
    Mode[Mode["Normal"] = 0] = "Normal";
    Mode[Mode["Editing"] = 1] = "Editing";
})(Mode || (Mode = {}));
const defaultState = {
    mode: Mode.Normal,
    tabGroupName: '',
    renamingCustomSectionId: null,
    renamingCustomSectionName: '',
};
class TabGroupRow extends react_1.default.Component {
    constructor(props) {
        super(props);
        this.showMoreMenu = () => {
            const { group } = this.props;
            const { Menu, MenuItem } = remote;
            const menu = new Menu();
            const addAppItem = new MenuItem({
                click: this.addApp,
                label: msg.addApp,
            });
            const addCustomSectionItem = new MenuItem({
                click: () => this.addCustomSection(false),
                label: "添加子文件夹",
            });
            const addCustomSectionWithUngroupedItem = new MenuItem({
                click: () => this.addCustomSection(true),
                label: "添加子文件夹并放入未分组App",
            });
            const expandCustomSectionsItem = new MenuItem({
                click: () => this.setAllCustomSectionsOpened(true),
                label: "展开全部小组",
            });
            const collapseCustomSectionsItem = new MenuItem({
                click: () => this.setAllCustomSectionsOpened(false),
                label: "收起全部小组",
            });
            const renameItem = new MenuItem({
                click: this.showEditTabGroupDialog,
                label: msg.renameGroup,
            });
            const deleteItem = new MenuItem({
                click: this.deleteTabGroup,
                label: msg.deleteGroup,
            });
            const toggleSharedItem = new MenuItem({
                click: this.toggleShared,
                label: group.shared ? msg.sharedSession.disableSharedSession : msg.sharedSession.enableSharedSession,
            });
            menu.append(addAppItem);
            menu.append(addCustomSectionItem);
            menu.append(addCustomSectionWithUngroupedItem);
            menu.append(expandCustomSectionsItem);
            menu.append(collapseCustomSectionsItem);
            menu.append(new MenuItem({ type: 'separator' }));
            menu.append(renameItem);
            menu.append(deleteItem);
            menu.append(new MenuItem({ type: 'separator' }));
            menu.append(toggleSharedItem);
            menu.popup({});
        };
        this.addApp = () => {
            const { group } = this.props;
            const actionMessage = {
                tabGroupId: group.id,
                type: PostMessageActions_1.SHOW_ADD_APP,
            };
            window.postMessage(actionMessage, '*');
        };
        this.addCustomSection = (moveUngrouped = false) => {
            const { group } = this.props;
            const state = loadCustomSectionState();
            const groupState = getCustomGroupState(state, group.id);
            const existingNames = new Set(groupState.sections.map((section) => section.name));
            let name = "新小组";
            let nameIndex = 2;
            while (existingNames.has(name)) {
                name = `新小组 ${nameIndex}`;
                nameIndex += 1;
            }
            const section = {
                id: `section_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                name,
                opened: true,
                tabIds: [],
            };
            if (moveUngrouped) {
                const usedTabIds = new Set();
                groupState.sections.forEach((it) => (it.tabIds || []).forEach((tabId) => usedTabIds.add(tabId)));
                section.tabIds = group.tabs.filter((tab) => !usedTabIds.has(tab.id)).map((tab) => tab.id);
            }
            groupState.sections.push(section);
            saveCustomSectionState(state);
            this.forceUpdate();
        };
        this.setAllCustomSectionsOpened = (opened) => {
            const { group } = this.props;
            const state = loadCustomSectionState();
            const groupState = getCustomGroupState(state, group.id);
            groupState.sections.forEach((section) => {
                section.opened = opened;
            });
            saveCustomSectionState(state);
            this.forceUpdate();
        };
        this.deleteTabGroup = () => {
            const { group } = this.props;
            const ok = confirm(msg.deleteGroupConfirmMessage);
            if (ok) {
                Store_1.default.dispatch((0, GroupActionCreators_1.createDeleteGroupAction)(group.id, Store_1.default));
            }
        };
        this.showEditTabGroupDialog = () => {
            this.setState({
                mode: Mode.Editing,
            });
        };
        this.hideEditTabGroupDialog = () => {
            this.setState({
                mode: Mode.Normal,
            });
        };
        this.toggleShared = () => {
            const { group } = this.props;
            const { BrowserWindow } = remote;
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (!focusedWindow) {
                return;
            }
            const message = group.shared ? msg.sharedSession.cofirmDisable : msg.sharedSession.cofirmEnable;
            const ok = confirm(message);
            if (ok) {
                group.shared = !group.shared;
                Store_1.default.dispatch((0, GroupActionCreators_1.createUpdateGroupAction)(group, Store_1.default));
                focusedWindow.reload();
            }
        };
        this.onClickMore = (e) => {
            this.showMoreMenu();
            e.stopPropagation();
        };
        this.onContextMenu = (e) => {
            this.showMoreMenu();
            // need preventDefault for Windows
            e.preventDefault();
        };
        this.onClickToggle = (e) => {
            const { group } = this.props;
            Store_1.default.dispatch((0, GroupActionCreators_1.createToggleGroupAction)(group.id, Store_1.default));
            e.stopPropagation();
        };
        this.onClose = () => {
            this.hideEditTabGroupDialog();
        };
        this.state = defaultState;
    }
    componentDidUpdate(prevProps, prevState) {
        if (prevState.mode === Mode.Normal && this.state.mode === Mode.Editing) {
            if (this.textInput) {
                this.textInput.focus();
                this.textInput.select();
            }
        }
    }
    componentDidCatch(error, errorInfo) {
        // When unmounted, catch error from VelocityTransitionGroup component
    }
    render() {
        const { group, selectedTabId, index, sidebar, notificationsSetting, isCursorOnSideberTop } = this.props;
        const tabs = group.tabs;
        const customSectionState = loadCustomSectionState();
        const customGroupState = normalizeCustomGroupState(customSectionState, group);
        const customSections = customGroupState.sections;
        const hasCustomSections = customSections.length > 0;
        const tabIndexById = new Map();
        tabs.forEach((tab, tabIndex) => tabIndexById.set(tab.id, tabIndex));
        const sectionById = new Map();
        customSections.forEach((section) => sectionById.set(section.id, section));
        let customTreeChanged = false;
        customSections.forEach((section) => {
            if (typeof section.parentId === "undefined") {
                section.parentId = null;
                customTreeChanged = true;
            }
            if (section.parentId && !sectionById.has(section.parentId)) {
                section.parentId = null;
                customTreeChanged = true;
            }
            if (section.parentId === section.id) {
                section.parentId = null;
                customTreeChanged = true;
            }
        });
        if (customTreeChanged) {
            saveCustomSectionState(customSectionState);
        }
        const sectionsByParentId = new Map();
        customSections.forEach((section) => {
            const parentId = section.parentId || "__root__";
            if (!sectionsByParentId.has(parentId)) {
                sectionsByParentId.set(parentId, []);
            }
            sectionsByParentId.get(parentId).push(section);
        });
        const getChildSections = (section) => sectionsByParentId.get(section ? section.id : "__root__") || [];
        const getSectionDepth = (section) => {
            let depth = 0;
            let current = section;
            const guard = new Set();
            while (current && current.parentId && sectionById.has(current.parentId) && !guard.has(current.parentId)) {
                guard.add(current.parentId);
                depth += 1;
                current = sectionById.get(current.parentId);
            }
            return depth;
        };
        const getSectionPath = (section) => {
            const names = [];
            let current = section;
            const guard = new Set();
            while (current && !guard.has(current.id)) {
                guard.add(current.id);
                names.unshift(current.name);
                current = current.parentId ? sectionById.get(current.parentId) : undefined;
            }
            return names.join(" / ");
        };
        const getDescendantSections = (section) => {
            const result = [];
            const visit = (parent) => {
                getChildSections(parent).forEach((child) => {
                    result.push(child);
                    visit(child);
                });
            };
            visit(section);
            return result;
        };
        const getSectionTabIdsDeep = (section) => {
            const ids = new Set(section.tabIds || []);
            getDescendantSections(section).forEach((child) => (child.tabIds || []).forEach((tabId) => ids.add(tabId)));
            return Array.from(ids);
        };
        const sectionContainsSelectedTab = (section) => getSectionTabIdsDeep(section).indexOf(selectedTabId) !== -1;
        const moveTabToSectionInCurrentState = (tabId, targetSection) => {
            customSections.forEach((section) => {
                section.tabIds = (section.tabIds || []).filter((id) => id !== tabId);
            });
            if (targetSection) {
                targetSection.tabIds = targetSection.tabIds || [];
                if (targetSection.tabIds.indexOf(tabId) === -1) {
                    targetSection.tabIds.push(tabId);
                }
                let openSection = targetSection;
                while (openSection) {
                    openSection.opened = true;
                    openSection = openSection.parentId ? sectionById.get(openSection.parentId) : undefined;
                }
            }
            saveCustomSectionState(customSectionState);
        };
        const findSectionContainingTab = (tabId) => customSections.find((section) => (section.tabIds || []).indexOf(tabId) !== -1);
        const moveTabBeforeInCurrentState = (draggedTabId, targetTabId, targetSection) => {
            if (!draggedTabId || !targetTabId || draggedTabId === targetTabId || !targetSection) {
                return false;
            }
            customSections.forEach((section) => {
                section.tabIds = (section.tabIds || []).filter((id) => id !== draggedTabId);
            });
            targetSection.tabIds = targetSection.tabIds || [];
            const targetIndex = targetSection.tabIds.indexOf(targetTabId);
            if (targetIndex < 0) {
                targetSection.tabIds.push(draggedTabId);
            }
            else {
                targetSection.tabIds.splice(targetIndex, 0, draggedTabId);
            }
            let openSection = targetSection;
            while (openSection) {
                openSection.opened = true;
                openSection = openSection.parentId ? sectionById.get(openSection.parentId) : undefined;
            }
            saveCustomSectionState(customSectionState);
            return true;
        };
        const buildFlatSectionMenu = (tab, excludeSection) => customSections
            .filter((section) => !excludeSection || (section.id !== excludeSection.id && getDescendantSections(excludeSection).every((child) => child.id !== section.id)))
            .map((section) => ({
                label: `${(section.tabIds || []).indexOf(tab.id) !== -1 ? "✓ " : ""}${getSectionPath(section)}`,
                click: () => {
                    moveTabToSectionInCurrentState(tab.id, section);
                    this.forceUpdate();
                    window.setTimeout(() => window.location.reload(), 0);
                },
            }));
        const buildSectionMenuItems = (tab) => {
            if (!hasCustomSections) {
                return undefined;
            }
            return [
                {
                    label: "未分组",
                    click: () => {
                        moveTabToSectionInCurrentState(tab.id, undefined);
                        this.forceUpdate();
                        window.setTimeout(() => window.location.reload(), 0);
                    },
                },
                { type: "separator" },
                ...buildFlatSectionMenu(tab),
            ];
        };
        const createTabRow = (it, dragDisabled, depth = 0, rowSection = undefined) => {
            const tabIndex = tabIndexById.get(it.id);
            const audiable = (0, ISessionState_1.isAudibleParentTab)(this.props.sessionState.audibleSourceIds, it);
            const row = react_1.default.createElement(TabRow_1.default, { key: it.id, tab: it, selectedTabId: selectedTabId, index: tabIndex, sidebar: sidebar, audible: audiable, notificationsSetting: notificationsSetting, dragDisabled: dragDisabled, sectionMenuItems: buildSectionMenuItems(it), ...it });
            const onNativeDragStart = hasCustomSections ? ((e) => {
                try {
                    e.dataTransfer.setData("application/x-biscuit-tab-id", it.id);
                    e.dataTransfer.effectAllowed = "move";
                }
                catch (err) {
                    /* ignore */
                }
            }) : undefined;
            const onNativeDragOver = hasCustomSections ? ((e) => {
                if (e.dataTransfer) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                }
            }) : undefined;
            const onNativeDrop = hasCustomSections ? ((e) => {
                const draggedTabId = e.dataTransfer ? e.dataTransfer.getData("application/x-biscuit-tab-id") : "";
                if (!draggedTabId || draggedTabId === it.id) {
                    return;
                }
                const targetSection = rowSection || findSectionContainingTab(it.id);
                if (moveTabBeforeInCurrentState(draggedTabId, it.id, targetSection)) {
                    this.forceUpdate();
                    e.preventDefault();
                    e.stopPropagation();
                }
            }) : undefined;
            return react_1.default.createElement("div", { key: `section_tab_${it.id}_${depth}`, draggable: hasCustomSections, onDragStart: onNativeDragStart, onDragOver: onNativeDragOver, onDrop: onNativeDrop, style: { paddingLeft: `${depth * 14}px`, cursor: hasCustomSections ? "grab" : undefined } }, row);
        };
        const createCustomSection = (parentSection, moveUngrouped = false) => {
            const existingNames = new Set(customSections.filter((section) => (section.parentId || null) === (parentSection ? parentSection.id : null)).map((section) => section.name));
            let name = parentSection ? "新子文件夹" : "新小组";
            let nameIndex = 2;
            while (existingNames.has(name)) {
                name = `${parentSection ? "新子文件夹" : "新小组"} ${nameIndex}`;
                nameIndex += 1;
            }
            const section = {
                id: `section_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                name,
                opened: true,
                parentId: parentSection ? parentSection.id : null,
                tabIds: [],
            };
            if (parentSection) {
                parentSection.opened = true;
            }
            if (moveUngrouped) {
                const usedTabIds = new Set();
                customSections.forEach((it) => (it.tabIds || []).forEach((tabId) => usedTabIds.add(tabId)));
                section.tabIds = group.tabs.filter((tab) => !usedTabIds.has(tab.id)).map((tab) => tab.id);
            }
            customGroupState.sections.push(section);
            sectionById.set(section.id, section);
            const parentKey = section.parentId || "__root__";
            if (!sectionsByParentId.has(parentKey)) {
                sectionsByParentId.set(parentKey, []);
            }
            sectionsByParentId.get(parentKey).push(section);
            saveCustomSectionState(customSectionState);
            this.forceUpdate();
        };
        const createSectionHeader = (section, count, opened, depth, extraTitle) => {
            const onClick = (e) => {
                if (section) {
                    section.opened = !section.opened;
                    saveCustomSectionState(customSectionState);
                    this.forceUpdate();
                }
                e.stopPropagation();
            };
            const onContextMenu = (e) => {
                if (!section) {
                    return;
                }
                const { Menu, MenuItem } = remote;
                const menu = new Menu();
                menu.append(new MenuItem({
                    label: depth === 0 ? "添加折叠小组" : "添加子文件夹",
                    click: () => createCustomSection(section, false),
                }));
                menu.append(new MenuItem({
                    label: "把未分组App放入这里",
                    click: () => {
                        const usedTabIds = new Set();
                        customSections.forEach((it) => (it.tabIds || []).forEach((tabId) => usedTabIds.add(tabId)));
                        section.tabIds = tabs.filter((tab) => !usedTabIds.has(tab.id)).map((tab) => tab.id);
                        section.opened = true;
                        saveCustomSectionState(customSectionState);
                        this.forceUpdate();
                    },
                }));
                menu.append(new MenuItem({
                    label: "把本文件夹App移到未分组",
                    enabled: getSectionTabIdsDeep(section).length > 0,
                    click: () => {
                        section.tabIds = [];
                        getDescendantSections(section).forEach((child) => { child.tabIds = []; });
                        saveCustomSectionState(customSectionState);
                        this.forceUpdate();
                    },
                }));
                menu.append(new MenuItem({
                    label: "移动本文件夹全部App到",
                    enabled: customSections.length > 1 && getSectionTabIdsDeep(section).length > 0,
                    submenu: customSections.filter((target) => target.id !== section.id && getDescendantSections(section).every((child) => child.id !== target.id)).map((target) => ({
                        label: getSectionPath(target),
                        click: () => {
                            const targetTabIds = new Set(target.tabIds || []);
                            getSectionTabIdsDeep(section).forEach((tabId) => targetTabIds.add(tabId));
                            target.tabIds = Array.from(targetTabIds);
                            target.opened = true;
                            section.tabIds = [];
                            getDescendantSections(section).forEach((child) => { child.tabIds = []; });
                            saveCustomSectionState(customSectionState);
                            this.forceUpdate();
                        },
                    })),
                }));
                menu.append(new MenuItem({ type: "separator" }));
                menu.append(new MenuItem({
                    label: "重命名文件夹",
                    click: () => {
                        this.setState({
                            renamingCustomSectionId: section.id,
                            renamingCustomSectionName: section.name,
                        });
                    },
                }));
                menu.append(new MenuItem({
                    label: "删除文件夹",
                    click: () => {
                        if (!window.confirm("删除这个文件夹？里面的 App 不会删除，会回到未分组。子文件夹也会一起删除。")) {
                            return;
                        }
                        const removeIds = new Set([section.id, ...getDescendantSections(section).map((child) => child.id)]);
                        customGroupState.sections = customGroupState.sections.filter((it) => !removeIds.has(it.id));
                        saveCustomSectionState(customSectionState);
                        this.forceUpdate();
                    },
                }));
                menu.popup({});
                e.preventDefault();
                e.stopPropagation();
            };
            const isRenaming = !!(section && this.state.renamingCustomSectionId === section.id);
            const saveRenamingCustomSection = () => {
                if (!section) {
                    return;
                }
                const name = (this.state.renamingCustomSectionName || "").trim();
                if (name) {
                    section.name = name;
                    saveCustomSectionState(customSectionState);
                }
                this.setState({ renamingCustomSectionId: null, renamingCustomSectionName: "" });
            };
            const renameInput = isRenaming ? react_1.default.createElement("input", {
                autoFocus: true,
                value: this.state.renamingCustomSectionName,
                onClick: (e) => e.stopPropagation(),
                onContextMenu: (e) => e.stopPropagation(),
                onChange: (e) => this.setState({ renamingCustomSectionName: e.target.value }),
                onBlur: saveRenamingCustomSection,
                onKeyDown: (e) => {
                    if (e.key === "Enter") {
                        saveRenamingCustomSection();
                    }
                    if (e.key === "Escape") {
                        this.setState({ renamingCustomSectionId: null, renamingCustomSectionName: "" });
                    }
                    e.stopPropagation();
                },
                style: {
                    flex: 1,
                    minWidth: 0,
                    border: 0,
                    outline: "none",
                    background: "transparent",
                    color: "inherit",
                    fontSize: "11px",
                    fontWeight: 600,
                },
            }) : react_1.default.createElement(CustomSectionName, null, section ? section.name : "未分组");
            const onDragOver = (e) => {
                if (e.dataTransfer) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                }
            };
            const onDrop = (e) => {
                const tabId = e.dataTransfer ? e.dataTransfer.getData("application/x-biscuit-tab-id") : "";
                if (!tabId) {
                    return;
                }
                moveTabToSectionInCurrentState(tabId, section);
                this.forceUpdate();
                e.preventDefault();
                e.stopPropagation();
            };
            return react_1.default.createElement(CustomSectionHeader, { key: section ? section.id : "ungrouped", style: { paddingLeft: `${6 + depth * 14}px` }, onClick: section ? onClick : undefined, onDoubleClick: section ? ((e) => { this.setState({ renamingCustomSectionId: section.id, renamingCustomSectionName: section.name }); e.stopPropagation(); }) : undefined, onContextMenu: onContextMenu, onDragOver: onDragOver, onDrop: onDrop, title: extraTitle },
                react_1.default.createElement(CustomSectionArrow, null, opened ? "▾" : "▸"),
                renameInput,
                react_1.default.createElement(CustomSectionCount, null, count));
        };
        let tabListElems;
        if (hasCustomSections) {
            const usedTabIds = new Set();
            tabListElems = [];
            const renderSectionTree = (section, depth) => {
                const sectionTabs = (section.tabIds || []).map((tabId) => tabs.find((tab) => tab.id === tabId)).filter(Boolean);
                sectionTabs.forEach((tab) => usedTabIds.add(tab.id));
                getDescendantSections(section).forEach((child) => (child.tabIds || []).forEach((tabId) => usedTabIds.add(tabId)));
                const deepCount = getSectionTabIdsDeep(section).filter((tabId) => tabs.some((tab) => tab.id === tabId)).length;
                const opened = section.opened !== false || sectionContainsSelectedTab(section);
                tabListElems.push(createSectionHeader(section, deepCount, opened, depth, "点击展开/收起，右键管理文件夹"));
                if (opened) {
                    getChildSections(section).forEach((child) => renderSectionTree(child, depth + 1));
                    sectionTabs.forEach((tab) => tabListElems.push(createTabRow(tab, true, depth + 1, section)));
                }
            };
            getChildSections(undefined).forEach((section) => renderSectionTree(section, 0));
            const ungroupedTabs = tabs.filter((tab) => !usedTabIds.has(tab.id));
            if (ungroupedTabs.length > 0) {
                tabListElems.push(createSectionHeader(undefined, ungroupedTabs.length, true, 0, "未分组 App"));
                ungroupedTabs.forEach((tab) => tabListElems.push(createTabRow(tab, true, 0, undefined)));
            }
        }
        else {
            tabListElems = tabs.map((it) => createTabRow(it, false));
        }
        return (react_1.default.createElement(react_beautiful_dnd_1.Draggable, { type: "TAB_GROUP", draggableId: group.id, index: index }, (draggableProvided, snapshot) => (react_1.default.createElement(Container, { ref: draggableProvided.innerRef, id: `group_${group.id}`, isCursorOnSideberTop: isCursorOnSideberTop, ...draggableProvided.draggableProps },
            react_1.default.createElement(TabGroupBodyWrapper, { ...draggableProvided.dragHandleProps, "data-react-beautiful-dnd-drag-handle": "pointer" },
                react_1.default.createElement(TabGroupBody, { onClick: this.onClickToggle, onContextMenu: this.onContextMenu },
                    react_1.default.createElement(TabGroupName, { sidebar: sidebar },
                        group.name,
                        react_1.default.createElement(CountOfTabs, { opened: group.opened },
                            "(",
                            group.tabs.length,
                            ")")),
                    react_1.default.createElement(MoreButton, { sidebar: sidebar, onClick: this.onClickMore },
                        react_1.default.createElement(lucide_react_1.MoreVertical, { size: 16 })))),
            react_1.default.createElement(react_beautiful_dnd_1.Droppable, { droppableId: group.id, type: "TAB" }, (droppableProvided) => (react_1.default.createElement(TabList, { opened: group.opened, sidebar: sidebar, ref: droppableProvided.innerRef, ...droppableProvided.droppableProps },
                tabListElems,
                droppableProvided.placeholder))),
            this.state.mode === Mode.Editing ?
                react_1.default.createElement(EditTabGroupDialog_1.EditTabGroupDialog, { onClose: this.onClose, group: group })
                : null))));
    }
}
exports.default = TabGroupRow;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGFiR3JvdXBSb3cuanMiLCJzb3VyY2VSb290IjoiLi90c3gvIiwic291cmNlcyI6WyJyZW5kZXJlci9jb21wb25lbnRzL1RhYkdyb3VwUm93LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEseURBQTJDO0FBQzNDLGtEQUF5QztBQUN6Qyw2REFFNkI7QUFDN0IsK0NBQTRDO0FBQzVDLDBFQUF1QztBQUN2Qyx3RUFFd0M7QUFDeEMsbURBQStCO0FBQy9CLDJEQUE0RTtBQUU1RSxpREFBK0Q7QUFFL0QscURBQTZCO0FBQzdCLG9FQUE4RTtBQUM5RSw2REFBMEQ7QUFDMUQsc0RBQThCO0FBRzlCLE1BQU0sR0FBRyxHQUFHLGNBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUM7QUFFL0IsZ0JBQWdCO0FBRWhCLE1BQU0sU0FBUyxHQUFHLDJCQUFNLENBQUMsRUFBRSxDQUFpQzs7MEJBRWxDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTTtDQUN4RSxDQUFDO0FBRUYsTUFBTSxVQUFVLEdBQUcsMkJBQU0sQ0FBQyxHQUFHLENBQXFCOzs7b0JBRzlCLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssSUFBSSwwQkFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU07Ozs7O0NBSzdFLENBQUM7QUFFRixNQUFNLG1CQUFtQixHQUFHLDJCQUFNLENBQUMsR0FBRyxDQUFBOztDQUVyQyxDQUFDO0FBRUYsTUFBTSxZQUFZLEdBQUcsMkJBQU0sQ0FBQyxHQUFHLENBQUE7Ozs7O2NBS2pCLFVBQVU7OztDQUd2QixDQUFDO0FBRUYsTUFBTSxZQUFZLEdBQUcsMkJBQU0sQ0FBQyxHQUFHLENBQXFCOztpQkFFbkMsQ0FBQyxDQUFDLEVBQUUsRUFB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QUMzQixpQkFBaUIsQ0FBQyxjQUFjO2dCQUVuQyxZQUFZO2dCQUNaLGlCQUFpQixDQUFDLFdBQVcsQ0FDeEIsQ0FDYixDQUNPO1lBQ1gsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUMvQiw4QkFBQyx1Q0FBa0IsSUFBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxHQUFJO2dCQUMzRCxDQUFDLENBQUMsSUFBSSxDQUVGLENBQ2YsQ0FDTyxDQUNmLENBQUM7SUFDTixDQUFDO0NBaUdKO0FBRUQsa0JBQWUsV0FBVyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcmVtb3RlIGZyb20gJ0BlbGVjdHJvbi9yZW1vdGUnO1xuaW1wb3J0IFJlYWN0LCB7IEVycm9ySW5mbyB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7XG4gICAgRHJhZ2dhYmxlLCBEcmFnZ2FibGVQcm92aWRlZCwgRHJhZ2dhYmxlU3RhdGVTbmFwc2hvdCwgRHJvcHBhYmxlLCBEcm9wcGFibGVQcm92aWRlZFxufSBmcm9tICdyZWFjdC1iZWF1dGlmdWwtZG5kJztcbmltcG9ydCB7IE1vcmVWZXJ0aWNhbCB9IGZyb20gJ2x1Y2lkZS1yZWFjdCc7XG5pbXBvcnQgU3R5bGVkIGZyb20gJ3N0eWxlZC1jb21wb25lbnRzJztcbmltcG9ydCB7XG4gICAgY3JlYXRlRGVsZXRlR3JvdXBBY3Rpb24sIGNyZWF0ZVRvZ2dsZUdyb3VwQWN0aW9uLCBjcmVhdGVVcGRhdGVHcm91cEFjdGlvblxufSBmcm9tICcuLi9hY3Rpb25zL0dyb3VwQWN0aW9uQ3JlYXRvcnMnO1xuaW1wb3J0IE1lc3NhZ2VzIGZyb20gJy4uL2kxOG4nO1xuaW1wb3J0IHsgaXNBdWRpYmxlUGFyZW50VGFiLCBJU2Vzc2lvblN0YXRlIH0gZnJvbSAnLi4vc3RhdGVzL0lTZXNzaW9uU3RhdGUnO1xuaW1wb3J0IHsgSU5vdGlmaWNhdGlvbnNTZXR0aW5nIH0gZnJvbSAnLi4vc3RhdGVzL0lTZXR0aW5ncyc7XG5pbXBvcnQgeyBJU2lkZWJhciwgc2lkZWJhck1pbldpZHRoIH0gZnJvbSAnLi4vc3RhdGVzL0lTaWRlYmFyJztcbmltcG9ydCB7IElUYWJHcm91cCB9IGZyb20gJy4uL3N0YXRlcy9JVGFiR3JvdXAnO1xuaW1wb3J0IHN0b3JlIGZyb20gJy4uL1N0b3JlJztcbmltcG9ydCB7IElTaG93QWRkQXBwQWN0aW9uLCBTSE9XX0FERF9BUFAgfSBmcm9tICcuLi91dGlscy9Qb3N0TWVzc2FnZUFjdGlvbnMnO1xuaW1wb3J0IHsgRWRpdFRhYkdyb3VwRGlhbG9nIH0gZnJvbSAnLi9FZGl0VGFiR3JvdXBEaWFsb2cnO1xuaW1wb3J0IFRhYlJvdyBmcm9tICcuL1RhYlJvdyc7XG5cblxuY29uc3QgbXNnID0gTWVzc2FnZXMuZ2V0KCkuYXBwO1xuXG4vLyNyZWdpb24gc3R5bGVkXG5cbmNvbnN0IENvbnRhaW5lciA9IFN0eWxlZC5saTx7aXNDdXJzb3JPblNpZGViZXJUb3A6IGJvb2xlYW59PmBcbiAgICBwYWRkaW5nOiA1cHggMHB4IDE1cHggMTBweDtcbiAgICAtd2Via2l0LWFwcC1yZWdpb246ICR7KHApID0+IHAuaXNDdXJzb3JPblNpZGViZXJUb3AgPyAnZHJhZycgOiAnbm9uZSd9O1xuYDtcblxuY29uc3QgTW9yZUJ1dHRvbiA9IFN0eWxlZC5kaXY8e3NpZGViYXI6IElTaWRlYmFyfT5gXG4gICAgZmxleDogMDtcbiAgICBkaXNwbGF5OiBub25lO1xuICAgIG1hcmdpbi1yaWdodDogJHsocCkgPT4gcC5zaWRlYmFyLndpZHRoIDw9IHNpZGViYXJNaW5XaWR0aCA/ICcwcHgnIDogJzEwcHgnfTtcbiAgICBjb2xvcjogdmFyKC0tY2hyb21lLXRvcC10YWItaWNvbik7XG4gICAgJiA+IHN2ZyB7XG4gICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIH1cbmA7XG5cbmNvbnN0IFRhYkdyb3VwQm9keVdyYXBwZXIgPSBTdHlsZWQuZGl2YFxuICAgIG91dGxpbmU6IG5vbmU7XG5gO1xuXG5jb25zdCBUYWJHcm91cEJvZHkgPSBTdHlsZWQuZGl2YFxuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgbWluLWhlaWdodDogMThweDtcbiAgICAmOmhvdmVyICR7TW9yZUJ1dHRvbn0ge1xuICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICB9XG5gO1xuXG5jb25zdCBUYWJHcm91cE5hbWUgPSBTdHlsZWQuZGl2PHtzaWRlYmFyOiBJU2lkZWJhcn0+YFxuICAgIGZsZXg6IDE7XG4gICAgZm9udC1zaXplOiAkeyhwKSA9PiBwLnNpZGViYXIud2lkdGggPD0gc2lkZWJhck1pbldpZHRoID8gJzlweCcgOiAnMTNweCd9O1xuICAgIGZvbnQtd2VpZ2h0OiA1MDA7XG4gICAgbGluZS1oZWlnaHQ6IDE4cHg7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuYDtcblxuY29uc3QgQ291bnRPZlRhYnMgPSBTdHlsZWQuc3Bhbjx7IG9wZW5lZDogYm9vbGVhbiB9PmBcbiAgICBkaXNwbGF5OiAkeyhwKSA9PiAhcC5vcGVuZWQgPyAnaW5saW5lJyA6ICdub25lJ307XG5gO1xuXG5jb25zdCBUYWJMaXN0ID0gU3R5bGVkLnVsPHsgb3BlbmVkOiBib29sZWFuLCBzaWRlYmFyOiBJU2lkZWJhciB9PmBcbiAgICBtYXJnaW4tdG9wOiAxZW07XG4gICAgbWFyZ2luLWxlZnQ6IDA7XG4gICAgcGFkZGluZy1sZWZ0OiAwO1xuICAgIHBhZGRpbmctcmlnaHQ6IDEwcHg7XG4gICAgbGlzdC1zdHlsZTogbm9uZTtcbiAgICBkaXNwbGF5OiAkeyhwKSA9PiBwLm9wZW5lZCA/ICdibG9jaycgOiAnbm9uZSd9O1xuYDtcblxuLy8jZW5kcmVnaW9uXG5cbmludGVyZmFjZSBJUHJvcHMge1xuICAgIGdyb3VwOiBJVGFiR3JvdXA7XG4gICAgaW5kZXg6IG51bWJlcjtcbiAgICBpc0N1cnNvck9uU2lkZWJlclRvcDogYm9vbGVhbjtcbiAgICBzZWxlY3RlZFRhYklkPzogc3RyaW5nO1xuICAgIHNpZGViYXI6IElTaWRlYmFyO1xuICAgIHNlc3Npb25TdGF0ZTogSVNlc3Npb25TdGF0ZTtcbiAgICBub3RpZmljYXRpb25zU2V0dGluZzogSU5vdGlmaWNhdGlvbnNTZXR0aW5nO1xufVxuXG5lbnVtIE1vZGUge1xuICAgIE5vcm1hbCxcbiAgICBFZGl0aW5nLFxufVxuXG5pbnRlcmZhY2UgSUxvY2FsU3RhdGUge1xuICAgIG1vZGU6IE1vZGU7XG4gICAgdGFiR3JvdXBOYW1lOiBzdHJpbmc7XG59XG5cbmNvbnN0IGRlZmF1bHRTdGF0ZTogSUxvY2FsU3RhdGUgPSB7XG4gICAgbW9kZTogTW9kZS5Ob3JtYWwsXG4gICAgdGFiR3JvdXBOYW1lOiAnJyxcbn07XG5cbmNsYXNzIFRhYkdyb3VwUm93IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50PElQcm9wcywgSUxvY2FsU3RhdGU+IHtcbiAgICBwcml2YXRlIHRleHRJbnB1dDogSFRNTElucHV0RWxlbWVudCB8IHVuZGVmaW5lZDtcblxuICAgIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcm9wczogSVByb3BzKSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IGRlZmF1bHRTdGF0ZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY29tcG9uZW50RGlkVXBkYXRlKHByZXZQcm9wczogUmVhZG9ubHk8SVByb3BzPiwgcHJldlN0YXRlOiBSZWFkb25seTxJTG9jYWxTdGF0ZT4pIHtcbiAgICAgICAgaWYgKHByZXZTdGF0ZS5tb2RlID09PSBNb2RlLk5vcm1hbCAmJiB0aGlzLnN0YXRlLm1vZGUgPT09IE1vZGUuRWRpdGluZykge1xuICAgICAgICAgICAgaWYgKHRoaXMudGV4dElucHV0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy50ZXh0SW5wdXQuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnRleHRJbnB1dC5zZWxlY3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBjb21wb25lbnREaWRDYXRjaChlcnJvcjogRXJyb3IsIGVycm9ySW5mbzogRXJyb3JJbmZvKSB7XG4gICAgICAgIC8vIFdoZW4gdW5tb3VudGVkLCBjYXRjaCBlcnJvciBmcm9tIFZlbG9jaXR5VHJhbnNpdGlvbkdyb3VwIGNvbXBvbmVudFxuICAgIH1cblxuICAgIHB1YmxpYyByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IHsgZ3JvdXAsIHNlbGVjdGVkVGFiSWQsIGluZGV4LCBzaWRlYmFyLCBub3RpZmljYXRpb25zU2V0dGluZywgaXNDdXJzb3JPblNpZGViZXJUb3AgfSA9IHRoaXMucHJvcHM7XG4gICAgICAgIGNvbnN0IHRhYnMgPSBncm91cC50YWJzO1xuICAgICAgICBjb25zdCB0YWJMaXN0RWxlbXMgPSB0YWJzLm1hcCgoaXQsIHRhYkluZGV4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhdWRpYWJsZSA9IGlzQXVkaWJsZVBhcmVudFRhYih0aGlzLnByb3BzLnNlc3Npb25TdGF0ZS5hdWRpYmxlU291cmNlSWRzLCBpdCk7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxUYWJSb3dcbiAgICAgICAgICAgICAgICAgICAga2V5PXtpdC5pZH1cbiAgICAgICAgICAgICAgICAgICAgdGFiPXtpdH1cbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRUYWJJZD17c2VsZWN0ZWRUYWJJZH1cbiAgICAgICAgICAgICAgICAgICAgaW5kZXg9e3RhYkluZGV4fVxuICAgICAgICAgICAgICAgICAgICBzaWRlYmFyPXtzaWRlYmFyfVxuICAgICAgICAgICAgICAgICAgICBhdWRpYmxlPXthdWRpYWJsZX1cbiAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uc1NldHRpbmc9e25vdGlmaWNhdGlvbnNTZXR0aW5nfVxuICAgICAgICAgICAgICAgICAgICB7Li4uaXR9IC8+XG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPERyYWdnYWJsZSB0eXBlPVwiVEFCX0dST1VQXCIgZHJhZ2dhYmxlSWQ9e2dyb3VwLmlkfSBpbmRleD17aW5kZXh9PlxuICAgICAgICAgICAgICAgIHsoZHJhZ2dhYmxlUHJvdmlkZWQ6IERyYWdnYWJsZVByb3ZpZGVkLCBzbmFwc2hvdDogRHJhZ2dhYmxlU3RhdGVTbmFwc2hvdCkgPT4gKFxuICAgICAgICAgICAgICAgICAgICA8Q29udGFpbmVyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWY9e2RyYWdnYWJsZVByb3ZpZGVkLmlubmVyUmVmfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ9e2Bncm91cF8ke2dyb3VwLmlkfWB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpc0N1cnNvck9uU2lkZWJlclRvcD17aXNDdXJzb3JPblNpZGViZXJUb3B9XG4gICAgICAgICAgICAgICAgICAgICAgICB7Li4uZHJhZ2dhYmxlUHJvdmlkZWQuZHJhZ2dhYmxlUHJvcHN9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPFRhYkdyb3VwQm9keVdyYXBwZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Li4uZHJhZ2dhYmxlUHJvdmlkZWQuZHJhZ0hhbmRsZVByb3BzfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEtcmVhY3QtYmVhdXRpZnVsLWRuZC1kcmFnLWhhbmRsZT1cInBvaW50ZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJHcm91cEJvZHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5vbkNsaWNrVG9nZ2xlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNvbnRleHRNZW51PXt0aGlzLm9uQ29udGV4dE1lbnV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGFiR3JvdXBOYW1lIHNpZGViYXI9e3NpZGViYXJ9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2dyb3VwLm5hbWV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Q291bnRPZlRhYnMgb3BlbmVkPXtncm91cC5vcGVuZWR9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh7Z3JvdXAudGFicy5sZW5ndGh9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9Db3VudE9mVGFicz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9UYWJHcm91cE5hbWU+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxNb3JlQnV0dG9uIHNpZGViYXI9e3NpZGViYXJ9IG9uQ2xpY2s9e3RoaXMub25DbGlja01vcmV9PjxNb3JlVmVydGljYWwgc2l6ZT17MTZ9IC8+PC9Nb3JlQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvVGFiR3JvdXBCb2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9UYWJHcm91cEJvZHlXcmFwcGVyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPERyb3BwYWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRyb3BwYWJsZUlkPXtncm91cC5pZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiVEFCXCJcbiAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7KGRyb3BwYWJsZVByb3ZpZGVkOiBEcm9wcGFibGVQcm92aWRlZCkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGFiTGlzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3BlbmVkPXtncm91cC5vcGVuZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWRlYmFyPXtzaWRlYmFyfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmPXtkcm9wcGFibGVQcm92aWRlZC5pbm5lclJlZn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsuLi5kcm9wcGFibGVQcm92aWRlZC5kcm9wcGFibGVQcm9wc31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3RhYkxpc3RFbGVtc31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtkcm9wcGFibGVQcm92aWRlZC5wbGFjZWhvbGRlcn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9UYWJMaXN0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L0Ryb3BwYWJsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHt0aGlzLnN0YXRlLm1vZGUgPT09IE1vZGUuRWRpdGluZyA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPEVkaXRUYWJHcm91cERpYWxvZyBvbkNsb3NlPXt0aGlzLm9uQ2xvc2V9IGdyb3VwPXtncm91cH0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgPC9Db250YWluZXI+XG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvRHJhZ2dhYmxlPlxuICAgICAgICApO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2hvd01vcmVNZW51ID0gKCkgPT4ge1xuICAgICAgICBjb25zdCB7IGdyb3VwIH0gPSB0aGlzLnByb3BzO1xuICAgICAgICBjb25zdCB7IE1lbnUsIE1lbnVJdGVtIH0gPSByZW1vdGU7XG5cbiAgICAgICAgY29uc3QgbWVudSA9IG5ldyBNZW51KCk7XG4gICAgICAgIGNvbnN0IGFkZEFwcEl0ZW0gPSBuZXcgTWVudUl0ZW0oe1xuICAgICAgICAgICAgY2xpY2s6IHRoaXMuYWRkQXBwLFxuICAgICAgICAgICAgbGFiZWw6IG1zZy5hZGRBcHAsXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCByZW5hbWVJdGVtID0gbmV3IE1lbnVJdGVtKHtcbiAgICAgICAgICAgIGNsaWNrOiB0aGlzLnNob3dFZGl0VGFiR3JvdXBEaWFsb2csXG4gICAgICAgICAgICBsYWJlbDogbXNnLnJlbmFtZUdyb3VwLFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZGVsZXRlSXRlbSA9IG5ldyBNZW51SXRlbSh7XG4gICAgICAgICAgICBjbGljazogdGhpcy5kZWxldGVUYWJHcm91cCxcbiAgICAgICAgICAgIGxhYmVsOiBtc2cuZGVsZXRlR3JvdXAsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHRvZ2dsZVNoYXJlZEl0ZW0gPSBuZXcgTWVudUl0ZW0oe1xuICAgICAgICAgICAgY2xpY2s6IHRoaXMudG9nZ2xlU2hhcmVkLFxuICAgICAgICAgICAgbGFiZWw6IGdyb3VwLnNoYXJlZCA/IG1zZy5zaGFyZWRTZXNzaW9uLmRpc2FibGVTaGFyZWRTZXNzaW9uIDogbXNnLnNoYXJlZFNlc3Npb24uZW5hYmxlU2hhcmVkU2Vzc2lvbixcbiAgICAgICAgfSk7XG4gICAgICAgIG1lbnUuYXBwZW5kKGFkZEFwcEl0ZW0pO1xuICAgICAgICBtZW51LmFwcGVuZChuZXcgTWVudUl0ZW0oe3R5cGU6ICdzZXBhcmF0b3InfSkpO1xuICAgICAgICBtZW51LmFwcGVuZChyZW5hbWVJdGVtKTtcbiAgICAgICAgbWVudS5hcHBlbmQoZGVsZXRlSXRlbSk7XG4gICAgICAgIG1lbnUuYXBwZW5kKG5ldyBNZW51SXRlbSh7dHlwZTogJ3NlcGFyYXRvcid9KSk7XG4gICAgICAgIG1lbnUuYXBwZW5kKHRvZ2dsZVNoYXJlZEl0ZW0pO1xuICAgICAgICBtZW51LnBvcHVwKHt9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFkZEFwcCA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgeyBncm91cCB9ID0gdGhpcy5wcm9wcztcbiAgICAgICAgY29uc3QgYWN0aW9uTWVzc2FnZSA9IHtcbiAgICAgICAgICAgIHRhYkdyb3VwSWQ6IGdyb3VwLmlkLFxuICAgICAgICAgICAgdHlwZTogU0hPV19BRERfQVBQLFxuICAgICAgICB9IGFzIElTaG93QWRkQXBwQWN0aW9uO1xuICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoYWN0aW9uTWVzc2FnZSwgJyonKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGRlbGV0ZVRhYkdyb3VwID0gKCkgPT4ge1xuICAgICAgICBjb25zdCB7IGdyb3VwIH0gPSB0aGlzLnByb3BzO1xuICAgICAgICBjb25zdCBvayA9IGNvbmZpcm0obXNnLmRlbGV0ZUdyb3VwQ29uZmlybU1lc3NhZ2UpO1xuICAgICAgICBpZiAob2spIHtcbiAgICAgICAgICAgIHN0b3JlLmRpc3BhdGNoKGNyZWF0ZURlbGV0ZUdyb3VwQWN0aW9uKGdyb3VwLmlkLCBzdG9yZSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzaG93RWRpdFRhYkdyb3VwRGlhbG9nID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIG1vZGU6IE1vZGUuRWRpdGluZyxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBoaWRlRWRpdFRhYkdyb3VwRGlhbG9nID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIG1vZGU6IE1vZGUuTm9ybWFsLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHRvZ2dsZVNoYXJlZCA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgeyBncm91cCB9ID0gdGhpcy5wcm9wcztcbiAgICAgICAgY29uc3QgeyBCcm93c2VyV2luZG93IH0gPSByZW1vdGU7XG4gICAgICAgIGNvbnN0IGZvY3VzZWRXaW5kb3cgPSBCcm93c2VyV2luZG93LmdldEZvY3VzZWRXaW5kb3coKTtcbiAgICAgICAgaWYgKCFmb2N1c2VkV2luZG93KSB7IHJldHVybjsgfVxuXG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBncm91cC5zaGFyZWQgPyBtc2cuc2hhcmVkU2Vzc2lvbi5jb2Zpcm1EaXNhYmxlIDogbXNnLnNoYXJlZFNlc3Npb24uY29maXJtRW5hYmxlO1xuICAgICAgICBjb25zdCBvayA9IGNvbmZpcm0obWVzc2FnZSk7XG4gICAgICAgIGlmIChvaykge1xuICAgICAgICAgICAgZ3JvdXAuc2hhcmVkID0gIWdyb3VwLnNoYXJlZDtcbiAgICAgICAgICAgIHN0b3JlLmRpc3BhdGNoKGNyZWF0ZVVwZGF0ZUdyb3VwQWN0aW9uKGdyb3VwLCBzdG9yZSkpO1xuICAgICAgICAgICAgZm9jdXNlZFdpbmRvdy5yZWxvYWQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgb25DbGlja01vcmUgPSAoZTogUmVhY3QuTW91c2VFdmVudCkgPT4ge1xuICAgICAgICB0aGlzLnNob3dNb3JlTWVudSgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cblxuICAgIHByaXZhdGUgb25Db250ZXh0TWVudSA9IChlOiBSZWFjdC5Nb3VzZUV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuc2hvd01vcmVNZW51KCk7XG4gICAgICAgIC8vIG5lZWQgcHJldmVudERlZmF1bHQgZm9yIFdpbmRvd3NcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgb25DbGlja1RvZ2dsZSA9IChlOiBSZWFjdC5Nb3VzZUV2ZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IHsgZ3JvdXAgfSA9IHRoaXMucHJvcHM7XG4gICAgICAgIHN0b3JlLmRpc3BhdGNoKGNyZWF0ZVRvZ2dsZUdyb3VwQWN0aW9uKGdyb3VwLmlkLCBzdG9yZSkpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cblxuICAgIHByaXZhdGUgb25DbG9zZSA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5oaWRlRWRpdFRhYkdyb3VwRGlhbG9nKCk7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBUYWJHcm91cFJvdztcbiJdfQ==

/***/ }),