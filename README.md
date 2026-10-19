# 哥伦比娅 · 月隐银蓝（dsh-columbina-theme）

把 DSH Web GUI 换成《原神》哥伦比娅（Columbina）的月隐银蓝渐变毛玻璃主题。除了皮肤，它还把 agent 的人格设定改成哥伦比娅（可在侧边栏直接改）、给她一套月下表情包、把新会话欢迎页的鱼换成她的月相头像，并把输入框的默认提示换成她的话；整页背景可以从 `Background/` 里选图、轮换、调淡化（**仓库不附带背景图，需自备**）。

这是 [`berhbro/dsh-cyrene-theme`](https://github.com/berhbro/dsh-cyrene-theme) 的**同构改色版**：宿主半、客户端半、路由、持久化、槽位、自检脚本的结构都保留，角色、文案、配色、素材与默认人格全部换成哥伦比娅。原项目代码以 MIT 发布，本仓库同样以 MIT 发布。

> **非官方同人作品 / Unofficial fan project**
>
> 代码以 MIT 发布；哥伦比娅与《原神》的角色、名称、美术素材 © **miHoYo / HoYoverse**，**不在 MIT 范围内**。
>
> 本仓库包含 12 张官方表情的高清化，以及 1 张欢迎头像（原作者：抖音 **糯米不唐**，抖音号 `liurx665`），仅用于非商业同人演示；**不包含任何背景图**（`Background/` 只有说明文件）。权利人如认为素材使用不妥，请开 Issue，我会删除对应素材或整个仓库。详见 [NOTICE.md](NOTICE.md)。
>
> 与米哈游、HoYoverse、DeepSeek 无隶属、合作或背书关系。

> 这是一个**外观插件**，不修改 `app.asar`、不改 DSH 本体、不碰系统目录。所有效果都由插件自己的样式表、系统提示词 section 与 fenced 路由提供；卸载插件并刷新页面即可还原。

## 基于 dsh-cyrene-theme

本项目的宿主半/客户端半结构、fenced 路由、`rev` 乐观并发、槽位注册与三套自检脚本，来自 [**berhbro/dsh-cyrene-theme**](https://github.com/berhbro/dsh-cyrene-theme)（MIT）。

保留的是**架构**；重写的是主题配色、角色内容、路由前缀（`/cyrene` → `/columbina`）、状态文件名、默认人格、12 张官方表情、欢迎页头像与文案。

原项目版权归 **berhbro**；原 MIT 声明保留在 [LICENSE](LICENSE)。

## 能力

| 部分 | 实现 |
| --- | --- |
| 主题 UI | 客户端半注入一份作用域化样式表（`body[data-dsh-columbina][data-columbina-skin="on"]`）：月白 → 银蓝 → 深靛的渐变底、半透明表面 token、`backdrop-filter` 毛玻璃、银蓝描边与柔和阴影、银蓝滚动条与选区。全部随插件卸载自动还原。`--dsw-alias-bg-base` 被设成 `transparent`，渐变由 `body::before` 铺满视口；桌面版窗口带原生 acrylic 材质，所以 `html` 画布上补了一层不透明底色，避免整窗透出系统模糊。 |
| 人格设定 | 宿主半注册 `systemPrompt.section({ name: 'columbina:persona', order: 部署人格前缀 order + 100 })`。section 名用本包自己的 `columbina:persona`，不占用保留名 `deployment:persona`；每次保存后重挂，改完立刻对之后每一轮对话生效，不需要重载插件。 |
| 侧边栏编辑 | 客户端半向 `sidebar.footer.action` 注册「☾ 哥伦比娅」按钮，向 `settings.section` 注册「哥伦比娅 · 主题」整页；两处共用同一个编辑器。 |
| 表情包 | 包内 `meme/` 有 12 张官方哥伦比娅表情（WebP，无字版），`stickers.json` 是清单（id / 名称 / 使用时机 / 文件）。宿主半把清单拼成一段「【表情包】」说明附在人格之后，每张图的绝对路径整行写好；并开 `GET /columbina/stickers`（清单，支持 `?reload=1`）与 `GET /columbina/sticker/<id>`（字节，带 ETag/304）。关掉表情包开关后这段说明不再注入。 |
| 表情包管理 | 编辑器里只有一行入口；点开是一整页管理器：加图（选文件 → data URL → `POST /columbina/stickers`）、删图（只删自己加的）、调大小（48–240px 滑杆）。自添加的图落在 `stickers-custom/`，条目存进状态文件。 |
| 背景图 | `Background/` 是唯一真相：宿主半扫描（`GET /columbina/backgrounds`，支持 `?reload=1`）并按文件名发字节（`GET /columbina/background/<文件名>`）。客户端在 `body` 上挂一层 `.colu-bg`（`position:fixed;inset:0;z-index:-1;pointer-events:none`）：两层交叉淡入 + 色纱。控制板可二选一（背景图 / 简约）、点缩略图选起点、开自动轮换（15–3600 秒）、拖淡化（0.2–0.85）。 |
| 持久化 | 宿主半自带 `/columbina/state`（GET 读 / POST 写），落盘到 `$DSH_HOME/columbina-theme.json`（默认 `~/.dsh/columbina-theme.json`）。写入走乐观并发：必须带 GET 拿到的 `rev`；缺 `rev` → 400 `client-outdated`，`rev` 过期 → 409 `stale`。 |
| 新会话欢迎页 | 客户端半占用 `conversation.hero.brand.mark` 单占位槽，渲染 72px 的圆形星眸头像（`meme/星眸.png`）+ 思源宋体/华文宋体的「今天的 token，能分我一口吗？」。字节走 `GET /columbina/hero`；整行 `pointer-events:none` + `user-select:none`，纯装饰。 |
| 输入框占位提示 | 原生占位写在 `[data-composer-placeholder]` 的文本节点里，没有 i18n 覆盖口子。用纯 CSS 把原字染透明，再用 `::after` 写「月色正好，想做点什么？♪」；闸门只认「默认 / 欢迎页默认」两个前缀，其他状态提示原样保留。 |

## 安装

从 GitHub 安装：

```powershell
dsh plugin --profile desktop add github:Columbina-sn/dsh-columbina-theme
```

本地开发时也可以直接装目录：

```powershell
dsh plugin --profile desktop add D:\path\to\dsh-columbina-theme
```

如果 `dsh` 不在 PATH，用 DSH 安装目录里的 `resources\runtime\cli\bin\dsh.cmd`，参数相同。

装完**刷新一次页面**（F5）：客户端半是页面加载时读的 bundle，不刷新还是旧的。宿主半的路由与人格 section 在 DSH 启动时载入；如果只想重载插件行，也可以从插件管理里重载，不必重启整个应用。

卸载：

```powershell
dsh plugin --profile desktop remove dsh-columbina-theme
```

然后刷新页面。想同时清掉人格与背景设定，再删除状态文件：

```powershell
Remove-Item "$env:USERPROFILE\.dsh\columbina-theme.json" -ErrorAction SilentlyContinue
```

> 安装任何第三方插件都等于在本机运行第三方代码，权限与你本人相同。这个包只读写自己的插件目录、`$DSH_HOME/columbina-theme.json` 和 `stickers-custom/`，不碰 DSH 安装目录与用户文档；但安装前仍建议先看一眼 `lib/index.js` 与 `lib/client.js`。

## 使用

1. 侧边栏最下方、设置按钮旁边点「☾ 哥伦比娅」打开人格面板；也可以在「设置 → 哥伦比娅 · 主题」里打开同一份编辑器。
2. 编辑框里写的就是人格底稿；点「保存设定」后，之后每一轮对话都按这段设定回答（旧对话也一样）。
3. 三个开关：**哥伦比娅人格**、**月隐银蓝主题**、**允许发表情包**。
4. 「表情包管理」里可以加图、删自己加的图、调聊天贴图大小。
5. 背景区：先把图片放进 `Background/`（**仓库不附带**）；「背景图 / 简约（无图）」二选一；点缩略图选起点；「自动轮换」按间隔在页面里换图（不写状态）；「淡化」控制压在照片上的色纱浓度。
6. 「恢复默认」把默认人格底稿填回编辑框（还要点一次保存才生效）；「重新载入」丢弃未保存的改动。

### 改完之后什么时候生效

| 改的是什么 | 生效方式 |
| --- | --- |
| 人格底稿 / 开关 / 背景设定（面板里保存） | 立刻，之后每一轮对话都按新设定 |
| `lib/client.js`（样式、面板） | 刷新页面（F5） |
| `lib/index.js`（路由、section） | 重载插件行或重启 DSH |
| `cordis.patch.yml` | 重载插件行或重启 DSH |
| `hero.image` / 欢迎语 | 重载插件行或重启 DSH（宿主启动时读一次） |
| `Background/` 加图 / 删图 / 改名 | 刷新页面即可（页面每次带 `reload=1` 重扫） |
| 手改状态文件里的 `background` | 重载插件行或重启 DSH |

## 状态文件

```json
{
  "persona": "……人格提示词……",
  "enabled": true,
  "theme": true,
  "stickers": true,
  "stickerSize": 128,
  "customStickers": [],
  "hero": { "image": "meme/星眸.png", "title": "今天的 token，能分我一口吗？" },
  "background": { "enabled": true, "current": "", "rotate": false, "interval": 90, "dim": 0.6 },
  "rev": 3
}
```

- `persona`：空字符串表示不注入人格。
- `enabled`：人格总开关；`theme`：主题开关；`stickers`：表情包说明开关。
- `stickerSize`：聊天贴图最大边长（落盘前夹在 48–320）。
- `customStickers`：面板里自添加的条目（`{ id, file, label, when }`，`file` 只是 `stickers-custom/` 下的文件名）。
- `hero`：欢迎页形象（包内相对路径）与欢迎语；图读不出来时 `hero.ready=false`，页面只显示欢迎语。
- `background`：`enabled` 总开关、`current` 起点文件名（空串＝按目录顺序第一张）、`rotate` / `interval` 轮换、`dim` 色纱浓度。
- `rev`：写入版本号，每次成功写入 +1。手工改这个文件时把 `rev` 一起调大即可。

出问题时最快的还原手段：删掉状态文件并重载插件行。

## 表情包

`stickers.json` 是唯一真相：

```json
{
  "version": 1,
  "dir": "meme",
  "maxPerTurn": 1,
  "items": [
    { "id": "goodnight", "label": "晚安", "file": "meme/晚安.webp",
      "when": "深夜收尾、劝用户去休息", "note": "合掌闭眼，蓝色蝶翼" }
  ]
}
```

当前 12 张：晚安、抱抱、期待、出发、好吃、思考、睡觉、困了、贴贴、好耶、唱歌、谢幕。素材来自 [米游社官方表情包合集（哥伦比娅篇）](https://www.miyoushe.com/ys/article/73065562)，统一放大到 1600×1600、转 WebP，**不加字**。官方页面里那张 240×240 的 FES 动画 GIF 没有并入：它带深色方底，放进聊天会是一个黑方块；需要的话可以单独处理。换图/加图只改 `stickers.json` 与 `meme/`；模型看到的每张图都是一行可照抄的 Markdown：

```markdown
- 晚安｜深夜收尾、劝用户去休息 → ![哥伦比娅·晚安](<D:/DSH_work/dsh-columbina-theme/meme/晚安.webp>)
```

规矩写在说明里：默认不贴、大多数回复都不贴；一次最多 1 张；只在情绪真的到了的时候贴；06:00–18:00 白天不用「晚安」「睡觉」「困了」；同一张不连续重复；代码/命令/报错旁边不贴；必须单独占一行（`dsh-client-ui-chat` 只把独立成行的图片渲染成预览）。

页面里的缩略图与聊天贴图都走宿主半的字节路由；不要用 `file://`——页面是 http 来源，本地路径在浏览器里加载不出来。

## 背景图（需要你自己提供）

**仓库不包含任何背景图。** `Background/` 里只有一份 [README.md](Background/README.md)，图片已被 `.gitignore` 排除，不会被提交。

把图片直接放进 `Background/`：

- 支持：`png` / `jpg` / `jpeg` / `gif` / `webp` / `avif`
- 单张上限：24 MB
- 推荐：**2560×1440 或更大，16:9**
- 文件名只用于排序与识别，不会执行；按文件名排序，第一张是默认起点。

插件用 CSS `background-size: cover` 自动铺满窗口，不需要手动裁切成固定比例；横窗、竖窗都会按窗口裁切，不留白。加图/换图后刷新页面，就能在「设置 → 哥伦比娅 · 主题」的缩略图条里看到。没有图片时主题使用自带的月白 → 银蓝渐变底，人格、表情包、欢迎页都不受影响。

三层结构：

1. `body::before` / `body::after`：主题自带的渐变底与顶部珠光。
2. `.colu-bg`：两层图片交叉淡入 + 色纱，有图时才铺满视口。
3. 对话内容：有图时把用户气泡底色调厚、给正文一圈很淡的光晕；对话列本身保持透明，照片直接透上来。

## 配色

| 角色 | 浅色 | 深色 |
| --- | --- | --- |
| 主文字 | `#1e2748` | `#edf0ff` |
| 品牌 / 主按钮 | `#5666c9` | `#9dabff` |
| 强调渐变 | `#8f9df2 → #b9a8ff` | `#7c8cf0 → #b9a8ff` |
| 页面渐变 | 月白 → 淡紫 → 冰蓝 | 深靛 → 夜蓝 → 暗紫 |
| 毛玻璃 | `blur(16px) saturate(160%)` | 同左 |

完整的 `--dsw-alias-*` token 覆写在 `lib/client.js` 的 `CSS` 段开头；改配色只需要改那两段（浅色 / 深色）与渐变、按钮、艺术字几处。`test/contrast.mjs` 会按 WCAG 对比度检查正文、次级文字、语义状态色和主按钮。

## 已知坑（改样式前务必看）

- **不要给 `[data-shell-overlay]` 加 `backdrop-filter`。** 它是铺满整帧、永远存在的 overlay 层；给它加模糊，整个窗口都会发糊。毛玻璃只打在浮层的直接子元素上。
- **不要给 `[data-composer-card]` 本身加 `backdrop-filter`。** 发送键的 Tooltip 没开 portal、气泡是 `position:fixed`；卡片一旦成为 fixed 后代的包含块，鼠标停在发送键上时界面会闪。毛玻璃画在 `::before` 上。
- **不要给 `[data-sidebar-right-panel]` 加 `backdrop-filter`。** 它收起时布局宽度还在，那块区域会一直发雾。要打就打真正的窗格 `[data-dockkit-pane]` / `[data-dockkit-float]`。
- **不要给 `[data-conversation-scroll]` 加 `backdrop-filter`。** 输入框卡片在它里面，会重新触发上面那条 Tooltip 闪烁。
- 桌面窗口是 Electron 原生 acrylic；`--dsw-alias-bg-base: transparent` 必须配 `html` 画布的不透明底色，否则整窗透出系统模糊。

以上几条在 `test/client.smoke.mjs` 里都有回归断言。

## 自检

```powershell
cd dsh-columbina-theme
node test/host.smoke.mjs
node test/client.smoke.mjs
node test/contrast.mjs
```

当前基线：宿主 **99/99**、客户端 **123/123**、对比度 **31/31**。host 自检全部跑在临时目录里（脚本自己把 `DSH_HOME` 指过去，不碰真实的 `~/.dsh`）。

## 目录

```
dsh-columbina-theme/
  package.json          dsh.bundle.patch + dsh.client（platform: web）
  cordis.patch.yml      插件树插入声明
  lib/index.js          宿主半：人格 section + /columbina/* 路由 + 状态落盘
  lib/client.js         客户端半：样式表 + 三个槽位 + 面板 + 背景层
  Background/           空目录 + README（背景图自备，仓库不附带图片）
  stickers.json         表情包清单
  meme/                 12 张官方表情（WebP）+ 星眸.png（欢迎页头像）
  test/                 宿主 / 客户端 / 对比度自检
  tools/                表情包改名与预览脚本（开发用，不参与运行）
  LICENSE               MIT
```

## 版权与致谢

### 素材来源

| 文件 | 来源 / 作者 | 说明 |
| --- | --- | --- |
| `meme/*.webp` | [米游社「官方表情包合集（哥伦比娅篇）」](https://www.miyoushe.com/ys/article/73065562) / miHoYo | 高清化、无字版 |
| `meme/星眸.png` | 抖音 **糯米不唐**（抖音号 `liurx665`） | 圆形裁切与尺寸适配；版权归原作者 |
| `Background/*` | 用户自备，不随仓库分发 | 本项目不附带背景图 |

> `meme/星眸.png` 的原作者是抖音「**糯米不唐**」（抖音号：`liurx665`）。二次使用前请先获得原作者授权；如原作者要求，本仓库会删除该文件。

- **代码**：基于 [`berhbro/dsh-cyrene-theme`](https://github.com/berhbro/dsh-cyrene-theme)（MIT）改造，同样以 MIT 发布；原版权声明保留在 `LICENSE`。
- **角色与美术**：哥伦比娅（Columbina）及《原神》的角色形象、名称与美术素材版权归**米哈游（miHoYo / HoYoverse）**所有。`meme/` 的 12 张表情来自 [米游社官方表情包合集（哥伦比娅篇）](https://www.miyoushe.com/ys/article/73065562) 的高清化（无字版）；欢迎页头像 `meme/星眸.png` 的原作者是抖音「糯米不唐」（抖音号 `liurx665`）。`Background/` 不随仓库分发，用户自行提供的背景图由用户负责。仅用于非商业同人美化，不是官方素材发布。
- **非官方**：与米哈游、HoYoverse、DeepSeek 及其关联方没有隶属、合作或背书关系。
- **侵权请联系删除**：如果权利人认为本仓库中任何素材的使用不妥，请删除对应文件或整个仓库。
