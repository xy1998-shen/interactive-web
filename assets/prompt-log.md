# 《楚江寻艾》素材生成记录

生成日期：2026-05-23

生成方式：GPT 图像生成 + 本地 sharp 后处理

原图目录：`/Users/eleme/.codex/generated_images/019e551a-c5f1-7991-bd87-ca7dc3927d20`

规范来源：历史素材规范文档（现已清理）。

## 入库清单

| 输出文件 | 版本 | 类型 | 原图 | 后处理 |
| --- | --- | --- | --- | --- |
| `assets/backgrounds/bg-river-mist-light.webp` | v1 | 背景 | `ig_097ab1b4c402efa7016a11b1f2602881989b472e450fbe8e6c.png` | 1920x1080，WebP q80 |
| 已删除的暗色江面备用图 | v1 | 背景 | `ig_097ab1b4c402efa7016a11b1f2602881989b472e450fbe8e6c.png` | 1920x1080，压暗校色，WebP q80 |
| `assets/backgrounds/bg-fog-layer.webp` | v1 | 背景/遮罩 | `ig_097ab1b4c402efa7016a11b22276948198a98a6c0bed61a65b.png` | 1920x1080，WebP q80，保留黑底用于 screen/alpha |
| 已清理的江岸备用图 | v1 | 背景 | `ig_097ab1b4c402efa7016a11b2ab4d1481988c74f5b46c137df3.png` | 未被运行时加载，已从项目移除 |
| `assets/backgrounds/bg-poem-water.webp` | v1 | 背景 | `ig_097ab1b4c402efa7016a11b3d200888198a5b8ac406543cee0.png` | 1920x1080，WebP q80 |
| `assets/backgrounds/bg-bamboo.webp` | v1 | 背景 | `ig_097ab1b4c402efa7016a11b6d1227481989360420f97280db5.png` | 512x1024，WebP q75 |
| `assets/textures/tex-water-ripple.webp` | v1 | 纹理 | `ig_097ab1b4c402efa7016a11b245ec188198bf94959d866ffd97.png` | 512x512，WebP q80 |
| `assets/textures/tex-pattern-duanwu.webp` | v1 | 纹理 | `ig_097ab1b4c402efa7016a11b3f150f08198a109f42d2e5dd691.png` | 512x512，WebP q80 |
| 运行时已移除的噪声纹理 | v1 | 纹理 | 本地生成 | 256x256，8bit 灰度 PNG |
| 运行时已移除的置换纹理 | v1 | 纹理 | 本地生成 | 256x256，8bit 灰度 PNG |
| `assets/sprites/sprite-mugwort.webp` | v1 | 精灵 | `ig_097ab1b4c402efa7016a11b282fc10819891806c75426e6634.png` | 白底抠除，512x512，透明 WebP q85 |
| 已删除的听鼓旧方案备用素材 | v1 | 精灵 | `ig_097ab1b4c402efa7016a11b2cc1cb48198a3f961ae34858716.png` | 白底抠除，512x512，透明 WebP q85 |
| `assets/sprites/sprite-boat.webp` | v1 | 精灵 | `ig_097ab1b4c402efa7016a11b2e80df08198a5576d898c087c6e.png` | 白底抠除，1024x384，透明 WebP q85 |
| 已删除的旧版编钟 WebP | v1 | 精灵 | `ig_097ab1b4c402efa7016a11b30c16408198a8289c17b8433209.png` | 白底抠除，384x768，透明 WebP q85 |
| `assets/backgrounds/bg-bell-water.png` | v2 | 背景 | 源稿已清理，不随项目保留 | 用户生成图入库，楚乐台 / 礼乐厅空间 |
| `assets/sprites/sprite-bell.png` | v2 | 精灵 | 源稿已清理，不随项目保留 | 棋盘格背景去底，713x840，透明 PNG |
| `assets/sprites/sprite-leaf-left.webp` | v1 | 精灵 | `ig_097ab1b4c402efa7016a11b343c208819896e3c45c16fce033.png` | 白底抠除，512x512，透明 WebP q85 |
| `assets/sprites/sprite-leaf-right.webp` | v1 | 精灵 | `ig_097ab1b4c402efa7016a11b3608358819890baf14b7eba36ff.png` | 白底抠除，512x512，透明 WebP q85 |
| `assets/sprites/sprite-seal.webp` | v1 | 精灵 | `ig_097ab1b4c402efa7016a11b38d140481988d7e4965e65a4c09.png` | 白底抠除，512x512，透明 WebP q90 |
| Pixi Graphics 叶形线 | v1 | 矢量 | 手工绘制 | 控制点简化，用于过渡 morph |
| Pixi Graphics 船形线 | v1 | 矢量 | 手工绘制 | 控制点简化，用于过渡 morph |
| Pixi Graphics 圆环 | v1 | 矢量 | 手工绘制 | 控制点简化，用于过渡 morph |
| Pixi Graphics 印记框 | v1 | 矢量 | 手工绘制 | 控制点简化，用于过渡 morph |

