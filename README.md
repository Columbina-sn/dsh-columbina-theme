# 哥伦比娅 · 月隐银蓝（dsh-columbina-theme）

把 DeepSeek Harness 的 Web GUI 换成《原神》哥伦比娅（Columbina）的月隐银蓝渐变毛玻璃主题。

它不只是换色：还会把 agent 的人格改成哥伦比娅（可在侧边栏直接编辑）、给她一套 12 张官方表情包的高清化版本、把新会话欢迎页换成星眸头像 + 一句「今天的 token，能分我一口吗？」，并把输入框默认提示换成她的话。整页背景可以从 `Background/` 里选图、轮换、调淡化——**但仓库不附带任何背景图，需要你自己提供**。

> **非官方同人作品 / Unofficial fan project**
>
> 代码以 MIT 发布；哥伦比娅与《原神》的角色、名称、美术素材 © **miHoYo / HoYoverse**，**不在 MIT 范围内**。
>
> 本仓库包含 12 张官方表情的高清化，以及 1 张欢迎头像（原作者：抖音 **糯米不唐**，抖音号 `liurx665`），仅用于非商业同人演示；**不包含任何背景图**（`Background/` 只有说明文件）。权利人如认为素材使用不妥，请开 Issue，我会删除对应素材或整个仓库。详见 [NOTICE.md](NOTICE.md)。
>
> 与米哈游、HoYoverse、DeepSeek 无隶属、合作或背书关系。

> 这是一个**外观插件**：不修改 `app.asar`、不改 DSH 本体、不碰系统目录。所有效果都由插件自己的样式表、系统提示词 section 与 fenced 路由提供；卸载插件并刷新页面即可还原。

## 基于 dsh-cyrene-theme

