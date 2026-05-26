/**
 * 第四幕「听鼓」视觉效果与动画模块
 *
 * 职责：鼓波、水痕、桨影、红绸、前进视差、鼓面/鼓槌动画和音频合成。
 * 所有方法挂载在 MVPScene.prototype 上，由 drum-scene.js 的交互逻辑调用。
 *
 * 依赖：pixi.js、gsap、ChuJiang.CONFIG.drum
 */
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};
  var CONFIG = NS.CONFIG.drum;

  // ─────────────────────────────────────────────
  // 私有工具
  // ─────────────────────────────────────────────

  /**
   * 懒创建 Web Audio 上下文，复用于整个场景生命周期。
   * 返回 null 表示浏览器不支持 Web Audio。
   */
  function getOrCreateAudioContext(state) {
    var AudioContextClass = global.AudioContext || global.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }
    if (!state.audioContext) {
      state.audioContext = new AudioContextClass();
    }
    return state.audioContext;
  }

  // ─────────────────────────────────────────────
  // 音频
  // ─────────────────────────────────────────────

  /**
   * 使用 Web Audio 合成一声短促低频鼓音。
   * @param {boolean} isFinal - 完成态最后一击使用更低频率和更长衰减
   */
  NS.MVPScene.prototype.playDrumSound = function (isFinal) {
    var state = this.state.drum;
    var context = getOrCreateAudioContext(state);
    if (!context) {
      return;
    }
    // 部分浏览器在用户首次交互前挂起 AudioContext
    if (context.state === "suspended" && context.resume) {
      context.resume();
    }

    var now = context.currentTime;
    var freq = isFinal ? CONFIG.finishSoundFrequency : CONFIG.soundFrequency;
    var duration = isFinal ? 0.42 : CONFIG.soundDuration;
    var peakGain = isFinal ? 0.22 : 0.14;

    var oscillator = context.createOscillator();
    var gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(freq, now);
    oscillator.frequency.exponentialRampToValueAtTime(36, now + (isFinal ? 0.32 : CONFIG.soundDuration));

    // 短促包络：快速起音 → 指数衰减
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.04);
  };

  // ─────────────────────────────────────────────
  // 鼓面按压动画
  // ─────────────────────────────────────────────

  /**
   * 鼓面短促压缩回弹。
   * 修复：始终基于初始 base scale 做动画，防止快速连击时 scale 漂移。
   */
  NS.MVPScene.prototype.animateDrumPress = function () {
    var state = this.state.drum;
    var drum = state.drum;
    var baseX = state.drumBaseScaleX;
    var baseY = state.drumBaseScaleY;

    // 防止多个 tween 同时驱动 scale 造成抖动
    global.gsap.killTweensOf(drum.scale);
    global.gsap.fromTo(drum.scale,
      { x: baseX * CONFIG.pressScaleUp, y: baseY * CONFIG.pressScaleDown },
      { x: baseX, y: baseY, duration: CONFIG.pressDuration, ease: "power2.out" }
    );
  };

  // ─────────────────────────────────────────────
  // 鼓槌击打动画
  // ─────────────────────────────────────────────

  /** 鼓槌下击回弹。支持精灵图模式和程序绘制模式。 */
  NS.MVPScene.prototype.animateDrumsticks = function () {
    var state = this.state.drum;
    if (!state) {
      return;
    }

    // 精灵图鼓槌：整体下压
    if (state.drumstickSprite) {
      var sprite = state.drumstickSprite;
      global.gsap.killTweensOf(sprite);
      global.gsap.killTweensOf(sprite.scale);
      global.gsap.fromTo(sprite,
        { y: sprite._baseY - 4, rotation: sprite._baseRotation },
        {
          y: sprite._baseY + 26,
          rotation: sprite._baseRotation + 0.018,
          duration: 0.09,
          ease: "power2.in",
          yoyo: true,
          repeat: 1
        }
      );
      global.gsap.fromTo(sprite.scale,
        { x: sprite._baseScaleX * 1.012, y: sprite._baseScaleY * 1.012 },
        {
          x: sprite._baseScaleX,
          y: sprite._baseScaleY,
          duration: 0.09,
          ease: "power2.in",
          yoyo: true,
          repeat: 1
        }
      );
      return;
    }

    // 程序绘制鼓槌：左右交替下击
    if (!state.drumsticks || !state.drumsticks.length) {
      return;
    }
    state.drumsticks.forEach(function (stick, index) {
      global.gsap.killTweensOf(stick);
      global.gsap.to(stick, {
        y: stick._baseY + 22,
        rotation: stick._baseRotation + stick._side * 0.16,
        duration: 0.08,
        delay: index * 0.035,
        ease: "power2.in",
        yoyo: true,
        repeat: 1
      });
    });
  };

  // ─────────────────────────────────────────────
  // 前进视差（背景缩放 + 位移）
  // ─────────────────────────────────────────────

  /**
   * 根据击鼓进度驱动背景微缩放和下移，营造"向前冲"的视差。
   * @param {number} progress - 0~1 进度值
   */
  NS.MVPScene.prototype.animateForwardMotion = function (progress) {
    var state = this.state.drum;
    if (!state || !this.background) {
      return;
    }
    var targetScale = 1 + progress * (CONFIG.forwardScale - 1);
    global.gsap.to(this.background.scale, {
      x: state.bgBaseScaleX * targetScale,
      y: state.bgBaseScaleY * targetScale,
      duration: CONFIG.forwardDuration,
      ease: "power2.out"
    });
    global.gsap.to(this.background, {
      y: state.bgBaseY + progress * CONFIG.forwardY,
      duration: CONFIG.forwardDuration,
      ease: "power2.out"
    });
  };

  // ─────────────────────────────────────────────
  // 甲板/船首推进感
  // ─────────────────────────────────────────────

  /** 每击后船体或甲板层短促前冲回弹。 */
  NS.MVPScene.prototype.animateBoatDeckPush = function () {
    var state = this.state.drum;
    if (!state || !state.boatDeckLayer) {
      return;
    }
    // 使用船首素材时：鼓面自身做 Y 向弹跳
    if (state.drum && !state.drum._usesGeneratedDeck) {
      global.gsap.fromTo(state.drum,
        { y: state.drumBaseY + 10 },
        { y: state.drumBaseY, duration: 0.24, ease: "power2.out" }
      );
      return;
    }
    // 程序绘制甲板：整层微缩放回弹
    global.gsap.fromTo(state.boatDeckLayer,
      { y: 10, scaleX: 1.012, scaleY: 1.012 },
      { y: 0, scaleX: 1, scaleY: 1, duration: 0.24, ease: "power2.out" }
    );
  };

  // ─────────────────────────────────────────────
  // 朱砂鼓波（扩散圆环）
  // ─────────────────────────────────────────────

  /**
   * 在指定位置生成双层扩散圆环。
   * @param {number} x - 中心 X
   * @param {number} y - 中心 Y
   * @param {number} maxRadius - 外圈最终半径
   * @param {number} intensity - 线宽加成系数
   * @param {PIXI.Container} container - 父容器
   */
  NS.MVPScene.prototype.spawnDrumRing = function (x, y, maxRadius, intensity, container) {
    var initialRadius = 20;

    // 外圈
    var ring = new PIXI.Graphics();
    ring.lineStyle(CONFIG.ringLineWidth * intensity, CONFIG.ringColor, 0.58);
    ring.drawCircle(0, 0, initialRadius);
    ring.position.set(x, y);
    container.addChild(ring);

    global.gsap.to(ring, {
      alpha: 0,
      duration: CONFIG.ringDuration,
      ease: "power1.out",
      onComplete: function () { if (!ring.destroyed) ring.destroy(); }
    });
    global.gsap.to(ring.scale, {
      x: maxRadius / initialRadius,
      y: maxRadius / initialRadius,
      duration: CONFIG.ringDuration,
      ease: "power2.out"
    });

    // 内圈：半径更小、消失更快，增加层次感
    var innerInitial = 12;
    var innerRing = new PIXI.Graphics();
    innerRing.lineStyle(CONFIG.ringLineWidth * 0.6, CONFIG.ringColor, 0.34);
    innerRing.drawCircle(0, 0, innerInitial);
    innerRing.position.set(x, y);
    container.addChild(innerRing);

    var innerTarget = maxRadius * CONFIG.innerRingRatio;
    global.gsap.to(innerRing, {
      alpha: 0,
      duration: CONFIG.ringDuration * 0.7,
      ease: "power1.out",
      onComplete: function () { if (!innerRing.destroyed) innerRing.destroy(); }
    });
    global.gsap.to(innerRing.scale, {
      x: innerTarget / innerInitial,
      y: innerTarget / innerInitial,
      duration: CONFIG.ringDuration * 0.7,
      ease: "power2.out"
    });
  };

  // ─────────────────────────────────────────────
  // 鼓波文字（单字随波飘散）
  // ─────────────────────────────────────────────

  /**
   * 在鼓面上方生成一个短促浮字（如"起""渡"），随鼓波消散。
   * @param {object} viewport - 视口尺寸
   * @param {boolean} stableRhythm - 稳定节奏时字号更大、半径更远
   */
  NS.MVPScene.prototype.spawnBeatWord = function (viewport, stableRhythm) {
    var state = this.state.drum;
    if (!CONFIG.beatWords || !CONFIG.beatWords.length) {
      return;
    }

    var word = CONFIG.beatWords[(state.beats - 1) % CONFIG.beatWords.length];
    var fontSize = stableRhythm ? CONFIG.beatWordStableFontSize : CONFIG.beatWordFontSize;
    var label = this.makeDrumText(word, fontSize);

    // 在鼓面上方半圆随机位置生成
    var angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
    var radius = viewport.width * (stableRhythm ? 0.1 : 0.07);
    label.anchor.set(0.5);
    label.position.set(
      viewport.width * CONFIG.drumX + Math.cos(angle) * radius,
      viewport.height * CONFIG.drumY - 40 + Math.sin(angle) * radius
    );
    state.wordLayer.addChild(label);

    // 快速显现 → 向上飘散淡出
    global.gsap.to(label, { alpha: 0.72, duration: 0.12 });
    global.gsap.to(label, {
      y: label.y - 34,
      alpha: 0,
      duration: 0.72,
      delay: 0.12,
      ease: "power2.out",
      onComplete: function () { if (!label.destroyed) label.destroy(); }
    });
  };

  // ─────────────────────────────────────────────
  // 鼓波信息短句（特定击数触发）
  // ─────────────────────────────────────────────

  /**
   * 在特定击数显示一句补充文案（如"鼓为令，众桨同频"）。
   * 由 CONFIG.beatNotes 配置哪些击数触发。
   */
  NS.MVPScene.prototype.spawnDrumInfoNote = function (viewport, beat) {
    var note = CONFIG.beatNotes && CONFIG.beatNotes[beat];
    if (!note) {
      return;
    }

    var label = this.makeDrumText(note, 20);
    label.anchor.set(0.5);
    label.style.wordWrap = true;
    label.style.wordWrapWidth = Math.min(360, viewport.width * 0.26);
    label.style.lineHeight = 28;
    label.position.set(
      viewport.width * (beat === 2 ? 0.68 : 0.66),
      viewport.height * (beat === 2 ? 0.36 : 0.44)
    );
    this.state.drum.wordLayer.addChild(label);

    global.gsap.to(label, { alpha: 0.78, y: label.y - 8, duration: 0.32, ease: "power2.out" });
    global.gsap.to(label, {
      alpha: 0,
      duration: 0.45,
      delay: 2.2,
      ease: "power1.out",
      onComplete: function () { if (!label.destroyed) label.destroy(); }
    });
  };

  // ─────────────────────────────────────────────
  // 水痕（双侧贝塞尔曲线）
  // ─────────────────────────────────────────────

  /**
   * 从船尾向远方画两条水痕线，随击鼓进度延伸。
   * 稳定节奏时线更粗、停留更久。
   */
  NS.MVPScene.prototype.spawnWaterTrail = function (viewport, progress, stableRhythm) {
    var state = this.state.drum;
    var trail = new PIXI.Graphics();
    var centerX = viewport.width * 0.5;
    var startY = viewport.height * 0.88;
    var endY = viewport.height * (0.48 - progress * 0.03);
    var spread = viewport.width * (0.18 + progress * 0.08);

    trail.lineStyle(
      CONFIG.trailWidth * (stableRhythm ? 1.5 : 1),
      CONFIG.trailColor,
      CONFIG.trailAlpha
    );
    // 左侧水痕
    trail.moveTo(centerX - spread, startY);
    trail.bezierCurveTo(
      centerX - spread * 0.58, viewport.height * 0.72,
      centerX - 38, viewport.height * 0.58,
      centerX - 10, endY
    );
    // 右侧水痕
    trail.moveTo(centerX + spread, startY);
    trail.bezierCurveTo(
      centerX + spread * 0.58, viewport.height * 0.72,
      centerX + 38, viewport.height * 0.58,
      centerX + 10, endY
    );
    state.trailLayer.addChild(trail);

    global.gsap.to(trail, {
      alpha: 0,
      y: 28,
      duration: stableRhythm ? 1.25 : 0.82,
      ease: "power1.out",
      onComplete: function () { if (!trail.destroyed) trail.destroy(); }
    });
  };

  // ─────────────────────────────────────────────
  // 桨影（稳定节奏时生成）
  // ─────────────────────────────────────────────

  /**
   * 在龙舟两侧画若干短划桨影，表现"众桨合力"。
   * 仅在稳定节奏时由 hitDrum 调用。
   */
  NS.MVPScene.prototype.spawnOarStrokes = function (viewport, progress) {
    var state = this.state.drum;
    var count = CONFIG.oarCount;
    var baseX = viewport.width * 0.5;
    var baseY = viewport.height * (0.58 + progress * 0.08);

    for (var i = 0; i < count; i++) {
      (function (index) {
        var stroke = new PIXI.Graphics();
        var side = index % 2 === 0 ? -1 : 1;
        var offsetX = side * (viewport.width * (0.12 + Math.floor(index / 2) * 0.045));

        stroke.lineStyle(2, CONFIG.oarStrokeColor, CONFIG.oarStrokeAlpha);
        stroke.moveTo(0, 0);
        stroke.lineTo(side * 34, 30);
        stroke.position.set(baseX + offsetX, baseY + Math.floor(index / 2) * 26);
        stroke.rotation = side * 0.16;
        state.oarLayer.addChild(stroke);

        global.gsap.to(stroke, {
          alpha: 0,
          y: stroke.y + 30,
          duration: 0.46,
          ease: "power2.out",
          onComplete: function () { if (!stroke.destroyed) stroke.destroy(); }
        });
      })(i);
    }
  };

  // ─────────────────────────────────────────────
  // 红绸闪现
  // ─────────────────────────────────────────────

  /** 舟首短暂一闪红绸，作为节奏增强反馈。仅稳定节奏时调用。 */
  NS.MVPScene.prototype.spawnRedSilk = function (viewport) {
    var state = this.state.drum;
    var silk = new PIXI.Graphics();
    silk.lineStyle(3, CONFIG.redSilkColor, 0.34);
    silk.moveTo(0, 0);
    silk.quadraticCurveTo(18, -10, 38, 2);
    silk.position.set(viewport.width * 0.5 - 18, viewport.height * 0.58);
    state.oarLayer.addChild(silk);

    global.gsap.to(silk, {
      alpha: 0,
      duration: 0.34,
      ease: "power1.out",
      onComplete: function () { if (!silk.destroyed) silk.destroy(); }
    });
  };

  // ─────────────────────────────────────────────
  // 完成态：长水痕 + 浮字
  // ─────────────────────────────────────────────

  /** 龙舟驶过后留下的持久水痕（不自动消失，随场景销毁）。 */
  NS.MVPScene.prototype.drawFinalWake = function (viewport) {
    var state = this.state.drum;
    var wake = new PIXI.Graphics();
    var centerX = viewport.width * 0.5;
    var topY = viewport.height * 0.42;
    var bottomY = viewport.height * 0.9;

    // 外侧双线
    wake.lineStyle(3, CONFIG.trailColor, 0.34);
    wake.moveTo(centerX - viewport.width * 0.28, bottomY);
    wake.bezierCurveTo(
      centerX - viewport.width * 0.18, viewport.height * 0.68,
      centerX - 44, viewport.height * 0.52,
      centerX - 8, topY
    );
    wake.moveTo(centerX + viewport.width * 0.28, bottomY);
    wake.bezierCurveTo(
      centerX + viewport.width * 0.18, viewport.height * 0.68,
      centerX + 44, viewport.height * 0.52,
      centerX + 8, topY
    );
    // 中部横联线，增加水痕层次
    wake.lineStyle(1.5, CONFIG.ringColor, 0.22);
    wake.moveTo(centerX - viewport.width * 0.16, bottomY - 24);
    wake.bezierCurveTo(
      centerX - viewport.width * 0.08, viewport.height * 0.66,
      centerX + viewport.width * 0.08, viewport.height * 0.56,
      centerX + viewport.width * 0.16, bottomY - 24
    );
    state.trailLayer.addChild(wake);
  };

  /**
   * 水痕中浮出字粒（如"江""艾""舟""鼓""风"），预告第五幕「问诗」入口。
   * 字粒依次延迟浮现，不自动消失。
   */
  NS.MVPScene.prototype.spawnWakeWords = function (viewport) {
    var state = this.state.drum;
    var scene = this;
    var baseY = viewport.height * 0.56;

    CONFIG.wakeWords.forEach(function (word, index) {
      var label = scene.makeDrumText(word, CONFIG.wakeWordFontSize);
      label.anchor.set(0.5);
      label.alpha = 0;
      label.position.set(
        viewport.width * (0.34 + index * 0.08),
        baseY + (index % 2) * 22
      );
      state.wordLayer.addChild(label);

      global.gsap.to(label, {
        alpha: 0.76,
        y: label.y - 18,
        duration: 0.58,
        delay: index * 0.08,
        ease: "power2.out"
      });
    });
  };

}(window));
