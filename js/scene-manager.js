(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};
  var SCENES = NS.SCENES;

  function SceneManager(app) {
    this.app = app;
    this.currentIndex = -1;
    this.currentScene = null;
    this.loading = false;
    this.completed = SCENES.map(function () { return false; });
  }

  SceneManager.prototype.goTo = function (index) {
    var manager = this;
    if (!this.canEnter(index)) {
      return;
    }
    this.loading = true;
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

  SceneManager.prototype.canEnter = function (index) {
    return index >= 0 && index < SCENES.length && index !== this.currentIndex && !this.loading;
  };

  SceneManager.prototype.enterScene = function (index, sceneMeta) {
    this.loading = false;
    this.exitCurrentScene();
    this.currentIndex = index;
    this.app.dom.clearAction();
    this.app.dom.setScene(index, this.completed);
    this.currentScene = this.createScene(index, sceneMeta);
    this.currentScene.onEnter();
    this.preloadNext(index);
  };

  SceneManager.prototype.exitCurrentScene = function () {
    if (this.currentScene && this.currentScene.onExit) {
      // 场景自己负责清理事件、ticker 关联和 Pixi 对象。
      this.currentScene.onExit();
    }
  };

  SceneManager.prototype.createScene = function (index, sceneMeta) {
    if (index === 0) {
      return new NS.IntroScene(this.app, this);
    }
    if (NS.MVPScene) {
      return new NS.MVPScene(this.app, this, sceneMeta, index);
    }
    return new NS.EmptyScene(this.app, this, sceneMeta);
  };

  SceneManager.prototype.preloadNext = function (index) {
    var next = SCENES[index + 1];
    if (next) {
      this.app.assets.preload(next.assets);
    }
  };

  SceneManager.prototype.completeCurrent = function () {
    if (this.currentIndex < 0) {
      return;
    }
    this.completed[this.currentIndex] = true;
    this.app.dom.setScene(this.currentIndex, this.completed);
  };

  SceneManager.prototype.update = function (dt) {
    if (this.currentScene && this.currentScene.onUpdate) {
      this.currentScene.onUpdate(dt);
    }
  };

  NS.SceneManager = SceneManager;
}(window));
