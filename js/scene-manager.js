// 场景管理器：负责资源加载、场景切换、完成状态和预加载。
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};
  var SCENES = NS.SCENES;

  // 保存当前场景实例和每幕完成状态。
  function SceneManager(app) {
    this.app = app;
    this.currentIndex = -1;
    this.currentScene = null;
    this.loading = false;
    this.completed = SCENES.map(function () { return false; });
  }

  // 切换到目标场景；先加载资源，成功后再销毁旧场景。
  SceneManager.prototype.goTo = function (index) {
    var manager = this;
    if (!this.canEnter(index)) {
      return;
    }
    this.loading = true;
    this.app.dom.clearAction();
    var sceneMeta = SCENES[index];
    // 先保证本场景资源完整，再销毁旧场景，避免切换时出现空白。
    this.app.assets.loadManifest(sceneMeta.assets).then(function () {
      manager.enterScene(index, sceneMeta);
    }).catch(function (error) {
      manager.loading = false;
      manager.app.dom.showHint(error.message);
      console.error("场景加载失败:", sceneMeta.id, error);
    });
  };

  // 判断目标场景是否可以进入。
  SceneManager.prototype.canEnter = function (index) {
    return index >= 0 && index < SCENES.length && index !== this.currentIndex && !this.loading;
  };

  // 完成进入流程：重置 DOM、创建场景、同步音频并预加载下一幕。
  SceneManager.prototype.enterScene = function (index, sceneMeta) {
    this.loading = false;
    this.exitCurrentScene();
    this.currentIndex = index;
    this.app.dom.resetSceneControls();
    this.app.dom.setScene(index, this.completed);
    if (this.app.audio) {
      this.app.audio.setScene(sceneMeta.id);
    }
    this.currentScene = this.createScene(index, sceneMeta);
    this.currentScene.onEnter();
    this.preloadNext(index);
  };

  // 退出当前场景，交给场景实例清理事件和 Pixi 对象。
  SceneManager.prototype.exitCurrentScene = function () {
    if (this.currentScene && this.currentScene.onExit) {
      // 场景自己负责清理事件、ticker 关联和 Pixi 对象。
      this.currentScene.onExit();
    }
  };

  // 根据场景索引创建实例；第一幕使用独立 IntroScene。
  SceneManager.prototype.createScene = function (index, sceneMeta) {
    if (index === 0) {
      return new NS.IntroScene(this.app, this);
    }
    if (NS.MVPScene) {
      return new NS.MVPScene(this.app, this, sceneMeta, index);
    }
    return new NS.EmptyScene(this.app, this, sceneMeta);
  };

  // 预加载下一幕资源，减少正式切换时的等待。
  SceneManager.prototype.preloadNext = function (index) {
    var next = SCENES[index + 1];
    if (next) {
      this.app.assets.preload(next.assets);
    }
  };

  // 标记当前场景完成，并刷新 DOM 进度节点。
  SceneManager.prototype.completeCurrent = function () {
    if (this.currentIndex < 0) {
      return;
    }
    this.completed[this.currentIndex] = true;
    this.app.dom.setScene(this.currentIndex, this.completed);
  };

  // 将 ticker 的帧更新转发给当前场景。
  SceneManager.prototype.update = function (dt) {
    if (this.currentScene && this.currentScene.onUpdate) {
      this.currentScene.onUpdate(dt);
    }
  };

  NS.SceneManager = SceneManager;
}(window));