## 使用 Prompt

本次使用历史核心素材 Prompt 母版，并按下列差异执行：

- `bg-river-mist-light`：使用“雾青江面” prompt。
- `bg-river-dark`：由 `bg-river-mist-light` 同源图压暗校色生成，避免回到全黑夜景。
- `bg-fog-layer`：使用“雾气 / 遮罩类” prompt，保留纯黑背景。
- `bg-poem-water`：使用“问诗深青水面” prompt，作为 `bg-bamboo` 之外的问诗整屏背景备用。
- `bg-bamboo`：从“问诗深青水面”延展为 1:2 竖向竹简暗影 prompt。
- 精灵类：使用对应中文 prompt，生成白底主体，再本地抠除白底为透明 WebP。

## 当前状态

状态：`final-v1`

已知限制：

- 字体子集已生成并入库：运行时使用 `assets/fonts/*-subset.woff2`，完整 TTF/OTF 不随项目保留。Aa 字体来源标注“非商业使用”，如后续商用需替换授权明确的书法字体。
- 精灵类为白底抠图后透明 WebP，后续进入 PixiJS 后建议在深浅两种背景上再做一次边缘检查。

## 第七幕尾声补充分镜素材 / v1 / 2026-06-08

规范来源：

- `doc/03-逐幕剧本/07-尾声.md`
- 用户反馈：最后一幕过乱，优先复用四张 `finale-panel-*`，再补齐两张同风格素材。

生成方式：Codex built-in image_gen。

源图目录：`/Users/eleme/.codex/generated_images/019ea02d-dc89-7bc2-a5ae-0b42ae8adc14`

入库文件：

| 输出文件 | 版本 | 类型 | 源图归档 | 后处理 |
| --- | --- | --- | --- | --- |
| `assets/backgrounds/finale-panel-0-mugwort.png` | v1 | 尾声开场分镜 | `ig_0c2672f2ec325152016a2554814b0c8190aaf765394358f3c4.png` | 未处理，保留 PNG 原图 |
| `assets/backgrounds/finale-panel-5-summary.png` | v1 | 尾声汇总分镜 | `ig_0b022805a2273ab7016a26236cf7848198b2e02eb166563143.png` | 未处理，保留 PNG 原图 |

### Prompt

`finale-panel-0-mugwort`：生成 16:9 沉浸式网页背景，表现晨雾楚江、远舟、岸边门廊和悬挂清艾，使用雾青、浅水青、米白、深墨绿和少量青铜金，保留下方 / 中央留白，禁止文字、水印、现代建筑和密集粒子。

`finale-panel-5-summary`：生成 16:9 最终汇总长卷，表现安静楚江、人物背影、由艾叶、粽叶、舟痕和钟波组成的圆形端午印记；中心和下方留给运行时印章、短文案和按钮，禁止伪中文、UI、密集符号、商业海报感和高频发光粒子。

### 生成结果

- `finale-panel-0-mugwort`：艾草和晨雾关系清楚，适合作为第七幕回望的第一张，承接“入江 / 寻艾”。
- `finale-panel-5-summary`：人物、江面和端午印记同屏成立，但符号比原 ending 背景更克制，适合作为最终收束背景。
- 状态：`finale-v1`

## bg-mugwort-village / v2 / 第二幕寻艾背景 / 2026-05-25

来源：用户生成图 `/Users/eleme/Downloads/ChatGPT Image 2026年5月25日 11_31_05.png`。

