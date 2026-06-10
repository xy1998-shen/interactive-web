# 《楚江寻艾》

《楚江寻艾》是一件以湖北屈原故里端午习俗为文化底色的沉浸式交互网页作品。作品以“顺江寻物”为主线，串联入江、寻艾、裹青、听鼓、问诗、和鸣和端午印记七幕，让用户在克制的互动中依次感知艾、粽、舟、诗、钟等端午意象。

项目是纯静态前端，不依赖接口、外链素材或构建产物。入口文件通过普通 `<script>` 顺序加载 PixiJS、GSAP 和业务脚本；由于 PixiJS/WebGL 在 Chrome 的 `file://` 环境下会触发本地图片跨源纹理限制，推荐通过根目录启动脚本或任意静态服务预览。

## 体验方式

推荐使用桌面端 Chrome 或 Edge 打开，按 PC 横屏体验设计，建议视口不低于 `960 x 540`。

macOS 双击启动：

```bash
./启动预览.command
```

也可以在 Finder 中直接双击 `启动预览.command`。脚本会自动选择可用端口，启动本地静态服务，并打开浏览器访问作品页面；关闭脚本打开的 Terminal 窗口即可停止服务。

Windows 双击启动：

```bat
启动预览.bat
```

在资源管理器中双击 `启动预览.bat` 即可。脚本会自动选择可用端口，启动本地静态服务，并打开浏览器访问作品页面；关闭脚本打开的命令行窗口即可停止服务。

没有 Python 环境时：

- macOS：`启动预览.command` 会按 Python 3、Python、Ruby、PHP 的顺序寻找可用运行环境；通常系统自带 Ruby 或 PHP 时也能直接启动。
- Windows：`启动预览.bat` 会优先使用 Python 3；如果没有 Python，会自动调用 Windows PowerShell 内置静态服务。若公司策略禁用了 PowerShell 脚本，再安装 Python 3 后重试。

手动本地服务预览：

```bash
python3 -m http.server 39217
```

然后访问 `http://127.0.0.1:39217/`。

## 作品流程

1. 入江：轻触江面，拨开江雾，进入楚江端午叙事。
2. 寻艾：浏览悬门、煮汤、入食、佩香，理解艾草如何进入端午日常。
3. 裹青：浏览备料、裹粽、蒸煮、分食，完成粽俗记忆。
4. 听鼓：随鼓序列前行，轻点画面加入水面回声与船身惯性。
5. 问诗：轻触三枚字粒，生成一行楚江短诗。
6. 和鸣：三处回声沿声路自动次第和鸣。
7. 端午印记：掠过江面，让艾、粽、舟、钟依次归印，完成旅程收束。

## 技术概览

- 渲染：PixiJS 负责全屏 Canvas、背景层、精灵、粒子、波纹和交互反馈。
- 动效：GSAP 负责场景内时间轴、淡入淡出、缩放、位移和节奏动画。
- 文本层：DOM 浮层负责标题、提示、章节进度、故事卷轴和按钮。
- 音频：`js/audio-manager.js` 管理背景音乐解锁、场景音量和 ducking。
- 资源：`js/constants.js` 统一维护场景顺序、字体栈、运行资源清单和标题图路径。

## 项目结构

```text
.
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── constants.js
│   ├── config.js
│   ├── scene-manager.js
│   ├── asset-loader.js
│   ├── audio-manager.js
│   ├── dom-layer.js
│   ├── utils.js
│   └── scenes/
├── assets/
│   ├── backgrounds/
│   ├── sprites/
│   ├── textures/
│   ├── titles/
│   ├── fonts/
│   ├── audio/
│   ├── favicon.png
│   └── prompt-log.md
├── libs/
│   ├── pixi.min.js
│   └── gsap.min.js
└── doc/
```

## 关键文档

- [开发交接文档](doc/02-开发规范/开发交接文档.md)：目录结构、模块职责、运行链路和维护建议。
- [技术方案](doc/02-开发规范/技术方案.md)：渲染架构、本地服务验收、性能目标和提交检查。
- [逐幕剧本](doc/03-逐幕剧本/01-入江.md)：各场景的叙事、交互和验收说明。

## 维护原则

- 新增运行素材先登记到 `js/constants.js` 的 `NS.ASSET_MANIFEST` 或 `NS.TITLE_ASSETS`，再在场景里按 key 使用。
- 新增场景配置优先放到 `js/config.js`，避免数值散落在场景代码中。
- 不重新引入 `assets/source/`、`tmp/`、`.omc/`、编辑器状态、生成联系表等过程文件。
- 修改场景后至少验证入口资源存在、页面能打开、控制台没有 error。
