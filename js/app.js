// 应用入口：初始化 Pixi、DOM、资源、音频与场景管理器。
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};

  // 持有全局运行对象，负责把各子模块串起来。
  function App() {
    this.canvas = document.getElementById("stage");
    this.dom = new NS.DOMLayer();
    this.assets = new NS.AssetLoader(NS.ASSET_MANIFEST);
    this.audio = NS.AudioManager ? new NS.AudioManager(NS.CONFIG.audio) : null;
    this.time = 0;
    this.pixiApp = null;
    this.manager = null;
  }

  // 启动应用；依赖库缺失或 WebGL 初始化失败时给出降级提示。
  App.prototype.start = function () {
    if (!global.PIXI || !global.gsap) {
      this.dom.showHint("本地 PixiJS / GSAP 资源未加载");
      return Promise.reject(new Error("本地 PixiJS / GSAP 资源未加载"));
    }
    // 启动顺序固定：渲染器 -> 场景管理 -> 交互绑定 -> 初始资源。
    try {
      this.createRenderer();
    } catch (error) {
      this.dom.showHint("当前浏览器无法启动 WebGL 渲染");
      console.error("Pixi 渲染器初始化失败:", error);
      return Promise.reject(error);
    }
    if (this.audio) {
      this.audio.init();
    }
    this.manager = new NS.SceneManager(this);
    this.bindProgress();
    this.bindTicker();
    return this.loadInitialScene();
  };

  // 创建全屏 Pixi 渲染器，绑定到 index.html 中的 #stage。
  App.prototype.createRenderer = function () {
    this.pixiApp = new PIXI.Application({
      view: this.canvas,
      resolution: Math.min(global.devicePixelRatio || 1, NS.CONFIG.renderer.maxResolution),
      autoDensity: true,
      resizeTo: global,
      backgroundAlpha: 0,
      antialias: true
    });
  };

  // 预加载第一幕资源，并在完成后进入初始场景。
  App.prototype.loadInitialScene = function () {
    var app = this;
    return this.assets.loadManifest(NS.SCENES[0].assets, function (loaded, total) {
      var percent = total ? Math.round((loaded / total) * 100) : 100;
      app.dom.showHint("载入江雾 " + percent + "%");
    }).then(function () {
      app.manager.goTo(0);
    }).catch(function (error) {
      app.dom.showHint(error.message);
      console.error("初始场景加载失败:", error);
      throw error;
    });
  };

  // 绑定 DOM 层的进度节点、CTA 与故事按钮。
  App.prototype.bindProgress = function () {
    var app = this;
    this.dom.nodes.forEach(function (node, index) {
      node.addEventListener("click", function () {
        app.manager.goTo(index);
      });
    });
    this.dom.introCta.addEventListener("click", function () {
      if (app.dom.actionHandler) {
        app.dom.actionHandler();
        return;
      }
      app.manager.goTo(1);
    });
    if (this.dom.storyNext) {
      this.dom.storyNext.addEventListener("click", function () {
        if (app.dom.actionHandler) {
          app.dom.actionHandler();
        }
      });
    }
  };

  // 把 Pixi ticker 接到统一帧更新入口。
  App.prototype.bindTicker = function () {
    var app = this;
    this.pixiApp.ticker.add(function () {
      app.tick();
    });
  };

  // 每帧推进当前场景；限制异常大 dt，避免切后台后动画跳变。
  App.prototype.tick = function () {
    var ticker = this.pixiApp.ticker;
    var dt = ticker.deltaMS || NS.CONFIG.renderer.fallbackDeltaMS;
    if (dt > NS.CONFIG.renderer.maxDeltaMS) {
      // 页面切后台后可能产生超大 dt，回退到稳定帧长避免动画跳变。
      dt = NS.CONFIG.renderer.fallbackDeltaMS;
    }
    this.time = ticker.lastTime;
    try {
      this.manager.update(dt);
    } catch (error) {
      console.error("渲染异常:", error);
    }
  };

  global.addEventListener("DOMContentLoaded", function () {
    var app = new App();
    global.ChuJiangApp = app;
    app.start().catch(function (error) {
      app.dom.showHint("体验启动失败，请换用支持 WebGL 的现代浏览器");
      console.error("应用启动失败:", error);
    });
  });

  NS.App = App;
}(window));
