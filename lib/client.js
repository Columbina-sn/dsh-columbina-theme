/**
 * dsh-columbina-theme — 客户端半（Client half）。
 *
 * 这是一个**手写的 CJS bundle**，按 DSH 客户端的 module-loader 约定包装：
 *   window.__ModuleLoader__.load({ id, factory })
 * factory 里写普通 CommonJS，导出 `apply(ctx)` 与 `inject`（无需 JSX / TS / 构建）。
 * 本包不需要 React 之外任何外部模块；React 只为两个槽位组件服务，
 * 拿不到时主题照常生效（只是没有侧边栏入口）。
 *
 * 客户端半做三件事：
 *  1. 注入一份作用域化样式表（月隐银蓝渐变 + 毛玻璃 + 完整 --dsw-alias-* token 覆写）。
 *  2. 给 body 打上 data-dsh-columbina / data-columbina-skin 作用域；卸载时全部还原。
 *  3. 通过宿主半自己的 fenced 路由 /columbina/state 读写人格设定，
 *     并把编辑器挂到 sidebar.footer.action 与 settings.section 两个槽位。
 *  4. 两处对话界面微调（不跟主题开关走，见 CSS 末尾一段）：
 *     用 conversation.hero.brand.mark 把新会话欢迎页的鱼换成哥伦比娅的形象 + 艺术字欢迎语；
 *     用 CSS 把输入框的默认占位提示换成哥伦比娅的招呼语。
 */
