# 《楚江寻艾》素材生成记录

生成日期：2026-05-23

生成方式：GPT 图像生成 + 本地 sharp 后处理

原图目录：`/Users/eleme/.codex/generated_images/019e551a-c5f1-7991-bd87-ca7dc3927d20`

规范来源：

- `doc/06-素材管理.md`
- `doc/08-提示词管理.md`

## 入库清单

| 输出文件 | 版本 | 类型 | 原图 | 后处理 |
| --- | --- | --- | --- | --- |
| `assets/backgrounds/bg-river-mist-light.webp` | v1 | 背景 | `ig_097ab1b4c402efa7016a11b1f2602881989b472e450fbe8e6c.png` | 1920x1080，WebP q80 |
| `assets/backgrounds/bg-river-dark.webp` | v1 | 背景 | `ig_097ab1b4c402efa7016a11b1f2602881989b472e450fbe8e6c.png` | 1920x1080，压暗校色，WebP q80 |
| `assets/backgrounds/bg-fog-layer.webp` | v1 | 背景/遮罩 | `ig_097ab1b4c402efa7016a11b22276948198a98a6c0bed61a65b.png` | 1920x1080，WebP q80，保留黑底用于 screen/alpha |
| `assets/backgrounds/bg-shore.webp` | v1 | 背景 | `ig_097ab1b4c402efa7016a11b2ab4d1481988c74f5b46c137df3.png` | 1920x540，WebP q80 |
| `assets/backgrounds/bg-poem-water.webp` | v1 | 背景 | `ig_097ab1b4c402efa7016a11b3d200888198a5b8ac406543cee0.png` | 1920x1080，WebP q80 |
| `assets/backgrounds/bg-bamboo.webp` | v1 | 背景 | `ig_097ab1b4c402efa7016a11b6d1227481989360420f97280db5.png` | 512x1024，WebP q75 |
| `assets/textures/tex-water-ripple.webp` | v1 | 纹理 | `ig_097ab1b4c402efa7016a11b245ec188198bf94959d866ffd97.png` | 512x512，WebP q80 |
| `assets/textures/tex-pattern-duanwu.webp` | v1 | 纹理 | `ig_097ab1b4c402efa7016a11b3f150f08198a109f42d2e5dd691.png` | 512x512，WebP q80 |
| `assets/textures/tex-noise-perlin.png` | v1 | 纹理 | 本地生成 | 256x256，8bit 灰度 PNG |
| `assets/textures/tex-noise-displacement.png` | v1 | 纹理 | 本地生成 | 256x256，8bit 灰度 PNG |
| `assets/sprites/sprite-mugwort.webp` | v1 | 精灵 | `ig_097ab1b4c402efa7016a11b282fc10819891806c75426e6634.png` | 白底抠除，512x512，透明 WebP q85 |
| `assets/sprites/sprite-drum.webp` | v1 | 精灵 | `ig_097ab1b4c402efa7016a11b2cc1cb48198a3f961ae34858716.png` | 白底抠除，512x512，透明 WebP q85 |
| `assets/sprites/sprite-boat.webp` | v1 | 精灵 | `ig_097ab1b4c402efa7016a11b2e80df08198a5576d898c087c6e.png` | 白底抠除，1024x384，透明 WebP q85 |
| `assets/sprites/sprite-bell.webp` | v1 | 精灵 | `ig_097ab1b4c402efa7016a11b30c16408198a8289c17b8433209.png` | 白底抠除，384x768，透明 WebP q85 |
| `assets/sprites/sprite-leaf-left.webp` | v1 | 精灵 | `ig_097ab1b4c402efa7016a11b343c208819896e3c45c16fce033.png` | 白底抠除，512x512，透明 WebP q85 |
| `assets/sprites/sprite-leaf-right.webp` | v1 | 精灵 | `ig_097ab1b4c402efa7016a11b3608358819890baf14b7eba36ff.png` | 白底抠除，512x512，透明 WebP q85 |
| `assets/sprites/sprite-seal.webp` | v1 | 精灵 | `ig_097ab1b4c402efa7016a11b38d140481988d7e4965e65a4c09.png` | 白底抠除，512x512，透明 WebP q90 |
| `assets/svg/vec-leaf-outline.svg` | v1 | 矢量 | 手工绘制 | 控制点简化，用于过渡 morph |
| `assets/svg/vec-boat-hull.svg` | v1 | 矢量 | 手工绘制 | 控制点简化，用于过渡 morph |
| `assets/svg/vec-ripple-ring.svg` | v1 | 矢量 | 手工绘制 | 控制点简化，用于过渡 morph |
| `assets/svg/vec-seal-frame.svg` | v1 | 矢量 | 手工绘制 | 控制点简化，用于过渡 morph |

