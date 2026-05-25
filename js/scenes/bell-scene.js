// 第六幕编钟：敲击扩散声波并闪回前几幕记忆。
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};
  var CONFIG = NS.CONFIG.bell;

  NS.MVPScene.prototype.buildBell = function (viewport) {
    var scene = this;
    var group = new PIXI.Container();
    this.content.addChild(group);

    // 声波容器（在钟下方）
    var ringLayer = new PIXI.Container();
    group.addChild(ringLayer);

    // 闪回层
    var flashbackLayer = new PIXI.Container();
    flashbackLayer.alpha = 0;
    group.addChild(flashbackLayer);

    // 编钟
    var bell = this.createSprite("bell", CONFIG.bellWidthRatio, CONFIG.bellX, CONFIG.bellY, viewport);
    // 重新挂载到group
    this.content.removeChild(bell);
    group.addChild(bell);

    bell.eventMode = "static";
    bell.cursor = "pointer";
    bell.hitArea = new PIXI.Circle(0, 0, Math.max(bell.width, bell.height) * 0.55);

    this.state.bell = {
      taps: 0,
      group: group,
      bell: bell,
      ringLayer: ringLayer,
      flashbackLayer: flashbackLayer,
      flashbackShown: false
    };

    bell.on("pointertap", function () {
      if (scene.completed) return;
      scene.tapBell(viewport);
    });
  };

  NS.MVPScene.prototype.tapBell = function (viewport) {
    var state = this.state.bell;
    state.taps++;

    var cx = viewport.width * CONFIG.bellX;
    var cy = viewport.height * CONFIG.bellY;

    // 钟体微振
    global.gsap.to(state.bell.scale, {
      x: state.bell.scale.x * CONFIG.tapScale,
      y: state.bell.scale.y * CONFIG.tapScale,
      duration: 0.14,
      yoyo: true,
      repeat: 1,
      ease: "sine.inOut"
    });

    // 青铜金慢速声波（1200-1800ms）
    var ringCount = state.taps;
    this.spawnBellRing(cx, cy, CONFIG.ringMaxRadius * (0.7 + ringCount * 0.15), state.ringLayer);

    // 第2次点击后显示闪回
    if (state.taps >= 2 && !state.flashbackShown) {
      state.flashbackShown = true;
      this.showBellFlashback(viewport, state.flashbackLayer);
    }

    this.setHint("钟声 " + state.taps + " / " + CONFIG.totalTaps);

    if (state.taps >= CONFIG.totalTaps) {
      this.completeBell(viewport);
    }
  };

  NS.MVPScene.prototype.spawnBellRing = function (x, y, maxRadius, container) {
    // 外圈
    var ring = new PIXI.Graphics();
    ring.lineStyle(CONFIG.ringLineWidth, CONFIG.ringColor, CONFIG.ringAlpha);
    ring.drawCircle(0, 0, 16);
    ring.position.set(x, y);
    container.addChild(ring);

    global.gsap.to(ring, {
      alpha: 0,
      duration: CONFIG.ringDuration,
      ease: "sine.out",
      onComplete: function () {
        if (!ring.destroyed) ring.destroy();
      }
    });
    global.gsap.to(ring.scale, {
      x: maxRadius / 16,
      y: maxRadius / 16,
      duration: CONFIG.ringDuration,
      ease: "power1.out"
    });

    // 内圈（稍小、稍快）
    var inner = new PIXI.Graphics();
    inner.lineStyle(CONFIG.ringLineWidth * 0.7, CONFIG.ringColor, CONFIG.ringAlpha * 0.6);
    inner.drawCircle(0, 0, 12);
    inner.position.set(x, y);
    container.addChild(inner);

    global.gsap.to(inner, {
      alpha: 0,
      duration: CONFIG.ringDuration * 0.75,
      ease: "sine.out",
      onComplete: function () {
        if (!inner.destroyed) inner.destroy();
      }
    });
    global.gsap.to(inner.scale, {
      x: maxRadius * 0.6 / 12,
      y: maxRadius * 0.6 / 12,
      duration: CONFIG.ringDuration * 0.75,
      ease: "power1.out"
    });
  };

  NS.MVPScene.prototype.showBellFlashback = function (viewport, layer) {
    var scene = this;
    var cx = viewport.width * 0.5;
    var cy = viewport.height * 0.5;

    // 闪回素材：前几幕记忆碎片
    var positions = [
      { x: 0.25, y: 0.35 },
      { x: 0.72, y: 0.3 },
      { x: 0.3, y: 0.65 },
      { x: 0.7, y: 0.6 }
    ];

    CONFIG.flashbackAssets.forEach(function (key, i) {
      var tex = scene.app.assets.get(key);
      if (!tex) return;
      var sprite = new PIXI.Sprite(tex);
      sprite.anchor.set(0.5);
      sprite.alpha = 0;
      var targetWidth = viewport.width * 0.1;
      sprite.scale.set(targetWidth / sprite.texture.width);
      sprite.position.set(viewport.width * positions[i].x, viewport.height * positions[i].y);
      layer.addChild(sprite);

      // 依次淡入
      global.gsap.to(sprite, {
        alpha: CONFIG.flashbackAlpha,
        duration: CONFIG.flashbackDuration * 0.4,
        delay: i * 0.3,
        ease: "sine.out"
      });
      // 轻微浮动
      global.gsap.to(sprite, {
        y: sprite.y - 8,
        duration: 2.5,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        delay: i * 0.2
      });
    });

    global.gsap.to(layer, { alpha: 1, duration: 0.6 });
  };

  // 三击后声波收束并淡出闪回层
  NS.MVPScene.prototype.completeBell = function (viewport) {
    var scene = this;
    var state = this.state.bell;
    var cx = viewport.width * CONFIG.bellX;
    var cy = viewport.height * CONFIG.bellY;

    state.bell.eventMode = "none";
    this.setHint("金声入水，楚江和鸣");

    // 最终大声波
    this.spawnBellRing(cx, cy, CONFIG.ringMaxRadius * 1.5, state.ringLayer);

    // 声波收束动画：从外向内
    var converge = new PIXI.Graphics();
    converge.lineStyle(2, CONFIG.ringColor, 0.5);
    converge.drawCircle(0, 0, CONFIG.ringMaxRadius * 1.2);
    converge.position.set(cx, cy);
    converge.alpha = 0.5;
    state.ringLayer.addChild(converge);

    global.gsap.to(converge.scale, {
      x: 0.05,
      y: 0.05,
      duration: CONFIG.convergeDuration,
      delay: 0.6,
      ease: "power2.in"
    });
    global.gsap.to(converge, {
      alpha: 0,
      duration: CONFIG.convergeDuration * 0.8,
      delay: 0.6 + CONFIG.convergeDuration * 0.3,
      onComplete: function () {
        if (!converge.destroyed) converge.destroy();
      }
    });

    // 闪回淡出
    global.gsap.to(state.flashbackLayer, {
      alpha: 0,
      duration: 0.8,
      delay: CONFIG.convergeDuration * 0.5
    });

    // 完成
    global.gsap.delayedCall(CONFIG.convergeDuration + 0.8, function () {
      scene.finish(true);
    });
  };
}(window));
