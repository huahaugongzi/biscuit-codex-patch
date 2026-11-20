#!/bin/bash
# 一键升级：Biscuit 升级后跑这一个脚本，补丁 + 扩展替换 + 重启全部搞定。
#
# 用法:
#   ./update.sh                       # 默认 /Applications/Biscuit.app
#   ./update.sh /Applications/xxx.app
#   ./update.sh --check               # 只看状态，不改任何东西
#
# 做的事:
#   1) 退出 Biscuit（app.asar 被占用时打包/替换会失败）
#   2) 跑 apply.sh 生成打好补丁的 app.asar，写回应用目录
#      - 直接写失败（macOS「App 管理」保护）时，改用 Finder 复制，等效且不需要 sudo
#   3) 重打沉浸式翻译副本的两处改动（manifest 去掉 file://、悬浮球只留主按钮）
#   4) 重新打开 Biscuit

set -euo pipefail

SELF_DIR="$(cd "$(dirname "$0")" && pwd)"
APP="/Applications/Biscuit.app"
CHECK_ONLY=0

for a in "$@"; do
  case "$a" in
    --check) CHECK_ONLY=1 ;;
    -*) echo "未知参数: $a" >&2; exit 2 ;;
    *) APP="$a" ;;
  esac
done
APP="${APP%/}"
ASAR="$APP/Contents/Resources/app.asar"
[ -f "$ASAR" ] || { echo "找不到 $ASAR" >&2; exit 1; }

EXT_ROOT="$HOME/Library/Application Support/biscuit/extensions/bpoadfkcbjbfhfodiogcnhhhpibjhbnh"

say() { printf '\033[1m%s\033[0m\n' "$*"; }

# --- 状态 ---------------------------------------------------------------
VER=$(/usr/libexec/PlistBuddy -c "Print CFBundleShortVersionString" "$APP/Contents/Info.plist" 2>/dev/null || echo "?")
say "目标: $APP (版本 $VER)"

EXT_DIR=""
if [ -d "$EXT_ROOT" ]; then
  # 取版本号最大的那个子目录
  EXT_DIR=$(ls -1 "$EXT_ROOT" | sort -V | tail -1)
  EXT_DIR="$EXT_ROOT/$EXT_DIR"
fi

if [ "$CHECK_ONLY" = "1" ]; then
  TMP=$(mktemp -d "${TMPDIR:-/tmp}/biscuit-check.XXXXXX")
  trap 'rm -rf "$TMP"' EXIT
  npx --yes @electron/asar extract "$ASAR" "$TMP/app" >/dev/null
  IDX="$TMP/app/js/renderer/index.js"
  echo "补丁状态:"
  for k in codexCustomSections codexExtensionsV1 codexHideSidebarFooterV1 ToggleSidebarButton; do
    printf '  %-28s %s 处\n' "$k" "$(grep -c "$k" "$IDX" 2>/dev/null || echo 0)"
  done
  if [ -n "$EXT_DIR" ]; then
    echo "扩展副本: $EXT_DIR"
    MF_STATE=$(python3 -I - "$EXT_DIR/manifest.json" <<'PY'
import json, sys
try:
    m = json.load(open(sys.argv[1]))
    bad = any(x in ('file:///*', '<all_urls>')
              for cs in m.get('content_scripts', []) for x in cs.get('matches', []))
    print('未打，需处理' if bad else '已打')
except Exception:
    print('读取失败')
PY
)
    echo "  内容脚本不再进 file://: $MF_STATE"
    echo "  悬浮球只留主按钮:     $(grep -q 'codex: 悬浮球只保留主按钮' "$EXT_DIR/content_main.js" 2>/dev/null && echo 已打 || echo 未打)"
  else
    echo "扩展副本: 未安装（在 Biscuit 里设置 → 扩展 安装）"
  fi
  exit 0
fi

# --- 1) 退出 Biscuit ----------------------------------------------------
if pgrep -f "$APP/Contents/MacOS" >/dev/null 2>&1; then
  say "退出 Biscuit ..."
  osascript -e "quit app \"$(basename "$APP" .app)\"" >/dev/null 2>&1 || true
  for _ in $(seq 1 40); do
    pgrep -f "$APP/Contents/MacOS" >/dev/null 2>&1 || break
    sleep 0.5
  done
  pgrep -f "$APP/Contents/MacOS" >/dev/null 2>&1 && { echo "Biscuit 没能退出，请手动退出后重试" >&2; exit 1; }
