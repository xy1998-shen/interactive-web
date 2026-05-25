# PixiJS / GSAP 接入与入江风吹雾散计划

## Summary

先把当前 MVP 骨架收敛到 PixiJS / GSAP 本地 UMD 架构，再迁移入江场景，并新增"鼠标划过有风吹雾散"的氛围交互。风吹雾散只做视觉反馈，不计入完成进度；入江完成仍由"按住拖动拨雾"触发，避免用户无意间通关。

## Key Changes

### 1. 新增本地库目录 `libs/`

| 文件 | 版本 | 体积 | 下载源 |
| --- | --- | --- | --- |
| `pixi.min.js` | PixiJS 7.3.3 | ~500 KB | `https://pixijs.download/v7.3.3/pixi.min.js` |
| `gsap.min.js` | GSAP 3.12.5 | ~60 KB | `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js` |

`index.html` 使用普通 `<script>` 顺序加载，保持 `file://` 可运行：

```html
<script src="libs/pixi.min.js"></script>
<script src="libs/gsap.min.js"></script>
<script src="js/app.js"></script>
```

### 2. 改造渲染底座

#### PIXI.Application 初始化

复用现有 `<canvas id="stage">`，不新建 canvas：

```js
this.pixiApp = new PIXI.Application({
  view: document.getElementById('stage'),
  resolution: Math.min(window.devicePixelRatio || 1, 2),
  autoDensity: true,
  resizeTo: window,
  backgroundAlpha: 0,
  antialias: true
});
```

- `view`：复用现有 canvas 元素，避免 DOM 中出现两个 canvas。
- `resolution` + `autoDensity`：替代当前手动 dpr 计算和 canvas 尺寸设置。
- `resizeTo: window`：替代当前手动 resize 监听。
- `backgroundAlpha: 0`：背景交由 Pixi 精灵绘制，不用默认黑底。

#### 渲染循环统一

删除自有 `requestAnimationFrame` 循环，统一使用 Pixi ticker：

```js
this.pixiApp.ticker.add(function (ticker) {
  var dt = ticker.deltaMS;
  if (dt > 100) dt = 16;
  try {
    manager.update(dt);
  } catch (e) {
    console.error("渲染异常:", e);
  }
});
```

保留已有优化：dt clamp、渲染 try-catch。

#### DOM 层保持独立

DOM 层继续负责标题、题签、提示、进度线。`DOMLayer` 类和 CSS 不变。

#### SceneManager 生命周期

保留 `onEnter / onUpdate / onExit / completeCurrent`。接口微调：

```js
onEnter()    // 无参数，场景内部自行初始化
onUpdate(dt) // dt 来自 Pixi ticker.deltaMS
onExit()     // 清理 Pixi 显示对象和事件
```

每个 Scene 持有自己的 `PIXI.Container`，onEnter 时 addChild 到 stage，onExit 时 removeChild 并销毁。

### 3. AssetLoader

集中加载 `doc/10` 映射资产，支持初始加载和 N+1 预加载。

```js
AssetLoader.loadManifest(manifest)  // 加载一组资产，返回 Promise
AssetLoader.preload(keys)           // 预加载下一场景资产，不阻塞当前场景
AssetLoader.get(key)                // 获取已加载的 PIXI.Texture
```

初始加载清单（入江必须）：

- `bg-river-mist-light.webp`
- `bg-fog-layer.webp`
- `tex-water-ripple.webp`

预加载时机：进入当前场景时，静默预加载下一场景资产（参照 `doc/10` 第六节分组）。预加载失败不阻塞场景切换，仅 console.warn。

### 4. 入江 Pixi 迁移

资产层级（从下到上）：

| 层级 | Pixi 对象 | 资产 |
| --- | --- | --- |
| 主背景 | `PIXI.Sprite` | `bg-river-mist-light.webp` |
| 水纹 | `PIXI.TilingSprite` | `tex-water-ripple.webp`，alpha=0.11，x/y 随时间偏移 |
| 雾层 | `PIXI.Sprite`（texture 来自离屏 canvas） | `bg-fog-layer.webp` |
| 薄雾面纱 | `PIXI.Graphics` | 渐变半透明矩形，随 progress 变化 |

#### 雾层合成方案：离屏 Canvas → Pixi Texture

