(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};

  function App() {
    this.canvas = document.getElementById("stage");
    this.dom = new NS.DOMLayer();
    this.assets = new NS.AssetLoader(NS.ASSET_MANIFEST);
    this.time = 0;
    this.pixiApp = null;
    this.manager = null;
  }

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
    this.manager = new NS.SceneManager(this);
    this.bindProgress();
    this.bindTicker();
    return this.loadInitialScene();
  };

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

  App.prototype.bindTicker = function () {
    var app = this;
    this.pixiApp.ticker.add(function () {
      app.tick();
    });
  };

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
