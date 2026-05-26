/**
 * 第四幕「听鼓」场景搭建与交互逻辑
 *
 * 职责：场景初始化、鼓面/甲板/鼓槌绘制、击鼓交互判定、
 *       节奏检测、完成流程和轻知识展示。
 * 视觉效果由 drum-effects.js 提供。
 *
 * 设计意图：用户通过节奏点击鼓面推动龙舟前行，
 * 不显示分数/计数/连击，仅以画面层次变化反映进度。
 *
 * 依赖：pixi.js、gsap、ChuJiang.CONFIG.drum、drum-effects.js
 */
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};
  var CONFIG = NS.CONFIG.drum;

  // ═══════════════════════════════════════════════
  // 场景搭建
  // ═══════════════════════════════════════════════

  /**
   * 第四幕入口：创建所有图层、交互对象和初始状态。
   * 由 base-scene.js 的 buildScene 分发调用。
   */
  NS.MVPScene.prototype.buildDrum = function (viewport) {
    var scene = this;

    // --- 创建图层（从后到前）---
    var ringLayer = new PIXI.Container();       // 鼓波扩散
    var trailLayer = new PIXI.Container();      // 水痕
    var boatDeckLayer = new PIXI.Container();   // 甲板/船首
    var oarLayer = new PIXI.Container();        // 桨影 + 红绸
    var drumstickLayer = new PIXI.Container();  // 鼓槌
    var wordLayer = new PIXI.Container();       // 文字层

    this.content.addChild(ringLayer);
    this.content.addChild(trailLayer);
    this.content.addChild(boatDeckLayer);
    this.content.addChild(oarLayer);

    // --- 创建鼓面和命中区 ---
    var drum = this.createDrumForeground(viewport);
    var hitTarget = this.createDrumHitTarget(viewport);

    this.content.addChild(drumstickLayer);
    this.content.addChild(wordLayer);

    // --- 初始化场景状态 ---
    this.state.drum = {
      beats: 0,                        // 当前击鼓次数
      intervals: [],                   // 最近几次击鼓间隔（毫秒）
      lastBeatTime: 0,                 // 上一击时间戳
      completing: false,               // 完成动画播放中，锁定输入
      drum: drum,                      // 鼓面精灵
      hitTarget: hitTarget,            // 隐形命中区
      drumstickLayer: drumstickLayer,
      drumsticks: [],                  // 程序绘制鼓槌引用
      drumstickSprite: null,           // 精灵图鼓槌引用
      boatDeckLayer: boatDeckLayer,
      ringLayer: ringLayer,
      trailLayer: trailLayer,
      oarLayer: oarLayer,
      wordLayer: wordLayer,
      knowledgeDot: null,
      audioContext: null,
      // 记录初始变换值，动画始终基于这些值计算，防止漂移
      bgBaseScaleX: this.background.scale.x,
      bgBaseScaleY: this.background.scale.y,
      bgBaseY: this.background.y,
      drumBaseY: drum.y,
      drumBaseScaleX: drum.scale.x,
      drumBaseScaleY: drum.scale.y
    };

    // --- 补充视觉元素 ---
    if (drum._usesGeneratedDeck) {
      this.drawFirstPersonBoat(viewport);
    }
    this.drawDrumsticks(viewport);
    this.createDrumEntryText(viewport);

    // --- 绑定交互 ---
    hitTarget.on("pointertap", function () {
      if (scene.completed) return;
      scene.hitDrum(viewport);
    });
  };

  // ═══════════════════════════════════════════════
  // 鼓面与命中区创建
  // ═══════════════════════════════════════════════

  /**
   * 创建鼓面前景精灵。
   * 优先使用船首素材（drumBoatBow），缺失时降级为独立鼓面。
   * _usesGeneratedDeck 标记决定是否需要程序绘制甲板。
   */
  NS.MVPScene.prototype.createDrumForeground = function (viewport) {
    var sprite;
    if (this.app.assets.get("drumBoatBow")) {
      sprite = this.createSprite(
        "drumBoatBow",
        CONFIG.bowSpriteWidthRatio,
        CONFIG.bowSpriteX,
        CONFIG.bowSpriteY,
        viewport
      );
      sprite.alpha = 0.96;
      sprite._usesGeneratedDeck = false;
      return sprite;
    }
    // 降级：使用独立鼓面素材 + 程序绘制甲板
    sprite = this.createSprite("drum", CONFIG.drumWidthRatio, CONFIG.drumX, CONFIG.drumY, viewport);
    sprite._usesGeneratedDeck = true;
    return sprite;
  };

  /**
   * 创建透明圆形命中区，半径大于视觉鼓面以保证易用性。
   * 参见设计文档：命中范围应大于视觉鼓面。
   */
  NS.MVPScene.prototype.createDrumHitTarget = function (viewport) {
    var hitTarget = new PIXI.Graphics();
    hitTarget.beginFill(0xffffff, 0.001);
    hitTarget.drawCircle(0, 0, viewport.width * CONFIG.hitRadiusRatio);
    hitTarget.endFill();
    hitTarget.position.set(viewport.width * CONFIG.drumX, viewport.height * CONFIG.drumY);
    hitTarget.eventMode = "static";
    hitTarget.cursor = "pointer";
    this.content.addChild(hitTarget);
    return hitTarget;
  };

  // ═══════════════════════════════════════════════
  // 入场文案
  // ═══════════════════════════════════════════════

  /** 入场短句"远鼓入江，舟影渐明"淡入后自动消失。 */
  NS.MVPScene.prototype.createDrumEntryText = function (viewport) {
    var label = this.createText(
      "远鼓入江，舟影渐明",
      CONFIG.entryTextFontSize,
      0xe8e1d2,
      0
    );
    label.anchor.set(0.5);
    label.position.set(viewport.width * 0.5, viewport.height * CONFIG.entryTextY);
    this.content.addChild(label);

    global.gsap.to(label, {
      alpha: 0.82,
      y: label.y - 8,
      duration: CONFIG.entryTextDuration,
      ease: "power2.out",
      yoyo: true,
      repeat: 1,
      repeatDelay: 0.4,
      onComplete: function () {
        if (!label.destroyed) label.destroy();
      }
    });
  };

  // ═══════════════════════════════════════════════
  // 文本工厂
  // ═══════════════════════════════════════════════

  /**
   * 创建带描边和阴影的场景内文字，用于鼓波字粒和完成态字粒。
   * 与 base-scene 的 createText 区别：增加描边确保在复杂背景上可读。
   */
  NS.MVPScene.prototype.makeDrumText = function (text, fontSize) {
    var label = this.createText(text, fontSize, CONFIG.textColor, 0);
    label.style.stroke = CONFIG.textStrokeColor;
    label.style.strokeThickness = Math.max(3, Math.round(fontSize * 0.18));
    label.style.dropShadow = true;
    label.style.dropShadowColor = "#f1e8d2";
    label.style.dropShadowBlur = 8;
    label.style.dropShadowAlpha = 0.5;
    label.style.dropShadowDistance = 0;
    return label;
  };

  // ═══════════════════════════════════════════════
  // 鼓槌绘制
  // ═══════════════════════════════════════════════

  /** 鼓槌渲染入口：有素材用素材，否则程序绘制。 */
  NS.MVPScene.prototype.drawDrumsticks = function (viewport) {
    if (this.app.assets.get("drumsticks")) {
      this.drawDrumstickSprite(viewport);
      return;
    }
    this.drawFallbackDrumsticks(viewport);
  };

  /** 使用 drumsticks 精灵图绘制鼓槌。 */
  NS.MVPScene.prototype.drawDrumstickSprite = function (viewport) {
    var state = this.state.drum;
    var sprite = this.createSprite(
      "drumsticks",
      CONFIG.drumsticksWidthRatio,
      CONFIG.drumsticksX,
      CONFIG.drumsticksY,
      viewport
    );
    sprite.alpha = 0.9;
    // 保存基准位置，动画始终从这里出发
    sprite._baseX = sprite.x;
    sprite._baseY = sprite.y;
    sprite._baseRotation = sprite.rotation;
    sprite._baseScaleX = sprite.scale.x;
    sprite._baseScaleY = sprite.scale.y;
    state.drumstickLayer.addChild(sprite);
    state.drumstickSprite = sprite;
  };

  /** 降级模式：程序绘制两根对称鼓槌。 */
  NS.MVPScene.prototype.drawFallbackDrumsticks = function (viewport) {
    var state = this.state.drum;
    var centerX = viewport.width * CONFIG.drumX;
    var centerY = viewport.height * CONFIG.drumY;
    var specs = [
      { x: centerX - viewport.width * 0.085, y: centerY - viewport.height * 0.055, rotation: -0.72, side: -1 },
      { x: centerX + viewport.width * 0.085, y: centerY - viewport.height * 0.055, rotation: 0.72, side: 1 }
    ];

    specs.forEach(function (spec) {
      var stick = new PIXI.Container();
      var shaft = new PIXI.Graphics();
      var tip = new PIXI.Graphics();

      // 杆身
      shaft.lineStyle(8, CONFIG.drumstickColor, CONFIG.drumstickAlpha);
      shaft.moveTo(0, 0);
      shaft.lineTo(0, -viewport.height * 0.18);
      // 槌头
      tip.beginFill(CONFIG.drumstickTipColor, 0.86);
      tip.drawCircle(0, -viewport.height * 0.19, 10);
      tip.endFill();

      stick.addChild(shaft);
      stick.addChild(tip);
      stick.position.set(spec.x, spec.y);
      stick.rotation = spec.rotation;
      stick.alpha = 0.88;
      stick._baseX = spec.x;
      stick._baseY = spec.y;
      stick._baseRotation = spec.rotation;
      stick._side = spec.side;

      state.drumstickLayer.addChild(stick);
      state.drumsticks.push(stick);
    });
  };

  // ═══════════════════════════════════════════════
  // 程序绘制甲板（降级模式）
  // ═══════════════════════════════════════════════

  /**
   * 当缺少船首素材时，程序绘制第一视角龙舟甲板。
   * 使用深墨绿 + 青铜金线表现船体纹理。
   */
  NS.MVPScene.prototype.drawFirstPersonBoat = function (viewport) {
    var state = this.state.drum;
    var deck = state.boatDeckLayer;
    var centerX = viewport.width * 0.5;
    var bottomY = viewport.height * 1.03;
    var bowY = viewport.height * 0.6;
    var leftX = viewport.width * 0.29;
    var rightX = viewport.width * 0.71;
    var bowTipX = centerX;
    var bowTipY = viewport.height * 0.42;

    var hull = new PIXI.Graphics();

    // 船体轮廓
    hull.beginFill(CONFIG.bowColor, CONFIG.bowAlpha);
    hull.lineStyle(1.5, CONFIG.bowLineColor, 0.22);
    hull.moveTo(leftX, bottomY);
    hull.lineTo(centerX - viewport.width * 0.07, bowY);
    hull.lineTo(bowTipX, bowTipY);
    hull.lineTo(centerX + viewport.width * 0.07, bowY);
    hull.lineTo(rightX, bottomY);
    hull.closePath();
    hull.endFill();

    // 龙骨线
    hull.lineStyle(2, CONFIG.bowLineColor, 0.24);
    hull.moveTo(centerX - viewport.width * 0.08, bottomY);
    hull.lineTo(bowTipX, bowTipY);
    hull.moveTo(centerX + viewport.width * 0.08, bottomY);
    hull.lineTo(bowTipX, bowTipY);

    // 横向肋条
    hull.lineStyle(1, 0xe8e1d2, 0.16);
    hull.moveTo(centerX - viewport.width * 0.18, viewport.height * 0.84);
    hull.lineTo(centerX + viewport.width * 0.18, viewport.height * 0.84);
    hull.moveTo(centerX - viewport.width * 0.12, viewport.height * 0.72);
    hull.lineTo(centerX + viewport.width * 0.12, viewport.height * 0.72);

    deck.addChild(hull);
  };

  // ═══════════════════════════════════════════════
  // 核心交互：击鼓
  // ═══════════════════════════════════════════════

  /**
   * 每次点击鼓面时执行的主逻辑。
   * 职责：记录时间、判定节奏、触发视觉/音频反馈、推进进度。
   */
  NS.MVPScene.prototype.hitDrum = function (viewport) {
    var state = this.state.drum;
    if (state.completing) {
      return;
    }

    // --- 记录击鼓间隔 ---
    var now = performance.now();
    var interval = state.lastBeatTime > 0 ? now - state.lastBeatTime : 0;
    if (interval > 0) {
      state.intervals.push(interval);
      // 只保留最近 N-1 个间隔用于节奏判定
      if (state.intervals.length > CONFIG.stableBeatCount - 1) {
        state.intervals.shift();
      }
    }
    state.lastBeatTime = now;
    state.beats++;

    // --- 节奏与进度计算 ---
    var stableRhythm = this.isDrumRhythmStable(state);
    var progress = Math.min(1, state.beats / CONFIG.totalBeats);
    var ringRadius = CONFIG.ringMaxRadius * (stableRhythm ? CONFIG.stableRingScale : 1);
    var ringY = viewport.height * CONFIG.drumY + CONFIG.ringSpawnOffsetY;

    // --- 触发反馈（音频 + 视觉）---
    this.playDrumSound(false);
    this.spawnDrumRing(
      viewport.width * CONFIG.drumX, ringY,
      ringRadius, stableRhythm ? 1.16 : 1,
      state.ringLayer
    );
    this.spawnBeatWord(viewport, stableRhythm);
    this.spawnDrumInfoNote(viewport, state.beats);
    this.animateDrumPress();
    this.animateDrumsticks();

    // --- 前进与水痕 ---
    this.animateForwardMotion(progress);
    this.animateBoatDeckPush();
    this.spawnWaterTrail(viewport, progress, stableRhythm);

    // --- 稳定节奏额外反馈 ---
    if (stableRhythm) {
      this.spawnOarStrokes(viewport, progress);
      this.spawnRedSilk(viewport);
    }

    // --- 提示文案（不显示数字）---
    if (progress < 1) {
      this.setHint("鼓声渐近");
    }

    // --- 完成判定 ---
    if (state.beats >= CONFIG.totalBeats) {
      this.completeDrum(viewport);
    }
  };

  // ═══════════════════════════════════════════════
  // 节奏判定
  // ═══════════════════════════════════════════════

  /**
   * 判断最近连击是否形成稳定节奏。
   * 条件：最近 (stableBeatCount - 1) 个间隔均在 [min, max] 毫秒区间内。
   */
  NS.MVPScene.prototype.isDrumRhythmStable = function (state) {
    if (state.intervals.length < CONFIG.stableBeatCount - 1) {
      return false;
    }
    return state.intervals.every(function (interval) {
      return interval >= CONFIG.stableMinIntervalMS && interval <= CONFIG.stableMaxIntervalMS;
    });
  };

  // ═══════════════════════════════════════════════
  // 完成流程
  // ═══════════════════════════════════════════════

  /**
   * 击满 totalBeats 后的完成演出：
   * 1. 播放终击音 + 放大鼓波
   * 2. 鼓面/甲板退场
   * 3. 绘制长水痕 + 浮出字粒
   * 4. 调用 finish() 显示完成态 UI
   */
  NS.MVPScene.prototype.completeDrum = function (viewport) {
    var scene = this;
    var state = this.state.drum;

    if (state.completing) {
      return;
    }
    state.completing = true;

    // 终击鼓波更开阔
    var ringY = viewport.height * CONFIG.drumY + CONFIG.ringSpawnOffsetY;
    this.playDrumSound(true);
    this.spawnDrumRing(
      viewport.width * CONFIG.drumX, ringY,
      CONFIG.ringMaxRadius * 1.7, 1.45,
      state.ringLayer
    );

    // 绘制持久水痕
    this.drawFinalWake(viewport);

    // 鼓面退场（下移 + 淡出）
    global.gsap.killTweensOf(state.drum);
    global.gsap.killTweensOf(state.boatDeckLayer);
    var drumExitY = state.drum._usesGeneratedDeck
      ? viewport.height * 1.04
      : state.drumBaseY + viewport.height * 0.14;
    global.gsap.to(state.drum, {
      y: drumExitY,
      alpha: 0.36,
      duration: 0.58,
      ease: "power2.out"
    });
    global.gsap.to(state.boatDeckLayer, {
      alpha: 0.42,
      duration: 0.5,
      ease: "power2.out"
    });

    // 延迟后显示水痕字粒并进入完成态
    global.gsap.delayedCall(0.78, function () {
      scene.spawnWakeWords(viewport);
      scene.finish(true);
    });

    this.setHint("鼓声已渡");
  };

  // ═══════════════════════════════════════════════
  // 轻知识展示
  // ═══════════════════════════════════════════════

  /**
   * 完成态显示一个呼吸光点，用户点击后展开轻知识文案。
   * 遵循交互串联的"随物解锁"模型——用户主动点击才看到知识。
   * @param {boolean} animate - false 时跳过进入动画（用于场景恢复）
   */
  NS.MVPScene.prototype.showDrumKnowledgeDot = function (animate) {
    var scene = this;
    var state = this.state.drum;
    var viewport = NS.utils.getViewport(this.app);

    if (!state || state.knowledgeDot) {
      return;
    }

    var dot = this.makeCircle(
      viewport.width * CONFIG.knowledgeDotX,
      viewport.height * CONFIG.knowledgeDotY,
      CONFIG.knowledgeDotRadius,
      CONFIG.knowledgeDotColor,
      animate === false ? 0.72 : 0
    );
    dot.eventMode = "static";
    dot.cursor = "pointer";
    dot.hitArea = new PIXI.Circle(0, 0, 24);
    state.knowledgeDot = dot;

    if (animate !== false) {
      global.gsap.to(dot, { alpha: 0.72, duration: 0.32, ease: "power2.out" });
      global.gsap.to(dot.scale, {
        x: 1.35,
        y: 1.35,
        duration: 0.7,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }

    dot.on("pointertap", function () {
      scene.revealDrumKnowledge();
    });
  };

  /** 点击光点后展开轻知识文案，光点停止呼吸变为不可交互。 */
  NS.MVPScene.prototype.revealDrumKnowledge = function () {
    var state = this.state.drum;
    if (state && state.knowledgeDot) {
      global.gsap.killTweensOf(state.knowledgeDot.scale);
      global.gsap.to(state.knowledgeDot, { alpha: 0.18, duration: 0.24 });
      state.knowledgeDot.cursor = "default";
      state.knowledgeDot.eventMode = "none";
    }
    if (this.knowledgeText) {
      this.knowledgeText.alpha = 0;
      global.gsap.to(this.knowledgeText, { alpha: 0.86, duration: 0.45 });
    }
  };

}(window));
