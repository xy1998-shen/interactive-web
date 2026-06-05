/**
 * 第四幕「听鼓」场景搭建与节奏调度
 *
 * 设计：船尾第一人称视角 + 自动鼓声序列 + 多层视差。
 * 不再使用面板切换，画面以缓慢行进、纵摇和鼓点惯性营造龙舟前进感；
 * 鼓声自动播放，由慢到快，用户也可点击屏幕加入额外鼓击。
 *
 * 视差层（从后到前）：
 *   Layer 0: 主背景（drumBgFirstperson，1.3× 视口宽，慢速横移）
 *   Layer 1: 雾气/光晕程序图层
 *   Layer 2: 中景水波（程序绘制水痕条纹，中速横移）
 *   Layer 3: 鼓击波纹/水花粒子层
 *   Layer 4: 字粒反馈
 *
 * 依赖：pixi.js、gsap、ChuJiang.CONFIG.drum、drum-effects.js
 */
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};
  var CONFIG = NS.CONFIG.drum;
  var utils = NS.utils;

  // 自动鼓声序列设计参数
  var SEQUENCE = {
    totalBeats: CONFIG.totalBeats || 6,
    startInterval: 820,    // BPM 73
    endInterval: 560,      // BPM 107
    leadInDelay: 1.1,      // 入场文字停留后再开始
    finalSilence: 1.15     // 最后一击后等待时间
  };

  // 提示文案随击数推进
  var HINT_BY_BEAT = [
    { beat: 0,  text: "远鼓自江上" },
    { beat: 2,  text: "舟随鼓行" },
    { beat: 4,  text: "众桨同频" },
    { beat: 6,  text: "鼓声已渡" }
  ];

  var DRUM_KNOWLEDGE_TITLE = "听鼓竞渡 · 舟鼓同频";
  var DRUM_KNOWLEDGE_CONTENT = [
    "<p><strong>为何龙舟以鼓为令？</strong></p>",
    "<p>竞渡时鼓点统一节奏，鼓手居前发令，桨手随声入水，整舟才能同频向前。</p>",
    "<br>",
    "<p><strong>端午竞渡的含义</strong></p>",
    "<p>龙舟竞渡承接江上追思，也把乡人合力、祈愿安康的节令情感，化成可听见的鼓声与水痕。</p>"
  ].join("");

  // ═══════════════════════════════════════════════
  // 入口：构建视差舞台
  // ═══════════════════════════════════════════════

  NS.MVPScene.prototype.buildDrum = function (viewport) {
    var scene = this;

    // --- 纯色底色（防止PNG透明区域露出棋盘格）---
    var solidBg = new PIXI.Graphics();
    solidBg.beginFill(0x1a3a3a); // 深青绿色，江面底色
    solidBg.drawRect(-200, -200, viewport.width + 400, viewport.height + 400);
    solidBg.endFill();
    // 再叠一层上深下浅的渐变感
    var gradTop = new PIXI.Graphics();
    gradTop.beginFill(0x2a4a52, 0.6);
    gradTop.drawRect(-200, 0, viewport.width + 400, viewport.height * 0.4);
    gradTop.endFill();
    var gradBot = new PIXI.Graphics();
    gradBot.beginFill(0x0d1a18, 0.5);
    gradBot.drawRect(-200, viewport.height * 0.65, viewport.width + 400, viewport.height * 0.35);
    gradBot.endFill();
    this.container.addChildAt(solidBg, 0);
    this.container.addChildAt(gradTop, 1);
    this.container.addChildAt(gradBot, 2);

    // --- 替换基类背景为第一人称素材 ---
    var firstPersonTex = this.app.assets.get("drumBgFirstperson");
    if (firstPersonTex) {
      this.background.texture = firstPersonTex;
      this.fitDrumBackground(viewport);
    }

    // --- 弱化基类 overlay（不要把第一人称背景压成灰白）---
    if (this.overlay) {
      this.overlay.clear();
      this.overlay.beginFill(0x0d1a18, 0.12);
      this.overlay.drawRect(0, viewport.height * 0.78, viewport.width, viewport.height * 0.22);
      this.overlay.endFill();
    }

    // --- 创建图层（从后到前） ---
    var mistLayer    = new PIXI.Container(); // 远雾光晕
    var midLayer     = new PIXI.Container(); // 中景水波条纹
    var ringLayer    = new PIXI.Container(); // 鼓波扩散
    var splashLayer  = new PIXI.Container(); // 水花粒子
    var wordLayer    = new PIXI.Container(); // 文字字粒
    this.content.addChild(mistLayer);
    this.content.addChild(midLayer);
    this.content.addChild(ringLayer);
    this.content.addChild(splashLayer);
    this.content.addChild(wordLayer);

    // 雾气光晕（中段层叠的米白渐隐条带，做出空气透视）
    mistLayer.addChild(NS.DrumEffects.createMistOverlay(viewport));

    // 中景水波（程序绘制的水痕条纹，独立横移）
    var midRipples = NS.DrumEffects.createMidRipples(viewport, this.app.pixiApp.renderer);
    midLayer.addChild(midRipples.container);

    // --- 状态记录 ---
    this.state.drum = {
      // 节奏
      beats: 0,
      totalBeats: SEQUENCE.totalBeats,
      completing: false,
      timers: [],
      // 视差驱动
      time: 0,
      bgBaseX: 0,
      bgBaseY: 0,
      bgBaseScaleX: 1,
      bgBaseScaleY: 1,
      bgCenterX: viewport.width * 0.5,
      bgCenterY: viewport.height * 0.5,
      scrollAccum: 0,
      motionPhase: Math.random() * Math.PI * 2,
      surgeZoom: 0,
      bobImpulse: 0,
      sideImpulse: 0,
      // 中景水波
      midRipples: midRipples,
      // 图层
      mistLayer: mistLayer,
      midLayer: midLayer,
      ringLayer: ringLayer,
      splashLayer: splashLayer,
      wordLayer: wordLayer,
      // 音频
      audioContext: null,
      // 完成态
      knowledgeDot: null
    };
    this.captureDrumBackgroundBase(viewport);

    // --- 入场文字 + 自动鼓序列 ---
    this.createDrumEntryText(viewport);
    this.scheduleDrumSequence(viewport);

    // --- 用户轻触：只给水面回声，不额外增加鼓声次数 ---
    this.background.eventMode = "static";
    this.background.cursor = "pointer";
    this.background.on("pointertap", function () {
      var state = scene.state.drum;
      if (!state || state.completing || scene.completed) return;
      var point = scene.getDrumBeatWaterPoint(viewport, state.beats + 1, 0.006);
      NS.DrumEffects.createWaterBeatBurst(
        state.ringLayer,
        point.x,
        point.y + viewport.height * 0.028,
        CONFIG.ringMaxRadius * 0.55,
        0.42,
        CONFIG
      );
    });

    // --- 每帧更新视差 ---
    var tickFn = function () { scene.updateDrumParallax(); };
    this.app.pixiApp.ticker.add(tickFn);
    this.cleanups.push(function () {
      scene.app.pixiApp.ticker.remove(tickFn);
    });
  };

  NS.MVPScene.prototype.fitDrumBackground = function (viewport) {
    var texture = this.background && this.background.texture;
    if (!texture) return;
    utils.fitCover(this.background, texture, viewport.width, viewport.height);
    // 16:9 素材在 16:9 视口几乎没有垂直余量；额外过扫给纵摇和鼓点惯性留出边界。
    this.background.scale.x *= 1.08;
    this.background.scale.y *= 1.08;
    this.background.x = (viewport.width - this.background.width) * 0.5;
    this.background.y = (viewport.height - this.background.height) * 0.5;
  };

  NS.MVPScene.prototype.captureDrumBackgroundBase = function (viewport) {
    var state = this.state && this.state.drum;
    if (!state || !this.background) return;
    state.bgBaseX = this.background.x;
    state.bgBaseY = this.background.y;
    state.bgBaseScaleX = this.background.scale.x;
    state.bgBaseScaleY = this.background.scale.y;
    state.bgCenterX = viewport.width * 0.5;
    state.bgCenterY = viewport.height * 0.5;
  };

  NS.MVPScene.prototype.updateDrumLayout = function (viewport) {
    this.fitDrumBackground(viewport);
    this.captureDrumBackgroundBase(viewport);
  };

  // ═══════════════════════════════════════════════
  // 入场文案
  // ═══════════════════════════════════════════════

  NS.MVPScene.prototype.createDrumEntryText = function (viewport) {
    var label = this.createText("远鼓入江，舟影渐明", CONFIG.entryTextFontSize, 0xf4ecd8, 0);
    label.anchor.set(0.5);
    label.position.set(viewport.width * 0.5, viewport.height * CONFIG.entryTextY);
    label.style.stroke = 0x16343a;
    label.style.strokeThickness = 3;
    label.style.dropShadow = true;
    label.style.dropShadowColor = "#0d1a18";
    label.style.dropShadowBlur = 8;
    label.style.dropShadowAlpha = 0.55;
    label.style.dropShadowDistance = 0;
    this.content.addChild(label);

    global.gsap.to(label, {
      alpha: 0.92,
      y: label.y - 6,
      duration: 0.7,
      ease: "power2.out",
      yoyo: true,
      repeat: 1,
      repeatDelay: 1.4,
      onComplete: function () {
        if (!label.destroyed) label.destroy();
      }
    });
  };

  // ═══════════════════════════════════════════════
  // 自动鼓序列：BPM 70 → 130，缓加速
  // ═══════════════════════════════════════════════

  NS.MVPScene.prototype.scheduleDrumSequence = function (viewport) {
    var scene = this;
    var state = this.state.drum;
    var n = SEQUENCE.totalBeats;
    var delaySec = SEQUENCE.leadInDelay;

    for (var i = 0; i < n; i++) {
      var ratio = n === 1 ? 0 : i / (n - 1);
      // 二次缓动 → 早期慢、后期更急
      var eased = ratio * ratio;
      var interval = SEQUENCE.startInterval - (SEQUENCE.startInterval - SEQUENCE.endInterval) * eased;
      var isFinal = (i === n - 1);

      (function (atDelay, finalBeat, beatIndex) {
        var call = global.gsap.delayedCall(atDelay, function () {
          if (scene.completed) return;
          scene.triggerDrumPulse(viewport, finalBeat, false);
          scene.updateBeatHint(beatIndex);
        });
        state.timers.push(call);
        scene.cleanups.push(function () { call.kill(); });
      })(delaySec, isFinal, i + 1);

      // 鼓击之间随机划水声（增强沉浸）
      if (!isFinal && i > 0 && Math.random() < 0.55) {
        (function (atDelay) {
          var swish = global.gsap.delayedCall(atDelay, function () {
            if (scene.completed) return;
            NS.DrumEffects.playPaddleNoise(scene);
          });
          state.timers.push(swish);
          scene.cleanups.push(function () { swish.kill(); });
        })(delaySec + (interval / 1000) * 0.55);
      }

      delaySec += interval / 1000;
    }

    // 最后一击之后延迟，进入完成态
    var endCall = global.gsap.delayedCall(delaySec + SEQUENCE.finalSilence, function () {
      if (scene.completed) return;
      scene.completeDrum(viewport);
    });
    state.timers.push(endCall);
    this.cleanups.push(function () { endCall.kill(); });
  };

  NS.MVPScene.prototype.updateBeatHint = function (beat) {
    var hint = null;
    for (var i = HINT_BY_BEAT.length - 1; i >= 0; i--) {
      if (beat >= HINT_BY_BEAT[i].beat) {
        hint = HINT_BY_BEAT[i].text;
        break;
      }
    }
    if (hint) this.setHint(hint);
  };

  NS.MVPScene.prototype.getDrumBeatWaterPoint = function (viewport, beat, jitterRatio) {
    var leftWater = [
      { x: 0.17, y: 0.56 },
      { x: 0.23, y: 0.61 },
      { x: 0.28, y: 0.66 }
    ];
    var rightWater = [
      { x: 0.72, y: 0.57 },
      { x: 0.80, y: 0.62 },
      { x: 0.88, y: 0.67 }
    ];
    var lane = beat % 2 === 0 ? rightWater : leftWater;
    var slot = lane[Math.floor((beat - 1) / 2) % lane.length];
    var jitter = jitterRatio == null ? 0.018 : jitterRatio;
    return {
      x: viewport.width * (slot.x + (Math.random() - 0.5) * jitter),
      y: viewport.height * (slot.y + (Math.random() - 0.5) * jitter)
    };
  };

  // ═══════════════════════════════════════════════
  // 单击鼓击：音频 + 视觉反馈 + 视差冲刺
  // ═══════════════════════════════════════════════

  /**
   * @param {object} viewport
   * @param {boolean} isFinal - 是否为序列最终一击
   * @param {boolean} isUserExtra - 用户加击：略弱、音色稍亮
   */
  NS.MVPScene.prototype.triggerDrumPulse = function (viewport, isFinal, isUserExtra) {
    var state = this.state.drum;
    if (!state) return;

    if (!isUserExtra) state.beats++;

    // 音频
    NS.DrumEffects.playDrumHit(this, isFinal, isUserExtra);

    // 鼓点水花跟随字粒落在左右江面，不落在船身中线。
    var wordPoint = this.getDrumBeatWaterPoint(viewport, state.beats || 1, 0.012);
    state.activeBeatWaterPoint = {
      beat: state.beats,
      x: wordPoint.x,
      y: wordPoint.y
    };
    var burstX = wordPoint.x;
    var burstY = wordPoint.y + viewport.height * 0.03;
    var burstRadius = isFinal
      ? CONFIG.ringMaxRadius * 1.85
      : (isUserExtra ? CONFIG.ringMaxRadius * 0.85 : CONFIG.ringMaxRadius * 1.1);
    var intensity = isFinal ? 1.6 : (isUserExtra ? 0.9 : 1.1);
    NS.DrumEffects.createWaterBeatBurst(state.ringLayer, burstX, burstY, burstRadius, intensity, CONFIG);

    // 画面前冲：用轻微缩放和纵向惯性替代整张图硬平移，避免机械抖动。
    var zoomKick = isFinal ? 0.018 : (isUserExtra ? 0.004 : 0.008);
    var bobKick = isFinal ? 10 : (isUserExtra ? 2.5 : 4.5);
    var sideKick = (Math.random() - 0.5) * (isFinal ? 5 : 2.2);
    state.surgeZoom = Math.min(0.026, state.surgeZoom + zoomKick);
    state.bobImpulse += bobKick;
    state.sideImpulse += sideKick;
    global.gsap.killTweensOf(state, "surgeZoom,bobImpulse,sideImpulse");
    global.gsap.to(state, {
      surgeZoom: 0,
      bobImpulse: 0,
      sideImpulse: 0,
      duration: isFinal ? 1.15 : 0.82,
      ease: "sine.out"
    });

    // 两侧水花粒子
    var splashCount = isFinal ? 16 : (isUserExtra ? 4 : 7);
    for (var i = 0; i < splashCount; i++) {
      NS.DrumEffects.createWaterSplash(
        state.splashLayer, viewport, i % 2 === 0 ? "left" : "right"
      );
    }

    // 字粒（仅自动序列触发，避免点击刷屏）
    if (!isUserExtra && CONFIG.beatWords && CONFIG.beatWords.length) {
      this.spawnDrumBeatWord(viewport, state.beats, isFinal);
    }

    // 终击额外白浪 + 提示
    if (isFinal) {
      NS.DrumEffects.createWaterBeatBurst(
        state.ringLayer, burstX, burstY,
        CONFIG.ringMaxRadius * 2.4, 1.2, CONFIG
      );
      this.setHint("鼓声已渡");
    }
  };

  NS.MVPScene.prototype.spawnDrumBeatWord = function (viewport, beat, isFinal) {
    var state = this.state.drum;
    var word = CONFIG.beatWords[(beat - 1) % CONFIG.beatWords.length];
    var fontSize = isFinal
      ? CONFIG.beatWordStableFontSize + 8
      : CONFIG.beatWordStableFontSize + 3;
    var label = this.createText(word, fontSize, 0xf4ecd8, 0);
    label.anchor.set(0.5);
    label.style.stroke = 0x16343a;
    label.style.strokeThickness = 3;
    label.style.dropShadow = true;
    label.style.dropShadowColor = "#f1e8d2";
    label.style.dropShadowBlur = 10;
    label.style.dropShadowAlpha = 0.36;
    label.style.dropShadowDistance = 0;

    var point = state.activeBeatWaterPoint && state.activeBeatWaterPoint.beat === beat
      ? state.activeBeatWaterPoint
      : this.getDrumBeatWaterPoint(viewport, beat, 0.018);
    var x = point.x;
    var y = point.y;
    this.spawnWaterGlyphRipple(state.wordLayer, x, y + fontSize * 0.42, isFinal ? 1.18 : 0.95, 0.16);
    label.position.set(x, y);
    label.rotation = (Math.random() - 0.5) * 0.08;
    state.wordLayer.addChild(label);

    global.gsap.to(label, { alpha: isFinal ? 0.9 : 0.78, duration: 0.22, ease: "sine.out" });
    global.gsap.to(label, {
      alpha: 0,
      y: y - 28,
      x: x + (beat % 2 === 0 ? -18 : 18) + (Math.random() - 0.5) * 8,
      duration: 1.42,
      delay: 0.2,
      ease: "sine.inOut",
      onComplete: function () {
        if (!label.destroyed) label.destroy();
      }
    });
  };

  // ═══════════════════════════════════════════════
  // 视差更新（每帧）
  // ═══════════════════════════════════════════════

  NS.MVPScene.prototype.updateDrumParallax = function () {
    var state = this.state && this.state.drum;
    if (!state || !this.background) return;

    var deltaMS = this.app.pixiApp.ticker.deltaMS || 16.67;
    if (deltaMS > 100) deltaMS = 16.67;
    state.time += deltaMS / 1000;

    // 加速度：随击数增加滚动速度（按实际帧时归一化到 60fps 基准）
    var beatBoost = Math.min(1.6, state.beats * 0.12);
    var scrollSpeed = (0.6 + beatBoost) * (deltaMS / 16.67);

    state.scrollAccum += scrollSpeed;
    var phase = state.motionPhase || 0;
    var naturalX = Math.sin(state.time * 0.37 + phase) * 1.8
      + Math.sin(state.time * 0.83 + phase * 0.7) * 0.9;
    var naturalY = Math.sin(state.time * 1.05 + phase * 0.4) * 1.5
      + Math.sin(state.time * 0.48 + phase) * 0.8;
    var forwardTravel = Math.min(this.viewportWidth * 0.02, state.scrollAccum * 0.024);
    var breathingZoom = Math.sin(state.time * 0.42 + phase) * 0.0012;
    var scaleBoost = state.surgeZoom + breathingZoom;
    var bgScaleX = state.bgBaseScaleX * (1 + scaleBoost);
    var bgScaleY = state.bgBaseScaleY * (1 + scaleBoost * 0.74);
    var texW = this.background.texture.width || (this.background.width / this.background.scale.x);
    var texH = this.background.texture.height || (this.background.height / this.background.scale.y);

    this.background.scale.set(bgScaleX, bgScaleY);
    this.background.x = state.bgCenterX - texW * bgScaleX * 0.5
      + naturalX + state.sideImpulse - forwardTravel;
    this.background.y = state.bgCenterY - texH * bgScaleY * 0.5
      + naturalY + state.bobImpulse + forwardTravel * 0.18;

    // Layer 2（中景水波）：水痕比船身更快，鼓点只给轻微惯性偏移。
    if (state.midRipples && state.midRipples.tile) {
      state.midRipples.tile.tilePosition.x -= scrollSpeed * 1.8;
      state.midRipples.container.x = (naturalX + state.sideImpulse) * 0.42;
      state.midRipples.container.y = (naturalY + state.bobImpulse) * 0.28;
    }

    // 雾气微缓飘
    if (state.mistLayer) {
      state.mistLayer.alpha = 0.85 + Math.sin(state.time * 0.6) * 0.08;
    }

  };

  // ═══════════════════════════════════════════════
  // 完成流程
  // ═══════════════════════════════════════════════

  NS.MVPScene.prototype.completeDrum = function (viewport) {
    var scene = this;
    var state = this.state.drum;
    if (!state || state.completing) return;
    state.completing = true;

    // 浮出尾声字粒
    this.spawnDrumWakeWords(viewport);
    // 进入完成态（DOM 显示完成文案与下一幕入口）
    this.scheduleCall(0.6, function () {
      scene.finish(true);
    });
  };

  /** 完成时浮现的关键字（江/艾/舟/鼓/风），引向下一幕。 */
  NS.MVPScene.prototype.spawnDrumWakeWords = function (viewport) {
    var state = this.state.drum;
    var words = CONFIG.wakeWords || ["江", "艾", "舟", "鼓", "风"];
    var waterSlots = [
      { x: 0.16, y: 0.58 },
      { x: 0.23, y: 0.67 },
      { x: 0.74, y: 0.57 },
      { x: 0.83, y: 0.50 },
      { x: 0.91, y: 0.54 }
    ];

    words.forEach(function (word, index) {
      var slot = waterSlots[index] || waterSlots[waterSlots.length - 1];
      var fontSize = Math.max(30, CONFIG.wakeWordFontSize + 4);
      var x = viewport.width * slot.x;
      var y = viewport.height * slot.y;
      this.spawnWaterGlyphRipple(state.wordLayer, x, y + fontSize * 0.46, 1.18, 0.22);
      var label = new PIXI.Text(word, {
        fontFamily: NS.FONT_STACKS.text,
        fontSize: fontSize,
        fill: 0xf4ecd8,
        stroke: 0x16343a,
        strokeThickness: 3,
        dropShadow: true,
        dropShadowColor: "#f1e8d2",
        dropShadowBlur: 10,
        dropShadowAlpha: 0.36,
        dropShadowDistance: 0
      });
      label.anchor.set(0.5);
      label.alpha = 0;
      label.position.set(x, y);
      label.rotation = (index - 2) * 0.025;
      state.wordLayer.addChild(label);

      global.gsap.to(label, {
        alpha: 0.88,
        y: label.y - 12,
        duration: 0.76,
        delay: 0.1 + index * 0.12,
        ease: "sine.out"
      });
    }, this);
  };

  NS.MVPScene.prototype.spawnWaterGlyphRipple = function (layer, x, y, scale, alpha) {
    var ripple = new PIXI.Graphics();
    ripple.lineStyle(1.5, 0xf4ecd8, alpha || 0.18);
    ripple.drawEllipse(0, 0, 28, 8);
    ripple.lineStyle(1, 0x9eaea3, (alpha || 0.18) * 0.72);
    ripple.drawEllipse(0, 1, 46, 13);
    ripple.position.set(x, y);
    ripple.alpha = 0;
    layer.addChild(ripple);
    global.gsap.to(ripple, { alpha: 1, duration: 0.24, ease: "sine.out" });
    global.gsap.to(ripple.scale, {
      x: scale || 1,
      y: (scale || 1) * 0.82,
      duration: 1.35,
      ease: "sine.out"
    });
    global.gsap.to(ripple, {
      alpha: 0,
      duration: 0.62,
      delay: 0.78,
      ease: "sine.in",
      onComplete: function () {
        if (!ripple.destroyed) ripple.destroy();
      }
    });
  };

  // ═══════════════════════════════════════════════
  // 完成后的轻知识卡片
  // ═══════════════════════════════════════════════

  NS.MVPScene.prototype.showDrumKnowledgeDot = function (animate) {
    var state = this.state.drum;
    if (state) {
      state.knowledgeDot = true;
    }
    this.revealDrumKnowledge(animate);
  };

  NS.MVPScene.prototype.revealDrumKnowledge = function (animate) {
    if (this.app && this.app.dom && this.app.dom.showKnowledgeCard) {
      var delay = animate === false ? 0 : 0.28;
      this.scheduleCall(delay, function () {
        this.app.dom.showKnowledgeCard(DRUM_KNOWLEDGE_TITLE, DRUM_KNOWLEDGE_CONTENT);
        if (this.app.dom.hideHint) {
          this.app.dom.hideHint();
        }
      }.bind(this));
      return;
    }
    var text = (this.knowledgeText && this.knowledgeText.text)
      ? this.knowledgeText.text
      : "龙舟竞渡以鼓为令，众桨同频向前。";
    this.showTimedKnowledgeText(text, 0.86, CONFIG.knowledgeVisibleDuration);
  };

}(window));
