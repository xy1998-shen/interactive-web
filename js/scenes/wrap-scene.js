// 第三幕裹青：4 面板顺序播放（备料 / 裹粽 / 蒸煮 / 分食）+ 文化知识卡。
// 依赖 base-scene.js 提供的 PanelSwitcher API（initPanels / switchToPanel /
// startAutoPlay / destroyPanels）以及 dom-layer 的 panel-caption / 指示器 / 知识卡。
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};

  // ---------------- 面板配置 ----------------
  // 直接写在场景内部，按任务约束不修改 config.js
  var WRAP_PANELS = [
    {
      bgKey: "wrapPanel1Prep",
      title: "备料",
      description: "箬叶洗净，糯米浸透。端午前夕，家家户户忙碌着同一件事。",
      buildFn: buildPanel1Ripples
    },
    {
      bgKey: "wrapPanel2Wrap",
      title: "裹粽",
      description: "两片叶交叠成斗，米实馅满，丝线一缠。手艺在指尖代代相传。",
      buildFn: buildPanel2Threads
    },
    {
      bgKey: "wrapPanel3Steam",
      title: "蒸煮",
      description: "文火慢煮数时辰，粽香渐浓。等待，也是节日仪式的一部分。",
      buildFn: buildPanel3Steam
    },
    {
      bgKey: "wrapPanel4Eat",
      title: "分食",
      description: "剥开青叶，糯香扑鼻。孩子的笑脸，是端午最好的注脚。",
      buildFn: buildPanel4Glow
    }
  ];

  // 文化知识卡内容（HTML 格式，由 dom-layer.showKnowledgeCard 注入）
  var KNOWLEDGE_TITLE = "端午裹青 · 粽俗拾趣";
  var KNOWLEDGE_CONTENT = [
    "<p><strong>为何端午裹青？</strong></p>",
    "<p>青色粽叶寓意生机，取“青”字谐音“清”，象征驱毒辟邪、洁净迎夏。将五谷裹入青叶，是对丰收与平安的祝愿。</p>",
    "<br>",
    "<p><strong>各地风俗差异</strong></p>",
    "<p>• 北方：黄米红枣甜粽，质朴敦厚</p>",
    "<p>• 江浙：鲜肉蛋黄咸粽，醇厚鲜美</p>",
    "<p>• 闽粤：碱水粽烧肉粽，独具风味</p>",
    "<p>• 客家：灰水粽艾叶粽，草木清香</p>",
    "<p>• 西南：竹筒粽草木灰粽，山野之趣</p>"
  ].join("");

  // 自动播放配置
  var AUTOPLAY_INTERVAL_MS = 5000;
  var KNOWLEDGE_DWELL_SEC = 3;   // 第 4 面板停留多久后展示知识卡
  var COMPLETE_DELAY_SEC = 3;    // 知识卡展示后多久标记完成

  // ---------------- 各面板动态元素构建 ----------------
  // 这些函数以 scene 为 this，会被 initPanels 在创建面板时调用一次。
  // 主要做两件事：把静态 GSAP 动效挂上；把需要每帧更新的数据塞进 scene.state。
  function buildPanel1Ripples(layer, viewport) {
    // 备料只做桌面材料的轻微呼吸：水盆涟漪、箬叶压影和少量米粒高光。
    var scene = this;
    var cx = viewport.width * 0.47;
    var cy = viewport.height * 0.61;
    var ringCount = 2;
    for (var i = 0; i < ringCount; i++) {
      (function (idx) {
        var ring = new PIXI.Graphics();
        ring.lineStyle(1, 0xd8ded1, 0.42);
        ring.drawEllipse(0, 0, 32, 12);
        ring.position.set(cx, cy);
        layer.addChild(ring);
        var period = 5.6;
        var delay = idx * (period / ringCount);
        var scaleTween = global.gsap.fromTo(ring.scale,
          { x: 0.45, y: 0.45 },
          { x: 2.6, y: 2.6, duration: period, delay: delay, repeat: -1, ease: "sine.out" }
        );
        var alphaTween = global.gsap.fromTo(ring,
          { alpha: 0.38 },
          { alpha: 0, duration: period, delay: delay, repeat: -1, ease: "sine.out" }
        );
        scene.cleanups.push(function () { scaleTween.kill(); alphaTween.kill(); });
      }(i));
    }

    var leafShadow = new PIXI.Graphics();
    leafShadow.beginFill(0x5f7448, 0.12);
    leafShadow.drawEllipse(0, 0, viewport.width * 0.12, viewport.height * 0.025);
    leafShadow.endFill();
    leafShadow.position.set(viewport.width * 0.51, viewport.height * 0.68);
    leafShadow.rotation = -0.08;
    layer.addChild(leafShadow);
    var shadowTween = global.gsap.to(leafShadow, {
      alpha: 0.2,
      duration: 3.4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
    scene.cleanups.push(function () { shadowTween.kill(); });

    for (var g = 0; g < 5; g++) {
      var grain = new PIXI.Graphics();
      grain.beginFill(0xf1e8d2, 0.44);
      grain.drawEllipse(0, 0, 2.2, 1.1);
      grain.endFill();
      grain.position.set(
        viewport.width * (0.42 + g * 0.035),
        viewport.height * (0.66 + (g % 2) * 0.025)
      );
      grain.rotation = -0.2 + g * 0.11;
      layer.addChild(grain);
      var grainTween = global.gsap.to(grain, {
        alpha: 0.15,
        duration: 2.2 + g * 0.18,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        delay: g * 0.26
      });
      scene.cleanups.push((function (t) { return function () { t.kill(); }; }(grainTween)));
    }
  }

  function buildPanel2Threads(layer, viewport) {
    // 裹粽不再使用绕中心飞行的粒子，改为青线弧、叶片压合和手作阴影。
    var scene = this;
    var cx = viewport.width * 0.52;
    var cy = viewport.height * 0.56;

    var leafBreath = new PIXI.Graphics();
    leafBreath.beginFill(0x5f7448, 0.1);
    leafBreath.drawEllipse(0, 0, viewport.width * 0.15, viewport.height * 0.045);
    leafBreath.endFill();
    leafBreath.position.set(cx, cy + viewport.height * 0.08);
    leafBreath.rotation = 0.06;
    layer.addChild(leafBreath);
    var leafTween = global.gsap.to(leafBreath, {
      alpha: 0.18,
      rotation: -0.025,
      duration: 3.2,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
    scene.cleanups.push(function () { leafTween.kill(); });

    var threadLines = [];
    for (var i = 0; i < 3; i++) {
      var line = new PIXI.Graphics();
      line.lineStyle(2 - i * 0.25, i === 1 ? 0xc8a45d : 0xe8d39d, 0.28);
      line.moveTo(-viewport.width * (0.08 + i * 0.01), viewport.height * (0.025 - i * 0.006));
      line.bezierCurveTo(
        -viewport.width * 0.025,
        -viewport.height * (0.035 + i * 0.002),
        viewport.width * 0.04,
        -viewport.height * (0.022 - i * 0.004),
        viewport.width * (0.09 + i * 0.008),
        viewport.height * (0.018 + i * 0.004)
      );
      line.position.set(cx, cy + i * 10);
      line.rotation = -0.22 + i * 0.18;
      layer.addChild(line);
      threadLines.push({
        sprite: line,
        baseAlpha: 0.22 + i * 0.08,
        baseRotation: line.rotation,
        phase: i * 0.72
      });
    }

    var tuckShadow = new PIXI.Graphics();
    tuckShadow.beginFill(0x101c1b, 0.1);
    tuckShadow.drawEllipse(0, 0, viewport.width * 0.11, viewport.height * 0.018);
    tuckShadow.endFill();
    tuckShadow.position.set(cx + viewport.width * 0.015, cy + viewport.height * 0.12);
    layer.addChild(tuckShadow);

    scene.state.wrapDynamics = scene.state.wrapDynamics || {};
    scene.state.wrapDynamics.panel2 = {
      threadLines: threadLines,
      tuckShadow: tuckShadow,
      t: 0
    };
  }

  function buildPanel3Steam(layer, viewport) {
    // 蒸煮使用柔软蒸汽线和锅口暖光，避免散点漂浮。
    var scene = this;
    var cx = viewport.width * 0.5;
    var stoveY = viewport.height * 0.68;

    var warm = new PIXI.Graphics();
    warm.beginFill(0xd9a65a, 0.16);
    warm.drawEllipse(0, 0, viewport.width * 0.18, viewport.height * 0.055);
    warm.endFill();
    warm.position.set(cx, stoveY + viewport.height * 0.075);
    warm.blendMode = PIXI.BLEND_MODES.ADD;
    layer.addChild(warm);
    var warmTween = global.gsap.to(warm, {
      alpha: 0.28,
      duration: 2.4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
    scene.cleanups.push(function () { warmTween.kill(); });

    var steamLines = [];
    for (var s = 0; s < 6; s++) {
      var steam = new PIXI.Graphics();
      steam.lineStyle(2, 0xf4ecd8, 0.26);
      steam.moveTo(0, 42);
      steam.bezierCurveTo(-18, 12, 18, -12, 2, -48);
      steam.position.set(cx + (s - 2.5) * viewport.width * 0.028, stoveY);
      steam.scale.set(0.82 + s * 0.04);
      layer.addChild(steam);
      steamLines.push({
        sprite: steam,
        baseX: steam.x,
        baseY: steam.y,
        phase: s * 0.55,
        speed: 0.45 + s * 0.035
      });
    }
    scene.state.wrapDynamics = scene.state.wrapDynamics || {};
    scene.state.wrapDynamics.panel3 = { steamLines: steamLines, t: 0 };
  }

  function buildPanel4Glow(layer, viewport) {
    // 分食面板只保留窗外暖光和桌面米香，不铺满金色粒子。
    var scene = this;
    var cx = viewport.width * 0.5;
    var cy = viewport.height * 0.5;

    var glow = new PIXI.Graphics();
    glow.beginFill(0xffd28a, 1);
    glow.drawCircle(0, 0, viewport.width * 0.46);
    glow.endFill();
    glow.position.set(cx, cy);
    glow.alpha = 0.05;
    glow.blendMode = PIXI.BLEND_MODES.ADD;
    layer.addChild(glow);
    var glowTween = global.gsap.to(glow, {
      alpha: 0.15,
      duration: 2.6,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
    scene.cleanups.push(function () { glowTween.kill(); });

    var tableSheen = new PIXI.Graphics();
    tableSheen.beginFill(0xf1e8d2, 0.11);
    tableSheen.drawEllipse(0, 0, viewport.width * 0.18, viewport.height * 0.036);
    tableSheen.endFill();
    tableSheen.position.set(viewport.width * 0.49, viewport.height * 0.68);
    tableSheen.rotation = -0.12;
    tableSheen.blendMode = PIXI.BLEND_MODES.ADD;
    layer.addChild(tableSheen);
    var sheenTween = global.gsap.to(tableSheen, {
      alpha: 0.22,
      duration: 3,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
    scene.cleanups.push(function () { sheenTween.kill(); });

    for (var i = 0; i < 4; i++) {
      var scent = new PIXI.Graphics();
      scent.lineStyle(1.4, 0xf1e8d2, 0.18);
      scent.moveTo(0, 18);
      scent.bezierCurveTo(-10, 4, 9, -10, 0, -24);
      scent.position.set(viewport.width * (0.43 + i * 0.045), viewport.height * (0.61 + (i % 2) * 0.025));
      layer.addChild(scent);
      var scentTween = global.gsap.to(scent, {
        alpha: 0.04,
        y: scent.y - 18,
        duration: 2.8 + i * 0.25,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        delay: i * 0.22
      });
      scene.cleanups.push((function (t) { return function () { t.kill(); }; }(scentTween)));
    }
  }

  // ---------------- 注入到 MVPScene 原型 ----------------
  // 注：scene-manager 始终实例化 NS.MVPScene，并通过 meta.id ("wrap")
  // 分发到 buildWrap，所以这里继续走 monkey-patch 模式与现有架构对齐；
  // 同时按任务约束在文件末尾暴露 NS.WrapScene 类。

  // 入场：搭建 4 面板 + 顺序播放 + 第 4 面板触达探测
  NS.MVPScene.prototype.buildWrap = function (viewport) {
    var scene = this;
    this.state.wrap = {
      knowledgeShown: false,
      finishScheduled: false
    };

    // 隐藏 hint，文案交给 panel-caption
    if (this.app && this.app.dom && this.app.dom.hideHint) {
      this.app.dom.hideHint();
    }

    // 创建并启动顺序播放
    this.initPanels(WRAP_PANELS.slice());
    this.startAutoPlay(AUTOPLAY_INTERVAL_MS);

    // 包装 switchToPanel：每次切到第 4 面板（idx=3）即调度知识卡显示
    var origSwitch = this.switchToPanel.bind(this);
    this.switchToPanel = function (index, direction) {
      origSwitch(index, direction);
      if (index === 3) {
        scene.scheduleWrapKnowledge();
      }
    };

    // 极端情况下初始就在 panel 4，也触发一次
    if (this.currentPanelIndex === 3) {
      this.scheduleWrapKnowledge();
    }
  };

  // 第 4 面板停留 3 秒后展示知识卡，再 3 秒后标记完成
  NS.MVPScene.prototype.scheduleWrapKnowledge = function () {
    var scene = this;
    var st = this.state.wrap;
    if (!st || st.knowledgeShown) {
      return;
    }
    st.knowledgeShown = true;

    this.scheduleCall(KNOWLEDGE_DWELL_SEC, function () {
      if (scene.app && scene.app.dom && scene.app.dom.showKnowledgeCard) {
        scene.app.dom.showKnowledgeCard(KNOWLEDGE_TITLE, KNOWLEDGE_CONTENT);
      }
      scene.scheduleCall(COMPLETE_DELAY_SEC, function () {
        if (scene.completed || scene.state.wrap.finishScheduled) {
          return;
        }
        scene.state.wrap.finishScheduled = true;
        scene.finish(true);
        if (scene.app && scene.app.dom && scene.app.dom.hideHint) {
          scene.app.dom.hideHint();
        }
      });
    });
  };

  // 兼容 base-scene 中 FINISH_HANDLERS.wrap 的旧调用：新版无需 PIXI 知识点
  NS.MVPScene.prototype.showWrapKnowledgeDot = function () {};

  // ---------------- 每帧粒子驱动：通过 ticker 实例级绑定 ----------------
  // 在 buildWrap 尾部挂载，避免原型级 monkey-patch 影响其他场景。
  var origBuildWrap = NS.MVPScene.prototype.buildWrap;
  NS.MVPScene.prototype.buildWrap = function (viewport) {
    var scene = this;
    origBuildWrap.call(this, viewport);

    this.scheduleCall(0.08, function () {
      if (scene.app && scene.app.dom && scene.app.dom.hideHint) {
        scene.app.dom.hideHint();
      }
    });

    var tickFn = function () { updateWrapDynamics(scene); };
    scene.app.pixiApp.ticker.add(tickFn);
    scene.cleanups.push(function () {
      scene.app.pixiApp.ticker.remove(tickFn);
      if (scene.state) scene.state.wrapDynamics = null;
    });
  };

  function updateWrapDynamics(scene) {
    var dyn = scene.state && scene.state.wrapDynamics;
    if (!dyn) {
      return;
    }
    var deltaMS = scene.app.pixiApp.ticker.deltaMS || 16.67;
    var stepSec = deltaMS / 1000;
    if (stepSec > 0.1) { stepSec = 0.1; }

    // 面板 2：青线弧线轻摆，模拟手指收线，不再绕场飞行。
    var p2 = dyn.panel2;
    if (p2 && p2.threadLines) {
      p2.t += stepSec;
      var t2 = p2.t;
      for (var i = 0; i < p2.threadLines.length; i++) {
        var th = p2.threadLines[i];
        if (!th.sprite || th.sprite.destroyed) continue;
        var pulse = Math.sin(t2 * 1.8 + th.phase);
        th.sprite.alpha = th.baseAlpha + pulse * 0.08;
        th.sprite.rotation = th.baseRotation + pulse * 0.018;
        th.sprite.scale.x = 1 + pulse * 0.018;
      }
      if (p2.tuckShadow && !p2.tuckShadow.destroyed) {
        p2.tuckShadow.alpha = 0.08 + Math.sin(t2 * 1.2) * 0.025;
      }
    }

    // 面板 3：蒸汽线缓慢上升和侧摆。
    var p3 = dyn.panel3;
    if (p3 && p3.steamLines) {
      p3.t += stepSec;
      var T = p3.t;
      for (var s = 0; s < p3.steamLines.length; s++) {
        var sp = p3.steamLines[s];
        if (!sp.sprite || sp.sprite.destroyed) continue;
        var wave = Math.sin(T * sp.speed + sp.phase);
        sp.sprite.x = sp.baseX + wave * 11;
        sp.sprite.y = sp.baseY - (Math.sin(T * 0.42 + sp.phase) + 1) * 8;
        sp.sprite.alpha = 0.16 + (1 - Math.abs(wave)) * 0.16;
        sp.sprite.scale.y = 0.95 + (Math.sin(T * 0.55 + sp.phase) + 1) * 0.12;
      }
    }
  }

  // ---------------- 暴露 NS.WrapScene 类（继承自 MVPScene） ----------------
  // scene-manager 当前仍构造 MVPScene；该类作为后续重构的接入点保留，
  // 同时让外部代码可以以 instanceof NS.WrapScene 判断本幕。
  function WrapScene(app, manager, meta, index) {
    NS.MVPScene.call(this, app, manager, meta, index);
  }
  WrapScene.prototype = Object.create(NS.MVPScene.prototype);
  WrapScene.prototype.constructor = WrapScene;
  NS.WrapScene = WrapScene;

}(window));
