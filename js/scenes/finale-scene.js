// 终幕：四面板氛围递进（祭祀→龙舟→家宴→夜景）+ 印章寄语收束。
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};
  var FONTS = NS.FONT_STACKS;

  // 自动轮播节拍
  var PANEL_INTERVAL = 6;          // 普通面板停留秒数
  var LAST_PANEL_DWELL = 4;        // 第 4 面板停留多久后开始收束
  var FAREWELL_TEXT = "愿年年此日，粽香犹在，家人安好。";
  var RESTART_DELAY = 3;           // 寄语显示后等待多久浮出"重游此程"

  // ============================================================
  // 入口：buildFinale 由 base-scene 的 buildScene 分发器调用
  // ============================================================
  NS.MVPScene.prototype.buildFinale = function (viewport) {
    var scene = this;

    // 终幕走自有 UI：屏蔽默认提示与 knowledgeText
    if (this.knowledgeText) {
      this.knowledgeText.alpha = 0;
      this.knowledgeText.visible = false;
    }
    this.app.dom.hideHint();
    this.app.dom.heroCopy.classList.add("is-suppressed");

    var panelConfigs = [
      {
        bgKey: "finalePanel1Memorial",
        title: "祭祀",
        description: "江畔焚香，遥祭诗魂。千年之后，那份赤诚依然滚烫。",
        buildFn: buildPanelMemorial
      },
      {
        bgKey: "finalePanel2Race",
        title: "龙舟",
        description: "百桨争流，鼓声如雷。江面上的热血，是对先人最好的告慰。",
        buildFn: buildPanelRace
      },
      {
        bgKey: "finalePanel3Feast",
        title: "家宴",
        description: "围炉团坐，粽香盈室。最平凡的团聚，最珍贵的时光。",
        buildFn: buildPanelFeast
      },
      {
        bgKey: "finalePanel4Night",
        title: "夜景",
        description: "花灯入水，心愿随波。愿来年此时，依旧灯火可亲。",
        buildFn: buildPanelNight
      }
    ];

    this.state.finale = {
      endingStarted: false,
      manualMode: false,
      stepCall: null,
      endingLayer: null
    };

    this.initPanels(panelConfigs);

    // 用自定义点击逻辑替换默认指示器：手动跳转时禁用自动序列
    if (this.app.dom.createPanelIndicator) {
      this.app.dom.createPanelIndicator(panelConfigs.length, function (idx) {
        scene._handleFinaleDotClick(idx);
      });
      this.app.dom.updatePanelIndicator(0);
    }

    // 启动自动序列
    this._scheduleFinaleAutoStep(0);
  };

  // ============================================================
  // 面板自动序列调度
  // ============================================================
  NS.MVPScene.prototype._scheduleFinaleAutoStep = function (currentIndex) {
    var scene = this;
    var state = this.state.finale;
    if (!state || state.endingStarted) return;

    if (state.stepCall) {
      state.stepCall.kill();
      state.stepCall = null;
    }

    var lastIndex = (this.panelConfigs ? this.panelConfigs.length : 4) - 1;

    if (currentIndex >= lastIndex) {
      // 在最后一个面板停留 LAST_PANEL_DWELL 秒后进入收束
      state.stepCall = this.scheduleCall(LAST_PANEL_DWELL, function () {
        scene._startEndingSequence();
      });
      return;
    }

    if (state.manualMode) {
      // 手动模式下不再继续自动跳转（除非已到最后面板）
      return;
    }

    state.stepCall = this.scheduleCall(PANEL_INTERVAL, function () {
      var next = currentIndex + 1;
      scene.switchToPanel(next);
      scene._scheduleFinaleAutoStep(next);
    });
  };

  NS.MVPScene.prototype._handleFinaleDotClick = function (idx) {
    var scene = this;
    var state = this.state.finale;
    if (!state || state.endingStarted) return;

    state.manualMode = true;
    if (state.stepCall) {
      state.stepCall.kill();
      state.stepCall = null;
    }
    this.switchToPanel(idx);

    // 即便手动跳转，落到最后一个面板也要进入收束
    var lastIndex = this.panelConfigs.length - 1;
    if (idx >= lastIndex) {
      state.stepCall = this.scheduleCall(LAST_PANEL_DWELL, function () {
        scene._startEndingSequence();
      });
    }
  };

  // ============================================================
  // 收束序列：暗遮罩 → 印章 → 寄语 → "重游此程"
  // ============================================================
  NS.MVPScene.prototype._startEndingSequence = function () {
    var scene = this;
    var state = this.state.finale;
    if (!state || state.endingStarted) return;
    state.endingStarted = true;

    var viewport = NS.utils.getViewport(this.app);

    // 收束序列中禁用面板切换：解除指示器交互
    if (this.app.dom.panelIndicator) {
      this.app.dom.panelIndicator.classList.add("is-disabled");
      this.app.dom.panelIndicator.style.pointerEvents = "none";
      this.app.dom.panelIndicator.style.opacity = "0.4";
    }
    if (this.app.dom.panelIndicatorDots && this.app.dom.panelIndicatorDots.length) {
      this.app.dom.panelIndicatorDots.forEach(function (dot) {
        dot.disabled = true;
      });
    }
    this.app.dom.hidePanelCaption();

    var endingLayer = new PIXI.Container();
    if (this.content) {
      this.content.addChild(endingLayer);
    }
    state.endingLayer = endingLayer;

    // 1) 半透明黑色遮罩 0 → 0.42
    var mask = new PIXI.Graphics();
    mask.beginFill(0x05080a, 1);
    mask.drawRect(0, 0, viewport.width, viewport.height);
    mask.endFill();
    mask.alpha = 0;
    endingLayer.addChild(mask);
    var maskTween = global.gsap.to(mask, {
      alpha: 0.42,
      duration: 1.5,
      ease: "sine.out"
    });
    this.cleanups.push(function () { maskTween.kill(); });

    // 2) 中央印章：缩放 0.3→1，旋转 -10°→0°，alpha 0→1
    var sealTexture = scene.app.assets.get("seal");
    var seal = new PIXI.Sprite(sealTexture);
    seal.anchor.set(0.5);
    var sealScale = (viewport.width * 0.16) / sealTexture.width;
    seal.scale.set(sealScale * 0.3);
    seal.rotation = -0.18;
    seal.alpha = 0;
    seal.position.set(viewport.width * 0.5, viewport.height * 0.44);
    endingLayer.addChild(seal);

    var sealAlphaTween = global.gsap.to(seal, {
      alpha: 1,
      duration: 1.0,
      delay: 0.55,
      ease: "sine.out"
    });
    var sealScaleTween = global.gsap.to(seal.scale, {
      x: sealScale,
      y: sealScale,
      duration: 1.2,
      delay: 0.55,
      ease: "back.out(1.4)"
    });
    var sealRotTween = global.gsap.to(seal, {
      rotation: 0,
      duration: 1.2,
      delay: 0.55,
      ease: "sine.out"
    });
    this.cleanups.push(function () {
      sealAlphaTween.kill();
      sealScaleTween.kill();
      sealRotTween.kill();
    });

    // 印章呼吸光环
    var halo = new PIXI.Graphics();
    halo.beginFill(0xc8a45d, 0.18);
    halo.drawCircle(0, 0, viewport.width * 0.13);
    halo.endFill();
    halo.position.set(viewport.width * 0.5, viewport.height * 0.44);
    halo.alpha = 0;
    endingLayer.addChildAt(halo, 1);
    var haloIn = global.gsap.to(halo, {
      alpha: 0.4,
      duration: 1.2,
      delay: 1.0,
      ease: "sine.out"
    });
    var haloPulse = global.gsap.to(halo.scale, {
      x: 1.18, y: 1.18,
      duration: 2.4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      delay: 1.6
    });
    this.cleanups.push(function () {
      haloIn.kill();
      haloPulse.kill();
    });

    // 3) 寄语文字（书法字体）
    var farewell = new PIXI.Text(FAREWELL_TEXT, {
      fontFamily: FONTS.calligraphy,
      fontSize: Math.round(viewport.width * 0.018) + 12,
      fill: 0xf4ecd8,
      align: "center",
      letterSpacing: 4,
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowBlur: 12,
      dropShadowAlpha: 0.7,
      dropShadowDistance: 0
    });
    farewell.anchor.set(0.5);
    farewell.alpha = 0;
    var farewellTargetY = viewport.height * 0.66;
    farewell.position.set(viewport.width * 0.5, farewellTargetY + 16);
    endingLayer.addChild(farewell);

    var farewellAlpha = global.gsap.to(farewell, {
      alpha: 0.96,
      duration: 1.0,
      delay: 1.6,
      ease: "sine.out"
    });
    var farewellY = global.gsap.to(farewell.position, {
      y: farewellTargetY,
      duration: 1.0,
      delay: 1.6,
      ease: "sine.out"
    });
    this.cleanups.push(function () {
      farewellAlpha.kill();
      farewellY.kill();
    });

    // 4) 一段细金线作为印章下分割
    var rule = new PIXI.Graphics();
    var ruleW = viewport.width * 0.12;
    rule.lineStyle(1, 0xc8a45d, 0.6);
    rule.moveTo(-ruleW / 2, 0);
    rule.lineTo(ruleW / 2, 0);
    rule.position.set(viewport.width * 0.5, viewport.height * 0.56);
    rule.alpha = 0;
    endingLayer.addChild(rule);
    var ruleTween = global.gsap.to(rule, {
      alpha: 0.78,
      duration: 0.8,
      delay: 1.4,
      ease: "sine.out"
    });
    this.cleanups.push(function () { ruleTween.kill(); });

    // 5) 寄语显示后再过 RESTART_DELAY 秒浮出"重游此程"
    var ctaDelay = 1.6 + 1.0 + RESTART_DELAY;
    this.scheduleCall(ctaDelay, function () {
      scene.app.dom.showAction("重游此程", function () {
        scene._restartJourney();
      });
    });
  };

  // ============================================================
  // 重置全部场景状态并回到入江幕
  // ============================================================
  NS.MVPScene.prototype._restartJourney = function () {
    var scene = this;
    var manager = this.manager;
    if (!manager) return;
    this.app.dom.clearAction();

    manager.completed = manager.completed.map(function () { return false; });

    if (this.container) {
      global.gsap.to(this.container, {
        alpha: 0,
        duration: 0.7,
        ease: "sine.inOut",
        onComplete: function () {
          manager.goTo(0);
        }
      });
    } else {
      manager.goTo(0);
    }
  };

  // ============================================================
  // 兼容钩子：若管理器在已完成态下重入，直接进入收束
  // ============================================================
  NS.MVPScene.prototype.showFinaleCompletion = function () {
    if (this.state && this.state.finale && this.state.finale.endingStarted) return;
    this._startEndingSequence();
  };

  // ============================================================
  // 视口变化：重设面板背景拉伸（base-scene.onUpdate 会调用）
  // ============================================================
  NS.MVPScene.prototype.updateFinaleLayout = function (viewport) {
    if (!this.panels) return;
    this.panels.forEach(function (panel) {
      if (panel.background && panel.background.texture) {
        NS.utils.fitCover(panel.background, panel.background.texture, viewport.width, viewport.height);
      }
    });
  };

  // ============================================================
  // 面板内容构造：每个 buildFn 在 contentLayer 上添加动态元素
  // 所有 GSAP 动画 kill 注册到 scene.cleanups，由 onExit 统一清理
  // ============================================================

  // —— 第 1 面板：祭祀（肃穆） · 香烟粒子 + 烛火脉动 ——
  function buildPanelMemorial(layer, viewport, idx) {
    var scene = this;

    // 烛火：4 个橙黄小点 + 微光晕，alpha 随机脉动
    var candles = [
      { x: 0.42, y: 0.74 },
      { x: 0.49, y: 0.76 },
      { x: 0.56, y: 0.74 },
      { x: 0.63, y: 0.76 }
    ];
    candles.forEach(function (c, i) {
      var glow = new PIXI.Graphics();
      glow.beginFill(0xffc66a, 0.5);
      glow.drawCircle(0, 0, 14);
      glow.endFill();
      glow.position.set(viewport.width * c.x, viewport.height * c.y);
      glow.alpha = 0.35;
      layer.addChild(glow);

      var flame = new PIXI.Graphics();
      flame.beginFill(0xffe28a, 1);
      flame.drawCircle(0, 0, 3.2);
      flame.endFill();
      flame.position.set(viewport.width * c.x, viewport.height * c.y);
      layer.addChild(flame);

      var flameTw = global.gsap.to(flame, {
        alpha: 0.45 + Math.random() * 0.2,
        duration: 0.4 + Math.random() * 0.4,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        delay: i * 0.12
      });
      var glowTw = global.gsap.to(glow, {
        alpha: 0.18 + Math.random() * 0.15,
        duration: 0.6 + Math.random() * 0.5,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        delay: i * 0.18
      });
      scene.cleanups.push(function () { flameTw.kill(); glowTw.kill(); });
    });

    // 香烟粒子：从烛火中心区缓慢上升 + 正弦微飘 + 渐淡
    function spawnSmoke() {
      if (!layer || layer.destroyed) return;
      var p = new PIXI.Graphics();
      var size = 3 + Math.random() * 2.4;
      p.beginFill(0xeae3d6, 0.55);
      p.drawCircle(0, 0, size);
      p.endFill();
      var startX = viewport.width * (0.42 + Math.random() * 0.22);
      var startY = viewport.height * 0.73;
      p.position.set(startX, startY);
      layer.addChild(p);

      var rise = viewport.height * (0.32 + Math.random() * 0.12);
      var sway = (Math.random() - 0.5) * 60;
      var dur = 4.0 + Math.random() * 1.6;

      var t1 = global.gsap.to(p, {
        y: startY - rise,
        alpha: 0,
        duration: dur,
        ease: "sine.out",
        onComplete: function () { if (!p.destroyed) p.destroy(); }
      });
      var t2 = global.gsap.to(p, {
        x: startX + sway,
        duration: dur * 0.5,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut"
      });
      var t3 = global.gsap.to(p.scale, {
        x: 2.2, y: 2.2,
        duration: dur,
        ease: "sine.out"
      });
      scene.cleanups.push(function () { t1.kill(); t2.kill(); t3.kill(); });
    }
    var smokeTicker = global.gsap.to({}, {
      duration: 0.55,
      repeat: -1,
      onRepeat: spawnSmoke
    });
    scene.cleanups.push(function () { smokeTicker.kill(); });
  }

  // —— 第 2 面板：龙舟（热闹） · 水花粒子 + 旗帜飘动 ——
  function buildPanelRace(layer, viewport, idx) {
    var scene = this;

    // 旗帜：两面小三角，rotation 正弦摇摆 ±10°
    var flagDefs = [
      { x: 0.16, y: 0.18, color: 0xc44a3a, size: 16 },
      { x: 0.82, y: 0.14, color: 0xd88e3a, size: 18 }
    ];
    flagDefs.forEach(function (f, i) {
      var poleX = viewport.width * f.x;
      var poleY = viewport.height * f.y;
      var pole = new PIXI.Graphics();
      pole.lineStyle(2, 0x3a2a1a, 0.7);
      pole.moveTo(0, 0);
      pole.lineTo(0, 70);
      pole.position.set(poleX, poleY);
      layer.addChild(pole);

      var flagPivot = new PIXI.Container();
      flagPivot.position.set(poleX, poleY + 4);
      var flag = new PIXI.Graphics();
      flag.beginFill(f.color, 0.86);
      flag.drawPolygon([0, 0, f.size + 6, 5, 0, 14]);
      flag.endFill();
      flag.lineStyle(1, 0x000000, 0.18);
      flag.drawPolygon([0, 0, f.size + 6, 5, 0, 14]);
      flagPivot.addChild(flag);
      layer.addChild(flagPivot);

      var rotTw = global.gsap.fromTo(flagPivot, { rotation: -0.17 }, {
        rotation: 0.17,
        duration: 0.7 + i * 0.18,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });
      scene.cleanups.push(function () { rotTw.kill(); });
    });

    // 水花粒子：两侧底部抛物线弹起
    function spawnSplash() {
      if (!layer || layer.destroyed) return;
      var leftSide = Math.random() > 0.5;
      var sx = leftSide
        ? viewport.width * (0.04 + Math.random() * 0.18)
        : viewport.width * (0.78 + Math.random() * 0.18);
      var sy = viewport.height * (0.66 + Math.random() * 0.12);
      var size = 1.8 + Math.random() * 2.2;

      var p = new PIXI.Graphics();
      p.beginFill(0xffffff, 0.88);
      p.drawCircle(0, 0, size);
      p.endFill();
      p.position.set(sx, sy);
      layer.addChild(p);

      var dx = (leftSide ? 1 : -1) * (40 + Math.random() * 80);
      var peakY = sy - 70 - Math.random() * 50;

      var up = global.gsap.to(p, {
        x: sx + dx * 0.5,
        y: peakY,
        duration: 0.42,
        ease: "sine.out"
      });
      var down = global.gsap.to(p, {
        x: sx + dx,
        y: sy + 30,
        duration: 0.5,
        delay: 0.42,
        ease: "sine.in"
      });
      var fade = global.gsap.to(p, {
        alpha: 0,
        duration: 0.38,
        delay: 0.55,
        onComplete: function () { if (!p.destroyed) p.destroy(); }
      });
      scene.cleanups.push(function () { up.kill(); down.kill(); fade.kill(); });
    }

    var splashTicker = global.gsap.to({}, {
      duration: 0.32,
      repeat: -1,
      onRepeat: function () {
        spawnSplash();
        if (Math.random() > 0.4) spawnSplash();
      }
    });
    scene.cleanups.push(function () { splashTicker.kill(); });
  }

  // —— 第 3 面板：家宴（温馨） · 暖色光晕 + 桌面金色微粒 ——
  function buildPanelFeast(layer, viewport, idx) {
    var scene = this;

    // 大暖色光晕：alpha 0.05~0.2 缓慢脉动
    var halo = new PIXI.Graphics();
    halo.beginFill(0xffd28a, 1);
    halo.drawCircle(0, 0, Math.min(viewport.width, viewport.height) * 0.42);
    halo.endFill();
    halo.position.set(viewport.width * 0.5, viewport.height * 0.5);
    halo.alpha = 0.06;
    halo.blendMode = PIXI.BLEND_MODES.ADD;
    layer.addChildAt(halo, 0);
    var haloTw = global.gsap.to(halo, {
      alpha: 0.2,
      duration: 2.6,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
    scene.cleanups.push(function () { haloTw.kill(); });

    // 桌面区金色小粒：从中下部缓慢上升微飘
    function spawnSpark() {
      if (!layer || layer.destroyed) return;
      var p = new PIXI.Graphics();
      var size = 1.4 + Math.random() * 1.6;
      p.beginFill(0xffe6a8, 0.92);
      p.drawCircle(0, 0, size);
      p.endFill();
      var startX = viewport.width * (0.25 + Math.random() * 0.5);
      var startY = viewport.height * (0.6 + Math.random() * 0.18);
      p.position.set(startX, startY);
      layer.addChild(p);

      var driftY = -40 - Math.random() * 60;
      var driftX = (Math.random() - 0.5) * 50;
      var dur = 2.4 + Math.random() * 1.6;
      var t = global.gsap.to(p, {
        x: startX + driftX,
        y: startY + driftY,
        alpha: 0,
        duration: dur,
        ease: "sine.out",
        onComplete: function () { if (!p.destroyed) p.destroy(); }
      });
      scene.cleanups.push(function () { t.kill(); });
    }
    var sparkTicker = global.gsap.to({}, {
      duration: 0.45,
      repeat: -1,
      onRepeat: spawnSpark
    });
    scene.cleanups.push(function () { sparkTicker.kill(); });
  }

  // —— 第 4 面板：夜景（祥和） · 河灯漂浮 + 萤火虫 ——
  function buildPanelNight(layer, viewport, idx) {
    var scene = this;

    // 河灯：暖橙小圆，从画面上方 1/3 处缓慢往下飘移，左右微摆
    function spawnLantern() {
      if (!layer || layer.destroyed) return;
      var size = 4 + Math.random() * 3;
      var lantern = new PIXI.Container();

      var outerGlow = new PIXI.Graphics();
      outerGlow.beginFill(0xffb56a, 0.32);
      outerGlow.drawCircle(0, 0, size * 2.6);
      outerGlow.endFill();
      lantern.addChild(outerGlow);

      var core = new PIXI.Graphics();
      core.beginFill(0xff9c3c, 0.92);
      core.drawCircle(0, 0, size);
      core.endFill();
      core.beginFill(0xffe6b2, 0.6);
      core.drawCircle(0, -size * 0.2, size * 0.5);
      core.endFill();
      lantern.addChild(core);

      var startX = viewport.width * (0.12 + Math.random() * 0.76);
      var startY = viewport.height * (0.30 + Math.random() * 0.08);
      lantern.position.set(startX, startY);
      lantern.alpha = 0;
      layer.addChild(lantern);

      var endY = startY + viewport.height * (0.32 + Math.random() * 0.18);
      var totalDur = 13 + Math.random() * 6;

      var fadeIn = global.gsap.to(lantern, {
        alpha: 0.95,
        duration: 1.4,
        ease: "sine.out"
      });
      var drift = global.gsap.to(lantern, {
        y: endY,
        duration: totalDur,
        ease: "none",
        onComplete: function () { if (!lantern.destroyed) lantern.destroy({ children: true }); }
      });
      var sway = global.gsap.to(lantern, {
        x: startX + (Math.random() - 0.5) * 70,
        duration: 3.2 + Math.random() * 1.6,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });
      var fadeOut = global.gsap.to(lantern, {
        alpha: 0,
        duration: 2.2,
        delay: totalDur - 2.2,
        ease: "sine.in"
      });
      scene.cleanups.push(function () {
        fadeIn.kill(); drift.kill(); sway.kill(); fadeOut.kill();
      });
    }
    // 初始铺 3 盏，错峰登场
    for (var k = 0; k < 3; k++) {
      (function (delay) {
        var c = scene.scheduleCall(delay, function () { spawnLantern(); });
        // scheduleCall 已自动注册到 cleanups
      })(k * 1.4);
    }
    var lanternTicker = global.gsap.to({}, {
      duration: 3.6,
      repeat: -1,
      onRepeat: spawnLantern
    });
    scene.cleanups.push(function () { lanternTicker.kill(); });

    // 萤火虫：12 个极小亮点，随机位置闪烁
    var fireflyHost = new PIXI.Container();
    layer.addChild(fireflyHost);
    for (var i = 0; i < 14; i++) {
      var f = new PIXI.Graphics();
      f.beginFill(0xfff5b8, 1);
      f.drawCircle(0, 0, 1.4 + Math.random() * 0.8);
      f.endFill();
      f.position.set(
        viewport.width * (0.08 + Math.random() * 0.84),
        viewport.height * (0.18 + Math.random() * 0.6)
      );
      f.alpha = 0;
      fireflyHost.addChild(f);

      var blink = global.gsap.to(f, {
        alpha: 0.85,
        duration: 0.6 + Math.random() * 0.5,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        delay: Math.random() * 2.4,
        repeatDelay: Math.random() * 1.4
      });
      var driftX = global.gsap.to(f, {
        x: f.x + (Math.random() - 0.5) * 50,
        y: f.y + (Math.random() - 0.5) * 30,
        duration: 5 + Math.random() * 4,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });
      scene.cleanups.push(function () { blink.kill(); driftX.kill(); });
    }
  }
}(window));
