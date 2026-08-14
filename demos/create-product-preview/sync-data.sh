#!/bin/bash
# 修改 data.json 后运行此脚本，同步到 data.js（支持 file:// 直接打开预览）
DIR="$(cd "$(dirname "$0")" && pwd)"
printf 'window.PAGE_DATA = ' > "$DIR/data.js"
cat "$DIR/data.json" >> "$DIR/data.js"
printf ';\n' >> "$DIR/data.js"
echo "已同步 data.json -> data.js"
