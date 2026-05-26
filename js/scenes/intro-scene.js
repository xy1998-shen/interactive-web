// 第一幕入江：轻触拨雾、自动叙事与进入下一幕。
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};
  var utils = NS.utils;
  var config = NS.CONFIG.intro;

  function IntroScene(app, manager) {
    this.app = app;
    this.manager = manager;
    this.container = null;
    this.background = null;
    this.ripple = null;
    this.fogSprite = null;
    this.darkOverlay = null;
    this.sunGlow = null;
    this.sunGlowTexture = null;
    this.nearBoat = null;
    this.boatWake = null;
    this.waterStreaks = [];
    this.titleText = null;
    this.fogCanvas = document.createElement("canvas");
    this.fogCtx = this.fogCanvas.getContext("2d");
    this.fogTexture = null;
    this.fogSource = null;

    this.started = false;
    this.elapsed = 0;
    this.completed = false;
    this.readyForNext = false;

    this.pressing = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragDistance = 0;

    this.boundDown = this.onPointerDown.bind(this);
    this.boundMove = this.onPointerMove.bind(this);
    this.boundUp = this.onPointerUp.bind(this);
    this.boundKeyDown = this.onKeyDown.bind(this);
  }

  IntroScene.prototype.onEnter = function () {
    var viewport = utils.getViewport(this.app);
    this.container = new PIXI.Container();

    this.background = new PIXI.Sprite(this.app.assets.get("introBg"));
    utils.fitCover(this.background, this.background.texture, viewport.width, viewport.height);
    this.container.addChild(this.background);

    this.ripple = new PIXI.TilingSprite(this.app.assets.get("ripple"), viewport.width, viewport.height);
    this.ripple.alpha = 0.06;
    this.container.addChild(this.ripple);

    this.fogSource = this.app.assets.getImage("fog");
    this.resizeFogCanvas(viewport.width, viewport.height);
    this.fogTexture = PIXI.Texture.from(this.fogCanvas);
    this.fogSprite = new PIXI.Sprite(this.fogTexture);
    this.container.addChild(this.fogSprite);

    this.sunGlowTexture = PIXI.Texture.from(this.createSunGlowCanvas());
    this.sunGlow = new PIXI.Sprite(this.sunGlowTexture);
    this.sunGlow.anchor.set(0.5);
    this.container.addChild(this.sunGlow);

    this.darkOverlay = new PIXI.Graphics();
    this.container.addChild(this.darkOverlay);

    this.boatWake = new PIXI.Graphics();
    this.container.addChild(this.boatWake);
    this.nearBoat = new PIXI.Sprite(this.app.assets.get("nearBoat"));
    this.nearBoat.anchor.set(0.5, 0.72);
    this.container.addChild(this.nearBoat);
    this.createWaterStreaks(viewport);

    this.titleText = new PIXI.Text("入江寻艾", {
      fontFamily: "Songti SC, STSong, FangSong, serif",
      fontSize: Math.round(Math.min(viewport.width, viewport.height) * 0.07),
      fill: 0xf4efe0,
      align: "center",
      letterSpacing: 0
    });
    this.titleText.anchor.set(0.5);
    this.titleText.alpha = 0;
    this.container.addChild(this.titleText);

    this.app.pixiApp.stage.addChild(this.container);
    this.app.dom.heroCopy.classList.add("is-muted");
    this.app.dom.heroCopy.classList.add("is-suppressed");
    this.app.dom.hideIntroCta();
    this.app.dom.showHint("轻触画面，拨开江雾");
    this.app.dom.hideStoryScroll();
    this.app.dom.hideStoryNext();
    this.bindEvents();
  };

  IntroScene.prototype.bindEvents = function () {
    this.app.canvas.addEventListener("pointerdown", this.boundDown);
    this.app.canvas.addEventListener("pointermove", this.boundMove);
    this.app.canvas.addEventListener("pointerup", this.boundUp);
    this.app.canvas.addEventListener("pointerleave", this.boundUp);
    if (this.app.dom.storyScroll) {
      this.app.dom.storyScroll.addEventListener("pointerdown", this.boundDown);
    }
    global.addEventListener("keydown", this.boundKeyDown);
  };

  IntroScene.prototype.unbindEvents = function () {
    this.app.canvas.removeEventListener("pointerdown", this.boundDown);
    this.app.canvas.removeEventListener("pointermove", this.boundMove);
    this.app.canvas.removeEventListener("pointerup", this.boundUp);
    this.app.canvas.removeEventListener("pointerleave", this.boundUp);
    if (this.app.dom.storyScroll) {
      this.app.dom.storyScroll.removeEventListener("pointerdown", this.boundDown);
    }
    global.removeEventListener("keydown", this.boundKeyDown);
  };

  IntroScene.prototype.onPointerDown = function () {
    if (this.started) {
      return;
    }
    this.triggerAnimation();
  };

  IntroScene.prototype.onPointerMove = function () {};

  IntroScene.prototype.onPointerUp = function () {};

  IntroScene.prototype.onKeyDown = function () {};

  // 用户轻触后启动自动叙事时间轴
  IntroScene.prototype.triggerAnimation = function () {
    this.started = true;
    this.pressing = false;
    this.elapsed = 0;
    this.app.dom.hideHint();
    this.app.dom.showStoryScroll();
    this.app.dom.heroCopy.classList.add("is-muted");
  };

  IntroScene.prototype.onExit = function () {
    this.unbindEvents();
    global.gsap.killTweensOf(this.titleText);
    this.app.dom.heroCopy.classList.remove("is-suppressed");
    this.app.dom.hideStoryScroll();
    if (this.container) {
      this.app.pixiApp.stage.removeChild(this.container);
      this.container.destroy({ children: true });
      this.container = null;
    }
    if (this.fogTexture) {
      this.fogTexture.destroy(true);
      this.fogTexture = null;
    }
  };

  IntroScene.prototype.resizeFogCanvas = function (width, height) {
    var pixelWidth = Math.max(1, Math.round(width));
    var pixelHeight = Math.max(1, Math.round(height));
    if (this.fogCanvas.width !== pixelWidth || this.fogCanvas.height !== pixelHeight) {
      this.fogCanvas.width = pixelWidth;
      this.fogCanvas.height = pixelHeight;
      if (this.fogSprite) {
        this.fogSprite.width = width;
        this.fogSprite.height = height;
      }
    }
  };

  IntroScene.prototype.onUpdate = function (dt) {
    var viewport = utils.getViewport(this.app);
    utils.fitCover(this.background, this.background.texture, viewport.width, viewport.height);
    this.resizeFogCanvas(viewport.width, viewport.height);
    if (this.started) {
      this.elapsed = Math.min(config.autoDurationMS, this.elapsed + dt);
    }
    var progress = this.started ? this.elapsed / config.autoDurationMS : 0;
    this.updateRipple(viewport, progress);
    this.updateSunGlow(viewport, progress);
    this.drawFogLayer(progress);
    this.drawDarkOverlay(viewport, progress);
    this.updateBoat(viewport, progress);
    this.updateTitle(viewport, progress);
    this.app.dom.setStoryProgress(progress);
    if (this.started && !this.completed && progress >= 1) {
      this.completed = true;
      this.manager.completeCurrent();
      this.app.dom.showStoryScroll();
      this.app.dom.hideHint();
      var self = this;
      this.app.dom.showIntroCta("随舟寻艾 →", function () {
        self.goNext();
      });
    }
  };

  IntroScene.prototype.goNext = function () {
    this.manager.goTo(1);
  };

  IntroScene.prototype.updateRipple = function (viewport, progress) {
    this.ripple.width = viewport.width;
    this.ripple.height = viewport.height;
    this.ripple.alpha = 0.06 + progress * 0.1;
    this.ripple.tilePosition.x = (this.app.time * (0.01 + progress * 0.018)) % this.app.assets.get("ripple").width;
    this.ripple.tilePosition.y = Math.sin(this.app.time * 0.0008) * 18 + progress * 22;
  };

  IntroScene.prototype.createSunGlowCanvas = function () {
    var canvas = document.createElement("canvas");
    var size = 720;
    var ctx = canvas.getContext("2d");
    canvas.width = size;
    canvas.height = size;
    var center = size / 2;
    var glow = ctx.createRadialGradient(center, center, 0, center, center, center);
    glow.addColorStop(0, "rgba(244, 199, 106, 0.46)");
    glow.addColorStop(0.18, "rgba(244, 199, 106, 0.28)");
    glow.addColorStop(0.48, "rgba(235, 205, 133, 0.12)");
    glow.addColorStop(1, "rgba(235, 205, 133, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    ctx.translate(center, center);
    for (var i = 0; i < 18; i += 1) {
      ctx.rotate((Math.PI * 2) / 18);
      var ray = ctx.createLinearGradient(0, 0, center * 0.95, 0);
      ray.addColorStop(0, "rgba(245, 215, 146, 0.12)");
      ray.addColorStop(1, "rgba(245, 215, 146, 0)");
      ctx.fillStyle = ray;
      ctx.beginPath();
      ctx.moveTo(center * 0.18, -8);
      ctx.lineTo(center * 0.95, -2);
      ctx.lineTo(center * 0.95, 2);
      ctx.lineTo(center * 0.18, 8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    return canvas;
  };

  IntroScene.prototype.updateSunGlow = function (viewport, progress) {
    var eased = this.easeInOut(progress);
    var pulse = Math.sin(this.app.time * 0.0014) * 0.04;
    this.sunGlow.position.set(viewport.width * 0.74, viewport.height * 0.34);
    this.sunGlow.width = viewport.width * (0.42 + eased * 0.24 + pulse);
    this.sunGlow.height = this.sunGlow.width;
    this.sunGlow.alpha = 0.05 + eased * 0.34;
    this.sunGlow.rotation = this.app.time * 0.000035;
  };

  // Canvas 雾层：贴图铺底并按进度斜向擦除
  IntroScene.prototype.drawFogLayer = function (progress) {
    var ctx = this.fogCtx;
    var width = this.fogCanvas.width;
    var height = this.fogCanvas.height;
    ctx.clearRect(0, 0, width, height);
    if (this.fogSource) {
      utils.drawImageCover(ctx, this.fogSource, width, height, 0.92);
    } else {
      this.drawProceduralFog(ctx, width, height);
    }
    if (progress > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      this.drawDiagonalMistCut(ctx, width, height, progress);
      ctx.restore();
    }
    this.fogTexture.update();
  };

  IntroScene.prototype.drawProceduralFog = function (ctx, width, height) {
    var gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "rgba(238, 247, 243, 0.94)");
    gradient.addColorStop(0.45, "rgba(215, 234, 228, 0.86)");
    gradient.addColorStop(1, "rgba(238, 247, 243, 0.9)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  };

  IntroScene.prototype.drawDiagonalMistCut = function (ctx, width, height, progress) {
    var eased = this.easeOutCubic(progress);
    var diagonal = Math.sqrt(width * width + height * height);
    var front = diagonal * (-0.42 + eased * 1.08);
    var feather = diagonal * 0.22;
    var angle = -Math.PI / 6;
    ctx.save();
    ctx.translate(width * 0.5, height * 0.5);
    ctx.rotate(angle);
    var gradient = ctx.createLinearGradient(front - feather, 0, front + feather, 0);
    gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
    gradient.addColorStop(0.44, "rgba(0, 0, 0, 0.72)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(-diagonal, -diagonal, front + feather + diagonal, diagonal * 2);

    for (var i = 0; i < 12; i += 1) {
      var y = -height * 0.62 + i * height * 0.12;
      var wave = Math.sin(this.app.time * 0.00075 + i * 0.8) * height * 0.045;
      var x = front - feather * (0.38 + 0.1 * Math.sin(i));
      var r = height * (0.09 + (i % 4) * 0.018);
      var blob = ctx.createRadialGradient(x + wave, y, 0, x + wave, y, r);
      blob.addColorStop(0, "rgba(0, 0, 0, 0.3)");
      blob.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = blob;
      ctx.beginPath();
      ctx.arc(x + wave, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  IntroScene.prototype.drawDarkOverlay = function (viewport, progress) {
    var darkness = 0.48 * (1 - this.easeOutCubic(progress));
    var warm = 0.1 + progress * 0.18;
    this.darkOverlay.clear();
    this.darkOverlay.beginFill(0x122a30, darkness);
    this.darkOverlay.drawRect(0, 0, viewport.width, viewport.height);
    this.darkOverlay.endFill();
    this.darkOverlay.beginFill(0xe6c57b, warm * 0.18);
    this.darkOverlay.drawRect(0, 0, viewport.width, viewport.height);
    this.darkOverlay.endFill();
  };

  IntroScene.prototype.createWaterStreaks = function (viewport) {
    for (var i = 0; i < 10; i += 1) {
      var streak = new PIXI.Graphics();
      streak.seed = i;
      streak.baseX = viewport.width * (0.18 + (i % 5) * 0.16);
      streak.baseY = viewport.height * (0.72 + Math.floor(i / 5) * 0.08);
      this.waterStreaks.push(streak);
      this.container.addChild(streak);
    }
  };

  IntroScene.prototype.updateBoat = function (viewport, progress) {
    var travel = Math.max(0, Math.min(1, progress));
    var eased = this.easeInOut(progress);
    var bob = Math.sin(this.app.time * 0.0022) * viewport.height * 0.006;
    var reveal = progress <= 0.03 ? 0 : this.easeOutCubic((progress - 0.03) / 0.16);
    var scale = Math.min(viewport.width, viewport.height) * (0.00034 + eased * 0.000025);
    this.nearBoat.scale.set(scale);
    this.nearBoat.alpha = reveal * (0.62 + eased * 0.2);
    this.nearBoat.position.set(viewport.width * (0.42 + travel * 0.44), viewport.height * (0.82 - travel * 0.15) + bob);
    this.nearBoat.rotation = -0.04 + Math.sin(this.app.time * 0.0016) * 0.008;
    this.drawBoatWake(viewport, progress);
    for (var i = 0; i < this.waterStreaks.length; i += 1) {
      this.drawWaterStreak(this.waterStreaks[i], viewport, progress);
    }
  };

  IntroScene.prototype.drawBoatWake = function (viewport, progress) {
    var eased = this.easeInOut(progress);
    var x = this.nearBoat.x;
    var y = this.nearBoat.y + viewport.height * 0.025;
    var spread = viewport.width * (0.06 + eased * 0.035);
    this.boatWake.clear();
    this.boatWake.lineStyle(1, 0xe8f2ec, this.nearBoat.alpha * (0.12 + eased * 0.14));
    this.boatWake.moveTo(x - spread * 0.2, y);
    this.boatWake.quadraticCurveTo(x - spread * 0.95, y + viewport.height * 0.025, x - spread * 1.55, y + viewport.height * 0.055);
    this.boatWake.moveTo(x + spread * 0.2, y);
    this.boatWake.quadraticCurveTo(x + spread * 0.85, y + viewport.height * 0.018, x + spread * 1.28, y + viewport.height * 0.045);
  };

  IntroScene.prototype.drawWaterStreak = function (streak, viewport, progress) {
    var seed = streak.seed;
    var speed = 0.04 + seed * 0.006 + progress * 0.06;
    var cycle = (this.app.time * speed + seed * 97) % viewport.height;
    var y = viewport.height * 0.58 + cycle * 0.45;
    var centerOffset = (streak.baseX - viewport.width * 0.5) * (0.5 + progress * 0.2);
    var x = viewport.width * 0.5 + centerOffset;
    var len = viewport.width * (0.04 + (seed % 3) * 0.018);
    streak.clear();
    streak.lineStyle(1, 0xe9f4ef, (0.08 + progress * 0.16) * (1 - Math.max(0, y - viewport.height * 0.88) / (viewport.height * 0.2)));
    streak.moveTo(x - len * 0.5, y);
    streak.quadraticCurveTo(x, y + 5, x + len, y + 2);
  };

  IntroScene.prototype.updateTitle = function (viewport, progress) {
    this.titleText.position.set(viewport.width / 2, viewport.height * 0.44);
    this.titleText.style.fontSize = Math.round(Math.min(viewport.width, viewport.height) * 0.07);
    if (!this.started) {
      this.titleText.alpha = 0;
      return;
    }
    var fadeIn = Math.min(1, progress / 0.22);
    var fadeOut = progress > 0.56 ? Math.max(0, 1 - (progress - 0.56) / 0.28) : 1;
    this.titleText.alpha = fadeIn * fadeOut * 0.92;
    this.titleText.y = viewport.height * (0.46 - progress * 0.05);
  };

  IntroScene.prototype.easeOutCubic = function (t) {
    return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
  };

  IntroScene.prototype.easeInOut = function (t) {
    t = Math.max(0, Math.min(1, t));
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  NS.IntroScene = IntroScene;
}(window));
