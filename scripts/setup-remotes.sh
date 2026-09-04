#!/usr/bin/env bash
# 配置 GitHub + Gitee 双远端，并推送代码
#
# 用法（Git Bash）：
#   1. 把下面两个变量改成你自己的用户名
#   2. bash scripts/setup-remotes.sh
#
# 前提：本机 SSH 公钥已添加到两个平台
#   查看公钥： cat ~/.ssh/id_ed25519.pub
#   GitHub： https://github.com/settings/keys
#   Gitee ： https://gitee.com/profile/sshkeys

set -euo pipefail

GITHUB_USER="your-github-name"   # ← 改成你的 GitHub 用户名
GITEE_USER="your-gitee-name"     # ← 改成你的 Gitee 用户名
REPO="kid-literacy"              # ← 仓库名（需与远端仓库同名）

if [ "$GITHUB_USER" = "your-github-name" ] || [ "$GITEE_USER" = "your-gitee-name" ]; then
  echo "❌ 请先编辑本脚本，把 GITHUB_USER / GITEE_USER 改成你自己的用户名"
  exit 1
fi

echo "▶ 配置远端..."
git remote remove github 2>/dev/null || true
git remote remove gitee  2>/dev/null || true
git remote remove all    2>/dev/null || true

git remote add github "git@github.com:${GITHUB_USER}/${REPO}.git"
git remote add gitee  "git@gitee.com:${GITEE_USER}/${REPO}.git"

# all = 一条命令推两边
git remote add all "git@github.com:${GITHUB_USER}/${REPO}.git"
git remote set-url --add all "git@gitee.com:${GITEE_USER}/${REPO}.git"

git branch -M main

echo "▶ 推送到 GitHub 与 Gitee..."
git push -u github main
git push -u gitee  main

echo ""
echo "✅ 推送完成！接下来："
echo "  GitHub Pages： https://github.com/${GITHUB_USER}/${REPO}/settings/pages"
echo "                → Source 选择 GitHub Actions，之后每次 push 自动部署"
echo "  访问地址：     https://${GITHUB_USER}.github.io/${REPO}/"
echo ""
echo "  Gitee Pages ： https://gitee.com/${GITEE_USER}/${REPO}/pages"
echo "                → 需实名认证，部署目录填 dist，手动点「启动 / 更新」"
echo "  访问地址：     https://${GITEE_USER}.gitee.io/${REPO}/"
echo ""
echo "  以后每次更新代码推送： git push all main"