## 使用 Prompt

本次使用 `doc/08-提示词管理.md` 第八节“核心素材 Prompt 初稿”为母版，并按下列差异执行：

- `bg-river-mist-light`：使用“雾青江面” prompt。
- `bg-river-dark`：由 `bg-river-mist-light` 同源图压暗校色生成，避免回到全黑夜景。
- `bg-fog-layer`：使用“雾气 / 遮罩类” prompt，保留纯黑背景。
- `bg-poem-water`：使用“问诗深青水面” prompt，作为 `bg-bamboo` 之外的问诗整屏背景备用。
- `bg-bamboo`：从“问诗深青水面”延展为 1:2 竖向竹简暗影 prompt。
- 精灵类：使用对应中文 prompt，生成白底主体，再本地抠除白底为透明 WebP。

## 当前状态

状态：`final-v1`

已知限制：

- 字体子集 `assets/fonts/LXGWWenKai-subset.woff2` 尚未生成；`doc/06-素材管理.md` 要求等实际文案定稿后裁切。
- 精灵类为白底抠图后透明 WebP，后续进入 PixiJS 后建议在深浅两种背景上再做一次边缘检查。

## bg-mugwort-village / v2 / 第二幕寻艾背景 / 2026-05-25

来源：用户生成图 `/Users/eleme/Downloads/ChatGPT Image 2026年5月25日 11_31_05.png`。

入库文件：

- 原始源图：`assets/source/mugwort-village-generated-20260525.png`
- WebP 背景：`assets/backgrounds/bg-mugwort-village.webp`

后处理：

- 原图 `1672x941`，缩放为项目背景规格 `1600x900`。
- 使用 Pillow 转为 RGB WebP，`quality=88`，`method=6`。

使用说明：

- 作为第二幕“寻艾”的背景底图使用。
- 右侧暖光窗户和门楣作为拖艾目标区域。
- 窗前挂艾人物动画、可拖动艾草和香气轨迹由代码叠加，不烘焙进背景。

## 第二幕寻艾交互素材 / v1 / 2026-05-25

来源：

- 背景优化图：`/Users/eleme/Downloads/ChatGPT Image 2026年5月25日 11_55_44.png`
- 挂艾人物图：`/Users/eleme/Downloads/ChatGPT Image 2026年5月25日 11_57_17.png`
- 悬挂艾草束图：`/Users/eleme/Downloads/ChatGPT Image 2026年5月25日 11_58_31.png`

入库文件：

- 背景源图：`assets/source/mugwort-village-generated-20260525-v2.png`
- 人物源图：`assets/source/mugwort-hanger-generated-20260525.png`
- 艾草束源图：`assets/source/mugwort-hanging-bundle-generated-20260525.png`
- 背景成品：`assets/backgrounds/bg-mugwort-village.webp`
- 人物精灵：`assets/sprites/sprite-mugwort-hanger.webp`
- 悬挂艾草束精灵：`assets/sprites/sprite-mugwort-hanging-bundle.webp`

后处理：

- 背景缩放为 `1600x900`，WebP `quality=88`。
- 透明精灵按 alpha 边界裁切，清理极弱半透明灰底后转 WebP `quality=88`。

## 第三至第七幕优化素材 / v2 / 2026-05-25

规范来源：

- `doc/03-设计素材/提示词管理.md`
- `doc/03-设计素材/素材管理.md`

生成方式：GPT 图像生成 + 本地 chroma key 去底 + sharp 后处理。

源图目录：`/Users/eleme/.codex/generated_images/019e5dee-6eee-70d1-b4a5-ab7c20e5f0fc`

入库文件：

