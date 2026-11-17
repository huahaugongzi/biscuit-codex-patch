# biscuit-codex-patch

给 [Biscuit](https://www.biscuitbrowser.com/)（基于 Electron 的分组浏览器）打本地增强补丁的脚本集合。**升级 Biscuit 后重新跑一次即可恢复所有增强。**

## 增强内容

1. **自定义折叠小组** — 侧栏里可建可嵌套的文件夹（如 `邮箱 → proton.me → 各账号`），支持折叠、右键菜单（新建子文件夹 / 重命名 / 删除 / 把未分组 App 收进来）、以及「移动到折叠小组」菜单项。
2. **左侧栏中部折叠把手** — 侧栏右缘中点一个窄条按钮，`<` / `>` 一键收起或展开侧栏。
3. **精简侧栏页脚** — 隐藏「通知」和「赞助」按钮，保留「添加组」。

数据存放在 Electron 的 `localStorage` 键 `biscuitCustomSectionsV1` 下，**升级不会丢失**；只有注入的代码需要重新打。

## 用法

```bash
./apply.sh /Applications/Biscuit.app            # 直接打补丁
./apply.sh /Applications/Biscuit.app --dry-run  # 只检查锚点，不写文件
./apply.sh /Applications/Biscuit.app --verify   # 报告当前是否已打补丁
./apply.sh /Applications/Biscuit.app --out /tmp/patched.asar   # 只生成补丁包
```

打补丁前请先退出 Biscuit（`app.asar` 被占用时替换会出问题）。

### 目录被 macOS「App 管理」保护时

较新版本的 macOS 会拒绝对 `/Applications/*.app` 的任何写入（`Operation not permitted`，sudo 也无效）。此时：

```bash
./apply.sh /Applications/Biscuit.app --out /tmp/patched.asar
```

再用 Finder 把 `/Applications/Biscuit.app/Contents/Resources/app.asar` 换掉（Finder 不受该保护限制），或者把 App 复制到 `~/Applications` 后在副本上直接跑 `apply.sh`。

## 实现方式

脚本按 Bocuit 的内部结构选配方：

| 版本 | 配方 |
|---|---|
| 2.1.x（含 `class MouseState`） | 整模块替换 `TabGroupRow.tsx` / `TabRow.tsx`（`parts/*.module.js`），把手注入 `SidebarSeparator.tsx` |
| 2.2.x 起 | 追加式，只改 4 处锚点，不覆盖组件（保留新版自带的静音/图标菜单等） |

### 2.2.x 配方的挂接点

| 位置 | 改动 |
|---|---|
| `TabGroupRow.tsx` 模块顶层 | 插入 `parts/sections_engine.js`（小组树、localStorage 持久化、扁平有序列表） |
| `TabGroupRow.render()` | 把 `tabs.map(...)` 换成按小组树展开的列表；小组标题行带右键菜单 |
| `TabRow.showMoreMenu()` | 加「移动到折叠小组」/「移出折叠小组」 |
| `Window.tsx` | 插 `ToggleSidebarButton`、页脚两个按钮置 `null`、`onDragStart` 记录被拖 tab |

`TabRow` 与 `TabGroupRow` 属于不同的 webpack 模块，引擎通过 `window.__codexCustomSections` 暴露给 TabRow 使用。

## 安全与回滚

- 所有定位基于唯一锚点文本，**任一锚点命中次数不为 1 就停止，不写半截文件**。
- 写入前跑 `node --check` 做语法校验，失败则不回包。
- 直接模式会自动备份为 `app.asar.backup-before-repatch-<时间戳>`。
- 幂等：已打过补丁的包再跑会提示「补丁已全部在位」。

回滚：把备份文件复制回 `Contents/Resources/app.asar`。

## 已知限制

- 小组内的 tab 排序目前靠右键菜单（「移动到折叠小组」会追加到末尾），组内拖动排序未实现。
- 每次 Biscuit 升级后都需要重跑 `apply.sh`，因为 `app.asar` 会被整包替换。

## 免责声明

个人使用的本地修改，非官方、与 Biscuit 作者无关。修改后的 App 签名失效，如需绕过 Gatekeeper 可执行 `xattr -dr com.apple.quarantine <app>`；请自行评估风险。