入库文件：

- 原始源图：源稿已清理，不随项目保留
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

- 背景源图：源稿已清理，不随项目保留
- 人物源图：源稿已清理，不随项目保留
- 艾草束源图：源稿已清理，不随项目保留
- 背景成品：`assets/backgrounds/bg-mugwort-village.webp`
- 人物精灵：`assets/sprites/sprite-mugwort-hanger.webp`
- 悬挂艾草束精灵：`assets/sprites/sprite-mugwort-hanging-bundle.webp`

后处理：

- 背景缩放为 `1600x900`，WebP `quality=88`。
- 透明精灵按 alpha 边界裁切，清理极弱半透明灰底后转 WebP `quality=88`。

## 第三至第七幕优化素材 / v2 / 2026-05-25

规范来源：历史素材规范文档（现已清理）。

生成方式：GPT 图像生成 + 本地 chroma key 去底 + sharp 后处理。

源图目录：`/Users/eleme/.codex/generated_images/019e5dee-6eee-70d1-b4a5-ab7c20e5f0fc`

入库文件：

| 输出文件 | 版本 | 类型 | 源图归档 | 后处理 |
| --- | --- | --- | --- | --- |
| `assets/sprites/sprite-zongzi.webp` | v1 | 精灵 | 源稿已清理，不随项目保留 | #ff00ff 背景抠除，512x512，透明 WebP q85 |
| `assets/textures/tex-pattern-duanwu.webp` | v2 | 纹理 | 源稿已清理，不随项目保留 | 512x512，WebP q80，替换 v1 暗纹 |

### Prompt

`sprite-zongzi` 使用历史提示词文档第十二节“sprite-zongzi 粽形完成态”prompt，并增加纯 `#ff00ff` 背景要求用于本地去底。

`tex-pattern-duanwu` 使用历史提示词文档第十二节“tex-pattern-duanwu / v2 端午暗纹优化”prompt。

### 生成结果

- 变体数量：每个目标素材生成 1 张候选。
- 入选：
  - `sprite-zongzi`：三角粽形轮廓清楚，叶面水墨肌理和金色缠线可识别。
  - `tex-pattern-duanwu`：低对比水波、艾叶和舟线纹样，无文字和明显中心主体。
- 淘汰原因：本次无额外候选淘汰。

### 后处理

- 去背景：使用 `remove_chroma_key.py` 抠除纯洋红背景，输出透明 PNG 中间件。
- 色彩校正：保留生成结果主色，未额外提高饱和度，避免偏商业国潮。
- 尺寸与压缩：
  - `sprite-zongzi.webp`：512x512，alpha 通道有效。
  - `tex-pattern-duanwu.webp`：512x512，低对比叠层纹理。
- 状态：`final-v2`

### 验证

- `sharp.metadata()` 验证输出尺寸符合素材规格。
- 精灵成品验证为 alpha WebP，边角透明。
- 暗纹成品验证无文字、水印、边框，体积约 27KB。

## 第三幕裹青重制素材 / v3 / 2026-05-26

规范来源：

- `doc/03-逐幕剧本/03-裹青.md`
- 历史素材提示词文档（现已清理）

来源：

- 临水包粽桌背景：`/Users/eleme/Downloads/ChatGPT Image 2026年5月26日 11_52_49.png`
- 缠线精灵：`/Users/eleme/Downloads/ChatGPT Image 2026年5月26日 11_53_46.png`
- 粽形完成态：`/Users/eleme/Downloads/ChatGPT Image 2026年5月26日 11_52_52.png`

入库文件：

| 输出文件 | 版本 | 类型 | 源图归档 | 后处理 |
| --- | --- | --- | --- | --- |
| `assets/backgrounds/bg-wrap-table.png` | v3 | 背景 | 源稿已清理，不随项目保留 | 1920x1080，WebP q80 |
| `assets/sprites/sprite-zongzi.webp` | v2 | 精灵 | 源稿已清理，不随项目保留 | 白底边缘抠除，512x512，透明 lossless WebP |
| 已清理的缠线精灵 | v2 | 精灵 | 源稿已清理，不随项目保留 | 未被运行时加载，已从项目移除 |

### 生成结果