保留当前离屏 Canvas 2D + `destination-out` 合成的雾层逻辑，渲染完成后将离屏 canvas 作为 Pixi 纹理贴到精灵上：

```js
// 离屏 canvas 绘制雾层（复用当前 drawFogLayer 逻辑）
this.fogCtx.clearRect(0, 0, w, h);
drawImageCover(this.fogCtx, fogImage, w, h, 0.84);
this.fogCtx.globalCompositeOperation = "destination-out";
// ... 绘制 fogCuts 和 windPoints 的扣除圆 ...

// 更新 Pixi 纹理
this.fogTexture.update();
```

选择此方案的理由：

- 当前 `destination-out` 扣洞逻辑已验证可用，迁移改动最小。
- Pixi 的 blendMode ERASE 需要 v7.2+ 且行为与 Canvas 2D 有差异，风险高。
- RenderTexture + Mask 方案对 90 个渐变圆的性能不如离屏 canvas 直接。
- 离屏 canvas 通过 `PIXI.Texture.from(canvas)` 接入 Pixi 渲染管线，无缝衔接。

保留已有优化：拖动插值、dead 点跳过（`life < 0.001` 时 continue）。

#### 事件坐标

雾层交互继续使用 window 级 pointer 事件（pointerdown / pointermove / pointerup），因为交互区域是整个画布而非某个精灵。坐标转换改用 Pixi 提供的方法：

```js
var globalPos = new PIXI.Point(event.clientX, event.clientY);
var localPos = this.container.toLocal(globalPos);
```

不再手动维护 `canvasRect` 缓存（Pixi 内部处理 resolution 和 density 转换）。

### 5. 新增"风吹雾散"氛围交互

鼠标未按下移动时，在指针路径生成低强度风痕。风痕和拨雾共享同一个离屏 canvas，但参数不同：

| 参数 | fogCuts（按住拖动） | windPoints（鼠标划过） |
| --- | --- | --- |
| 触发条件 | pointerdown + pointermove | pointermove 且未按下 |
| radius | `44 ± 8`（CSS px） | `18 ± 4`（CSS px），约 fogCuts 的 0.4x |
| alpha 系数 | center=0.78, mid=0.46 | center=0.22, mid=0.12 |
| life 衰减 | `dt * 0.00018` | `dt * 0.0012`，约 7x 速度衰减 |
| 最大存活点数 | 90 | 40 |
| 计入完成进度 | 是 | 否 |
| 视觉效果 | 雾气永久散开 | 短暂风痕，~0.8 秒后自然淡出 |

风痕使用 GSAP 做横向拉伸效果：每个 windPoint 的 scaleX 在生命周期内从 1.0 渐变到 2.4，模拟风吹横向扩散感。

```js
// onPointerMove 中，未按下时：
if (!this.dragging) {
  var point = this.getPoint(event);
  var radius = 18 + Math.sin(Date.now() / 200) * 4;
  this.windPoints.push({
    x: point.x, y: point.y,
    radius: radius * dpr,
    life: 1,
    scaleX: 1
  });
  if (this.windPoints.length > 40) {
    this.windPoints.shift();
  }
}
```

drawFogLayer 中，在 fogCuts 之后、ctx.restore() 之前绘制 windPoints：

```js
for (var j = 0; j < this.windPoints.length; j++) {
  var wp = this.windPoints[j];
  wp.life = Math.max(0, wp.life - dt * 0.0012);
  wp.scaleX = 1 + (1 - wp.life) * 1.4;
  if (wp.life < 0.001) continue;
  ctx.save();
  ctx.translate(wp.x, wp.y);
  ctx.scale(wp.scaleX, 1);
  var g = ctx.createRadialGradient(0, 0, 0, 0, 0, wp.radius);
  g.addColorStop(0, "rgba(0,0,0," + (0.22 * wp.life) + ")");
  g.addColorStop(0.6, "rgba(0,0,0," + (0.12 * wp.life) + ")");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, wp.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
```

### 6. EmptyScene 统一 Pixi 渲染

非入江场景的骨架占位统一用 Pixi 对象渲染：