fi

# --- 2) 生成并写入 app.asar --------------------------------------------
TMP=$(mktemp -d "${TMPDIR:-/tmp}/biscuit-update.XXXXXX")
trap 'rm -rf "$TMP"' EXIT
OUT_ASAR="$TMP/app.asar"

say "打补丁 ..."
"$SELF_DIR/apply.sh" "$APP" --out "$OUT_ASAR"

say "写入应用目录 ..."
if cp "$OUT_ASAR" "$ASAR" 2>/dev/null; then
  echo "  直接写入成功"
else
  echo "  直接写入被系统拒绝，改用 Finder 复制 ..."
  # Finder 不受「App 管理」限制：先复制成 app.asar.new，再删旧包改名
  /usr/bin/osascript <<EOF || { echo "Finder 写入失败" >&2; exit 1; }
tell application "Finder"
  set src to POSIX file "$OUT_ASAR" as alias
  set dstFolder to POSIX file "$APP/Contents/Resources" as alias
  set tmpItem to (duplicate src to dstFolder with replacing)
  set name of tmpItem to "app.asar.new"
  delete (item "app.asar" of dstFolder)
  set name of tmpItem to "app.asar"
end tell
EOF
  cmp -s "$OUT_ASAR" "$ASAR" || { echo "写入失败：内容不一致" >&2; exit 1; }
  echo "  Finder 写入成功"
fi

# --- 3) 扩展副本的两处改动 --------------------------------------------
if [ -n "$EXT_DIR" ] && [ -f "$EXT_DIR/manifest.json" ]; then
  say "重打扩展副本补丁 ..."
  python3 -I - "$EXT_DIR" <<'PY'
import json, os, sys, io
d = sys.argv[1]

# a) content_scripts 不再注入 file:// （避免在 Biscuit 主界面再出现一个球）
mp = os.path.join(d, 'manifest.json')
m = json.load(open(mp))
changed = False
for cs in m.get('content_scripts', []):
    mm = cs.get('matches', [])
    keep = [x for x in mm if x not in ('file:///*', '<all_urls>')]
    if not keep:
        keep = ['*://*/*']
    if mm != keep:
        cs['matches'] = keep
        changed = True
if changed:
    bak = mp + '.bak-codex'
    if not os.path.exists(bak):
        io.open(bak, 'w', encoding='utf-8').write(io.open(mp, encoding='utf-8').read())
    json.dump(m, open(mp, 'w'), ensure_ascii=False, indent=2)
    print('  manifest: 已去掉 file:// 匹配')
else:
    print('  manifest: 已是目标状态')

# b) 悬浮球只保留主按钮
cp_ = os.path.join(d, 'content_main.js')
if os.path.exists(cp_):
    s = io.open(cp_, encoding='utf-8').read()
    ins = ('\n/* codex: 悬浮球只保留主按钮 */\n'
           '.imt-fb-container > .btn-animate.imt-fb-action-button { display: none !important; }\n'
           '.imt-fb-container > .btn-animate { display: none !important; }\n')
    if 'codex: 悬浮球只保留主按钮' in s:
        print('  content_main.js: 已打过')
    else:
        mark = '"float_ball.css":`'
        if s.count(mark) != 1:
            print('  content_main.js: 找不到 float_ball.css 锚点，跳过（新版本结构可能变了）')
        else:
            s = s.replace(mark, mark + ins, 1)
            io.open(cp_, 'w', encoding='utf-8').write(s)
            print('  content_main.js: 已打补丁')
PY
  node --check "$EXT_DIR/content_main.js" 2>/dev/null || { echo "扩展 content_main.js 语法错误，已中止" >&2; exit 1; }
else
  echo "未发现扩展副本，跳过（需要的话在 Biscuit → 设置 → 扩展 里安装）"
fi

# --- 4) 重新打开 --------------------------------------------------------
say "启动 Biscuit ..."
open -a "$APP"
say "完成。"