- `bg-wrap-table`：临水屋舍、旧木桌、窗外江光和包粽材料清晰，适合作为第三幕主背景。
- `sprite-zongzi`：三角粽形识别度高，缠线与叶面水墨质感清楚。
- 缠线精灵：后续未被运行时采用，已用代码线条替代并移出项目。

### 验证

- `bg-wrap-table.png`：1920x1080，无 alpha。
- `sprite-zongzi.webp`：512x512，alpha 通道有效。
- 缠线精灵：已移除，运行时不加载。
- 三张原始 PNG 已归档到 `已清理源稿目录/`。

## 第五幕问诗人物背景 / v2 / 2026-05-27

来源：

- 用户生成图：`/Users/eleme/Downloads/ChatGPT Image 2026年5月27日 11_37_00.png`

入库文件：

| 输出文件 | 版本 | 类型 | 源图归档 | 后处理 |
| --- | --- | --- | --- | --- |
| `assets/backgrounds/bg-poem-question-figure.png` | v2 | 背景 | 源稿已清理，不随项目保留 | 未处理，保留 PNG 原图 |

### 备注

- 已接入第五幕「问诗」主背景。
- v2 为无字人物背景，解决 v1 背景自带中文大字与前景交互字粒重叠的问题。
- `bg-poem-water.webp` 保留为备用背景。

### 验证

- `bg-poem-question-figure.png`：1672x941，RGB PNG。

## 第五幕远景诗人题诗背景 / v1 / 2026-05-27

规范来源：

- `doc/03-逐幕剧本/05-问诗.md`

状态：

- 已生成并入库。
- 透明交互素材仍保持纯素材方向，不加入人物；人物只出现在新版背景中。

来源：

- 用户生成图：`/Users/eleme/Downloads/ChatGPT Image 2026年5月27日 15_41_50.png`

入库文件：

| 输出文件 | 版本 | 类型 | 源图归档 | 后处理 |
| --- | --- | --- | --- | --- |
| `assets/backgrounds/bg-poem-water-poet.png` | v1 | 背景 | 源稿已清理，不随项目保留 | WebP q82 |

### 中文 Prompt

```text
生成一张 16:9 中国水墨风数字绘画背景。画面是傍晚的深青色楚江静水，远处有低对比的楚地山影和薄雾，水面保留柔和月影、极淡舟痕和竞渡之后留下的长水纹。

画面左侧远岸安排一位古代诗人，身着素色长袍，临水坐于低矮石案旁，手持毛笔正在题诗。石案上有展开的空白竹简或素笺，只能有淡淡墨痕，不要出现可读文字。笔尖下方有一滴墨意落向江面，水面因此扩散出极淡涟漪和几粒未成形的发光字点，暗示“题诗入水、字从痕起”。

人物为中远景，不要过大，不要站在画面中央，不要遮挡主要水面留白。中央和偏右区域需要留出干净深青水面，用来承载前景漂浮汉字、诗轴和交互素材。整体色彩以深青、雾白、少量克制青铜金为主，气质安静、诗意、端午文化感强。

不要出现任何可读文字，不要现代物件，不要 UI，不要边框，不要水印，不要强烈戏剧光，不要高饱和色彩，不要让人物成为画面最大主体。
```

### 生成结果

- 远岸诗人位于左侧中远景，临水题诗动作清楚，未占据中央水面主交互区。
- 中央和偏右保留深青静水、月影和长水痕，适合作为字粒、诗轴和交互素材承载区域。
- 画面未见明显可读文字、现代物件、UI、边框或水印。

### 验证

- 源稿已清理，不随项目保留：1672x941，RGB PNG。
- `assets/backgrounds/bg-poem-water-poet.png`：1672x941，RGB WebP，约 130KB。

## 第五幕墨滴涟漪交互素材 / v1 / 2026-05-27

来源：

- 用户生成图：`/Users/eleme/Downloads/ChatGPT Image 2026年5月27日 17_11_01.png`

入库文件：

| 输出文件 | 版本 | 类型 | 源图归档 | 后处理 |
| --- | --- | --- | --- | --- |
| `assets/sprites/sprite-poem-ink-ripple.png` | v1 | 透明交互精灵 | 源稿已清理，不随项目保留 | 裁切主体，清理低 alpha 边缘，整体 alpha 降至 72% |

