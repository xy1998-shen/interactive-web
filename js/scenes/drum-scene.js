// 第四幕击鼓：连击推进龙舟，八击后过江完成。
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};
  var CONFIG = NS.CONFIG.drum;

  NS.MVPScene.prototype.buildDrum = function (viewport) {
    var scene = this;

    var boat = this.createSprite("boat", CONFIG.boatWidthRatio, CONFIG.boatStartX, CONFIG.boatY, viewport);
    var drum = this.createSprite("drum", CONFIG.drumWidthRatio, CONFIG.drumX, CONFIG.drumY, viewport);
    drum.eventMode = "static";
    drum.cursor = "pointer";
    drum.hitArea = new PIXI.Circle(0, 0, Math.max(drum.width, drum.height) * 0.6);

    // 波纹容器（在鼓下方渲染）
    var ringLayer = new PIXI.Container();
    this.content.addChildAt(ringLayer, this.content.getChildIndex(drum));

    this.state.drum = {
      beats: 0,
      lastBeatTime: 0,
      comboCount: 0,
      boat: boat,
      ringLayer: ringLayer
    };

    drum.on("pointertap", function () {
      if (scene.completed) return;
      scene.hitDrum(viewport);
    });
  };

  NS.MVPScene.prototype.hitDrum = function (viewport) {
    var state = this.state.drum;
    var now = performance.now();

    // 连击检测
    var isCombo = (now - state.lastBeatTime) < CONFIG.comboWindowMS && state.lastBeatTime > 0;
    state.lastBeatTime = now;

    if (isCombo) {
      state.comboCount++;
    } else {
      state.comboCount = 0;
    }

    state.beats++;

    // 波纹参数：连击时增大
    var comboMult = isCombo ? Math.min(CONFIG.comboRingScale, 1 + state.comboCount * 0.15) : 1;
    var ringRadius = CONFIG.ringMaxRadius * comboMult;

    // 生成朱砂红波纹
    this.spawnDrumRing(
      viewport.width * CONFIG.drumX,
      viewport.height * CONFIG.drumY - 20,
      ringRadius,
      comboMult,
      state.ringLayer
    );

    // 鼓面反馈
    var drumSprite = this.content.children[this.content.children.length - 1];
    global.gsap.fromTo(drumSprite.scale,
      { x: drumSprite.scale.x * 1.06, y: drumSprite.scale.y * 0.94 },
      { x: drumSprite.scale.x / 1.06, y: drumSprite.scale.y / 0.94, duration: 0.15, ease: "power2.out" }
    );

    // 龙舟推进：连击时步进增大
    var progress = Math.min(1, state.beats / CONFIG.totalBeats);
    var boatStep = isCombo ? CONFIG.comboBoatScale : 1;
    var targetX = viewport.width * (CONFIG.boatStartX + progress * CONFIG.boatTravelX);

    global.gsap.to(state.boat, {
      x: targetX,
      duration: CONFIG.boatStepDuration * (isCombo ? 0.7 : 1),
      ease: CONFIG.boatStepEase
    });

    // 连击时龙舟微微上浮
    if (isCombo && state.comboCount >= 2) {
      global.gsap.to(state.boat, {
        y: state.boat.y - 3,
        duration: 0.12,
        yoyo: true,
        repeat: 1
      });
    }

    this.setHint("鼓声 " + state.beats + " / " + CONFIG.totalBeats + (isCombo ? " 连击！" : ""));

    if (state.beats >= CONFIG.totalBeats) {
      this.completeDrum(viewport);
    }
  };

  NS.MVPScene.prototype.spawnDrumRing = function (x, y, maxRadius, intensity, container) {
    var ring = new PIXI.Graphics();
    ring.lineStyle(CONFIG.ringLineWidth * intensity, CONFIG.ringColor, 0.7 * intensity);
    ring.drawCircle(0, 0, 20);
    ring.position.set(x, y);
    container.addChild(ring);

    // 内圈
    var innerRing = new PIXI.Graphics();
    innerRing.lineStyle(CONFIG.ringLineWidth * 0.6, CONFIG.ringColor, 0.4);
    innerRing.drawCircle(0, 0, 12);
    innerRing.position.set(x, y);
    container.addChild(innerRing);

    global.gsap.to(ring, {
      alpha: 0,
      duration: CONFIG.ringDuration,
      ease: "power1.out",
      onComplete: function () {
        if (!ring.destroyed) ring.destroy();
      }
    });
    global.gsap.to(ring.scale, {
      x: maxRadius / 20,
      y: maxRadius / 20,
      duration: CONFIG.ringDuration,
      ease: "power2.out"
    });

    global.gsap.to(innerRing, {
      alpha: 0,
      duration: CONFIG.ringDuration * 0.7,
      ease: "power1.out",
      onComplete: function () {
        if (!innerRing.destroyed) innerRing.destroy();
      }
    });
    global.gsap.to(innerRing.scale, {
      x: maxRadius * 0.6 / 12,
      y: maxRadius * 0.6 / 12,
      duration: CONFIG.ringDuration * 0.7,
      ease: "power2.out"
    });
  };

  // 八击满后放大波纹并让龙舟驶出画面
  NS.MVPScene.prototype.completeDrum = function (viewport) {
    var scene = this;
    var state = this.state.drum;

    // 最终大波纹
    this.spawnDrumRing(
      viewport.width * CONFIG.drumX,
      viewport.height * CONFIG.drumY - 20,
      CONFIG.ringMaxRadius * 1.8,
      1.6,
      state.ringLayer
    );

    // 龙舟驶过画面
    global.gsap.to(state.boat, {
      x: viewport.width * 1.1,
      alpha: 0.4,
      duration: 0.8,
      ease: "power2.in",
      delay: 0.3,
      onComplete: function () {
        scene.finish(true);
      }
    });

    this.setHint("龙舟过江");
  };
}(window));