本项目的宿主半/客户端半结构、fenced 路由、`rev` 乐观并发、槽位注册与三套自检脚本，来自 [**berhbro/dsh-cyrene-theme**](https://github.com/berhbro/dsh-cyrene-theme)（MIT）。

保留的是**架构**；重写的是主题配色、角色内容、路由前缀（`/cyrene` → `/columbina`）、状态文件名、默认人格、12 张官方表情、欢迎页头像与文案、主动贴表情 / 防连发设置，以及 README / NOTICE 的公开说明。

原项目版权归 **berhbro**；原 MIT 声明保留在 [LICENSE](LICENSE)。

## 目录

- [它做了什么](#它做了什么)
- [安装](#安装)
- [快速上手](#快速上手)
- [状态与设置](#状态与设置)
- [表情包](#表情包)
- [背景图（需要你自己提供）](#背景图需要你自己提供)
- [人格](#人格)
- [主题与界面](#主题与界面)
- [实现结构](#实现结构)
- [已知坑](#已知坑)
- [开发与自检](#开发与自检)
- [FAQ](#faq)
- [版权与致谢](#版权与致谢)

## 它做了什么

| 模块 | 行为 |
| --- | --- |
| 主题 UI | 客户端半注入一份作用域化样式表（`body[data-dsh-columbina][data-columbina-skin="on"]`）：月白 → 银蓝 → 深靛的渐变底、半透明表面 token、`backdrop-filter` 毛玻璃、银蓝描边与柔和阴影、银蓝滚动条与选区。全部随插件卸载自动还原。 |
| 人格 | 宿主半注册 `systemPrompt.section({ name: 'columbina:persona', ... })`，把哥伦比娅的默认人格插在部署人格前缀之后、工具策略之前。保存后重挂 section，下一轮对话立即生效。 |
| 侧边栏编辑器 | 向 `sidebar.footer.action` 注册「☾ 哥伦比娅」按钮，向 `settings.section` 注册「哥伦比娅 · 主题」整页；两处共用同一个编辑器。 |
| 表情包 | 包内 `meme/` 有 12 张官方表情（WebP，无字高清版），`stickers.json` 是清单。宿主半把清单拼成「【表情包】」说明附在人格之后，每张图的绝对路径整行写好；并开清单/字节路由。 |
| 主动贴表情 | 默认开启：在问候/问身份/道谢/累了/开心/难过/任务完成/被夸这些情绪节点，提示词鼓励主动贴一张，不必等用户要求；普通技术回复仍然不贴。可在侧边栏关闭。**这是提示词规则，不是消息拦截器。** |
| 防连发 | 默认开启「同一张表情最多连续 2 次」：如果最近两轮已经用过同一张，提示词会要求换一张或不贴。可在侧边栏关闭。**这是提示词规则，不是消息拦截器。** |
| 表情包管理器 | 编辑器里一行入口；打开是一整页管理器：加图、编辑已有表情的名字/触发词、隐藏/显示包内表情、删除自己加的图、调聊天贴图大小（48–240px）。自添加的图落在 `stickers-custom/`。 |
| 背景图 | `Background/` 是唯一真相：宿主半扫描目录并按文件名发字节；客户端在 `body` 上挂两层交叉淡入 + 色纱。支持选起点、自动轮换（15–3600 秒）、淡化（0.2–0.85）。**仓库不带图。** |
| 欢迎页 | 占用 `conversation.hero.brand.mark` 单占位槽，渲染 72px 圆形星眸头像 + 思源宋体欢迎语；字节走 `GET /columbina/hero`；整行纯装饰。 |
| 输入框占位 | 用纯 CSS 把原生占位染透明，再用 `::after` 写「月色正好，想做点什么？♪」；只对默认/欢迎页默认两个前缀生效。 |
| 持久化 | `/columbina/state`（GET 读 / POST 写），落盘到 `$DSH_HOME/columbina-theme.json`。写入带 `rev` 乐观并发：缺 `rev` → 400 `client-outdated`，过期 → 409 `stale`。 |
| 自检 | 宿主、客户端、对比度三套 smoke test；全部在临时 `DSH_HOME` 里跑，不碰真实 `~/.dsh`。 |

## 安装

要求：DSH 的 desktop（或 web）profile 能正常加载客户端插件；开发时在 **DSH 0.2.1-rc.2** 的 desktop profile 上验证过，其他版本以 DSH 槽位/API 兼容性为准。

从 GitHub 安装：

```powershell
dsh plugin --profile desktop add github:Columbina-sn/dsh-columbina-theme
```

本地开发时也可以直接装目录：

```powershell
dsh plugin --profile desktop add D:\path\to\dsh-columbina-theme
```

如果 `dsh` 不在 PATH，用 DSH 安装目录里的 `resources\runtime\cli\bin\dsh.cmd`，参数相同。

装完**刷新一次页面**（F5）：客户端半是页面加载时读的 bundle，不刷新还是旧的。宿主半的路由与人格 section 在 DSH 启动时载入；如果改了 `lib/index.js`，需要**重载插件行**或重启 DSH，单刷新页面不会更新宿主半。

卸载：

```powershell
dsh plugin --profile desktop remove dsh-columbina-theme
```

然后刷新页面。想同时清掉人格、表情包大小、背景与欢迎页设定，再删除状态文件：

```powershell
Remove-Item "$env:USERPROFILE\.dsh\columbina-theme.json" -ErrorAction SilentlyContinue
```

> 安装第三方插件等于在本机运行第三方代码，权限与你本人相同。这个包只读写自己的插件目录、`$DSH_HOME/columbina-theme.json` 和 `stickers-custom/`，不碰 DSH 安装目录与用户文档；但安装前仍建议先看一眼 `lib/index.js` 与 `lib/client.js`。

## 快速上手

1. 安装后按 F5，侧边栏最下方、设置按钮旁边会出现「☾ 哥伦比娅」；也可以在「设置 → 哥伦比娅 · 主题」打开同一份编辑器。
2. 编辑框里写的就是人格底稿；点「保存设定」，之后每一轮对话都按这段设定回答。
3. 顶部五个开关：**哥伦比娅人格**、**月隐银蓝主题**、**允许发表情包**、**主动贴表情**、**同一张最多连续 2 次**。
4. 「表情包管理」里可以加图、编辑已有表情、隐藏包内表情、删自己加的图、调聊天贴图大小。
5. 背景区：先把图片放进插件的 `Background/`，刷新页面；然后选「背景图 / 简约（无图）」、点缩略图选起点、按需开自动轮换和淡化。
6. 「恢复默认」把默认人格底稿填回编辑框（还要点一次保存）；「重新载入」丢弃未保存的改动。

### 改完之后什么时候生效

| 改的是什么 | 生效方式 |
| --- | --- |
| 人格 / 开关 / 背景设定（面板保存） | 立刻，下一轮对话按新设定 |
| `lib/client.js`（样式、面板、客户端规则） | 刷新页面（F5） |
| `lib/index.js`（路由、section、宿主规则） | 重载插件行或重启 DSH |
| `cordis.patch.yml` | 重载插件行或重启 DSH |
| `stickers.json` / `meme/` 素材 | 重载插件行；只调 `?reload=1` 只刷新清单，不重挂人格附录 |
| `proactive` 主动贴表情 / `noRepeat` 防连发 | 保存后立即生效；改的是宿主半规则，旧页面需重载插件行才能看到新提示词 |
| `Background/` 加图 / 删图 / 改名 | 刷新页面即可 |
| 手改状态文件 | 重载插件行或重启 DSH |

## 状态与设置

状态文件默认在 `$DSH_HOME/columbina-theme.json`（没有 `DSH_HOME` 时是 `~/.dsh/columbina-theme.json`）：

```json
{
  "persona": "……人格提示词……",
  "enabled": true,
  "theme": true,
  "stickers": true,
  "proactive": true,
  "noRepeat": true,
  "stickerSize": 128,
  "customStickers": [],
  "stickerOverrides": {},
  "hero": { "image": "meme/星眸.png", "title": "今天的 token，能分我一口吗？" },
  "background": { "enabled": true, "current": "", "rotate": false, "interval": 90, "dim": 0.6 },
  "rev": 3
}
```

| 字段 | 含义 |
| --- | --- |
| `persona` | 人格提示词；空字符串表示不注入人格。 |
| `enabled` | 人格总开关。 |
| `theme` | 主题开关。 |
| `stickers` | 表情包说明开关；关掉后人格正文里不再附「怎么贴」。 |
| `proactive` | 主动贴表情开关；默认 `true`。开启时提示词鼓励在问候/情绪节点主动贴一张。 |
| `noRepeat` | 防连发开关；默认 `true`。开启时提示词要求同一张最多连续 2 次。 |
| `stickerSize` | 聊天贴图最大边长，落盘前夹在 48–320，默认 128。 |
| `customStickers` | 面板里自添加的条目 `{ id, file, label, when }`；`file` 只是 `stickers-custom/` 下的文件名。 |
| `stickerOverrides` | 包内表情的改名/触发词覆盖/隐藏：`id -> { label?, when?, note?, hidden? }`；包内文件不动。 |
| `hero` | 欢迎页形象（包内相对路径）与欢迎语；图读不出来时 `hero.ready=false`，页面只显示文字。 |
| `background` | `enabled` 总开关、`current` 起点文件名（空串＝按目录顺序第一张）、`rotate`/`interval` 轮换、`dim` 色纱浓度。 |
| `rev` | 写入版本号，每次成功写入 +1；手工改文件时把它一起调大即可。 |

写入采用「先写临时文件再 rename」；两个窗口同时改时，旧 `rev` 会被 409 拒绝，不会互相覆盖。

## 表情包

`stickers.json` 是唯一真相：

```json
{
  "version": 1,
  "dir": "meme",
  "maxPerTurn": 1,
  "items": [
    {
      "id": "goodnight",
      "label": "晚安",
      "file": "meme/晚安.webp",
      "when": "仅深夜（23:00 后）收尾、劝用户去休息",
      "note": "合掌闭眼，蓝色蝶翼"
    }
  ]
}
```

当前 12 张：晚安、抱抱、期待、出发、好吃、思考、睡觉、困了、贴贴、好耶、唱歌、谢幕。素材来自 [米游社「官方表情包合集（哥伦比娅篇）」](https://www.miyoushe.com/ys/article/73065562)，放大到 1600×1600、转 WebP，**不加字**。官方页面那张 240×240 的 FES 动画 GIF 没有并入：它带深色方底，放进聊天会是一个黑方块。

### 聊天里怎么贴

宿主半会把每张图写成一行可照抄的 Markdown：

```markdown
- 晚安｜仅深夜（23:00 后）收尾、劝用户去休息 → ![哥伦比娅·晚安](<D:/path/to/dsh-columbina-theme/meme/晚安.webp>)
```

规则同时写进人格附录：

- **主动贴表情（默认开）**：在问候/问身份、道谢、累了/开心/难过、被夸时，主动贴一张，不必等用户要求。比如「你好」「你是谁」可以贴「期待」或「抱抱」；「谢谢」可以贴「贴贴」。
- **12 张都有明确触发场景**：晚安（23:00 后收尾）、抱抱（安慰）、期待（新开始/等好消息）、出发（开工/动手）、好吃（吃的/庆祝）、思考（权衡/怎么选）、睡觉（23:00 后熬夜）、困了（困/累，白天可用但别当晚安）、贴贴（谢谢/亲近）、好耶（真正的里程碑：功能完成/测试全绿/发布成功）、唱歌（心情好/想听歌）、谢幕（收尾/告别）。
- **中性池随机**：期待 / 出发 / 思考 / 唱歌 / 谢幕；没有强烈情绪、但想贴一张时，从这五张里随机选，不要固定同一张。
- **好耶降频**：日常小修、单个文件改动、每次提交都不贴「好耶」；只在真正的里程碑贴。
- 如果用户明确说「发个表情 / 贴一张」，就从清单里选一张最贴切的，不要再克制。
- 关掉「主动贴表情」后：默认不贴，大多数回复都不贴；只在情绪真的到了的时候贴（事情做成了、想鼓励你、想撒个娇、要道歉、被夸了）。
- 一次最多 1 张；不要每轮都贴。
- 06:00–18:00 白天不用「晚安」「睡觉」「困了」；这三张只在深夜用。
- **防连发（可关）**：同一张表情最多连续出现两次；最近两轮已经用过同一张，就换一张或不贴。
- 技术汇报、安装/回滚说明、命令列表旁边不贴；拿不准就不贴。

> 主动贴 + 防连发都是**提示词规则**，不是消息过滤器。插件不会拦截/改写已经生成的回复；模型仍可能违反规则。需要硬约束的话，得在客户端/宿主侧做消息级拦截，这不在本插件的范围内。

### 管理器

- 加图：选文件 → 转 data URL → `POST /columbina/stickers`；落盘到 `stickers-custom/`。
- 编辑：每张卡片都有「编辑」，可改名字和触发场景；包内素材写入 `stickerOverrides`，自定义项直接改状态文件，不动磁盘文件。
- 隐藏：包内表情不能删仓库文件，但可以「隐藏」；隐藏后人格清单里不再出现，管理器里可点「显示」恢复。
- 删除：只有自己加的图会真的删文件；包内素材没有删除按钮。
- 大小：48–240px 滑杆；默认 128px。
- 页面缩略图与聊天贴图都走宿主半字节路由（`/columbina/sticker/<id>`），不用 `file://`。
- 支持格式：`png` / `jpg` / `jpeg` / `gif` / `webp` / `avif`；单张 ≤ 8MB。

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
2. `.colu-bg`：两层图片交叉淡入 + 色纱；有图时才铺满视口。
3. 对话内容：有图时把用户气泡底色调厚、给正文一圈很淡的光晕；对话列本身保持透明，照片直接透上来。

## 人格

- 默认人格是哥伦比娅（《原神》愚人众十一执行官第三席，代号「少女」），口吻轻柔、缓慢、像月下低语；保留「工程严谨性不打折」的边界。
- section 名是 `columbina:persona`，不使用保留名 `deployment:persona`；order 落在部署人格前缀之后、`PLAN_POLICY(500)` 之前。
- 保存后「先卸再挂」section，下一轮对话立刻生效；不需要重载插件。
- 用户可以在侧边栏改成任何人格；改过之后以用户的版本为准。
- 关掉「启用哥伦比娅人格」或把人格清空，就不会注入 section。

## 主题与界面

| 角色 | 浅色 | 深色 |
| --- | --- | --- |
| 主文字 | `#1e2748` | `#edf0ff` |
| 品牌 / 主按钮 | `#5666c9` | `#9dabff` |
| 强调渐变 | `#8f9df2 → #b9a8ff` | `#7c8cf0 → #b9a8ff` |
| 页面渐变 | 月白 → 淡紫 → 冰蓝 | 深靛 → 夜蓝 → 暗紫 |
| 毛玻璃 | `blur(16px) saturate(160%)` | 同左 |

- 完整的 `--dsw-alias-*` token 覆写在 `lib/client.js` 的 `CSS` 段开头；改配色主要改浅色/深色两段、渐变、按钮、艺术字。
- 新会话欢迎语用思源宋体/华文宋体、字重 400、字距 2px，靛蓝 → 银灰渐变；深色主题反成浅银 → 淡靛。
- 欢迎语只用 `background-image` 设置渐变，**不要改回 `background` 简写**：简写会把 `background-clip:text` 重置为 `border-box`，整条渐变会铺成一个浅色方块（深色模式曾经踩过这个坑，已加回归测试）。
- 输入框占位用纯 CSS 的 `::after` 替换，不改 DOM、不碰宿主词典；只对「默认 / 欢迎页默认」两个前缀生效。

## 实现结构

```
┌──────────────────────────── DSH host ────────────────────────────┐
│ lib/index.js                                                     │
│  · systemPrompt.section('columbina:persona')                     │
│  · /columbina/state      状态读写（rev 乐观并发 + 落盘）              │
│  · /columbina/stickers   清单 / 上传 / 编辑 / 隐藏 / 删除             │
│  · /columbina/sticker/:id 字节（ETag / 304 / nosniff）             │
│  · /columbina/backgrounds、/background/:name 背景扫描/字节          │
│  · /columbina/hero       欢迎页头像字节                            │
│  · /columbina/report     活页面取证（只存内存）                       │
└──────────────────────────────────────────────────────────────────┘
                              ▲ fenced HTTP
┌──────────────────────────── Web client ──────────────────────────┐
│ lib/client.js                                                    │
│  · 注入作用域样式表（data-dsh-columbina + data-columbina-skin）      │
│  · sidebar.footer.action / settings.section / hero.brand.mark      │
│  · 编辑器、表情包管理器、背景层、欢迎页、占位提示                      │
└──────────────────────────────────────────────────────────────────┘
```

- 客户端半是手写的 CJS bundle，按 `window.__ModuleLoader__.load({ id, factory })` 约定包装，无构建步骤。
- 宿主半是 ESM；路由使用 DSH 的 fenced `webServer.register({ kind: 'prefix' })`。
- 状态写入必须带 `rev`；读盘失败/文件不存在时退回默认值，不阻塞插件加载。
- 自检用临时 `DSH_HOME`，不会碰真实配置。

### 路由

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET/POST | `/columbina/state` | 读/写状态；POST 必须带 `rev` |
| GET | `/columbina/stickers` | 表情包清单；`?reload=1` 强制重扫 |
| POST | `/columbina/stickers` | 上传自添加表情（data URL） |
| POST | `/columbina/stickers/update` | 改名字/触发词，或隐藏/显示包内表情 |
| POST | `/columbina/stickers/remove` | 删除自添加表情 |
| GET | `/columbina/sticker/<id>` | 单张表情字节（ETag/304） |
| GET | `/columbina/backgrounds` | 背景清单；`?reload=1` 强制重扫 |
| GET | `/columbina/background/<name>` | 单张背景字节 |
| GET | `/columbina/hero` | 欢迎页头像字节；不可用时 404 |
| POST/GET | `/columbina/report` | 活页面取证（只存内存） |

## 已知坑

- **不要给 `[data-shell-overlay]` 加 `backdrop-filter`。** 它是铺满整帧、永远存在的 overlay 层；给它加模糊，整个窗口都会发糊。毛玻璃只打在浮层的直接子元素上。
- **不要给 `[data-composer-card]` 本身加 `backdrop-filter`。** 发送键的 Tooltip 没开 portal、气泡是 `position:fixed`；卡片一旦成为 fixed 后代的包含块，鼠标停在发送键上时界面会闪。毛玻璃画在 `::before` 上。
- **不要给 `[data-sidebar-right-panel]` 加 `backdrop-filter`。** 它收起时布局宽度还在，那块区域会一直发雾。要打就打真正的窗格 `[data-dockkit-pane]` / `[data-dockkit-float]`。
- **不要给 `[data-conversation-scroll]` 加 `backdrop-filter`。** 输入框卡片在它里面，会重新触发上面那条 Tooltip 闪烁。
- **深色欢迎语不要用 `background` 简写。** 会重置 `background-clip:text`，渐变变成整块方块；用 `background-image` 并重新声明裁字/透明填充。
- **背景图默认没有。** 这是有意的：仓库不附带角色背景图；不放图时会用渐变底。
- **主动贴 / 防连发都是提示词规则。** 插件不拦截消息；模型仍可能违反。刚改完宿主半要重载插件行，否则模型看到的还是旧规则。
- **浮层面板要自己滚。** `.colu-overlay` 有 `max-height` + `overflow:hidden`；正文放在 `.colu-overlay-body`（`flex:1; min-height:0; overflow-y:auto`）里，否则背景缩略图一多就被截在视口底部。设置页有自己的滚动容器，不受影响。
- **客户端改了要 F5，宿主改了要重载插件行/重启。** 只刷新页面不会重载 `lib/index.js`。

## 开发与自检

```powershell
cd dsh-columbina-theme
node test/host.smoke.mjs
node test/client.smoke.mjs
node test/contrast.mjs
```

当前基线：

- 宿主 **114/114**
- 客户端 **128/128**
- 对比度 **31/31**

host 自检全部跑在临时目录里（脚本自己把 `DSH_HOME` 指过去，不碰真实的 `~/.dsh`）。client 自检用极简 DOM 桩，不会真的开浏览器。contrast 会按 WCAG 对比度检查正文、次级文字、语义状态色和主按钮。

### 加一张表情

1. 把图片放进 `meme/`（支持 png/jpg/jpeg/gif/webp/avif，单张 ≤8MB）。
2. 在 `stickers.json` 的 `items` 里加一条：`id`、`label`、`file`、`when`、`note`。
3. 重载插件行；只调 `/columbina/stickers?reload=1` 会刷新清单，但人格附录要重挂后才更新。

### 加一张背景

1. 把图片放进 `Background/`（≤24MB，推荐 2560×1440/16:9）。
2. 刷新页面；在「设置 → 哥伦比娅 · 主题」的缩略图条里选起点/开轮换。
3. 文件名只用于排序，不会执行；第一张是默认。

### 改主题

- 改 `lib/client.js` 的 `CSS` 段：浅色 token、深色 token、渐变、按钮、欢迎语艺术字。
- 改完 F5；客户端半没有构建步骤。
- 新增/修改颜色后跑 `node test/contrast.mjs`，别把正文对比度降到阈值以下。

## FAQ

**Q：安装后界面没变？**  
先 F5。客户端半是页面加载时读的；如果改了宿主半，还要重载插件行/重启 DSH。

**Q：为什么 `Background/` 是空的？**  
仓库不附带背景图。把你自己有授权的图放进去，刷新页面即可；没有图时用渐变底。

**Q：为什么表情包不显示？**  
先看「表情包管理」里是否 `missing` 为空；再确认 `stickers.json` 的 `file` 路径正确、格式在支持列表内。包内素材要重载插件行；自添加的图走 `stickers-custom/`。

**Q：为什么她不主动贴表情？**  
先看「主动贴表情」开关是否开着，再确认宿主半已经重载：这次规则在 `lib/index.js`，只 F5 不会更新宿主。重载插件行/重启 DSH 后再开新对话试试；普通技术回复仍然不会贴。

**Q：怎么关掉主动贴 / 同表情防连发？**  
设置里取消「主动贴表情」或「同一张最多连续 2 次」。默认都开启；关掉主动后回到“默认不贴”，关掉防连发后只保留“尽量别连续重复”。

**Q：怎么让哥伦比娅闭嘴 / 关掉主题？**  
设置里取消「启用哥伦比娅人格」或「月隐银蓝主题」；两个开关独立。

**Q：怎么完全重置？**  
卸载插件并删除 `$DSH_HOME/columbina-theme.json`；或者只删状态文件后重载插件行。

**Q：这是官方插件吗？**  
不是。非官方同人作品，与米哈游 / HoYoverse / DeepSeek 无隶属或背书关系。

## 版权与致谢

### 素材来源

| 文件 | 来源 / 作者 | 说明 |
| --- | --- | --- |
| `meme/*.webp` | [米游社「官方表情包合集（哥伦比娅篇）」](https://www.miyoushe.com/ys/article/73065562) / miHoYo | 高清化、无字版 |
| `meme/星眸.png` | 抖音 **糯米不唐**（抖音号 `liurx665`） | 圆形裁切与尺寸适配；版权归原作者 |
| `Background/*` | 用户自备，不随仓库分发 | 本项目不附带背景图 |

> `meme/星眸.png` 的原作者是抖音「**糯米不唐**」（抖音号：`liurx665`）。二次使用前请先获得原作者授权；如原作者要求，本仓库会删除该文件。

- **代码**：基于 [`berhbro/dsh-cyrene-theme`](https://github.com/berhbro/dsh-cyrene-theme)（MIT）改造，同样以 MIT 发布；原版权声明保留在 `LICENSE`。
- **角色与美术**：哥伦比娅（Columbina）及《原神》的角色形象、名称与美术素材版权归**米哈游（miHoYo / HoYoverse）**所有。`meme/` 的 12 张表情来自米游社官方表情包合集的高清化（无字版）；欢迎页头像 `meme/星眸.png` 的原作者是抖音「糯米不唐」（抖音号 `liurx665`）。
- **背景图**：不随仓库分发；用户自行提供的背景图由用户负责确认授权。
- **非官方**：与米哈游、HoYoverse、DeepSeek 及其关联方没有隶属、合作或背书关系。
- **侵权处理**：如果权利人认为本仓库中任何素材的使用不妥，请在 GitHub Issues 说明；收到通知后会尽快删除对应素材，必要时下线整个仓库并保留代码部分。

## License

代码以 **MIT** 发布，见 [LICENSE](LICENSE)。  
`meme/` 下的角色/表情/头像素材**不在 MIT 范围内**；`Background/` 不随仓库分发。详见 [NOTICE.md](NOTICE.md)。