### 用途

- 第五幕触字时作为“墨意入水”反馈。
- 三字成诗时在诗轴中心轻扩一次，连接“题诗入水、触字成诗”的叙事。

### 验证

- 源稿已清理，不随项目保留：1536x1024，RGBA PNG。
- `assets/sprites/sprite-poem-ink-ripple.png`：712x363，RGBA PNG，alpha 通道有效。

## 全局标题艺术字 / v1 / 2026-05-27

规范来源：历史素材规范文档（现已清理）。

状态：

- 已生成并入库。
- 标题图只作为视觉层，DOM 文本仍保留。
- 第一次生成的 `和鳴` 因繁简误用未入库，已重生成简体 `和鸣`。

统一 Prompt：

```text
请生成一张用于沉浸式交互网页《楚江寻艾》的透明背景中文标题艺术字。

文字内容：[替换为指定文案]。

视觉风格：诗意东方，水墨书写感，宋楷之间的笔意，雾青江光气质，克制、清润、安静，不要商业国潮海报感。笔触应自然、有手写温度，但字形必须清晰可读。

色彩：主笔触使用深墨绿 #16343A，可有少量雾白 #E8E1D2 或暖金 #C8A45D 的柔光边缘，但不要大面积金色、红色或高饱和绿色。

构图：只生成文字本身，纯色绿底用于后处理抠图，文字居中，四周留出 12% 安全边距，不能有边框、印章、图案、水纹、山水背景、英文、logo、水印或签名。

输出要求：横向构图，适合叠加在雾青江面背景上。中文必须完全正确，不能多字、少字、错字、异体错用。
```

入库文件：

| 输出文件 | 文案 | 源图归档 | 后处理 |
| --- | --- | --- | --- |
| `assets/titles/title-main-chujiang-xunai.webp` | 楚江寻艾 | 源稿已清理，不随项目保留 | 绿底抠图为透明 WebP |
| `assets/titles/title-scene-01-rujiang.webp` | 入江 | 源稿已清理，不随项目保留 | 绿底抠图为透明 WebP |
| `assets/titles/title-scene-02-xunai.webp` | 寻艾 | 源稿已清理，不随项目保留 | 绿底抠图为透明 WebP |
| `assets/titles/title-scene-03-guoqing.webp` | 裹青 | 源稿已清理，不随项目保留 | 绿底抠图为透明 WebP |
| `assets/titles/title-scene-04-tinggu.webp` | 听鼓 | 源稿已清理，不随项目保留 | 绿底抠图为透明 WebP |
| `assets/titles/title-scene-05-wenshi.webp` | 问诗 | 源稿已清理，不随项目保留 | 绿底抠图为透明 WebP |
| `assets/titles/title-scene-06-heming.webp` | 和鸣 | 源稿已清理，不随项目保留 | 绿底抠图为透明 WebP |
| `assets/titles/title-scene-07-duanwu-yinji.webp` | 端午印记 | 源稿已清理，不随项目保留 | 绿底抠图为透明 WebP |
| `assets/titles/title-action-rujiang-xunai.webp` | 入江寻艾 | 源稿已清理，不随项目保留 | 绿底抠图为透明 WebP |
| `assets/titles/title-action-bokai-jiangwu.webp` | 拨开江雾 | 源稿已清理，不随项目保留 | 绿底抠图为透明 WebP |
| `assets/titles/title-action-sui-zhou-xunai.webp` | 随舟寻艾 | 源稿已清理，不随项目保留 | 绿底抠图为透明 WebP |

### 验证

- 临时联系表已随 `tmp/` 过程文件清理。
- WebP 输出均带 alpha 通道。

### 补充：入江交互中水雾浮字

```text
文字内容：入江寻艾。

用途：第一幕点击江面后，在雾中浮现再淡出的画面内标题。参考 历史设计稿（已清理，不随项目保留） 与 `03-完成态.png` 的中央大字气质；比首屏主标题更轻、更像水雾中浮出的仪式短句。

约束：只生成四个中文字符，不带背景、边框、印章、图案、水纹、英文、logo、水印或签名；中文必须为简体“入江寻艾”。
```

