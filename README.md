# 🌈 小小识字乐园

> 给 **4-10 岁**孩子的双语识字启蒙应用：汉字 **600 字**（4 级）+ 英语 **173 词**（10 类），
> 带拼音、部首、组词、例句、标准语发音、闯关游戏和学习进度记录。

纯前端、零后端、离线可用、无广告、不收集任何数据。一份代码同时部署到 **GitHub Pages** 和 **Gitee Pages**。

![首页](docs/screenshot-home.png)

---

## ✨ 功能一览

### 🇨🇳 汉字王国（4 级 · 600 字）

| 级别 | 适合年龄 | 内容 | 字数 |
| --- | --- | --- | --- |
| 🌱 启蒙篇 | 4-5 岁 | 象形字、数字、身体、自然、天气、动作 | 90 |
| 🌿 进阶篇 | 5-6 岁 | 一年级上册常用字、颜色、动物、食物、动作 | 160 |
| 🌳 提升篇 | 6-8 岁 | 四季、家人称谓、生活用品、学习用品、心理 | 180 |
| 🏆 挑战篇 | 8-10 岁 | 城乡、职业、抽象概念、时间、品质 | 170 |

每张识字卡包含：**田字格大字号** · 拼音 · 部首 · 笔画数 · 组词（可点读）· 例句（可点读）· 一键朗读。

### 🔤 英语乐园（10 类 · 173 词）

动物朋友 · 颜色形状 · 美味食物 · 数字数学 · 我的身体 · 我的家人 · 学校用品 · 大自然 · 动作情绪 · 我的家

每个单词卡包含：**大号单词** · 国际音标 · 中文释义 · 插图 emoji · 例句 + 中英对照 · 美式发音朗读。

### 🎮 闯关游戏（4 种玩法）

| 玩法 | 说明 | 适用 |
| --- | --- | --- |
| 🎧 听音辨字 | 播放发音，从 4 个选项中选出正确的字/词 | 汉字 + 英语 |
| 🖼️ 看图选词 | 看插图，选出对应的字/词 | 汉字 + 英语 |
| 💬 组词选字 / 中文选词 | 汉字看词语选字，英语看中文选词 | 汉字 + 英语 |
| 🔠 字母拼写 | 把打乱的字母拼成单词 | 仅英语 |

每关 10 题，即时反馈 + 语音鼓励，**同一题答对 3 次自动标记为「已掌握」**。

### ✍️ 描红练习（汉字专属）

田字格描红，手指 / 鼠标直接书写，支持撤销、清空、保存作品。大字描红配拼音与组词，帮助孩子形成书写记忆。

### 🎬 笔顺动画（SVG · 汉字专属）

点「看笔顺」即用 **hanzi-writer** 把每个字按真实笔顺逐笔演示（渲染为 SVG，可调速、可循环），看完再描红，书写更规范。
> 笔顺数据在运行时从 CDN 加载，首次观看需联网；离线时自动提示，其余功能不受影响。

### 🎧 听写模式（汉字专属）

「听写练习」播放一句挖空的话（本字不发音，留出听写空缺），孩子从 4 个候选字里把空补上。
听错有鼓励、连对计入进度，是复习字词的趣味方式。

### 📕 错题专项复习

家长中心的**错字本**里点「去练习」即可进入错题闯关——题目只从答错过的字/词里抽取，**答对自动移出错字本**，让错题真正练回来。

### 👨‍👩‍👧 家长中心

- 学习总览：已学字数/词数、已掌握数、累计正确率、连续学习天数
- 最近 7 天学习量柱状图
- **错字本**：自动收集答错的内容，按错误次数排序，一键「去练习」进入错题闯关
- 分级进度：每一级/每一类的完成度
- 设置：孩子昵称、朗读语速、自动朗读开关
- 数据管理：导出/导入 JSON 备份、清空记录

### 📱 PWA 可安装到桌面

支持添加到主屏幕 / 桌面，安装后像原生 App 一样全屏运行。Service Worker 让应用**离线也能打开**，无需联网即可学习。

---

## 🛠 技术栈

| 项目 | 选型 | 说明 |
| --- | --- | --- |
| 框架 | Vue 3（Composition API + `<script setup>`） | 组件化、体积小 |
| 构建 | Vite 6 | 秒级热更新 |
| 路由 | Vue Router 4（**hash 模式**） | 静态托管刷新不 404 |
| 状态 | Pinia + localStorage | 学习进度本地持久化 |
| 语音 | Web Speech API | 浏览器原生 TTS，零依赖、可离线 |
| PWA | Manifest + Service Worker | 可安装到桌面，离线可用 |
| 样式 | 原生 CSS（CSS 变量 + 动画） | 无 UI 框架，产物极小 |

> 为什么用 hash 路由？GitHub Pages / Gitee Pages 都没有服务端重写规则，
> history 模式刷新子页面会 404。配合 `base: './'` 相对路径，
> 同一份 `dist` 产物在两边（含子路径）都能直接跑。

---

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 本地开发（默认 http://localhost:5173）
npm run dev

# 构建产物到 dist/
npm run build