```js
EmptyScene.prototype.onEnter = function () {
  this.container = new PIXI.Container();
  // 背景精灵
  var bg = new PIXI.Sprite(AssetLoader.get('bg-river-mist-light'));
  // ... cover 适配 ...
  this.container.addChild(bg);
  // 半透明遮罩
  var overlay = new PIXI.Graphics();
  overlay.beginFill(0xecf5f0, 0.34);
  overlay.drawRect(0, 0, w, h);
  overlay.endFill();
  this.container.addChild(overlay);
  // 场景名文字
  var title = new PIXI.Text(this.meta.name, {
    fontFamily: 'Songti SC, STSong, serif',
    fontSize: Math.round(h * 0.064),
    fill: 'rgba(22,52,58,0.72)',
    align: 'center'
  });
  title.anchor.set(0.5);
  title.position.set(w / 2, h / 2);
  this.container.addChild(title);
  this.app.pixiApp.stage.addChild(this.container);
};

EmptyScene.prototype.onExit = function () {
  this.app.pixiApp.stage.removeChild(this.container);
  this.container.destroy({ children: true });
};
```

不再使用 Canvas 2D 的 `ctx.fillText()`，避免两套渲染管线并存。

## Public Interfaces

- `window.ChuJiangApp` 保留用于验证：
  - `manager.currentIndex`
  - `manager.completed`
  - `manager.goTo(index)`
  - `pixiApp`（Pixi Application 实例，调试用）
- `SceneManager` 场景接口固定：
  - `onEnter()`
  - `onUpdate(dt)`
  - `onExit()`
- `AssetLoader` 接口：
  - `loadManifest(manifest)` — 加载一组资产，返回 Promise
  - `preload(keys)` — 静默预加载，不阻塞
  - `get(key)` — 获取已加载的 PIXI.Texture
- 入江交互状态区分：
  - `windPoints`：鼠标划过风痕，只影响视觉。
  - `fogCuts`：按住拖动拨雾，影响完成进度。

## Implementation Steps

1. 下载 pixi.min.js（v7.3.3）和 gsap.min.js（v3.12.5）到 `libs/`。
2. 更新 `index.html`，按顺序引入 libs → app.js。
3. 改造 `App`：初始化 `PIXI.Application`，删除自有 rAF 循环，接入 ticker。
4. 实现 `AssetLoader`，完成初始资产加载。
5. 改造 `EmptyScene`：用 Pixi Container + Sprite + Text 替代 Canvas 2D。
6. 迁移 `IntroScene`：背景/水纹用 Pixi 精灵，雾层用离屏 canvas → Pixi Texture。
7. 新增 `windPoints` 风吹雾散逻辑。
8. 浏览器验证全部测试项。

## Test Plan

- 静态检查：`node --check js/app.js`
- 资源检查：页面无外链脚本、无 `type="module"`、核心资源无 404。
- 浏览器验证：
  - 首屏保持明亮雾青江面、DOM 标题层、江流进度线。
  - 鼠标不按下划过时，有风吹雾散视觉（短暂横向风痕），但 `completed[0]` 不变。
  - 按住拖动时，雾层连续消散，快速拖动不断裂。
  - 达到阈值后 `completed[0] === true`，标题解除雾化。
  - 7 个进度节点可切换，章节标题同步。
  - 控制台无 `PIXI` 或 `gsap` 未定义错误。
  - 窗口 resize 后画面自适应，无拉伸变形。
- 离线验证：
  - 直接打开 `file:///...index.html`
  - 页面可运行，无模块/CORS 错误，无外链依赖。
- 性能验证：
  - 开发者工具 Performance 面板录制 5 秒拨雾操作，帧率不低于 50fps。
  - 内存面板检查场景切换后无 Pixi 纹理泄漏。

## Assumptions

- 鼠标划过的风吹雾散只做氛围反馈，不计入完成。
- 优先接入 PixiJS / GSAP，再继续后续 MVP 场景。
- PixiJS / GSAP 只使用本地 UMD 文件，不引入 npm/Vite 运行依赖。
- MVP 仍以 PC 横屏和 `file://` 离线打开为首要验收标准。
- 雾层合成使用离屏 Canvas 2D → Pixi Texture 方案，不使用 Pixi 原生 blendMode ERASE。
- EmptyScene 统一 Pixi 渲染，不保留 Canvas 2D 文字绘制。