## 书法字体子集 / v1 / 2026-05-27

来源：

- 用户字体包：`/Users/eleme/Downloads/AaDongQiChangYueYangLouJi.zip`

入库文件：

| 输出文件 | 用途 | 备注 |
| --- | --- | --- |
| 源稿已清理，不随项目保留 | 来源字体归档 | 字体内部标注非商业使用 |
| `assets/fonts/LXGWNeoZhiSong-subset.woff2` | 运行时小范围书法字体 | 章节标识、问诗诗轴 |

### 验证

- 字体覆盖章节名、问诗诗句与入江动作短句。
- 子集大小约 20KB。

## finale-ending-person / v1 / 第七幕人物收束背景 / 2026-05-29

规范来源：

- `doc/03-逐幕剧本/07-尾声.md`
- 历史素材规范文档（现已清理）

状态：

- 已生成并入库为背景草稿。
- 背景用于第七幕 ending：左下人物作为旅程见证者，中央端午印记融合艾、粽、舟、钟。
- 当前保留 PNG 原图；如进入最终运行包，建议再压缩为 WebP。

Prompt：

```text
请生成一张 16:9 横屏背景概念图，用于沉浸式交互网页《楚江寻艾》的第七幕 ending / 端午印记。

画面定位：这是全篇结尾，不是普通背景，也不是分享页。它要像一幅收束长卷：前六幕的江雾、悬艾、裹粽、击鼓行舟、问诗、编钟和鸣都被安静地融合到最后一幕。

场景：承接上一幕明亮楚乐台 / 礼乐厅空间，帷幔、竹帘、石台青铜纹样在背景中低透明退入雾里；下方有极淡楚江水纹反光。中央是一枚正在形成或已经安静完成的圆形端午印记，由艾叶弧线、粽叶折线、舟身水痕、钟波圆环组成，青铜金和雾白微微发光，少量艾草青藏在叶脉和节点里。

人物：画面中需要出现一个低对比人物，作为旅程结束的见证者。人物可以是楚地乐人、行吟诗人或归舟旅人，站在画面左侧或中远景，背影或侧身，衣袂被微风带起，面部不必清晰，不要现代服饰。人物手边或身旁可以有一束艾草、竹简或小舟影，气质安静、庄重、有人情味。人物不要成为海报主角，要融入环境，不能压过中央端午印记。

融合前几幕：远处薄雾中有极淡小舟 / 龙舟水痕；近处有一束清艾的淡绿色香气线；印记附近有少量米粒光点、粽叶折线、朱砂鼓波、诗字碎片和青铜钟波，全部低透明、克制，只作为记忆回声，不要堆满画面。

构图：PC 端 16:9 网页背景，中央端午印记清楚，人物偏左或偏中远景，右侧和下方保留足够留白用于网页文字、节点和“重游此程”题签叠加。整体有 ending 的完成感和作品落款感。

中文文字：尽量不要生成任何文字。如果必须出现，只允许极少量清晰中文：“端午印记”“沿楚江，寻一缕端午清艾”。不要生成伪中文、英文或多余题字。

视觉风格：诗意东方，水墨长卷质感，雾青江光，明亮但克制，安静沉浸，有一点实验交互感；不要商业国潮海报，不要旅游宣传图，不要博物馆照片感。

色彩：晨雾青 #D8DED1、浅水青 #9EAEA3、云水米白 #F1E8D2、雾白 #E8E1D2 为明亮基底；楚江青黑 #101C1B 和深墨绿 #1D332C 用于水面深处和纹样阴影；青铜金 #C8A45D 用于印记和钟波；少量艾草青 #8EA86A、粽叶青 #5F7448、朱砂红 #A43D32、夕照暖金 #D9A65A 作为低饱和点缀。

不要生成多余文字、英文、水印、签名、logo、二维码、现代 UI、按钮、卡片、边框、亮红印章、巨大编钟、舞台灯光、全黑夜景、恐怖或鬼怪元素、卡通可爱风、现代人物、现代建筑。
```

入库文件：

| 输出文件 | 用途 | 源图归档 | 备注 |
| --- | --- | --- | --- |
| `assets/backgrounds/bg-finale-ending-person.png` | 第七幕 ending 背景草稿 | 源稿已清理，不随项目保留 | 1672x941，PNG |

