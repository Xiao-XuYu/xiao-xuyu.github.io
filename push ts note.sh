# 获取脚本文件的目录
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
# 切换到脚本文件的目录
cd "$SCRIPT_DIR"
git pull
git add -A
git commit -m "update"
git push
sleep 1