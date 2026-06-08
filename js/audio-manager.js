// 背景音乐管理：用户解锁、场景音量切换与临时压低。
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};

  // 维护单个背景音乐实例及其淡入淡出状态。
  function AudioManager(config) {
    this.config = config || {};
    this.audio = null;
    this.enabled = false;
    this.unlocked = false;
    this.currentVolume = 0;
    this.targetVolume = 0;
    this.fadeFrame = null;
    this.duckTimer = null;
    this.boundUnlock = this.unlock.bind(this);
  }

  // 创建 Audio 元素，并等待用户手势解锁播放。
  AudioManager.prototype.init = function () {
    if (!this.config.src || this.audio) {
      return;
    }
    this.audio = new Audio(this.config.src);
    this.audio.loop = true;
    this.audio.preload = "auto";
    this.audio.volume = 0;
    this.currentVolume = 0;
    this.targetVolume = this.getSceneVolume("intro");
    this.bindUnlockEvents();
  };

  // 绑定一次性解锁事件，兼容浏览器自动播放限制。
  AudioManager.prototype.bindUnlockEvents = function () {
    global.addEventListener("pointerdown", this.boundUnlock, { once: true });
    global.addEventListener("keydown", this.boundUnlock, { once: true });
  };

  // 用户首次交互后开始播放并淡入到目标音量。
  AudioManager.prototype.unlock = function () {
    if (!this.audio || this.unlocked) {
      return;
    }
    this.unlocked = true;
    this.enabled = true;
    var manager = this;
    var playResult = this.audio.play();
    if (playResult && playResult.catch) {
      playResult.catch(function (error) {
        manager.enabled = false;
        if (manager.fadeFrame) {
          global.cancelAnimationFrame(manager.fadeFrame);
          manager.fadeFrame = null;
        }
        console.warn("背景音乐播放失败:", error);
      });
    }
    this.fadeTo(this.targetVolume, this.config.fadeInMS || 2600);
  };

  // 切换场景时调整背景音乐目标音量。
  AudioManager.prototype.setScene = function (sceneId) {
    this.targetVolume = this.getSceneVolume(sceneId);
    this.fadeTo(this.targetVolume, this.config.sceneFadeMS || 1800);
  };

  // 读取场景专属音量，缺省时使用基础音量。
  AudioManager.prototype.getSceneVolume = function (sceneId) {
    var volumes = this.config.sceneVolumes || {};
    if (Object.prototype.hasOwnProperty.call(volumes, sceneId)) {
      return volumes[sceneId];
    }
    return this.config.baseVolume || 0.18;
  };

  // 临时压低背景音乐，用于鼓声、钟声等前景音效。
  AudioManager.prototype.duck = function (ratio, durationMS, holdMS) {
    if (!this.audio) {
      return;
    }
    var manager = this;
    var level = this.targetVolume * Math.max(0, Math.min(1, ratio));
    if (this.duckTimer) {
      global.clearTimeout(this.duckTimer);
      this.duckTimer = null;
    }
    this.fadeTo(level, durationMS || 700);
    this.duckTimer = global.setTimeout(function () {
      manager.fadeTo(manager.targetVolume, manager.config.duckRecoverMS || 1800);
      manager.duckTimer = null;
    }, holdMS || 1800);
  };

  // 使用 requestAnimationFrame 做平滑音量过渡。
  AudioManager.prototype.fadeTo = function (volume, durationMS) {
    if (!this.audio) {
      return;
    }
    if (!this.enabled) {
      this.targetVolume = volume;
      if (this.fadeFrame) {
        global.cancelAnimationFrame(this.fadeFrame);
        this.fadeFrame = null;
      }
      return;
    }
    if (this.fadeFrame) {
      global.cancelAnimationFrame(this.fadeFrame);
    }
    var audio = this.audio;
    var manager = this;
    var startVolume = this.currentVolume;
    var target = Math.max(0, Math.min(1, volume));
    var startTime = global.performance.now();
    var duration = Math.max(1, durationMS || 1200);
    function step(now) {
      var progress = Math.min(1, (now - startTime) / duration);
      var eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      manager.currentVolume = startVolume + (target - startVolume) * eased;
      audio.volume = manager.currentVolume;
      if (progress < 1) {
        manager.fadeFrame = global.requestAnimationFrame(step);
      } else {
        manager.fadeFrame = null;
      }
    }
    this.fadeFrame = global.requestAnimationFrame(step);
  };

  NS.AudioManager = AudioManager;
}(window));