### 验证

- 人物位于左下偏前景，不遮挡中央端午印记。
- 中央印记融合艾叶、粽形、舟线、水纹和钟波，适合作为第七幕交互锚点。
- 背景有楚乐台帷幔和水面反光，可承接第六幕。

## 寻艾子幕前景动效素材 / v1 / 2026-06-05

用途：

- 第二幕寻艾 4 个子幕中的第 2、3、4 子幕前景动效。
- 使用纯 #ff00ff 背景生成，再通过 chroma-key 抠成透明 PNG。

入库文件：

| 输出文件 | 用途 | 源图归档 |
| --- | --- | --- |
| `assets/sprites/sprite-mugwort-steam-wisp.png` | 煮汤子幕锅口艾香蒸汽 | 源稿已清理，不随项目保留 |
| `assets/sprites/sprite-qingtuan-flour-mist.png` | 制糕子幕艾汁米粉微尘 | 源稿已清理，不随项目保留 |
| `assets/sprites/sprite-sachet-scent-wisp.png` | 佩香子幕香囊清气与五色丝残影 | 源稿已清理，不随项目保留 |

Prompt 摘要：

- `sprite-mugwort-steam-wisp.png`：3 到 5 缕半透明白色蒸汽，夹杂极淡艾叶碎影和浅艾绿色气息；不要锅、人物和背景。
- `sprite-qingtuan-flour-mist.png`：浅绿色艾汁痕、米粉细尘和少量柔和亮点；横向偏扁，适合叠在青团和木桌附近。
- `sprite-sachet-scent-wisp.png`：香囊附近的清香气息、暖金光点和极短五色丝残影；不要长彩带和彩虹条。

### 验证

- 三张运行时 PNG 均为 RGBA，并已接入 `mugwort-scene.js` 对应子幕。
- 第二子幕蒸汽起点对齐锅口上方，第三/第四子幕前景素材采用低透明呼吸与轻漂移动画。

## 问诗悬挂吊饰 / v1 / 2026-06-05

用途：

- 替换第五幕问诗运行时代码绘制的高饱和红灯笼。
- 作为随宽幅背景平移的上方悬挂氛围素材，保持轻摆动画。

入库文件：

| 输出文件 | 用途 | 源图归档 |
| --- | --- | --- |
| `assets/sprites/sprite-poem-hanging-charm.png` | 问诗上方水墨艾叶诗签吊饰 | 源稿已清理，不随项目保留 |

Prompt 摘要：

- 生成单个楚风诗签 / 艾叶香囊式悬挂吊饰，浅手工纸、艾叶、细绳、短穗和淡青铜金边。
- 使用纯 `#ff00ff` 背景生成，再通过 chroma-key 抠成透明 PNG。
- 明确排除亮红灯笼、高饱和节庆红金、卡通、文字、水印和背景场景。

### 验证

- 运行时已由 `createPoemHangingCharms` 接入，保留随背景平移和微摆。
- 宽屏截图检查中，原红灯笼已替换为低饱和纸色吊饰，和雾青水墨背景更协调。

## 问诗宣纸诗笺 / v1 / 2026-06-05

用途：

- 第五幕问诗中承载 8 个可点击诗字。
- 点击字后由代码绘制毛笔圈痕，选满三字后生成诗歌。

入库文件：

| 输出文件 | 用途 | 源图归档 |
| --- | --- | --- |
| `assets/sprites/sprite-poem-paper.png` | 问诗纸上点字交互底图 | 源稿已清理，不随项目保留 |

Prompt 摘要：

- 生成横向展开的浅色宣纸 / 楚风诗笺，低饱和雾青、米白、浅水青和淡青铜金。
- 中央保留干净区域，供代码叠加 8 个中文字。
- 使用纯 `#ff00ff` 背景生成，再通过 chroma-key 抠成透明 PNG。
- 明确排除任何文字、印章、现代 UI、红灯笼、人物、建筑和完整背景。

### 验证

- 运行时已接入 `poemPaper` 资源，纸笺位于问诗画面中部水面区域。
- 8 个字由代码排布在纸面上，点击后显示毛笔圈痕。