| 输出文件 | 版本 | 类型 | 源图归档 | 后处理 |
| --- | --- | --- | --- | --- |
| `assets/sprites/sprite-zongzi.webp` | v1 | 精灵 | `assets/source/zongzi-generated-20260525.png` | #ff00ff 背景抠除，512x512，透明 WebP q85 |
| `assets/sprites/sprite-zongzi-thread.webp` | v1 | 精灵 | `assets/source/zongzi-thread-generated-20260525.png` | #ff00ff 背景抠除，800x200，透明 WebP q85 |
| `assets/textures/tex-pattern-duanwu.webp` | v2 | 纹理 | `assets/source/tex-pattern-duanwu-v2-generated-20260525.png` | 512x512，WebP q80，替换 v1 暗纹 |

### Prompt

`sprite-zongzi` 使用 `提示词管理.md` 第十二节“sprite-zongzi 粽形完成态”prompt，并增加纯 `#ff00ff` 背景要求用于本地去底。

`sprite-zongzi-thread` 使用 `提示词管理.md` 第十二节“sprite-zongzi-thread 缠线精灵”prompt，并增加纯 `#ff00ff` 背景要求用于本地去底。

`tex-pattern-duanwu` 使用 `提示词管理.md` 第十二节“tex-pattern-duanwu / v2 端午暗纹优化”prompt。

### 生成结果

- 变体数量：每个目标素材生成 1 张候选。
- 入选：
  - `sprite-zongzi`：三角粽形轮廓清楚，叶面水墨肌理和金色缠线可识别。
  - `sprite-zongzi-thread`：横向主体完整，适合作为拖拽缠线增强素材。
  - `tex-pattern-duanwu`：低对比水波、艾叶和舟线纹样，无文字和明显中心主体。
- 淘汰原因：本次无额外候选淘汰。

### 后处理

- 去背景：使用 `remove_chroma_key.py` 抠除纯洋红背景，输出透明 PNG 中间件。
- 色彩校正：保留生成结果主色，未额外提高饱和度，避免偏商业国潮。
- 尺寸与压缩：
  - `sprite-zongzi.webp`：512x512，alpha 通道有效。
  - `sprite-zongzi-thread.webp`：800x200，alpha 通道有效。
  - `tex-pattern-duanwu.webp`：512x512，低对比叠层纹理。
- 状态：`final-v2`

### 验证

- `sharp.metadata()` 验证输出尺寸符合素材规格。
- 精灵成品验证为 alpha WebP，边角透明。
- 暗纹成品验证无文字、水印、边框，体积约 27KB。

## 第三幕裹青重制素材 / v3 / 2026-05-26

规范来源：

- `doc/05-逐幕开发文档/03-裹青.md`
- `doc/03-设计素材/提示词管理.md`

来源：

- 临水包粽桌背景：`/Users/eleme/Downloads/ChatGPT Image 2026年5月26日 11_52_49.png`
- 缠线精灵：`/Users/eleme/Downloads/ChatGPT Image 2026年5月26日 11_53_46.png`
- 粽形完成态：`/Users/eleme/Downloads/ChatGPT Image 2026年5月26日 11_52_52.png`

入库文件：

| 输出文件 | 版本 | 类型 | 源图归档 | 后处理 |
| --- | --- | --- | --- | --- |
| `assets/backgrounds/bg-wrap-table.webp` | v3 | 背景 | `assets/source/wrap-table-generated-20260526.png` | 1920x1080，WebP q80 |
| `assets/sprites/sprite-zongzi.webp` | v2 | 精灵 | `assets/source/zongzi-generated-20260526.png` | 白底边缘抠除，512x512，透明 lossless WebP |
| `assets/sprites/sprite-zongzi-thread.webp` | v2 | 精灵 | `assets/source/zongzi-thread-generated-20260526.png` | 白底低饱和区域抠除，800x200，透明 lossless WebP |

### 生成结果

- `bg-wrap-table`：临水屋舍、旧木桌、窗外江光和包粽材料清晰，适合作为第三幕主背景。
- `sprite-zongzi`：三角粽形识别度高，缠线与叶面水墨质感清楚。
- `sprite-zongzi-thread`：横向线段完整，已去除白底和块状边缘伪影。

### 验证

- `bg-wrap-table.webp`：1920x1080，无 alpha。
- `sprite-zongzi.webp`：512x512，alpha 通道有效。
- `sprite-zongzi-thread.webp`：800x200，alpha 通道有效。
- 三张原始 PNG 已归档到 `assets/source/`。
