//#region codexCustomSectionsV10 (injected)
// 自定义折叠小组：树形嵌套 / 折叠 / 拖拽 / 右键菜单 / 未分组
const CUSTOM_SECTION_STORAGE_KEY = 'biscuitCustomSectionsV1';
const CUSTOM_SECTION_PATCH_VERSION = 'codexCustomSectionsV10';
// 正在就地重命名的小组 id（null 表示没有）
let codexRenamingSectionId = null;
const loadCustomSectionState = () => {
    try {
        const raw = window.localStorage.getItem(CUSTOM_SECTION_STORAGE_KEY);
        if (!raw) {
            return { groups: {} };
        }
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || !parsed.groups || typeof parsed.groups !== 'object') {
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
const newSectionId = () => `section_${Date.now()}_${Math.random().toString(36).slice(2)}`;
const normalizeCustomGroupState = (state, group) => {
    const groupState = getCustomGroupState(state, group.id);
    const validTabIds = new Set(group.tabs.map((tab) => tab.id));
    const usedTabIds = new Set();
    let changed = false;
    groupState.sections = groupState.sections.filter((section) => {
        if (!section || typeof section !== 'object') {
            changed = true;
            return false;
        }
        if (!section.id) {
            section.id = newSectionId();
            changed = true;
        }
        if (!section.name) {
            section.name = '未命名';
            changed = true;
        }
        if (!Array.isArray(section.tabIds)) {
            section.tabIds = [];
            changed = true;
        }
        if (typeof section.parentId === 'undefined') {
            section.parentId = null;
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
        if (typeof section.opened !== 'boolean') {
            section.opened = true;
        }
        return true;
    });
    const ids = new Set(groupState.sections.map((section) => section.id));
    groupState.sections.forEach((section) => {
        if (section.parentId && (!ids.has(section.parentId) || section.parentId === section.id)) {
            section.parentId = null;
            changed = true;
        }
    });
    if (changed) {
        saveCustomSectionState(state);
    }
    return groupState;
};
// 构建一个 group 的小组树上下文
const buildCustomSectionContext = (group) => {
    const state = loadCustomSectionState();
    const groupState = normalizeCustomGroupState(state, group);
    const sections = groupState.sections;
    const byId = new Map();
    sections.forEach((section) => byId.set(section.id, section));
    const byParent = new Map();
    sections.forEach((section) => {
        const key = section.parentId || '__root__';
        if (!byParent.has(key)) {
            byParent.set(key, []);
        }
        byParent.get(key).push(section);
    });
    const children = (section) => byParent.get(section ? section.id : '__root__') || [];
    const depth = (section) => {
        let d = 0;
        let cur = section;
        const guard = new Set();
        while (cur && cur.parentId && byId.has(cur.parentId) && !guard.has(cur.parentId)) {
            guard.add(cur.parentId);
            d += 1;
            cur = byId.get(cur.parentId);
        }
        return d;
    };
    const path = (section) => {
        const names = [];
        let cur = section;
        const guard = new Set();
        while (cur && !guard.has(cur.id)) {
            guard.add(cur.id);
            names.unshift(cur.name);
            cur = cur.parentId ? byId.get(cur.parentId) : undefined;
        }
        return names.join(' / ');
    };
    const descendants = (section) => {
        const out = [];
        const visit = (parent) => {
            children(parent).forEach((child) => {
                out.push(child);
                visit(child);
            });
        };
        visit(section);
        return out;
    };
    const deepTabIds = (section) => {
        const ids = new Set(section.tabIds || []);
        descendants(section).forEach((child) => (child.tabIds || []).forEach((tabId) => ids.add(tabId)));
        return Array.from(ids);
    };
    const openAncestors = (section) => {
        let cur = section;
        while (cur) {
            cur.opened = true;
            cur = cur.parentId ? byId.get(cur.parentId) : undefined;
        }
    };
    const addToSection = (target, tabId) => {
        target.tabIds = target.tabIds || [];
        if (target.tabIds.indexOf(tabId) === -1) {
            target.tabIds.push(tabId);
        }
        openAncestors(target);
    };
    const moveTabTo = (tabId, target) => {
        sections.forEach((section) => {
            section.tabIds = (section.tabIds || []).filter((id) => id !== tabId);
        });
        if (target) {
            addToSection(target, tabId);
        }
        saveCustomSectionState(state);
    };
    const claimedTabIds = () => {
        const claimed = new Set();
        sections.forEach((section) => (section.tabIds || []).forEach((tabId) => claimed.add(tabId)));
        return claimed;
    };
    const createSection = (parentSection, moveUngrouped) => {
        const siblings = sections.filter((section) => (section.parentId || null) === (parentSection ? parentSection.id : null));
        const used = new Set(siblings.map((section) => section.name));
        const base = parentSection ? '新子文件夹' : '新小组';
        let name = base;
        let index = 2;
        while (used.has(name)) {
            name = `${base} ${index}`;
            index += 1;
        }
        const section = { id: newSectionId(), name, opened: true, parentId: parentSection ? parentSection.id : null, tabIds: [] };
        if (parentSection) {
            parentSection.opened = true;
        }
        if (moveUngrouped) {
            const claimed = claimedTabIds();
            section.tabIds = group.tabs.filter((tab) => !claimed.has(tab.id)).map((tab) => tab.id);
        }
        sections.push(section);
        byId.set(section.id, section);
        const key = section.parentId || '__root__';
        if (!byParent.has(key)) {
            byParent.set(key, []);
        }
        byParent.get(key).push(section);
        saveCustomSectionState(state);
        return section;
    };
    const removeSection = (section) => {
        const removeIds = new Set([section.id, ...descendants(section).map((child) => child.id)]);
        groupState.sections = groupState.sections.filter((it) => !removeIds.has(it.id));
        saveCustomSectionState(state);
    };
    return {
        state, groupState, sections, byId, children, depth, path, descendants, deepTabIds,
        openAncestors, addToSection, moveTabTo, claimedTabIds, createSection, removeSection,
    };
};
// 扁平有序列表：把 group.tabs 按小组树重排；tab 项在 flat 里的位置就是拖拽序号
const buildSectionFlatList = (group) => {
    const ctx = buildCustomSectionContext(group);
    const itemById = new Map();
    group.tabs.forEach((tab) => itemById.set(tab.id, tab));
    const flat = [];
    const emit = (section, depth) => {
        flat.push({ kind: 'section', section, depth });
        if (section.opened !== false) {
            (section.tabIds || []).forEach((tabId) => {
                const tab = itemById.get(tabId);
                if (tab) {
                    flat.push({ kind: 'tab', tab, depth: depth + 1, section });
                }
            });
            ctx.children(section).forEach((child) => emit(child, depth + 1));
        }
    };
    ctx.children(null).forEach((section) => emit(section, 0));
    const hasSections = ctx.children(null).length > 0;
    const ungrouped = group.tabs.filter((tab) => !ctx.claimedTabIds().has(tab.id));
    if (hasSections) {
        flat.push({ kind: 'ungrouped', tabs: ungrouped, depth: 0 });
    }
    ungrouped.forEach((tab) => flat.push({ kind: 'tab', tab, depth: hasSections ? 1 : 0, section: null }));
    return { ctx, flat };
};
// 拖拽落位：index 是拖拽框架里的行序号（只数 tab 行，不含小组标题），
// 表示“插到这一行之前”；等于行数时追加到末尾。
const moveTabToFlatIndex = (group, draggedTabId, index) => {
    const ctx = buildCustomSectionContext(group);
    if (ctx.children(null).length === 0) {
        // 没有小组时不接管排序，交给原本的 move action
        return false;
    }
    const rows = buildSectionFlatList(group).flat.filter((item) => item.kind === 'tab');
    const at = rows[index];
    const destSection = at ? at.section : (rows.length ? rows[rows.length - 1].section : null);
    ctx.sections.forEach((section) => {
        section.tabIds = (section.tabIds || []).filter((id) => id !== draggedTabId);
    });
    if (destSection) {
        const ids = destSection.tabIds || (destSection.tabIds = []);
        if (at) {
            const found = ids.indexOf(at.tab.id);
            ids.splice(found < 0 ? ids.length : found, 0, draggedTabId);
        }
        else {
            ids.push(draggedTabId);
        }
        ctx.openAncestors(destSection);
    }
    saveCustomSectionState(ctx.state);
    return true;
};
// 找到拖拽序号对应的目标：小组、插入锚点 tab（null 表示追加）
const resolveFlatDropTarget = (group, index) => {
    const rows = buildSectionFlatList(group).flat.filter((item) => item.kind === 'tab');
    const at = rows[index];
    if (at) {
        return { sectionId: at.section ? at.section.id : null, beforeTabId: at.tab.id };
    }
    const last = rows.length ? rows[rows.length - 1] : null;
    return { sectionId: last && last.section ? last.section.id : null, beforeTabId: null };
};
// 放到小组标题 / 右键菜单：进该小组末尾；sectionId 为 null 表示移出
const moveTabIntoSection = (group, draggedTabId, sectionId, beforeTabId) => {
    const ctx = buildCustomSectionContext(group);
    ctx.sections.forEach((section) => {
        section.tabIds = (section.tabIds || []).filter((id) => id !== draggedTabId);
    });
    if (sectionId) {
        const target = ctx.byId.get(sectionId);
        if (target) {
            const ids = target.tabIds || (target.tabIds = []);
            const found = beforeTabId ? ids.indexOf(beforeTabId) : -1;
            if (found < 0) {
                ids.push(draggedTabId);
            }
            else {
                ids.splice(found, 0, draggedTabId);
            }
            ctx.openAncestors(target);
        }
    }
    saveCustomSectionState(ctx.state);
    return true;
};
// TabRow 在另一个 webpack 模块里，靠这个全局桥接调用
window.__codexCustomSections = {
    buildCustomSectionContext,
    buildSectionFlatList,
    resolveFlatDropTarget,
    moveTabToFlatIndex,
    moveTabIntoSection,
    saveCustomSectionState,
};
//#endregion codexCustomSectionsV10
