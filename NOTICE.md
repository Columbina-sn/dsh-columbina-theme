# NOTICE / 版权与素材说明

## 代码

本仓库的源代码（`lib/`、`test/`、`tools/`、`cordis.patch.yml`、`package.json` 等）以 **MIT** 发布，基于 [**berhbro/dsh-cyrene-theme**](https://github.com/berhbro/dsh-cyrene-theme) 改造；原版权声明保留在 `LICENSE`。

上游项目提供的是架构与自检框架（宿主半/客户端半结构、fenced 路由、`rev` 乐观并发、槽位注册、三套 smoke test）；本仓库的主题、角色内容、配色、路由前缀、状态文件名、素材与默认人格由本项目重写。

## 素材（不在 MIT 范围内）

- `meme/*.webp`：来自 [米游社「官方表情包合集（哥伦比娅篇）」](https://www.miyoushe.com/ys/article/73065562) 的高清化、无字版，版权归 **miHoYo / HoYoverse**。
- `meme/星眸.png`：用户提供的欢迎页头像，版权归原作者 / miHoYo / HoYoverse；本仓库只做圆形裁切与尺寸适配。
- `Background/`：**仓库不包含任何背景图**，只有说明文件。用户自行放入的背景图由用户自行确认授权，本项目不再分发。

以上素材仅用于非商业同人界面美化，不是官方素材发布，也不代表官方立场。

## 非官方

本项目与米哈游（miHoYo）、HoYoverse、DeepSeek 及其关联方没有隶属、合作或背书关系。

## 侵权处理

如果权利人认为本仓库中任何素材的使用不妥，请在 GitHub Issues 中说明。收到通知后会尽快删除对应素材；必要时会连同整个仓库一起下线，保留代码部分。

## 安装前

安装第三方插件等于在本机运行第三方代码，权限与用户本人相同。请先审阅 `lib/index.js` 与 `lib/client.js`；本插件不修改 DSH 安装目录，不读取用户文档。