window.__ModuleLoader__.load({
  id: "dsh-columbina-theme",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    /** 与 package.json 的 name 一致（module id 与归属标记）。 */
    const PACKAGE_ID = "dsh-columbina-theme";
    /** 插件作用域属性：只要插件在，body 上就有它。 */
    const BODY_ATTR = "data-dsh-columbina";
    /** 主题开关属性：on / off。 */
    const SKIN_ATTR = "data-columbina-skin";
    /** 宿主半路由：<base>/columbina/state。 */
    const API_PATH = "columbina/state";
    /** 活页面取证路由：<base>/columbina/report（诊断用，只存宿主内存）。 */
    const REPORT_PATH = "columbina/report";
    /** 表情包清单：<base>/columbina/stickers。 */
    const STICKERS_PATH = "columbina/stickers";
    /** 单张表情包字节：<base>/columbina/sticker/<id>（宿主半只服务包内文件）。 */
    const STICKER_PATH = "columbina/sticker";
    /** 新会话欢迎页的形象字节：<base>/columbina/hero（同样是包内文件）。 */
    const HERO_PATH = "columbina/hero";
    /** 背景图清单：<base>/columbina/backgrounds（Background/ 目录的实时扫描结果）。 */
    const BACKGROUNDS_PATH = "columbina/backgrounds";
    /** 单张背景字节：<base>/columbina/background/<文件名>（只能取到清单里的那张）。 */
    const BACKGROUND_PATH = "columbina/background";
    /** 色纱浓度兜底值 / 轮换间隔兜底值与下限（与宿主半的 0.2–0.85、15–3600 对齐）。 */
    const BG_DIM_FALLBACK = 0.6;
    const BG_INTERVAL_FALLBACK = 90;
    const BG_INTERVAL_MIN = 15;
    /** 欢迎语：宿主半没给出 title 时用这句。 */
    const HERO_TITLE_FALLBACK = "今天的 token，能分我一口吗？";
    /** 输入框占位提示的替换文案（由 CSS 的 ::after 写出去，改这里就够）。 */
    const PLACEHOLDER_TEXT = "月色正好，想做点什么？♪";
    /**
     * 取证扫描节奏：5 秒一次，报告内容没变就不重复上报。
     * 这是诊断旁路（桌面外壳的页面没法从沙箱里截图/读 DOM），
     * 把全页 DOM 扫一遍有成本，所以节奏放慢、内容不变不上报。
     */
    const REPORT_INTERVAL_MS = 5000;

    // ---------------------------------------------------------------------
    // 样式表
    // ---------------------------------------------------------------------
    const CSS = `
/* =====================================================================
   哥伦比娅 · 月隐银蓝渐变毛玻璃主题
   作用域：body[data-dsh-columbina][data-columbina-skin="on"]
   全部规则随样式表移除而消失，不改动任何宿主文件。
   ===================================================================== */

/* ---- 浅色：表面 token ---- */
body[data-dsh-columbina][data-columbina-skin="on"]{
  --co-ink:#1e2748;
  --co-ink-soft:#5a648c;
  --dsw-alias-bg-base:transparent;
  --dsw-alias-bg-layer-1:rgba(250,252,255,.64);
  --dsw-alias-bg-layer-2:rgba(246,249,255,.52);
  --dsw-alias-bg-layer-3:rgba(242,246,255,.42);
  --dsw-alias-bg-module-platform:rgba(250,252,255,.56);
  --dsw-alias-bg-overlay:rgba(246,249,255,.9);
  --dsw-alias-border-l1:rgba(126,146,214,.28);
  --dsw-alias-border-l2:rgba(104,126,204,.4);
  --dsw-alias-border-l2-darkmode-thin:rgba(104,126,204,.2);
  --dsw-alias-border-l3:rgba(82,104,188,.52);
  --dsw-alias-border-l4:rgba(62,82,166,.68);
  --dsw-alias-brand-primary:#5666c9;
  --dsw-alias-brand-text:#ffffff;
  --dsw-alias-button-elevated-fill:rgba(255,255,255,.88);
  --dsw-alias-button-floating-fill:rgba(249,251,255,.95);
  --dsw-alias-button-floating-hover:#e4e9ff;
  --dsw-alias-button-info-fill:#5666c9;
  --dsw-alias-button-info-hover:#4454b4;
  --dsw-alias-interactive-bg-active:rgba(108,126,204,.2);
  --dsw-alias-interactive-bg-hover:rgba(108,126,204,.1);
  --dsw-alias-interactive-bg-hover-solid:#e8edff;
  --dsw-alias-label-caption:#5f688c;
  --dsw-alias-label-deep-diving:#4d4fae;
  --dsw-alias-label-dimmed:#a4abc9;
  --dsw-alias-label-primary:#1e2748;
  --dsw-alias-label-primary-bluish:#2d3762;
  --dsw-alias-label-primary-dimmed:#5b6488;
  --dsw-alias-label-primary-foreground:#ffffff;
  --dsw-alias-label-primary-inverted:#f6f8ff;
  --dsw-alias-label-secondary:#5a648c;
  --dsw-alias-label-tertiary:#5f688c;
  --dsw-alias-markdown-code-block:rgba(255,255,255,.64);
  --dsw-alias-menu-group-header-fill:rgba(234,239,255,.86);
  --dsw-alias-scrollbar-bg-l2:rgba(108,126,204,.18);
  --dsw-alias-scrollbar-hover-l2:rgba(108,126,204,.36);
  --dsw-alias-state-business-primary:#6f62c4;
  --dsw-alias-state-business-tertiary:#ecebfb;
  --dsw-alias-state-error-primary:#b23f56;
  --dsw-alias-state-idle-primary:#a8afc9;
  --dsw-alias-state-success-primary:#2f8268;
  --dsw-alias-state-warn-primary:#a36a35;
  --dsw-alias-state-warn-label:#85511f;
  --dsw-alias-state-warn-tertiary:#f8eee2;
  --dsw-alias-tooltip-bg:rgba(24,30,56,.95);
  --dsw-specific-bubble:rgba(255,255,255,.58);
  --dsw-specific-input-major:rgba(250,252,255,.74);
  --dsw-specific-menu:rgba(249,251,255,.96);
  --dsw-specific-selector:rgba(255,255,255,.82);
  --dsw-specific-sidebar-fill:rgba(238,243,255,.58);
  --dsw-specific-sidebar-nav-item-active-accent:rgba(108,126,204,.16);
  --dsw-static-neutral-bluish-00:#f7f9ff;
  --dsw-shadow-lv2:0 18px 48px rgba(64,84,160,.16), 0 2px 8px rgba(64,84,160,.1);
  background-color:transparent;
  color:var(--co-ink);
}

/* ---- 深色：表面 token ---- */
body[data-dsh-columbina][data-columbina-skin="on"][data-ds-dark-theme]{
  --co-ink:#edf0ff;
  --co-ink-soft:#b7c0e4;
  --dsw-alias-bg-base:transparent;
  --dsw-alias-bg-layer-1:rgba(20,27,52,.66);
  --dsw-alias-bg-layer-2:rgba(26,34,64,.52);
  --dsw-alias-bg-layer-3:rgba(32,41,76,.42);
  --dsw-alias-bg-module-platform:rgba(20,27,52,.58);
  --dsw-alias-bg-overlay:rgba(12,17,36,.92);
  --dsw-alias-border-l1:rgba(164,180,240,.22);
  --dsw-alias-border-l2:rgba(164,180,240,.32);
  --dsw-alias-border-l2-darkmode-thin:rgba(164,180,240,.16);
  --dsw-alias-border-l3:rgba(164,180,240,.46);
  --dsw-alias-border-l4:rgba(180,196,255,.62);
  --dsw-alias-brand-primary:#9dabff;
  --dsw-alias-brand-text:#11162b;
  --dsw-alias-button-elevated-fill:rgba(34,43,78,.82);
  --dsw-alias-button-floating-fill:rgba(22,29,56,.94);
  --dsw-alias-button-floating-hover:rgba(40,51,92,.96);
  --dsw-alias-button-info-fill:#7c8cf0;
  --dsw-alias-button-info-hover:#9dabff;
  --dsw-alias-interactive-bg-active:rgba(157,171,255,.24);
  --dsw-alias-interactive-bg-hover:rgba(157,171,255,.14);
  --dsw-alias-interactive-bg-hover-solid:#26305a;
  --dsw-alias-label-caption:#a3aed6;
  --dsw-alias-label-deep-diving:#aab8ff;
  --dsw-alias-label-dimmed:#7d86ad;
  --dsw-alias-label-primary:#edf0ff;
  --dsw-alias-label-primary-bluish:#d6dcff;
  --dsw-alias-label-primary-dimmed:#b7c0e4;
  --dsw-alias-label-primary-foreground:#11162b;
  --dsw-alias-label-primary-inverted:#11162b;
  --dsw-alias-label-secondary:#b7c0e4;
  --dsw-alias-label-tertiary:#9aa5cf;
  --dsw-alias-markdown-code-block:rgba(9,13,28,.62);
  --dsw-alias-menu-group-header-fill:rgba(28,36,68,.92);
  --dsw-alias-scrollbar-bg-l2:rgba(157,171,255,.18);
  --dsw-alias-scrollbar-hover-l2:rgba(157,171,255,.38);
  --dsw-alias-state-business-primary:#b3a4f0;
  --dsw-alias-state-business-tertiary:#2d2a4c;
  --dsw-alias-state-error-primary:#f2708a;
  --dsw-alias-state-idle-primary:#7a83a8;
  --dsw-alias-state-success-primary:#6ccfa1;
  --dsw-alias-state-warn-primary:#eaa96f;
  --dsw-alias-state-warn-label:#f0b982;
  --dsw-alias-state-warn-tertiary:#3a2f22;
  --dsw-alias-tooltip-bg:rgba(8,12,26,.95);
  --dsw-specific-bubble:rgba(32,41,76,.52);
  --dsw-specific-input-major:rgba(26,34,64,.76);
  --dsw-specific-menu:rgba(12,17,36,.97);
  --dsw-specific-selector:rgba(28,36,68,.86);
  --dsw-specific-sidebar-fill:rgba(18,25,48,.6);
  --dsw-specific-sidebar-nav-item-active-accent:rgba(157,171,255,.18);
  --dsw-static-neutral-bluish-00:#141a30;
  --dsw-shadow-lv2:0 20px 52px rgba(0,0,0,.48), 0 2px 10px rgba(0,0,0,.36);
  color:var(--co-ink);
}

/* ---- 整页渐变底：固定在最底层的伪元素，不参与布局 ---- */
body[data-dsh-columbina][data-columbina-skin="on"]::before{
  content:"";
  position:fixed;
  inset:0;
  z-index:-1;
  pointer-events:none;
  background:
    radial-gradient(1100px 760px at 12% -6%, rgba(190,204,255,.96), rgba(190,204,255,0) 62%),
    radial-gradient(900px 700px at 88% 4%, rgba(214,206,255,.82), rgba(214,206,255,0) 60%),
    radial-gradient(760px 620px at 76% 96%, rgba(176,220,255,.66), rgba(176,220,255,0) 62%),
    radial-gradient(900px 800px at 8% 92%, rgba(222,228,255,.88), rgba(222,228,255,0) 65%),
    linear-gradient(158deg, #f8faff 0%, #eef3ff 34%, #eae9ff 68%, #f1f7ff 100%);
}
body[data-dsh-columbina][data-columbina-skin="on"][data-ds-dark-theme]::before{
  background:
    radial-gradient(1000px 720px at 14% -8%, rgba(52,70,150,.78), rgba(52,70,150,0) 62%),
    radial-gradient(880px 680px at 86% 2%, rgba(86,72,152,.72), rgba(86,72,152,0) 60%),
    radial-gradient(760px 620px at 70% 98%, rgba(38,70,124,.56), rgba(38,70,124,0) 62%),
    linear-gradient(158deg, #0b1024 0%, #111832 36%, #191a3a 70%, #0d1530 100%);
}
/* 顶部一层极淡的珠光，让毛玻璃有可折射的内容 */
body[data-dsh-columbina][data-columbina-skin="on"]::after{
  content:"";
  position:fixed;
  inset:0;
  z-index:-1;
  pointer-events:none;
  background:linear-gradient(180deg, rgba(255,255,255,.36), rgba(255,255,255,0) 42%);
}
body[data-dsh-columbina][data-columbina-skin="on"][data-ds-dark-theme]::after{
  background:linear-gradient(180deg, rgba(190,208,255,.12), rgba(255,255,255,0) 46%);
}

/* ---- 整页背景图：两层交叉淡入 + 一层色纱 ----
   这一层是 body 的真实子元素、z-index:-1，树序排在 body::before（月隐银蓝渐变）之后，
   所以有图时它盖住渐变；没有图时整层 display:none，渐变照旧。
   它 position:fixed 且 pointer-events:none：不参与布局、不接指针，不影响任何交互。
   图片走宿主半的 /columbina/background/<文件名>（页面是 http 来源，file:// 加载不出来）。 */
body[data-dsh-columbina][data-columbina-skin="on"] .colu-bg{
  position:fixed;
  inset:0;
  z-index:-1;
  pointer-events:none;
  overflow:hidden;
  background:#f8faff;
}
body[data-dsh-columbina][data-columbina-skin="on"][data-ds-dark-theme] .colu-bg{
  background:#0b1024;
}
body[data-dsh-columbina][data-columbina-skin="on"][data-colu-bg="off"] .colu-bg{
  display:none;
}
body[data-dsh-columbina][data-columbina-skin="on"] .colu-bg-img{
  position:absolute;
  inset:0;
  background-position:center center;
  background-size:cover;
  background-repeat:no-repeat;
  opacity:0;
  transition:opacity 900ms ease;
}
body[data-dsh-columbina][data-columbina-skin="on"] .colu-bg-img[data-active="1"]{
  opacity:1;
}
/* 色纱：把照片压到"能读字"的程度，配色也拉回主题那一套。
   浓度 --colu-bg-dim（0.2–0.85）由控制板的滑杆写，越大越淡。 */
body[data-dsh-columbina][data-columbina-skin="on"] .colu-bg-veil{
  position:absolute;
  inset:0;
  background:
    radial-gradient(1200px 800px at 12% -6%, rgba(190,204,255,calc(var(--colu-bg-dim) * .55)), rgba(190,204,255,0) 62%),
    radial-gradient(900px 700px at 88% 4%, rgba(214,206,255,calc(var(--colu-bg-dim) * .45)), rgba(214,206,255,0) 60%),
    rgba(248,250,255,var(--colu-bg-dim));
}
body[data-dsh-columbina][data-columbina-skin="on"][data-ds-dark-theme] .colu-bg-veil{
  background:
    radial-gradient(1000px 720px at 14% -8%, rgba(52,70,150,calc(var(--colu-bg-dim) * .5)), rgba(52,70,150,0) 62%),
    radial-gradient(880px 680px at 86% 2%, rgba(86,72,152,calc(var(--colu-bg-dim) * .45)), rgba(86,72,152,0) 60%),
    rgba(9,13,28,var(--colu-bg-dim));
}

/* ---- 对话列：照片直接透上来，整列**不**刷白 ----
   之前给 [data-conversation-scroll] 铺了一层 90% 的白纸，结果背景图基本看不见。
   现在只对"对话本身"做处理，整列保持透明：
     · 对话气泡本来就用 --dsw-specific-bubble 上色，有图时把它调厚一点；
     · 正文（段落 / 列表 / 表格）加一圈很淡的光晕，压在照片最花的地方也读得动。
   光晕只落在真正的文字块上，所以预格式化的代码块（自带深色底）不受影响。
   这里同样**不能**用 backdrop-filter：输入框卡片（以及发送键那个没开 portal、
   气泡 position:fixed 的 Tooltip）是这一层的后代，一旦它成为 fixed 后代的
   包含块，鼠标停在发送键上时界面就会闪。 */
body[data-dsh-columbina][data-columbina-skin="on"][data-colu-bg="on"]{
  --dsw-specific-bubble:rgba(255,255,255,.78);
}
body[data-dsh-columbina][data-columbina-skin="on"][data-colu-bg="on"][data-ds-dark-theme]{
  --dsw-specific-bubble:rgba(26,34,64,.76);
}
body[data-dsh-columbina][data-columbina-skin="on"][data-colu-bg="on"] [data-conversation-scroll] :is(p,li,h1,h2,h3,h4,h5,h6,blockquote,td,th){
  text-shadow:0 1px 2px rgba(255,255,255,.9), 0 0 10px rgba(248,250,255,.72);
}
body[data-dsh-columbina][data-columbina-skin="on"][data-colu-bg="on"][data-ds-dark-theme] [data-conversation-scroll] :is(p,li,h1,h2,h3,h4,h5,h6,blockquote,td,th){
  text-shadow:0 1px 2px rgba(5,8,20,.85), 0 0 10px rgba(9,13,28,.66);
}

/* ---- 窗口画布兜底 ----
   桌面版窗口带原生材质（lib/main.js 里 backgroundMaterial: "acrylic"，
   renderer/assets/window-material.css 的注释也写着 "native material owns the blur"），
   而本主题把 --dsw-alias-bg-base 设成 transparent、body 也透明。
   如果连 html 画布都没有不透明底色，整扇窗就会透出系统模糊、看起来整屏发糊。
   这里给画布一个不透明底；可见的月隐银蓝渐变仍由上面的 ::before 提供。 */
html:has(body[data-dsh-columbina][data-columbina-skin="on"]){
  background-color:#f8faff;
}
html:has(body[data-dsh-columbina][data-columbina-skin="on"][data-ds-dark-theme]){
  background-color:#0b1024;
}

/* ---- 毛玻璃：只加在列级面板 / 真正浮起的表面 ----
   注意：不要给 [data-shell-overlay]（AppFrame 的 overlayLayer，永远存在且铺满整帧）
   或 [data-slot="shell.overlay"]（它的槽位宿主）加 backdrop-filter ——
   那会让整个窗口一起发糊。浮层本身用下面第二条规则里的直接子元素来打。
   同理，也不要给 [data-sidebar-right-panel]（右侧栏容器 .OUqwTW_panel）加：
   它 position:absolute;top:0;bottom:0;right:0 且自身没有背景，收起时只是把窗格
   设成 visibility:hidden（布局宽度仍在），于是那块区域会一直保持模糊 ——
   表现就是"打开设置页后右半边发雾、关掉也不散"。毛玻璃要打在真正的窗格
   [data-dockkit-pane] / [data-dockkit-float] 上，它们在收起时不被绘制。 */
body[data-dsh-columbina][data-columbina-skin="on"] [data-slot="sidebar"],
body[data-dsh-columbina][data-columbina-skin="on"] [data-slot="sidebar.settings"],
body[data-dsh-columbina][data-columbina-skin="on"] [data-dockkit-pane],
body[data-dsh-columbina][data-columbina-skin="on"] [data-dockkit-float],
body[data-dsh-columbina][data-columbina-skin="on"] [role="dialog"],
body[data-dsh-columbina][data-columbina-skin="on"] [data-radix-popper-content-wrapper],
body[data-dsh-columbina][data-columbina-skin="on"] [data-shell-overlay] > *{
  -webkit-backdrop-filter:blur(16px) saturate(160%);
  backdrop-filter:blur(16px) saturate(160%);
}

/* ---- 输入框卡片的毛玻璃：画在静态伪元素上，不画在卡片自己身上 ----
   发送键外面套着一个 Tooltip（primitives 的），它没开 portal，气泡是
   position:fixed 且靠在 ResizeObserver 里反复"适应"视口换边。给卡片本身加
   backdrop-filter 会让卡片成为 fixed 后代的包含块、并立起层叠上下文，气泡的
   视口定位就被破坏 → 鼠标停在发送键上时界面抖/闪（delayMs 500ms 触发）。
   挪到 ::before 上：观感不变，定位不再被劫持。isolation:isolate 让 z-index:-1
   的伪元素只压在这张卡片自己下面，不会钻到别的内容后面去。 */
body[data-dsh-columbina][data-columbina-skin="on"] [data-composer-card]{
  isolation:isolate;
  border-radius:20px;
  box-shadow:0 12px 34px rgba(64,84,160,.16);
}
body[data-dsh-columbina][data-columbina-skin="on"] [data-composer-card]::before{
  content:"";
  position:absolute;
  inset:0;
  z-index:-1;
  border-radius:inherit;
  pointer-events:none;
  -webkit-backdrop-filter:blur(16px) saturate(160%);
  backdrop-filter:blur(16px) saturate(160%);
}

/* ---- 聊天里贴图的大小 ----
   贴图就是 Markdown 图片（alt 是「哥伦比娅·…」、地址是绝对路径），alt 原样保留，认 alt 比认 src
   稳（src 会被宿主按工作区重写）。宿主自己那条 ._imageButton_1ypvv_446
   ._image_1ypvv_287{max-height:360px} 特异度是 (0,2,0)，我们这条更高，不用 !important。
   故意不带 data-columbina-skin：贴图大小是插件自己的设定，关了主题也该照样起作用。 */
body[data-dsh-columbina]{
  --colu-sticker-size:128px;
  --colu-bg-dim:.6;
}
body[data-dsh-columbina] img[alt^="哥伦比娅·"]{
  max-width:var(--colu-sticker-size);
  max-height:var(--colu-sticker-size);
  width:auto;
  height:auto;
}
body[data-dsh-columbina][data-columbina-skin="on"] ::selection{
  background:rgba(150,170,255,.55);
  color:var(--co-ink);
}
body[data-dsh-columbina][data-columbina-skin="on"] ::-webkit-scrollbar{width:10px;height:10px}
body[data-dsh-columbina][data-columbina-skin="on"] ::-webkit-scrollbar-track{background:transparent}
body[data-dsh-columbina][data-columbina-skin="on"] ::-webkit-scrollbar-thumb{
  background:linear-gradient(180deg, rgba(143,157,242,.75), rgba(185,168,255,.65));
  border-radius:999px;
  border:2px solid transparent;
  background-clip:padding-box;
}
body[data-dsh-columbina][data-columbina-skin="on"] ::-webkit-scrollbar-thumb:hover{
  background:linear-gradient(180deg, #7c8cf0, #b9a8ff);
  background-clip:padding-box;
}
body[data-dsh-columbina][data-columbina-skin="on"] *:focus-visible{
  outline:2px solid rgba(124,140,240,.55);
  outline-offset:2px;
}

/* =====================================================================
   插件自带 UI（侧边栏入口 / 浮动面板 / 设置页）：不依赖主题开关
   ===================================================================== */
body[data-dsh-columbina]{
  --co-ui-face:rgba(251,253,255,.92);
  --co-ui-face2:rgba(240,245,255,.96);
  --co-ui-line:rgba(126,146,214,.45);
  --co-ui-text:#1e2748;
  --co-ui-soft:#5f688c;
  --co-ui-accent:#6d7fe0;
}
body[data-dsh-columbina][data-ds-dark-theme]{
  --co-ui-face:rgba(18,25,48,.94);
  --co-ui-face2:rgba(28,36,68,.96);
  --co-ui-line:rgba(164,180,240,.3);
  --co-ui-text:#edf0ff;
  --co-ui-soft:#b7c0e4;
  --co-ui-accent:#9dabff;
}

.colu-mark{color:var(--co-ui-accent)}

.colu-navbtn{
  display:inline-flex;
  align-items:center;
  gap:6px;
  width:100%;
  padding:6px 10px;
  border:1px solid var(--co-ui-line);
  border-radius:12px;
  background:linear-gradient(135deg, rgba(214,224,255,.6), rgba(228,218,255,.5));
  color:var(--co-ui-text);
  font:inherit;
  font-size:13px;
  cursor:pointer;
}
.colu-navbtn:hover{background:linear-gradient(135deg, rgba(190,204,255,.82), rgba(214,202,255,.66))}

.colu-overlay{
  position:fixed;
  right:24px;
  bottom:24px;
  z-index:2147483000;
  width:min(460px, calc(100vw - 48px));
  max-height:min(74vh, 760px);
  display:flex;
  flex-direction:column;
  overflow:hidden;
  padding:14px;
  border:1px solid var(--co-ui-line);
  border-radius:20px;
  background:var(--co-ui-face);
  -webkit-backdrop-filter:blur(22px) saturate(170%);
  backdrop-filter:blur(22px) saturate(170%);
  box-shadow:0 24px 64px rgba(40,60,130,.28);
  color:var(--co-ui-text);
  font-family:inherit;
}
.colu-overlay-head{display:flex;align-items:center;gap:8px;padding:0 2px 10px}
.colu-overlay-title{font-size:14px;font-weight:600}
.colu-close{
  margin-left:auto;
  width:26px;
  height:26px;
  border-radius:50%;
  border:1px solid var(--co-ui-line);
  background:transparent;
  color:var(--co-ui-soft);
  cursor:pointer;
  line-height:1;
}
.colu-close:hover{background:rgba(108,126,204,.14)}

.colu-editor{display:flex;flex-direction:column;gap:10px;min-height:0}
.colu-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.colu-switch{
  display:inline-flex;
  align-items:center;
  gap:6px;
  font-size:12.5px;
  color:var(--co-ui-soft);
  cursor:pointer;
  user-select:none;
}
.colu-switch input{accent-color:var(--co-ui-accent)}
.colu-status{margin-left:auto;font-size:12px;color:var(--co-ui-soft)}
.colu-status[data-tone="ok"]{color:#2f8a6a}
.colu-status[data-tone="error"]{color:#c04a6a}
.colu-text{
  min-height:220px;
  max-height:46vh;
  resize:vertical;
  padding:12px 14px;
  border:1px solid var(--co-ui-line);
  border-radius:14px;
  background:var(--co-ui-face2);
  color:var(--co-ui-text);
  font-family:ui-monospace, "Cascadia Code", Consolas, "Microsoft YaHei", monospace;
  font-size:12.5px;
  line-height:1.75;
  outline:none;
}
.colu-text:focus{border-color:var(--co-ui-accent);box-shadow:0 0 0 3px rgba(108,126,204,.18)}
.colu-btn{
  padding:6px 14px;
  border-radius:999px;
  border:1px solid var(--co-ui-line);
  background:transparent;
  color:var(--co-ui-text);
  font:inherit;
  font-size:12.5px;
  cursor:pointer;
}
.colu-btn:hover{background:rgba(108,126,204,.12)}
.colu-primary{
  border-color:transparent;
  background:linear-gradient(135deg, #8f9df2, #b9a8ff);
  color:#1c2242;
  font-weight:600;
}
.colu-primary:hover{filter:brightness(1.06)}
.colu-hint{margin:0;font-size:11.5px;line-height:1.7;color:var(--co-ui-soft)}

.colu-page{display:flex;flex-direction:column;gap:12px;max-width:820px;padding:4px 2px 16px}
.colu-page-title{margin:0;font-size:16px}
.colu-page-lead{margin:0;font-size:12.5px;line-height:1.75;color:var(--co-ui-soft)}
.colu-page .colu-text{min-height:42vh}

.colu-stickers{margin-top:6px;padding-top:12px;border-top:1px dashed var(--co-ui-line)}
.colu-stickers-head{display:flex;align-items:baseline;gap:8px;margin-bottom:8px;font-size:12.5px;color:var(--co-ui-text)}
.colu-stickers-head span{font-size:11.5px;color:var(--co-ui-soft)}
.colu-sticker-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill, minmax(92px, 1fr));
  gap:8px;
  padding-right:2px;
}
.colu-sticker{
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:4px;
  min-width:0;
  max-width:100%;
  overflow:hidden;
  padding:6px;
  border:1px solid var(--co-ui-line);
  border-radius:12px;
  background:var(--co-ui-face2);
}
.colu-sticker img{max-width:100%;width:min(88px, var(--colu-sticker-size, 128px));height:min(88px, var(--colu-sticker-size, 128px));object-fit:contain;border-radius:8px;background:rgba(255,255,255,.62)}
.colu-sticker b{max-width:100%;font-size:11.5px;font-weight:600;color:var(--co-ui-text);word-break:break-word;text-align:center}
.colu-sticker em{max-width:100%;font-size:10.5px;font-style:normal;line-height:1.45;text-align:center;color:var(--co-ui-soft);word-break:break-word}
.colu-empty{margin:0;font-size:11.5px;line-height:1.7;color:var(--co-ui-soft)}

/* ---- 背景：入口一行 + 缩略图条 + 轮换滑杆 ---- */
.colu-bg-strip{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  min-width:0;
  max-width:100%;
}
.colu-bg-thumb{
  flex:0 0 auto;
  width:104px;
  max-width:100%;
  padding:4px;
  overflow:hidden;
  border:1px solid var(--co-ui-line);
  border-radius:10px;
  background:var(--co-ui-face2);
  color:var(--co-ui-soft);
  font:inherit;
  font-size:10.5px;
  line-height:1.5;
  cursor:pointer;
  text-align:center;
}
.colu-bg-thumb img{
  display:block;
  width:100%;
  height:58px;
  object-fit:cover;
  border-radius:6px;
  background:rgba(255,255,255,.5);
}
.colu-bg-thumb span{display:block;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.colu-bg-thumb[data-on="1"]{
  border-color:var(--co-ui-accent);
  box-shadow:0 0 0 2px rgba(108,126,204,.22);
  color:var(--co-ui-text);
}
/* 风格二选一：背景图 / 简约（无图）。简约那档就是"没加背景之前"的样子。 */
.colu-mode{
  display:inline-flex;
  flex:none;
  padding:2px;
  border:1px solid var(--co-ui-line);
  border-radius:999px;
  background:var(--co-ui-face2);
}
.colu-mode-btn{
  padding:4px 12px;
  border:none;
  border-radius:999px;
  background:transparent;
  color:var(--co-ui-soft);
  font:inherit;
  font-size:12px;
  line-height:1.5;
  cursor:pointer;
}
.colu-mode-btn[data-on="1"]{
  background:var(--co-ui-face);
  box-shadow:0 2px 8px rgba(64,84,160,.18);
  color:var(--co-ui-text);
  font-weight:600;
}
/* 简约档下，跟图片有关的那些控件（轮换 / 间隔 / 淡化 / 下一张 / 缩略图）淡下去。 */
[data-bg-mode="plain"] .colu-bg-only{opacity:.4}

/* ---- 表情包管理：大小滑杆 / 上传 / 删除 ---- */
.colu-stickers-tools{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin-bottom:10px}
.colu-size{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--co-ui-text)}
.colu-size input[type="range"]{width:150px;accent-color:var(--co-ui-accent)}
.colu-size b{min-width:46px;font-weight:600;color:var(--co-ui-accent)}
.colu-add{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:10px}
.colu-add input[type="text"]{
  min-width:0;
  flex:1 1 118px;
  max-width:100%;
  width:118px;
  padding:5px 8px;
  font:inherit;
  font-size:11.5px;
  color:var(--co-ui-text);
  border:1px solid var(--co-ui-line);
  border-radius:9px;
  background:var(--co-ui-face);
}
.colu-add input[type="file"]{
  min-width:0;
  max-width:100%;
  font-size:11px;
  color:var(--co-ui-soft);
}
.colu-del{
  align-self:flex-end;
  margin-top:2px;
  padding:1px 7px;
  font:inherit;
  font-size:10.5px;
  line-height:1.6;
  color:var(--co-ui-soft);
  cursor:pointer;
  border:1px solid var(--co-ui-line);
  border-radius:999px;
  background:transparent;
}
.colu-del:hover{color:#fff;border-color:transparent;background:var(--co-ui-accent)}

/* ---- 表情包管理器：单独一页，入口只有一行 ----
   管理器是一个覆盖层（.colu-overlay--wide），高度由覆盖层自己封顶，里面的
   .colu-manager-scroll 才负责滚动 —— 网格再长也只会在这块区域里滚，
   不会把卡片顶出面板外。卡片和文字都锁了 max-width/min-width:0 + 断词，
   窄面板下长名字也不会把格子撑破。 */
.colu-overlay--wide{width:min(560px, calc(100vw - 48px))}
.colu-manager{display:flex;flex-direction:column;gap:10px;min-height:0;flex:1 1 auto}
.colu-manager-scroll{
  flex:1 1 auto;
  min-height:0;
  overflow-y:auto;
  overflow-x:hidden;
  padding-right:2px;
  display:flex;
  flex-direction:column;
  gap:10px;
}
.colu-manager-status{margin-left:auto;font-size:12px;color:var(--co-ui-soft)}
.colu-manager-status[data-tone="ok"]{color:#2f8a6a}
.colu-manager-status[data-tone="error"]{color:#c04a6a}
.colu-entry{
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  gap:8px;
  margin-top:6px;
  padding-top:12px;
  border-top:1px dashed var(--co-ui-line);
}
.colu-entry-info{display:flex;align-items:baseline;gap:8px;font-size:12.5px;color:var(--co-ui-text)}
.colu-entry-info span{font-size:11.5px;color:var(--co-ui-soft)}
.colu-entry .colu-btn{margin-left:auto}

/* =====================================================================
   对话界面微调（不跟主题开关走：换掉新会话欢迎页的内置鱼 + 自带艺术字欢迎语，
   并把输入框的默认占位提示换成哥伦比娅的招呼语）
   ===================================================================== */

/* ---- 新会话欢迎页：形象 + 艺术字欢迎语 ---- */
/* 内置文案（「探索未至之境」）和我们的形象同在一行 [class*="_headline"] 里，
   有我们的形象时把它藏掉。藏哪个 span 要按运行版来：运行版把它放在 [class*="_titleGroup"]
   里、是个没有 class 的 span（带 class 的同级是「预览版」badge）；早一些的构建则给它
   _headlineText。两种都写上；顺带把 grid 那版的首列从 34px 放开，72px 的头像才不被压扁。 */
[class*="_headline"]:has(.colu-hero){grid-template-columns:auto}
[class*="_headline"]:has(.colu-hero) [class*="_headlineText"],
[class*="_headline"]:has(.colu-hero) [class*="_titleGroup"] > span:not([class]){display:none}
/* 官方那枚「预览版」徽标也一起收掉：有哥伦比娅的形象和欢迎语时，这一行只留它们俩。 */
[class*="_headline"]:has(.colu-hero) [class*="_previewBadge"]{display:none}
/* 整行都不接指针：这一行只剩哥伦比娅的形象和欢迎语，点哪都不该有反应。
   写在行上（而不是只写在自己的容器上），免得宿主那层槽位外壳把点击接走。 */
[class*="_headline"]:has(.colu-hero){pointer-events:none;user-select:none;-webkit-user-select:none}
.colu-hero{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:12px;
  /* 这一行是纯装饰：形象点不响、文字选不中、图也拖不动。
     pointer-events / user-select 都会被继承，所以写在容器上就够；
     cursor:default 是给"手型光标"兜底（万一哪层宿主元素带了 cursor:pointer）。 */
  pointer-events:none;
  user-select:none;
  -webkit-user-select:none;
  cursor:default;
}
.colu-hero-mark{
  display:block;
  height:72px;
  width:auto;
  max-width:96px;
  object-fit:contain;
  /* 素材本身就是带透明通道的贴纸（meme 里的 Q 版立绘），是"把图单独扣出来贴上去"的那种：
     所以这里**什么都不再画**——没有 border、没有底盘、没有 border-radius、没有遮罩，
     抠出来的轮廓自己就是边界，和背景之间没有任何过渡痕迹。
     这层投影是 drop-shadow，跟着 alpha 轮廓走（不是 box-shadow 那种方框影），
     只是让她像贴纸一样落在页面上；不想要的话删掉这一行即可。 */
  filter:drop-shadow(0 5px 12px rgba(60,80,150,.3));
  /* 不许拖拽：Chromium 里图片默认可以被拖出一个影子，这里关掉。 */
  -webkit-user-drag:none;
}
.colu-hero-mark[data-colu-missing="1"]{display:none}
.colu-hero-title{
  display:inline-flex;
  align-items:baseline;
  gap:2px;
  /* 思源宋体 / 华文宋体：细笔画、书卷气，和“歌者、月下、梦”的气质更合；
     末尾收在 serif，不用粗黑体的游戏 LogO 感。 */
  font-family:"Noto Serif SC","Source Han Serif SC","STSong","华文宋体","SimSun",serif;
  font-size:34px;
  line-height:44px;
  font-weight:400;
  letter-spacing:2px;
}
.colu-hero-title-text{
  /* 靛蓝 → 银灰：不再落到刺眼的纯白，浅底和深底都能读 */
  background:linear-gradient(168deg,#2f3f7a 0%,#4a5b9e 38%,#6f7fb8 70%,#9aa8d8 100%);
  -webkit-background-clip:text;
  background-clip:text;
  -webkit-text-fill-color:transparent;
  color:transparent;
  /* 只留一根很细的靛蓝边，不再用 1.1px 的粗描边 */
  -webkit-text-stroke:0.4px rgba(47,63,124,.55);
  filter:drop-shadow(0 1px 0 rgba(255,255,255,.6)) drop-shadow(0 4px 12px rgba(60,80,150,.22));
}
body[data-dsh-columbina][data-columbina-skin="on"][data-ds-dark-theme] .colu-hero-title-text{
  /* 深色主题下反过来：浅银 → 淡靛，避免整句发黑。
     这里必须用 background-image，不能用 background 简写：
     简写会把上一段的 background-clip:text 重置成 border-box，
     整条渐变就会铺成一个浅色方块（深色模式欢迎语的 bug）。
     下面重新声明一遍裁字/透明填充，避免后续再被简写覆盖。 */
  background-image:linear-gradient(168deg,#e6ebff 0%,#c3cdf0 38%,#9aa9e0 72%,#7280bc 100%);
  -webkit-background-clip:text;
  background-clip:text;
  -webkit-text-fill-color:transparent;
  color:transparent;
  -webkit-text-stroke-color:rgba(20,28,60,.55);
  filter:drop-shadow(0 1px 0 rgba(10,16,36,.65)) drop-shadow(0 4px 10px rgba(0,0,0,.3));
}
@supports not (background-clip:text){
  .colu-hero-title-text{background:none;color:#3b4a86;-webkit-text-fill-color:currentColor;text-shadow:0 1px 0 rgba(255,255,255,.7)}
}
.colu-hero-note{
  font-family:inherit;
  font-size:.86em;
  color:#5a6ada;
  -webkit-text-fill-color:currentColor;
  animation:colu-note-float 2.8s ease-in-out infinite;
}
@keyframes colu-note-float{
  0%,100%{transform:translateY(0) rotate(-7deg)}
  50%{transform:translateY(-5px) rotate(7deg)}
}
@media (prefers-reduced-motion: reduce){
  .colu-hero-note{animation:none}
}

/* ---- 输入框占位提示 ---- */
/* 可见的那句占位提示是 [data-composer-input] 的紧邻兄弟 [data-composer-placeholder]
   （宿主把同一段文案既写到 contenteditable 的 data-placeholder 上，也写进它自己的
   文本节点），没有 i18n 覆盖的口子；把原字染成透明，再用自己的 ::after 写一句。
   闸门开在兄弟节点的 data-placeholder 前缀上：只有「默认」与「欢迎页默认」这两种
   文案会被换掉，「会话不可用 / 父会话已离线 / 排队插话 / 计划模式 / 选择工作区」
   这些状态提示原样保留。纯 CSS：不动 DOM、不碰宿主词典。 */
body[data-dsh-columbina] [data-composer-input][data-placeholder^="发消息或创建任务"] + [data-composer-placeholder],
body[data-dsh-columbina] [data-composer-input][data-placeholder^="描述你想要构建的内容"] + [data-composer-placeholder],
body[data-dsh-columbina] [data-composer-input][data-placeholder^="Message or run a task"] + [data-composer-placeholder],
body[data-dsh-columbina] [data-composer-input][data-placeholder^="Describe what you want to build"] + [data-composer-placeholder]{color:transparent}
/* 透明的那串原字仍然占着宽度：直接往后接一句会被它顶到右边去（欢迎页那版容器是
   -webkit-box + 两行 clamp，还会把新文案挤到第二行）。所以把新文案绝对定位钉回
   容器左上角——那正是原字的起点，也就和输入的文字同一个左边距。 */
body[data-dsh-columbina] [data-composer-input][data-placeholder^="发消息或创建任务"] + [data-composer-placeholder]::after,
body[data-dsh-columbina] [data-composer-input][data-placeholder^="描述你想要构建的内容"] + [data-composer-placeholder]::after,
body[data-dsh-columbina] [data-composer-input][data-placeholder^="Message or run a task"] + [data-composer-placeholder]::after,
body[data-dsh-columbina] [data-composer-input][data-placeholder^="Describe what you want to build"] + [data-composer-placeholder]::after{
  content:"${PLACEHOLDER_TEXT}";
  position:absolute;
  left:0;
  top:0;
  text-align:left;
  white-space:nowrap;
  /* 明写一套无衬线：这句是中文，掉进衬线字库里就会像宋体 */
  font-family:"Microsoft YaHei UI","微软雅黑","PingFang SC","Hiragino Sans GB","Noto Sans SC",system-ui,sans-serif;
  font-size:inherit;
  line-height:inherit;
  color:var(--dsw-alias-label-caption, rgba(95,104,140,.8));
}
`;

    // ---------------------------------------------------------------------
    // 状态：客户端只缓存一份，真正的真相在宿主半
    // ---------------------------------------------------------------------
    const state = {
      persona: "", enabled: true, theme: true, stickers: true, proactive: true, noRepeat: true, rev: 0,
      /** 聊天里贴图的最大边长（px）：落到 body 上的 --colu-sticker-size。 */
      stickerSize: 128,
      defaultPersona: "", statePath: "",
      /** 新会话欢迎语（空串表示用 HERO_TITLE_FALLBACK）；形象字节由宿主半发。 */
      heroTitle: "", heroReady: true,
      /**
       * 整页背景图。current 是"锚点图"的文件名（空串＝按目录顺序第一张），
       * dim 是色纱浓度（越大越淡），rotate/interval 决定要不要自己换下一张。
       * 轮换只发生在页面里，不会每次换图都回写宿主（省得写盘写不停）。
       */
      background: { enabled: true, current: "", rotate: false, interval: 90, dim: 0.6 },
    };
    /** 背景图清单（宿主半扫 Background/ 得来的快照）。 */
    let backgroundItems = [];
    let backgroundNote = "";
    /** 当前铺在页面上的那张在清单里的下标（轮换会推着它走）。 */
    let backgroundIndex = 0;
    /** 背景层与轮换定时器（都是模块级：刷新与轮换只动这一份）。 */
    let backgroundLayer = null;
    let rotationTimer = null;
    /** 上一次"按锚点铺图"的凭据：锚点或清单变了才重铺，免得把轮换进度拽回去。 */
    let backgroundAnchor = null;
    /** 表情包清单（宿主半读包内 stickers.json 得来的快照）。 */
    let stickerItems = [];
    let stickerNote = "";
    let ready = false;
    let failure = null;
    const watchers = new Set();
    /** 有未保存编辑的编辑器：外部同步要避开它们，免得盖掉正在写的东西。 */
    const pendingEdits = new Set();

    function log(level, message, error) {
      const emit = console[level] || console.log;
      if (error === undefined) emit("[" + PACKAGE_ID + "] " + message);
      else emit("[" + PACKAGE_ID + "] " + message, error);
    }

    function notify() {
      watchers.forEach((fn) => {
        try {
          fn();
        } catch (error) {
          log("error", "界面刷新失败", error);
        }
      });
    }

    function endpoint() {
      return new URL(API_PATH, document.baseURI).href;
    }

    /**
     * 读写宿主半的 fenced 路由；非 {ok:true,value} 的信封一律当失败。
     * POST 一律带上"我读到的是哪一版"（rev），宿主据此拒绝过期写入；
     * 失败时把宿主的错误码挂在 error.code 上，交给调用方决定要不要重新载入。
     */
    async function request(method, patch) {
      const response = await fetch(endpoint(), method === "POST"
        ? {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(Object.assign({ rev: state.rev }, patch || {})),
        }
        : { method: "GET" });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload === null || payload.ok !== true || !payload.value) {
        const message = payload && payload.error && payload.error.message
          ? payload.error.message
          : "HTTP " + response.status;
        const error = new Error(message);
        if (payload && payload.error && payload.error.code) error.code = payload.error.code;
        throw error;
      }
      return payload.value;
    }

    function absorb(value) {
      if (typeof value.persona === "string") state.persona = value.persona;
      if (typeof value.enabled === "boolean") state.enabled = value.enabled;
      if (typeof value.theme === "boolean") state.theme = value.theme;
      if (typeof value.stickers === "boolean") state.stickers = value.stickers;
      if (typeof value.proactive === "boolean") state.proactive = value.proactive;
      if (typeof value.noRepeat === "boolean") state.noRepeat = value.noRepeat;
      if (Number.isFinite(value.stickerSize)) state.stickerSize = value.stickerSize;
      if (value.hero !== null && typeof value.hero === "object") {
        if (typeof value.hero.title === "string") state.heroTitle = value.hero.title;
        if (typeof value.hero.ready === "boolean") state.heroReady = value.hero.ready;
      }
      if (value.background !== null && typeof value.background === "object") {
        const bg = value.background;
        if (typeof bg.enabled === "boolean") state.background.enabled = bg.enabled;
        if (typeof bg.current === "string") state.background.current = bg.current;
        if (typeof bg.rotate === "boolean") state.background.rotate = bg.rotate;
        if (Number.isFinite(bg.interval)) state.background.interval = bg.interval;
        if (Number.isFinite(bg.dim)) state.background.dim = bg.dim;
      }
      if (Number.isInteger(value.rev) && value.rev >= 0) state.rev = value.rev;
      if (typeof value.defaultPersona === "string") state.defaultPersona = value.defaultPersona;
      if (typeof value.statePath === "string") state.statePath = value.statePath;
      ready = true;
      failure = null;
    }

    /** 主题开关落到 body 属性上；样式表只认 on。贴图大小与色纱浓度落到 CSS 变量上。 */
    function applySkin() {
      if (!document.body) return;
      document.body.setAttribute(SKIN_ATTR, state.theme ? "on" : "off");
      const size = Number.isFinite(state.stickerSize) ? Math.round(state.stickerSize) : 128;
      document.body.style.setProperty("--colu-sticker-size", size + "px");
      applyBackground();
    }

    /** 把设置页里点选的文件读成 data URL（FileReader 在渲染进程里是同步可用的）。 */
    function readAsDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(reader.error || new Error("读取文件失败"));
        reader.readAsDataURL(file);
      });
    }

    /**
     * 上传 / 删除自定义表情包：都走宿主半的 fenced 路由，成功回一份新快照。
     * 返回前顺手把新状态吸进 state（rev 也跟着 +1），调用方直接重画即可。
     */
    async function postStickers(action, payload) {
      const url = new URL(STICKERS_PATH + action, document.baseURI).href;
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.assign({ rev: state.rev }, payload || {})),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || body === null || body.ok !== true || !body.value) {
        const message = body && body.error && body.error.message
          ? body.error.message
          : "HTTP " + response.status;
        const error = new Error(message);
        if (body && body.error && body.error.code) error.code = body.error.code;
        throw error;
      }
      if (body.value.state) absorb(body.value.state);
      if (body.value.stickers) applyStickers(body.value.stickers);
      notify();
      return body.value;
    }

    // ---------------------------------------------------------------------
    // 活页面取证（诊断旁路）
    // 桌面外壳的活页面在受限沙箱里既截不了图、也没有 DOM 读取通道，皮肤出现
    // 视觉问题时只能让页面自己把「谁带了 backdrop-filter、谁是大面积半透明」
    // 报给宿主（POST /columbina/report，只存宿主内存）。任何一步失败都只是少一份
    // 诊断，绝不打扰主题与人格。
    // ---------------------------------------------------------------------
    const REPORT_ATTRS = [
      "data-slot", "data-dockkit-pane", "data-dockkit-float", "data-dockkit-host",
      "data-sidebar-right-panel", "data-sidebar-right-open", "data-shell-overlay", "role",
    ];

    /** 把元素描述成一行可读的标签（tag + 关键属性 + class/id）。 */
    function describeElement(el) {
      const parts = [];
      for (const name of REPORT_ATTRS) {
        const value = el.getAttribute ? el.getAttribute(name) : null;
        // 空字符串是布尔属性的常态（data-shell-overlay=""），照样要报出来。
        if (value === null || value === undefined) continue;
        parts.push(value === "" ? name : name + "=" + String(value).slice(0, 60));
      }
      const cls = el.getAttribute ? el.getAttribute("class") : null;
      if (cls) parts.push("class=" + String(cls).slice(0, 90));
      const id = el.getAttribute ? el.getAttribute("id") : null;
      if (id) parts.push("id=" + String(id).slice(0, 40));
      return el.tagName.toLowerCase() + (parts.length ? "[" + parts.join(" ") + "]" : "");
    }

    /** 从 CSS 颜色里抠出 alpha（不认识就当 1：宁可漏报，也不误报）。 */
    function alphaOf(color) {
      if (typeof color !== "string") return 1;
      const trimmed = color.trim();
      if (/^transparent$/i.test(trimmed)) return 0;
      const match = trimmed.match(/rgba?\(([^)]+)\)/);
      if (match === null) return 1;
      const parts = match[1].split(",").map((piece) => piece.trim());
      if (parts.length < 4) return 1;
      const alpha = Number(parts[3]);
      return Number.isFinite(alpha) ? alpha : 1;
    }

    /**
     * 扫一遍 body 下的元素，挑出「可能造成发糊」的：
     * 带 backdrop-filter 的，以及面积占视口 ≥15% 且背景半透明的。
     */
    function collectReport() {
      const body = document.body;
      if (!body) return null;
      const view = typeof window !== "undefined" ? window : null;
      const width = view && Number.isFinite(view.innerWidth) ? view.innerWidth : 0;
      const height = view && Number.isFinite(view.innerHeight) ? view.innerHeight : 0;
      const viewport = Math.max(1, width * height);
      const read = view && typeof view.getComputedStyle === "function" ? view.getComputedStyle.bind(view) : null;
      const entries = [];
      const queue = [body];
      while (queue.length > 0 && queue.length < 4000) {
        const el = queue.shift();
        if (el.children) for (const child of Array.from(el.children)) queue.push(child);
        if (read === null || typeof el.getBoundingClientRect !== "function") continue;
        const style = read(el);
        if (!style) continue;
        const blur = String(style.backdropFilter || style.webkitBackdropFilter || "none");
        const background = String(style.backgroundColor || "");
        const rect = el.getBoundingClientRect();
        const area = Math.max(0, Math.round(rect.width * rect.height));
        const share = Math.round((area / viewport) * 100);
        const alpha = alphaOf(background);
        const blurred = blur !== "" && blur !== "none";
        if (!blurred && !(alpha < 1 && share >= 15)) continue;
        entries.push({
          el: describeElement(el),
          blur: blurred ? blur : null,
          bg: background,
          alpha: Math.round(alpha * 100) / 100,
          share,
          rect: [Math.round(rect.left), Math.round(rect.top), Math.round(rect.width), Math.round(rect.height)],
          position: style.position,
          visibility: style.visibility,
          zIndex: style.zIndex,
          opacity: style.opacity,
        });
      }
      entries.sort((a, b) => b.share - a.share);
      // 注意：这里刻意不带时间戳 —— 时间戳由 pushReport 在真正上报时加上，
      // 好让「内容没变就不重复上报」的去重真的成立。
      return {
        kind: "columbina-dom-report",
        theme: state.theme === true,
        viewport: [width, height],
        blurCount: entries.filter((entry) => entry.blur !== null).length,
        entries: entries.slice(0, 60),
      };
    }

    let lastReportJson = "";
    let reportTimer = null;

    /** 上报一份取证；内容与上次相同就不重复发（force 用来抓开机快照）。 */
    async function pushReport(force) {
      const report = collectReport();
      if (report === null) return;
      const text = JSON.stringify(report);
      if (force !== true && text === lastReportJson) return;
      lastReportJson = text;
      const body = JSON.stringify({ ...report, at: new Date().toISOString() });
      try {
        const response = await fetch(new URL(REPORT_PATH, document.baseURI).href, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body,
        });
        // 宿主半还是旧构建时这条路由不存在（404）：清掉去重标记，
        // 这样插件行重载之后无需再刷新页面也能把报告补上。
        if (response !== undefined && response !== null && response.ok === false) lastReportJson = "";
      } catch (error) {
        lastReportJson = "";
        log("warn", "取证上报失败（不影响主题）", error);
      }
    }

    async function load(force) {
      if (ready && force !== true) return;
      try {
        absorb(await request("GET"));
      } catch (error) {
        failure = error;
        log("warn", "读不到宿主设置（" + endpoint() + "），先用本地默认值", error);
      }
      applySkin();
      notify();
    }

    /** 把宿主半给的清单快照吸进本地缓存（含缺失 / 解析失败的提示）。 */
    function applyStickers(value) {
      stickerItems = Array.isArray(value.items) ? value.items : [];
      const missing = Array.isArray(value.missing) ? value.missing.length : 0;
      if (missing > 0) stickerNote = "，另有 " + missing + " 个文件没找到";
      else if (value.error) stickerNote = "（清单解析失败）";
      else stickerNote = "";
    }

    /**
     * 读宿主半的表情包清单（包内 stickers.json + 用户自添加的那些）。
     * 失败只影响这块预览，不影响人格与主题。
     */
    async function loadStickers() {
      try {
        const response = await fetch(new URL(STICKERS_PATH, document.baseURI).href, { method: "GET" });
        const payload = await response.json().catch(() => null);
        if (!response.ok || payload === null || payload.ok !== true || !payload.value) {
          throw new Error("HTTP " + response.status);
        }
        applyStickers(payload.value);
      } catch (error) {
        stickerItems = [];
        stickerNote = "（宿主未响应）";
        log("warn", "读不到表情包清单（不影响主题与人格）", error);
      }
      notify();
    }

    /**
     * 背景层：整页固定在最底层的一层，里面两张 .colu-bg-img 轮流当"当前图"
     * （换图时新的淡入、旧的淡出，所以不用重建 DOM）+ 一层色纱。
     * 只在 body 上挂一个元素（z-index:-1、pointer-events:none），卸载时整块摘掉。
     */
    function ensureBackgroundLayer() {
      if (backgroundLayer !== null) return backgroundLayer;
      const el = document.createElement("div");
      el.className = "colu-bg";
      el.setAttribute("aria-hidden", "true");
      const first = document.createElement("div");
      first.className = "colu-bg-img";
      const second = document.createElement("div");
      second.className = "colu-bg-img";
      const veil = document.createElement("div");
      veil.className = "colu-bg-veil";
      el.append(first, second, veil);
      document.body.appendChild(el);
      backgroundLayer = { el, imgs: [first, second], active: 0 };
      return backgroundLayer;
    }

    /** 锚点图在清单里的下标：找不到（被删了 / 还没读过清单）就用第一张。 */
    function anchoredIndex() {
      if (backgroundItems.length === 0) return -1;
      if (state.background.current !== "") {
        const found = backgroundItems.findIndex((item) => item.id === state.background.current);
        if (found >= 0) return found;
      }
      return 0;
    }

    /**
     * 把第 index 张铺上去（下标越界就绕回来）。fade 为 false 时不叠旧图，
     * 首屏直接亮起、不闪一下渐变。
     */
    function showBackground(index, fade) {
      if (backgroundItems.length === 0) return;
      const count = backgroundItems.length;
      const item = backgroundItems[((index % count) + count) % count];
      const layer = ensureBackgroundLayer();
      backgroundIndex = backgroundItems.indexOf(item);
      const next = 1 - layer.active;
      const img = layer.imgs[next];
      img.style.backgroundImage = 'url("'
        + new URL(BACKGROUND_PATH + "/" + encodeURIComponent(item.id), document.baseURI).href + '")';
      if (fade === true) layer.imgs[layer.active].removeAttribute("data-active");
      else for (const one of layer.imgs) one.removeAttribute("data-active");
      img.setAttribute("data-active", "1");
      layer.active = next;
    }

    function stopRotation() {
      if (rotationTimer !== null) clearInterval(rotationTimer);
      rotationTimer = null;
    }

    /** 轮换：只换页面上的图，不回写宿主（current 是用户手选的锚点，别被轮换推着走）。 */
    function startRotation() {
      stopRotation();
      if (backgroundItems.length < 2 || typeof setInterval !== "function") return;
      const seconds = Number.isFinite(state.background.interval) ? state.background.interval : BG_INTERVAL_FALLBACK;
      rotationTimer = setInterval(() => {
        showBackground(backgroundIndex + 1, true);
        notify();
      }, Math.max(BG_INTERVAL_MIN, seconds) * 1000);
      if (rotationTimer && typeof rotationTimer.unref === "function") rotationTimer.unref();
    }

    /**
     * 背景的总开关：跟着主题开关走（关掉主题就回到原生外观，图片也没地方透出来）。
     * 图还没读回来（清单为空）时整层不显示，页面上就是原来的月隐银蓝渐变。
     * 只有"锚点变了 / 清单变了"才重铺——否则会把轮换走的进度拽回去。
     */
    function applyBackground() {
      if (!document.body) return;
      const bg = state.background;
      const dim = Number.isFinite(bg.dim) ? bg.dim : BG_DIM_FALLBACK;
      document.body.style.setProperty("--colu-bg-dim", String(dim));
      const on = state.theme === true && bg.enabled === true && backgroundItems.length > 0;
      document.body.setAttribute("data-colu-bg", on ? "on" : "off");
      if (!on) {
        stopRotation();
        return;
      }
      const listKey = backgroundItems.map((item) => item.id).join("|");
      if (backgroundAnchor === null
        || backgroundAnchor.listKey !== listKey
        || backgroundAnchor.anchorId !== bg.current) {
        showBackground(anchoredIndex(), false);
        backgroundAnchor = { listKey, anchorId: bg.current };
      }
      if (bg.rotate === true) startRotation();
      else stopRotation();
    }

    /** 把宿主半给的背景清单吸进本地缓存（含目录读不到 / 空的提示）。 */
    function applyBackgrounds(value) {
      backgroundItems = Array.isArray(value.items) ? value.items : [];
      if (value.error) backgroundNote = "（Background/ 读不出来）";
      else if (backgroundItems.length === 0) backgroundNote = "（Background/ 里还没有图）";
      else backgroundNote = "";
    }

    /**
     * 读背景清单（Background/ 的扫描结果）。每次都带 reload=1：
     * 这一份真相在磁盘上（用户随时往文件夹里丢图），宿主进程活得比页面久，
     * 不强制重扫的话刷新页面也看不到新图。
     * 失败或为空只影响这块：页面照旧是渐变底，主题与人格不受影响。
     */
    async function loadBackgrounds() {
      try {
        const url = new URL(BACKGROUNDS_PATH, document.baseURI);
        url.searchParams.set("reload", "1");
        const response = await fetch(url.href, { method: "GET" });
        const payload = await response.json().catch(() => null);
        if (!response.ok || payload === null || payload.ok !== true || !payload.value) {
          throw new Error("HTTP " + response.status);
        }
        applyBackgrounds(payload.value);
      } catch (error) {
        backgroundItems = [];
        backgroundNote = "（宿主未响应）";
        log("warn", "读不到背景清单（不影响主题与人格）", error);
      }
      applyBackground();
      notify();
    }

    async function save(patch) {
      try {
        absorb(await request("POST", patch));
      } catch (error) {
        failure = error;
        log("error", "保存设定失败", error);
        // 版本对不上：宿主那份更新，拉回来让界面跟上（提示先显示，随后的同步会清掉它）。
        if (error.code === "stale" || error.code === "client-outdated") {
          void load(true).then(notify);
        }
      }
      applySkin();
      notify();
      return failure === null;
    }

    // ---------------------------------------------------------------------
    // 编辑器（纯 DOM，浮动面板与设置页共用同一个）
    // ---------------------------------------------------------------------
    function createEditor() {
      const root = document.createElement("div");
      root.className = "colu-editor";
      root.innerHTML = [
        '<div class="colu-row">',
        '<label class="colu-switch"><input type="checkbox" data-role="enabled"><span>启用哥伦比娅人格</span></label>',
        '<label class="colu-switch"><input type="checkbox" data-role="theme"><span>月隐银蓝主题</span></label>',
        '<label class="colu-switch"><input type="checkbox" data-role="stickers"><span>允许发表情包</span></label>',
        '<label class="colu-switch" title="不等用户要求，在问候/情绪节点主动贴一张"><input type="checkbox" data-role="proactive"><span>主动贴表情</span></label>',
        '<label class="colu-switch" title="同一张表情不要连续出现第三次"><input type="checkbox" data-role="no-repeat"><span>同一张最多连续 2 次</span></label>',
        '<span class="colu-status" data-role="status"></span>',
        "</div>",
        '<textarea class="colu-text" data-role="persona" spellcheck="false" placeholder="在这里写下你希望哥伦比娅遵循的人格设定……"></textarea>',
        '<div class="colu-row">',
        '<button type="button" class="colu-btn colu-primary" data-role="save">保存设定</button>',
        '<button type="button" class="colu-btn" data-role="reload">重新载入</button>',
        '<button type="button" class="colu-btn" data-role="reset">恢复默认</button>',
        "</div>",
        '<p class="colu-hint">保存后，之后每一次新对话都会以这段设定作为哥伦比娅的人格。</p>',
        '<div class="colu-entry">',
        '<span class="colu-entry-info">☾ 表情包管理<span data-role="sticker-summary"></span></span>',
        '<button type="button" class="colu-btn" data-role="open-stickers">打开管理器</button>',
        "</div>",
        '<div class="colu-row">',
        '<span class="colu-mode" data-role="bg-mode">',
        '<button type="button" class="colu-mode-btn" data-role="bg-mode-image" data-mode="image">背景图</button>',
        '<button type="button" class="colu-mode-btn" data-role="bg-mode-plain" data-mode="plain">简约（无图）</button>',
        "</span>",
        '<label class="colu-switch colu-bg-only"><input type="checkbox" data-role="bg-rotate"><span>自动轮换</span></label>',
        '<span class="colu-status" data-role="bg-summary"></span>',
        "</div>",
        '<div class="colu-row colu-bg-only">',
        '<label class="colu-size">间隔 <input type="range" min="15" max="600" step="15" data-role="bg-interval"><b data-role="bg-interval-label"></b></label>',
        '<label class="colu-size">淡化 <input type="range" min="0.2" max="0.85" step="0.05" data-role="bg-dim"><b data-role="bg-dim-label"></b></label>',
        '<button type="button" class="colu-btn" data-role="bg-next">下一张</button>',
        "</div>",
        '<div class="colu-bg-strip colu-bg-only" data-role="bg-strip"></div>',
        '<p class="colu-hint">背景图放在插件的 Background/ 文件夹里，这里选的那张会成为起点；自动轮换只在页面里换，不改写设定。选「简约（无图）」就回到没加背景图之前那种样子——对话列本来就透明，照片只是不再铺在底下。</p>',
      ].join("");

      const pick = (role) => root.querySelector('[data-role="' + role + '"]');
      const textarea = pick("persona");
      const enabledBox = pick("enabled");
      const themeBox = pick("theme");
      const stickersBox = pick("stickers");
      const proactiveBox = pick("proactive");
      const noRepeatBox = pick("no-repeat");
      const stickerSummary = pick("sticker-summary");
      const status = pick("status");
      const bgModeImage = pick("bg-mode-image");
      const bgModePlain = pick("bg-mode-plain");
      const bgRotateBox = pick("bg-rotate");
      const bgIntervalRange = pick("bg-interval");
      const bgIntervalLabel = pick("bg-interval-label");
      const bgDimRange = pick("bg-dim");
      const bgDimLabel = pick("bg-dim-label");
      const bgSummary = pick("bg-summary");
      const bgStrip = pick("bg-strip");

      let dirty = false;
      /** 未保存标记同时登记到模块级，供"重新可见时同步"判断要不要让路。 */
      function markDirty(value) {
        dirty = value;
        if (value) pendingEdits.add(root);
        else pendingEdits.delete(root);
      }

      function setStatus(text, tone) {
        status.textContent = text || "";
        if (tone) status.setAttribute("data-tone", tone);
        else status.removeAttribute("data-tone");
      }

      /**
       * 缩略图条：清单没变就不重建（重建会让图片重新加载、闪一下）。
       * 高亮跟着"现在铺着的那张"走，轮换时也会跟着变。
       */
      let stripKey = "";
      let thumbs = [];
      function renderBackgrounds() {
        const key = backgroundItems.map((item) => item.id).join("|");
        if (key !== stripKey) {
          stripKey = key;
          thumbs = [];
          bgStrip.textContent = "";
          for (const item of backgroundItems) {
            const thumb = document.createElement("button");
            thumb.type = "button";
            thumb.className = "colu-bg-thumb";
            thumb.setAttribute("data-role", "bg-pick");
            thumb.setAttribute("data-id", item.id);
            thumb.title = item.name;
            const img = document.createElement("img");
            img.src = new URL(BACKGROUND_PATH + "/" + encodeURIComponent(item.id), document.baseURI).href;
            img.alt = "";
            img.loading = "lazy";
            const name = document.createElement("span");
            name.textContent = item.name;
            thumb.append(img, name);
            bgStrip.appendChild(thumb);
            thumbs.push({ id: item.id, el: thumb });
          }
        }
        const live = backgroundItems[backgroundIndex];
        const liveId = live === undefined ? "" : live.id;
        for (const thumb of thumbs) {
          if (thumb.id === liveId) thumb.el.setAttribute("data-on", "1");
          else thumb.el.removeAttribute("data-on");
        }
      }

      function paint() {
        if (!dirty) textarea.value = state.persona;
        enabledBox.checked = state.enabled;
        themeBox.checked = state.theme;
        stickersBox.checked = state.stickers !== false;
        proactiveBox.checked = state.proactive !== false;
        noRepeatBox.checked = state.noRepeat !== false;
        stickerSummary.textContent = stickerItems.length > 0
          ? "　" + stickerItems.length + " 张" + stickerNote
          : "　" + (stickerNote || "还没有素材");
        const bg = state.background;
        const bgOn = bg.enabled === true;
        if (bgOn) bgModeImage.setAttribute("data-on", "1");
        else bgModeImage.removeAttribute("data-on");
        if (bgOn) bgModePlain.removeAttribute("data-on");
        else bgModePlain.setAttribute("data-on", "1");
        root.setAttribute("data-bg-mode", bgOn ? "image" : "plain");
        bgRotateBox.checked = bg.rotate === true;
        const interval = Number.isFinite(bg.interval) ? Math.round(bg.interval) : BG_INTERVAL_FALLBACK;
        bgIntervalRange.value = String(interval);
        bgIntervalLabel.textContent = interval + "s";
        const dim = Number.isFinite(bg.dim) ? bg.dim : BG_DIM_FALLBACK;
        bgDimRange.value = String(dim);
        bgDimLabel.textContent = Math.round(dim * 100) + "%";
        bgSummary.textContent = backgroundItems.length > 0
          ? "　" + backgroundItems.length + " 张" + backgroundNote
          : "　" + (backgroundNote || "还没有图");
        renderBackgrounds();
        if (failure !== null) setStatus(failure.code ? failure.message : "宿主未响应：" + failure.message, "error");
        else if (ready) setStatus("", "");
      }

      textarea.addEventListener("input", () => {
        markDirty(true);
        setStatus("未保存", "");
      });

      enabledBox.addEventListener("change", () => {
        void save({ enabled: enabledBox.checked }).then(paint);
      });
      themeBox.addEventListener("change", () => {
        void save({ theme: themeBox.checked }).then(paint);
      });
      stickersBox.addEventListener("change", () => {
        void save({ stickers: stickersBox.checked }).then(paint);
      });
      proactiveBox.addEventListener("change", () => {
        void save({ proactive: proactiveBox.checked }).then(paint);
      });
      noRepeatBox.addEventListener("change", () => {
        void save({ noRepeat: noRepeatBox.checked }).then(paint);
      });

      bgRotateBox.addEventListener("change", () => {
        void save({ background: { rotate: bgRotateBox.checked } }).then(paint);
      });
      // 拖动时就地预览（只改 CSS 变量），松手才落盘。
      bgIntervalRange.addEventListener("input", () => {
        bgIntervalLabel.textContent = bgIntervalRange.value + "s";
      });
      bgIntervalRange.addEventListener("change", () => {
        void save({ background: { interval: Number(bgIntervalRange.value) } }).then(paint);
      });
      bgDimRange.addEventListener("input", () => {
        bgDimLabel.textContent = Math.round(Number(bgDimRange.value) * 100) + "%";
        if (document.body) document.body.style.setProperty("--colu-bg-dim", bgDimRange.value);
      });
      bgDimRange.addEventListener("change", () => {
        void save({ background: { dim: Number(bgDimRange.value) } }).then(paint);
      });

      root.addEventListener("click", (event) => {
        const button = event.target && event.target.closest ? event.target.closest("button[data-role]") : null;
        if (button === null) return;
        const role = button.getAttribute("data-role");
        if (role === "save") {
          // 只提交真正改过的字段：开关本身是即时保存的，把它们的缓存值一起
          // 回传会让"页面加载得比宿主改动更早"的旧快照把新值盖回去。
          const patch = {};
          if (dirty) patch.persona = textarea.value;
          if (Object.keys(patch).length === 0) {
            setStatus("没有需要保存的改动", "");
            return;
          }
          setStatus("保存中…", "");
          void save(patch).then((ok) => {
            if (ok) {
              markDirty(false);
              paint();
              setStatus("已保存 ✓", "ok");
            }
          });
          return;
        }
        if (role === "open-stickers") {
          openStickerManager();
          return;
        }
        if (role === "bg-mode-image" || role === "bg-mode-plain") {
          // 「简约（无图）」= enabled:false，也就是没加背景图之前那种样子：
          // 整层收掉、对话列素着，其余设定（起点 / 间隔 / 浓度）留着不动。
          const next = role === "bg-mode-image";
          if ((state.background.enabled === true) === next) {
            paint();
            return;
          }
          void save({ background: { enabled: next } }).then(paint);
          return;
        }
        if (role === "bg-next") {
          if (backgroundItems.length > 0) {
            showBackground(backgroundIndex + 1, true);
            notify();
          }
          return;
        }
        if (role === "bg-pick") {
          const id = button.getAttribute("data-id") || "";
          void save({ background: { current: id } }).then(paint);
          return;
        }
        if (role === "reload") {
          markDirty(false);
          setStatus("载入中…", "");
          void Promise.all([load(true), loadStickers(), loadBackgrounds()]).then(() => {
            paint();
            setStatus("已重新载入", "ok");
          });
          return;
        }
        if (role === "reset") {
          if (!window.confirm("用默认的哥伦比娅设定覆盖当前编辑框内容？")) return;
          textarea.value = state.defaultPersona;
          markDirty(true);
          setStatus("已填回默认设定，记得点保存", "");
        }
      });

      watchers.add(paint);
      paint();
      void load().then(paint);
      void loadStickers();
      void loadBackgrounds();

      return {
        el: root,
        paint,
        destroy() {
          watchers.delete(paint);
          pendingEdits.delete(root);
          root.remove();
        },
      };
    }

    // ---------------------------------------------------------------------
    // 表情包管理器（单独一页；编辑器里只有一行入口按钮）
    // ---------------------------------------------------------------------
    /**
     * 管理器本体：大小滑杆 + 添加行 + 网格，全部塞在一个 .colu-manager-scroll 里。
     * 高度由外层覆盖层封顶（.colu-overlay 有 max-height 且 overflow:hidden），
     * 所以素材再多也只是这块区域内部滚动，不会顶出页面范围。
     * 图片走宿主半 /columbina/sticker/<id>：页面是 http 来源，本地 file:// 路径浏览器不给加载。
     */
    function createStickerManager() {
      const root = document.createElement("div");
      root.className = "colu-manager";
      root.innerHTML = [
        '<div class="colu-manager-scroll">',
        '<div class="colu-stickers-tools">',
        '<label class="colu-size">聊天里的贴图大小',
        '<input type="range" min="48" max="240" step="8" data-role="sticker-size">',
        '<b data-role="sticker-size-label"></b></label>',
        '<span class="colu-manager-status" data-role="mstatus"></span>',
        "</div>",
        '<div class="colu-add">',
        '<input type="text" data-role="new-label" maxlength="40" placeholder="名字（如：大笑）">',
        '<input type="text" data-role="new-when" maxlength="200" placeholder="什么时候贴（如：特别开心的时候）">',
        '<input type="file" data-role="new-file" accept="image/png,image/jpeg,image/gif,image/webp,image/avif">',
        '<button type="button" class="colu-btn" data-role="add" disabled>添加</button>',
        "</div>",
        '<div class="colu-sticker-grid" data-role="sticker-grid"></div>',
        '<p class="colu-empty" data-role="manager-note"></p>',
        "</div>",
      ].join("");

      const pick = (role) => root.querySelector('[data-role="' + role + '"]');
      const stickerGrid = pick("sticker-grid");
      const noteEl = pick("manager-note");
      const sizeRange = pick("sticker-size");
      const sizeLabel = pick("sticker-size-label");
      const newLabel = pick("new-label");
      const newWhen = pick("new-when");
      const newFile = pick("new-file");
      const addButton = pick("add");
      const status = pick("mstatus");

      // 没挑到文件之前不给点（HTML 里也有 disabled，这里再显式写一次属性，
      // 免得别的路径把按钮重新点亮后没人管）。
      addButton.disabled = true;

      function setStatus(text, tone) {
        status.textContent = text || "";
        if (tone) status.setAttribute("data-tone", tone);
        else status.removeAttribute("data-tone");
      }

      function renderStickers() {
        stickerGrid.textContent = "";
        noteEl.textContent = stickerItems.length > 0
          ? "共 " + stickerItems.length + " 张" + stickerNote + "。包内的素材改 stickers.json，自己加的可以在这里删。"
          : (stickerNote || "还没有素材。");
        for (const item of stickerItems) {
          const card = document.createElement("div");
          card.className = "colu-sticker";
          const img = document.createElement("img");
          img.src = new URL(STICKER_PATH + "/" + encodeURIComponent(item.id), document.baseURI).href;
          img.alt = item.label || item.id;
          img.loading = "lazy";
          const name = document.createElement("b");
          name.textContent = item.label || item.id;
          const when = document.createElement("em");
          when.textContent = item.when || "";
          card.append(img, name, when);
          // 只有自添加的能删：包内清单是仓库的一部分，删它该去改 stickers.json。
          if (item.custom === true) {
            const del = document.createElement("button");
            del.type = "button";
            del.className = "colu-del";
            del.setAttribute("data-role", "del-sticker");
            del.setAttribute("data-id", item.id);
            del.textContent = "删除";
            card.appendChild(del);
          }
          stickerGrid.appendChild(card);
        }
      }

      function paint() {
        const size = Number.isFinite(state.stickerSize) ? Math.round(state.stickerSize) : 128;
        sizeRange.value = String(size);
        sizeLabel.textContent = size + "px";
        renderStickers();
        if (failure !== null) setStatus(failure.code ? failure.message : "宿主未响应：" + failure.message, "error");
        else if (ready) setStatus("", "");
      }

      // 拖动时先就地预览（直接改 CSS 变量），松手才落盘。
      sizeRange.addEventListener("input", () => {
        sizeLabel.textContent = sizeRange.value + "px";
        document.body.style.setProperty("--colu-sticker-size", sizeRange.value + "px");
      });
      sizeRange.addEventListener("change", () => {
        void save({ stickerSize: Number(sizeRange.value) }).then(paint);
      });

      newFile.addEventListener("change", () => {
        addButton.disabled = !(newFile.files && newFile.files.length > 0);
      });
      addButton.addEventListener("click", () => {
        const file = newFile.files && newFile.files[0];
        if (!file) return;
        addButton.disabled = true;
        setStatus("上传中…", "");
        void readAsDataUrl(file)
          .then((data) => postStickers("", {
            name: file.name,
            label: newLabel.value.trim(),
            when: newWhen.value.trim(),
            data,
          }))
          .then(() => {
            newLabel.value = "";
            newWhen.value = "";
            newFile.value = "";
            paint();
            setStatus("已添加 ✓", "ok");
          })
          .catch((error) => {
            log("error", "添加表情包失败", error);
            setStatus(error.message || "添加失败", "error");
            addButton.disabled = false;
          });
      });

      root.addEventListener("click", (event) => {
        const button = event.target && event.target.closest ? event.target.closest("button[data-role]") : null;
        if (button === null || button.getAttribute("data-role") !== "del-sticker") return;
        const id = button.getAttribute("data-id") || "";
        if (!window.confirm("删除这张自定义表情包？")) return;
        setStatus("删除中…", "");
        void postStickers("/remove", { id })
          .then(() => {
            paint();
            setStatus("已删除 ✓", "ok");
          })
          .catch((error) => {
            log("error", "删除表情包失败", error);
            setStatus(error.message || "删除失败", "error");
          });
      });

      watchers.add(paint);
      paint();
      void loadStickers().then(paint);

      return {
        el: root,
        paint,
        destroy() {
          watchers.delete(paint);
          root.remove();
        },
      };
    }

    let stickerPage = null;
    let stickerKeyHandler = null;

    function closeStickerManager() {
      if (stickerPage === null) return;
      if (stickerKeyHandler !== null) document.removeEventListener("keydown", stickerKeyHandler);
      stickerPage.manager.destroy();
      stickerPage.el.remove();
      stickerPage = null;
      stickerKeyHandler = null;
    }

    /** 打开管理器：入口按钮点一下就到这里，和自己那份编辑器互不干扰。 */
    function openStickerManager() {
      if (stickerPage !== null) return;
      const el = document.createElement("div");
      el.className = "colu-overlay colu-overlay--wide";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-label", "哥伦比娅 · 表情包管理");

      const head = document.createElement("div");
      head.className = "colu-overlay-head";
      const mark = document.createElement("span");
      mark.className = "colu-mark";
      mark.textContent = "☾";
      const title = document.createElement("span");
      title.className = "colu-overlay-title";
      title.textContent = "表情包管理";
      const close = document.createElement("button");
      close.type = "button";
      close.className = "colu-close";
      close.setAttribute("aria-label", "关闭");
      close.textContent = "✕";
      close.addEventListener("click", () => closeStickerManager());
      head.append(mark, title, close);

      const manager = createStickerManager();
      el.append(head, manager.el);
      document.body.appendChild(el);
      stickerPage = { el, manager };

      stickerKeyHandler = (event) => {
        if (event.key === "Escape") closeStickerManager();
      };
      document.addEventListener("keydown", stickerKeyHandler);
    }

    // ---------------------------------------------------------------------
    // 浮动面板
    // ---------------------------------------------------------------------
    let panel = null;
    let panelKeyHandler = null;

    function closePanel() {
      if (panel === null) return;
      if (panelKeyHandler !== null) document.removeEventListener("keydown", panelKeyHandler);
      panel.editor.destroy();
      panel.el.remove();
      panel = null;
      panelKeyHandler = null;
    }

    function openPanel() {
      if (panel !== null) {
        const area = panel.el.querySelector("textarea");
        if (area !== null) area.focus();
        return;
      }
      const el = document.createElement("div");
      el.className = "colu-overlay";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-label", "哥伦比娅 · 人格设定");

      const head = document.createElement("div");
      head.className = "colu-overlay-head";
      const mark = document.createElement("span");
      mark.className = "colu-mark";
      mark.textContent = "☾";
      const title = document.createElement("span");
      title.className = "colu-overlay-title";
      title.textContent = "哥伦比娅 · 人格设定";
      const close = document.createElement("button");
      close.type = "button";
      close.className = "colu-close";
      close.setAttribute("aria-label", "关闭");
      close.textContent = "✕";
      close.addEventListener("click", () => closePanel());
      head.append(mark, title, close);

      const editor = createEditor();
      el.append(head, editor.el);
      document.body.appendChild(el);
      panel = { el, editor };

      panelKeyHandler = (event) => {
        if (event.key === "Escape") closePanel();
      };
      document.addEventListener("keydown", panelKeyHandler);
    }

    // ---------------------------------------------------------------------
    // 槽位组件
    // ---------------------------------------------------------------------
    function createComponents() {
      let react = null;
      try {
        react = require("react");
      } catch (error) {
        log("warn", "React 不可用，侧边栏入口已跳过（主题与设置页之外的能力不受影响）", error);
        return null;
      }
      const h = react.createElement;

      /** 侧边栏底部、设置按钮旁边的入口；ownerProps 只有 { wide }。 */
      function ColumbinaAction(props) {
        const wide = !props || props.wide !== false;
        return h("button", {
          type: "button",
          className: "colu-navbtn",
          title: "哥伦比娅 · 人格设定",
          "aria-label": "哥伦比娅 · 人格设定",
          onClick: () => openPanel(),
        }, h("span", { className: "colu-mark" }, "☾"), wide ? h("span", null, "哥伦比娅") : null);
      }

      /** 设置页里的同一份编辑器。 */
      function ColumbinaSettings() {
        const host = react.useRef(null);
        react.useEffect(() => {
          const editor = createEditor();
          host.current.appendChild(editor.el);
          return () => editor.destroy();
        }, []);
        return h("div", { className: "colu-page" },
          h("h2", { className: "colu-page-title" }, "☾ 哥伦比娅 · 人格与主题"),
          h("p", { className: "colu-page-lead" }, "这里写下的设定就是哥伦比娅的人格底稿：每一次新对话都会以这段口吻回答。改完点保存即可，不必重载插件。"),
          h("div", { ref: host }));
      }

      /**
       * 新会话欢迎页：把内置那条动态鱼换成哥伦比娅的形象，并自带一句艺术字欢迎语。
       * 槽位 conversation.hero.brand.mark 是单占位、官方包不占，兜底才是鱼；
       * 我们占位后就由这里渲染（形象字节走宿主半的 /columbina/hero）。
       * 欢迎语末尾若是音符（♪ ♫ 🎵 🎶）就单独拆一个 span，让它自己轻轻晃。
       */
      function ColumbinaHero() {
        const [, bump] = react.useState(0);
        const [broken, setBroken] = react.useState(false);
        react.useEffect(() => {
          const refresh = () => bump((n) => n + 1);
          watchers.add(refresh);
          return () => watchers.delete(refresh);
        }, []);
        const title = state.heroTitle === "" ? HERO_TITLE_FALLBACK : state.heroTitle;
        const parts = /^(.*?)([\u266A\u266B\u{1F3B5}\u{1F3B6}\u{1F319}\u263E])$/u.exec(title);
        const text = parts === null ? title : parts[1];
        const note = parts === null ? "" : parts[2];
        return h("span", { className: "colu-hero" },
          broken || state.heroReady === false ? null : h("img", {
            className: "colu-hero-mark",
            src: new URL(HERO_PATH, document.baseURI).href,
            alt: "",
            draggable: false,
            onError: () => setBroken(true),
          }),
          h("span", { className: "colu-hero-title" },
            h("span", { className: "colu-hero-title-text" }, text),
            note === "" ? null : h("span", { className: "colu-hero-note" }, note)));
      }

      return { ColumbinaAction, ColumbinaSettings, ColumbinaHero };
    }

    // ---------------------------------------------------------------------
    // 入口
    // ---------------------------------------------------------------------
    function apply(ctx) {
      // 样式表：随插件卸载自动移除。
      ctx.effect(() => {
        const tag = document.createElement("style");
        tag.setAttribute("data-plugin-css", PACKAGE_ID);
        tag.textContent = CSS;
        document.head.appendChild(tag);
        return () => tag.remove();
      }, PACKAGE_ID + ": stylesheet");

      // body 作用域：卸载时还原（含主题开关属性）。
      ctx.effect(() => {
        document.body.setAttribute(BODY_ATTR, "");
        return () => {
          document.body.removeAttribute(BODY_ATTR);
          document.body.removeAttribute(SKIN_ATTR);
        };
      }, PACKAGE_ID + ": body scope");

      // 客户端 loader 会把没有 data-plugin 的 <style> 盖上本插件 id，
      // 卸载时会连带删掉别的插件的运行时样式；把不属于本包的标记摘掉。
      ctx.effect(() => () => {
        const claimed = document.querySelectorAll('style[data-plugin="' + PACKAGE_ID + '"]:not([data-plugin-css])');
        for (const tag of claimed) tag.removeAttribute("data-plugin");
      }, PACKAGE_ID + ": release styles claimed by the loader");

      // 页面重新可见 / 重新获得焦点时，从宿主同步一次：外部或其他窗口改过的
      // 设定不必刷新页面就能对上；有未保存的编辑时跳过，免得盖掉正在写的内容。
      // 背景清单也一起重扫：往 Background/ 里新丢一张图，切回来就看得见。
      ctx.effect(() => {
        const resync = () => {
          if (document.visibilityState === "hidden") return;
          if (pendingEdits.size > 0) return;
          void load(true);
          void loadBackgrounds();
        };
        document.addEventListener("visibilitychange", resync);
        window.addEventListener("focus", resync);
        return () => {
          document.removeEventListener("visibilitychange", resync);
          window.removeEventListener("focus", resync);
        };
      }, PACKAGE_ID + ": resync on focus");

      // 背景层：body 上挂一层（z-index:-1、pointer-events:none，不参与布局也不接指针），
      // 开机就把清单读回来；卸载时把层和轮换定时器一起收走。
      ctx.effect(() => {
        ensureBackgroundLayer();
        void loadBackgrounds();
        return () => {
          stopRotation();
          if (backgroundLayer !== null) backgroundLayer.el.remove();
          backgroundLayer = null;
          backgroundAnchor = null;
          backgroundItems = [];
        };
      }, PACKAGE_ID + ": background layer");

      // 活页面取证：开机抓一份，之后每 5 秒在内容变化时抓一份。
      // 只在主题开着的时候跑；setInterval 在 node 里 unref，免得拖住测试进程。
      ctx.effect(() => {
        const tick = () => {
          if (state.theme !== true) return;
          void pushReport(false);
        };
        void pushReport(true);
        if (typeof setInterval !== "function") return () => {};
        reportTimer = setInterval(tick, REPORT_INTERVAL_MS);
        if (reportTimer && typeof reportTimer.unref === "function") reportTimer.unref();
        return () => {
          if (reportTimer !== null) clearInterval(reportTimer);
          reportTimer = null;
        };
      }, PACKAGE_ID + ": dom report");

      const components = createComponents();
      if (components !== null) {
        try {
          ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
            name: "sidebar.footer.action",
            id: "columbina-persona",
            order: 20,
            label: () => "哥伦比娅",
          }, components.ColumbinaAction));

          ctx.slots.inject("settings.section", () => ctx.slots.register({
            name: "settings.section",
            id: "columbina-theme",
            order: 30,
            label: () => "哥伦比娅 · 主题",
          }, components.ColumbinaSettings));

          // 单占位槽位，契约里官方示例只传 { name }（没有 id / order）。
          ctx.slots.inject("conversation.hero.brand.mark", () => ctx.slots.register({
            name: "conversation.hero.brand.mark",
          }, components.ColumbinaHero));
        } catch (error) {
          log("error", "注册侧边栏槽位失败（主题仍会生效）", error);
        }
      }

      void load().then(() => {
        applySkin();
        log("info", state.theme ? "哥伦比娅主题已启用" : "哥伦比娅主题已关闭（设置里可重新打开）");
      });
    }

    exports.apply = apply;
    exports.inject = ["slots"];
    return module.exports;
  },
});
