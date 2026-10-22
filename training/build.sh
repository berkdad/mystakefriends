#!/usr/bin/env bash
# Rebuilds the training PDFs from the HTML mockups.
# Usage (Git Bash, from anywhere):  bash training/build.sh
# Output: training/out/*.pdf   (screenshots go to training/shots/<lang>/)
set -euo pipefail

cd "$(dirname "$0")"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
ROOT="$(pwd -W 2>/dev/null || pwd)"

shot() { # shot <url> <out.png> <width> <height> <scale>
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --force-device-scale-factor="$5" --window-size="$3,$4" \
    --screenshot="$ROOT/$2" "$1" 2>/dev/null
}

# Centered pages (login card, modals) are captured through a wrapper that
# shows the 1280x860 page in an iframe shifted so only the middle is visible.
crop() { # crop <lang> <name> <winW> <winH> <shiftX> <shiftY> [iframeH]
  local wrap="shots/$1/_crop-$2.html"
  cat > "$wrap" <<EOF
<body style="margin:0;overflow:hidden"><iframe src="../../mockups/$1/$2.html" style="border:0;width:1280px;height:${7:-860}px;transform:translate(-$5px,-$6px);transform-origin:0 0"></iframe></body>
EOF
  shot "file:///$ROOT/$wrap" "shots/$1/$2.png" "$3" "$4" 1.5
  rm -f "$wrap"
}

for lang in en es; do
  mkdir -p "shots/$lang"
  for f in app-login app-dashboard app-chat app-activities app-info-dialog app-no-circle app-notif-banner; do
    shot "file:///$ROOT/mockups/$lang/$f.html" "shots/$lang/$f.png" 490 990 2
  done
  for f in web-admin-dashboard web-friends-tab web-circle-builder; do
    shot "file:///$ROOT/mockups/$lang/$f.html" "shots/$lang/$f.png" 1280 860 1.5
  done
  crop "$lang" web-login          ${LOGIN_CROP:-640 700 320 80}
  crop "$lang" web-setup-password ${SETUP_CROP:-640 760 320 50}
  crop "$lang" web-golive-modal   ${GOLIVE_CROP:-760 1080 260 20 1150}
  crop "$lang" web-announcements-modal ${ANN_CROP:-760 760 260 50}
done

mkdir -p out
pdf() { "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="$ROOT/out/$2" "file:///$ROOT/$1" 2>/dev/null; }
pdf admin-guide.en.html  "MyStakeFriends-Admin-Guide.pdf"
pdf member-guide.en.html "MyStakeFriends-Member-QuickStart.pdf"
pdf admin-guide.es.html  "MyStakeFriends-Guia-Administradores.pdf"
pdf member-guide.es.html "MyStakeFriends-Guia-Miembros.pdf"
ls -la out