# 本地预览构建产物
npm run preview
```

要求 Node.js 18+（推荐 20 LTS）。

---

## 📦 部署到 GitHub Pages

### 方式一：GitHub Actions 自动部署（推荐，已内置）

1. 推送代码到 GitHub 仓库（默认分支 `main`）
2. 仓库 → **Settings** → **Pages** → **Source** 选择 **GitHub Actions**
3. 之后每次 `git push` 到 `main`，`.github/workflows/deploy-pages.yml` 会自动构建并发布

访问地址：`https://<你的用户名>.github.io/kid-literacy/`

### 方式二：手动部署 dist

```bash
npm run build
npx gh-pages -d dist     # 需要先 npm i -D gh-pages
```

---

## 📦 部署到 Gitee Pages

> ⚠️ Gitee Pages 需要先完成**实名认证**才能开通。

1. 在 Gitee 新建仓库（建议同名 `kid-literacy`，**选择开源**）
2. 推送代码
3. 仓库 → **服务** → **Gitee Pages** → 选择分支 `main`、部署目录留空或填 `dist`
   - 若部署目录留空（部署源码），需要先在本地 `npm run build` 并把 `dist` 一并提交
   - 推荐：本地构建后提交 `dist`，部署目录填 `dist`
4. 点击「启动」，得到 `https://<你的用户名>.gitee.io/kid-literacy/`

Gitee Pages 免费版**不会自动更新**，代码更新后需要回到 Gitee Pages 页面手动点一次「更新」。

---

## 🔧 同时推送 GitHub + Gitee

```bash
# 一次性配置两个远端
git remote add github git@github.com:<你的GitHub用户名>/kid-literacy.git
git remote add gitee  git@gitee.com:<你的Gitee用户名>/kid-literacy.git

# 之后每次推送
git push github main
git push gitee  main

# 或者一条命令推两边
git remote add all git@github.com:<你的GitHub用户名>/kid-literacy.git
git remote set-url --add all git@gitee.com:<你的Gitee用户名>/kid-literacy.git
git push all main
```

> 使用 SSH 前请确保公钥已添加到两个平台：
> `cat ~/.ssh/id_ed25519.pub`
> GitHub：Settings → SSH and GPG keys → New SSH key
> Gitee：设置 → SSH 公钥

---

## 📁 目录结构

```
kid-literacy/
├── index.html
├── vite.config.js          # base: './' 兼容两边 Pages 子路径
├── package.json
├── .github/
│   └── workflows/
│       └── deploy-pages.yml # GitHub Pages 自动部署
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── router/index.js      # hash 路由
│   ├── store/progress.js    # Pinia + localStorage 进度
│   ├── utils/speech.js      # Web Speech API 封装
│   ├── styles/global.css    # 设计变量与动画
│   ├── data/
│   │   ├── hanzi.js         # 汉字分级词库（600 字）
│   │   └── english.js       # 英语分类词库（173 词）
│   └── scripts/
│       └── check-data.mjs   # 词库自检（npm run check）
│   ├── components/
│   │   ├── AppHeader.vue
│   │   └── GroupCard.vue
│   └── views/
│       ├── HomeView.vue
│       ├── HanziHomeView.vue
│       ├── HanziLearnView.vue   # 汉字学习卡（田字格）
│       ├── EnHomeView.vue
│       ├── EnLearnView.vue      # 单词学习卡
│       ├── GameView.vue         # 4 种闯关玩法
│       ├── TraceView.vue        # 描红练习 + 笔顺动画
│       ├── DictationView.vue    # 听写模式
│       └── ParentView.vue       # 家长中心
└── docs/                    # 截图（可选）
```

---

## 📝 如何扩充词库

**汉字** —— 编辑 `src/data/hanzi.js`，在对应级别的数组里追加一行：

```js
['字', 'zì', '子', 6, ['汉字', '写字'], '我在学习汉字。', '📝']
//  ↑汉字 ↑拼音 ↑部首 ↑笔画 ↑组词数组      ↑例句            ↑emoji
```

**英语** —— 编辑 `src/data/english.js`，在对应分类里追加：

```js
['word', '/wɜːd/', '单词', '🔠', 'This word is easy.', '这个单词很简单。']
//  ↑单词  ↑音标   ↑中文  ↑emoji  ↑英文例句           ↑中文翻译
```

数据结构在文件底部的 `normalize()` 中映射为对象，新增字段只需同步改那里。

---

## 🌐 浏览器兼容

| 浏览器 | 支持 |
| --- | --- |
| Chrome / Edge 90+ | ✅ 完整（含朗读） |
| Safari 14+ | ✅ 完整（含朗读） |
| Firefox 90+ | ✅ 完整（含朗读） |
| 微信内置浏览器 | ✅ 可用（iOS 朗读受系统限制） |
| 老旧浏览器 | ⚠️ 识字卡可用，朗读自动降级 |

语音朗读依赖 Web Speech API，不支持时首页会提示，其余功能不受影响。

---

## 🤝 贡献

欢迎 PR：补充词库、增加新级别、优化无障碍、补充多语言。

提交前请确保 `npm run build` 通过。

---

## 📄 开源协议

[MIT](LICENSE) —— 可自由使用、修改和分发。

词库内容（拼音、部首、笔画、例句）依据通用小学语文教材整理，仅供学习交流使用。
