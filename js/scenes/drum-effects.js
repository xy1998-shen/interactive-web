/**
 * 第四幕「听鼓」视觉效果与音频合成模块
 *
 * 职责：鼓波扩散、水花粒子、抖动、视差水波、音频合成。
 * 所有方法挂在 NS.DrumEffects 命名空间下，由 drum-scene.js 调用；
 * 仅 closeDrumAudio 需要挂在 MVPScene 上以匹配 base-scene.onExit 钩子。
 *
 * 依赖：pixi.js、gsap、ChuJiang.CONFIG.drum
 */
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};
  var CONFIG = NS.CONFIG.drum;
  var DrumEffects = {};

  // ─────────────────────────────────────────────
  // 私有：取/建 AudioContext
  // ─────────────────────────────────────────────

  /**
   * 获取共享 AudioContext。
   * 优先复用 NS.audioCtx（前几幕用户交互时已解锁）；
   * 退化时基于 scene.state.drum.audioContext 单例创建。
   */
  function getAudioCtx(scene) {
    if (NS.audioCtx) {
      if (NS.audioCtx.state === "suspended" && NS.audioCtx.resume) {
        NS.audioCtx.resume();
      }
      return NS.audioCtx;
    }
    var Ctor = global.AudioContext || global.webkitAudioContext;
    if (!Ctor) return null;
    var state = scene && scene.state && scene.state.drum;
    if (state && state.audioContext) {
      if (state.audioContext.state === "suspended" && state.audioContext.resume) {
        state.audioContext.resume();
      }
      return state.audioContext;
    }
    var ctx;
    try {
      ctx = new Ctor();
    } catch (e) {
      return null;
    }
    if (state) state.audioContext = ctx;
    NS.audioCtx = ctx;
    return ctx;
  }

  // ─────────────────────────────────────────────
  // 音频合成
  // ─────────────────────────────────────────────

  /**
   * 合成一声鼓击：低频正弦扫频 + 短促带通噪声冲击。
   * @param {object} scene - MVPScene 实例
   * @param {boolean} isFinal - 终击（音量×1.5、衰减更长）
   * @param {boolean} isUserExtra - 用户加击（音色稍亮、音量稍小）
   */
  DrumEffects.playDrumHit = function (scene, isFinal, isUserExtra) {
    var ctx = getAudioCtx(scene);
    if (!ctx) return;

    var now = ctx.currentTime;
    var amp = isFinal ? 1.5 : (isUserExtra ? 0.7 : 1.0);
    var sweepDuration = isFinal ? 0.22 : 0.15;
    var totalDuration = isFinal ? 0.42 : 0.32;
    var startFreq = isUserExtra ? 100 : 80;
    var endFreq = isUserExtra ? 50 : 40;

    // —— 主鼓声：sine 扫频 + 包络 ——
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + sweepDuration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.55 * amp, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + totalDuration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + totalDuration + 0.05);

    // —— 噪声冲击：带通滤波，制造"扑"的瞬态 ——
    var noiseDur = isFinal ? 0.16 : 0.11;
    var bufferSize = Math.max(64, Math.floor(ctx.sampleRate * noiseDur));
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      var decay = Math.pow(1 - i / bufferSize, 2);
      data[i] = (Math.random() * 2 - 1) * decay;
    }
    var noise = ctx.createBufferSource();
    noise.buffer = buffer;
    var bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = isUserExtra ? 280 : 200;
    bp.Q.value = 0.85;
    var ng = ctx.createGain();
    ng.gain.setValueAtTime(0.42 * amp, now);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + noiseDur);
    noise.connect(bp);
    bp.connect(ng);
    ng.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + noiseDur + 0.04);

    // —— 终击额外加一个延迟回声 ——
    if (isFinal) {
      var echoOsc = ctx.createOscillator();
      var echoGain = ctx.createGain();
      echoOsc.type = "sine";
      echoOsc.frequency.setValueAtTime(54, now + 0.18);
      echoOsc.frequency.exponentialRampToValueAtTime(36, now + 0.6);
      echoGain.gain.setValueAtTime(0.0001, now + 0.18);
      echoGain.gain.exponentialRampToValueAtTime(0.22, now + 0.21);
      echoGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.78);
      echoOsc.connect(echoGain);
      echoGain.connect(ctx.destination);
      echoOsc.start(now + 0.18);
      echoOsc.stop(now + 0.82);
    }
  };

  /**
   * 划水声：白噪声 + 带通滤波（300-800Hz），短促衰减。
   */
  DrumEffects.playPaddleNoise = function (scene) {
    var ctx = getAudioCtx(scene);
    if (!ctx) return;
    var now = ctx.currentTime;
    var dur = 0.13;
    var bufferSize = Math.max(64, Math.floor(ctx.sampleRate * dur));
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      var decay = Math.pow(1 - i / bufferSize, 1.4);
      data[i] = (Math.random() * 2 - 1) * decay;
    }
    var noise = ctx.createBufferSource();
    noise.buffer = buffer;
    var bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 460 + Math.random() * 280;
    bp.Q.value = 1.4;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.10, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    noise.connect(bp);
    bp.connect(g);
    g.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + dur + 0.04);
  };

  // ─────────────────────────────────────────────
  // 视觉：鼓波扩散
  // ─────────────────────────────────────────────

  /**
   * 在指定位置生成双层扩散圆环。
   * @param {PIXI.Container} container 父容器
   * @param {number} x,y 中心
   * @param {number} maxRadius 外圈最终半径
   * @param {number} intensity 线宽与不透明度系数
   * @param {object} cfg CONFIG.drum
   */
  DrumEffects.createDrumWave = function (container, x, y, maxRadius, intensity, cfg) {
    cfg = cfg || CONFIG;
    var initialRadius = 18;

    var ring = new PIXI.Graphics();
    ring.lineStyle(cfg.ringLineWidth * intensity, cfg.ringColor, 0.62);
    ring.drawCircle(0, 0, initialRadius);
    ring.position.set(x, y);
    container.addChild(ring);

    global.gsap.to(ring, {
      alpha: 0,
      duration: cfg.ringDuration,
      ease: "power1.out",
      onComplete: function () { if (!ring.destroyed) ring.destroy(); }
    });
    global.gsap.to(ring.scale, {
      x: maxRadius / initialRadius,
      y: maxRadius / initialRadius,
      duration: cfg.ringDuration,
      ease: "power2.out"
    });

    // 内圈：更小、更快消散
    var innerInitial = 11;
    var innerRing = new PIXI.Graphics();
    innerRing.lineStyle(cfg.ringLineWidth * 0.6 * intensity, cfg.ringColor, 0.36);
    innerRing.drawCircle(0, 0, innerInitial);
    innerRing.position.set(x, y);
    container.addChild(innerRing);

    var innerTarget = maxRadius * cfg.innerRingRatio;
    global.gsap.to(innerRing, {
      alpha: 0,
      duration: cfg.ringDuration * 0.7,
      ease: "power1.out",
      onComplete: function () { if (!innerRing.destroyed) innerRing.destroy(); }
    });
    global.gsap.to(innerRing.scale, {
      x: innerTarget / innerInitial,
      y: innerTarget / innerInitial,
      duration: cfg.ringDuration * 0.7,
      ease: "power2.out"
    });
  };

  /**
   * 鼓点落下时的江水溅起：用短水线和水滴替代醒目的朱砂圆环。
   * 位置仍沿用鼓波中心，但视觉更像桨浪被鼓声带起。
   */
  DrumEffects.createWaterBeatBurst = function (container, x, y, maxRadius, intensity, cfg) {
    cfg = cfg || CONFIG;
    var burst = new PIXI.Container();
    burst.position.set(x, y);
    container.addChild(burst);

    var lineCount = Math.round(8 + intensity * 5);
    for (var i = 0; i < lineCount; i++) {
      (function (idx) {
        var side = idx % 2 === 0 ? -1 : 1;
        var angle = (-0.72 + Math.random() * 0.34) * side;
        var len = maxRadius * (0.18 + Math.random() * 0.2);
        var start = maxRadius * (0.05 + Math.random() * 0.08);
        var stroke = new PIXI.Graphics();
        stroke.lineStyle(
          Math.max(1, cfg.ringLineWidth * (0.48 + intensity * 0.18)),
          Math.random() > 0.42 ? 0xe8e1d2 : 0x9eaea3,
          0.34 + Math.random() * 0.18
        );
        stroke.moveTo(0, 0);
        stroke.quadraticCurveTo(side * len * 0.38, -len * 0.16, side * len, -len * 0.04);
        stroke.position.set(Math.cos(angle) * start, Math.sin(angle) * start);
        stroke.rotation = angle;
        burst.addChild(stroke);

        global.gsap.fromTo(stroke, { alpha: 0, x: stroke.x * 0.35, y: stroke.y * 0.35 }, {
          alpha: 0,
          x: stroke.x + side * (18 + Math.random() * 26),
          y: stroke.y - (10 + Math.random() * 18),
          duration: cfg.ringDuration * (0.86 + Math.random() * 0.28),
          ease: "sine.out",
          onStart: function () { stroke.alpha = 0.54; }
        });
      })(i);
    }

    var dropCount = Math.round(10 + intensity * 8);
    for (var j = 0; j < dropCount; j++) {
      (function () {
        var dot = new PIXI.Graphics();
        var radius = 1.6 + Math.random() * 2.8;
        dot.beginFill(Math.random() > 0.35 ? 0xf4ecd8 : 0xcbd8d2, 0.74);
        dot.drawCircle(0, 0, radius);
        dot.endFill();
        burst.addChild(dot);

        var side = Math.random() > 0.5 ? 1 : -1;
        var dx = side * (18 + Math.random() * maxRadius * 0.34);
        var dy = -(16 + Math.random() * maxRadius * 0.2);
        global.gsap.fromTo(dot, { x: 0, y: 0, alpha: 0.72 }, {
          x: dx,
          y: dy + Math.random() * 18,
          alpha: 0,
          duration: cfg.ringDuration * (0.75 + Math.random() * 0.32),
          ease: "power2.out"
        });
      })();
    }

    var wash = new PIXI.Graphics();
    wash.lineStyle(Math.max(1, cfg.ringLineWidth * 0.44), 0xe8e1d2, 0.18);
    wash.drawEllipse(0, 0, maxRadius * 0.16, maxRadius * 0.038);
    burst.addChild(wash);
    global.gsap.to(wash, {
      alpha: 0,
      duration: cfg.ringDuration * 0.72,
      ease: "sine.out"
    });
    global.gsap.to(wash.scale, {
      x: 1.7 + intensity * 0.3,
      y: 1.22,
      duration: cfg.ringDuration * 0.72,
      ease: "sine.out"
    });

    global.gsap.delayedCall(cfg.ringDuration * 1.2, function () {
      if (!burst.destroyed) burst.destroy({ children: true });
    });
  };

  // ─────────────────────────────────────────────
  // 视觉：水花粒子
  // ─────────────────────────────────────────────

  /**
   * 从屏幕底部两侧溅出一颗白色小圆，抛物线运动后淡出。
   * @param {PIXI.Container} container
   * @param {{width:number,height:number}} viewport
   * @param {string} side "left" | "right"
   */
  DrumEffects.createWaterSplash = function (container, viewport, side) {
    var fromLeft = side === "left";
    var x = fromLeft
      ? viewport.width * (0.05 + Math.random() * 0.18)
      : viewport.width * (0.77 + Math.random() * 0.18);
    var startY = viewport.height * (0.88 + Math.random() * 0.08);
    var dx = (fromLeft ? 1 : -1) * (40 + Math.random() * 110);
    var dyUp = -(70 + Math.random() * 90);
    var size = 3.5 + Math.random() * 4;

    var dot = new PIXI.Graphics();
    dot.beginFill(0xf4ecd8, 0.92);
    dot.drawCircle(0, 0, size);
    dot.endFill();
    dot.position.set(x, startY);
    container.addChild(dot);

    var tracker = { v: 0 };
    var startX = x;
    global.gsap.to(tracker, {
      v: 1,
      duration: 0.7 + Math.random() * 0.3,
      ease: "power1.out",
      onUpdate: function () {
        var p = tracker.v;
        // 抛物线：水平匀速 + 垂直先升后降
        dot.x = startX + dx * p;
        dot.y = startY + dyUp * p + 280 * p * p;
        dot.alpha = 0.92 * (1 - p);
        var s = 1 - p * 0.4;
        dot.scale.set(s);
      },
      onComplete: function () {
        if (!dot.destroyed) dot.destroy();
      }
    });
  };

  // ─────────────────────────────────────────────
  // 视觉：抖动
  // ─────────────────────────────────────────────

  /**
   * 对显示对象进行 Y 轴抖动。
   * 自动捕获 _baseX/_baseY 作为锚点，保证多次抖动不漂移。
   */
  DrumEffects.shakeElement = function (sprite, intensity, duration) {
    if (!sprite) return;
    if (sprite._baseY == null) sprite._baseY = sprite.y;
    if (sprite._baseX == null) sprite._baseX = sprite.x;
    var baseY = sprite._baseY;

    global.gsap.killTweensOf(sprite, "y");
    var tl = global.gsap.timeline();
    tl.to(sprite, { y: baseY - intensity, duration: duration * 0.22, ease: "power2.out" })
      .to(sprite, { y: baseY + intensity * 1.05, duration: duration * 0.26, ease: "power2.inOut" })
      .to(sprite, { y: baseY - intensity * 0.5, duration: duration * 0.22, ease: "power2.inOut" })
      .to(sprite, { y: baseY, duration: duration * 0.30, ease: "power2.out" });
  };

  // ─────────────────────────────────────────────
  // 视觉：中景水波（可滚动 TilingSprite）
  // ─────────────────────────────────────────────

  /**
   * 创建中景水波层：用 RenderTexture 烘焙一段水痕条纹，
   * 然后包成 TilingSprite 实现无缝横向滚动。
   * 返回 { container, tile }，tile.tilePosition.x 由 scene 每帧更新。
   */
  DrumEffects.createMidRipples = function (viewport, renderer) {
    var stripWidth = 256;
    var stripHeight = Math.max(120, Math.floor(viewport.height * 0.4));

    // 烘焙一段水痕：横向多条短线 + 半透明波浪
    var brush = new PIXI.Graphics();
    brush.beginFill(0x16343a, 0.0);
    brush.drawRect(0, 0, stripWidth, stripHeight);
    brush.endFill();
    brush.lineStyle(1.4, 0xe8e1d2, 0.18);
    for (var i = 0; i < 14; i++) {
      var y = (i * stripHeight) / 14 + (Math.random() - 0.5) * 4;
      var startX = Math.random() * stripWidth;
      var len = 28 + Math.random() * 64;
      brush.moveTo(startX, y);
      brush.lineTo(startX + len, y + (Math.random() - 0.5) * 2);
    }
    brush.lineStyle(1, 0xa94f3f, 0.10);
    for (var k = 0; k < 6; k++) {
      var yy = Math.random() * stripHeight;
      var sx = Math.random() * stripWidth;
      brush.moveTo(sx, yy);
      brush.lineTo(sx + 18 + Math.random() * 24, yy);
    }

    var tile;
    if (renderer && PIXI.RenderTexture) {
      var rt = PIXI.RenderTexture.create({ width: stripWidth, height: stripHeight });
      renderer.render(brush, { renderTexture: rt });
      tile = new PIXI.TilingSprite(rt, viewport.width, stripHeight);
    } else {
      // 退化方案：直接用 brush 当无缝纹理（视觉上不会循环但仍可工作）
      tile = new PIXI.Container();
      tile.addChild(brush);
      tile.tilePosition = { x: 0, y: 0 }; // 占位，scene 内 setter 不会失败
    }

    var container = new PIXI.Container();
    container.position.set(0, viewport.height * 0.55);
    container.alpha = 0.85;
    container.addChild(tile);

    return { container: container, tile: tile };
  };

  // ─────────────────────────────────────────────
  // 视觉：雾气光晕叠层
  // ─────────────────────────────────────────────

  /**
   * 上方淡雾、下方水汽光带，弱化第一人称背景的硬边。
   */
  DrumEffects.createMistOverlay = function (viewport) {
    var c = new PIXI.Container();

    var topMist = new PIXI.Graphics();
    topMist.beginFill(0xf4ecd8, 0.10);
    topMist.drawRect(0, 0, viewport.width, viewport.height * 0.30);
    topMist.endFill();
    c.addChild(topMist);

    var midGlow = new PIXI.Graphics();
    midGlow.beginFill(0xc8a45d, 0.05);
    midGlow.drawRect(0, viewport.height * 0.34, viewport.width, viewport.height * 0.12);
    midGlow.endFill();
    c.addChild(midGlow);

    var bottomShade = new PIXI.Graphics();
    bottomShade.beginFill(0x0d1a18, 0.18);
    bottomShade.drawRect(0, viewport.height * 0.86, viewport.width, viewport.height * 0.14);
    bottomShade.endFill();
    c.addChild(bottomShade);

    return c;
  };

  // ─────────────────────────────────────────────
  // 视觉：视差层创建工具（通用）
  // ─────────────────────────────────────────────

  /**
   * 创建一个带视差元数据的容器（让 scene 可统一管理 speed/tile）。
   * @param {object} config { texture, tiling, width, height, x, y, alpha, speed }
   */
  DrumEffects.createParallaxLayer = function (config) {
    var layer = new PIXI.Container();
    layer._parallaxSpeed = (config && config.speed) || 0.5;
    if (!config) return layer;
    if (config.texture && config.tiling && PIXI.TilingSprite) {
      var tile = new PIXI.TilingSprite(
        config.texture,
        config.width || 1920,
        config.height || 200
      );
      if (config.x != null) tile.x = config.x;
      if (config.y != null) tile.y = config.y;
      if (config.alpha != null) tile.alpha = config.alpha;
      layer.addChild(tile);
      layer._tile = tile;
    } else if (config.texture) {
      var sp = new PIXI.Sprite(config.texture);
      if (config.x != null) sp.x = config.x;
      if (config.y != null) sp.y = config.y;
      if (config.alpha != null) sp.alpha = config.alpha;
      layer.addChild(sp);
    }
    return layer;
  };

  // ─────────────────────────────────────────────
  // 视觉：降级船架（无前景素材时）
  // ─────────────────────────────────────────────

  DrumEffects.drawFallbackBoatFrame = function (viewport) {
    var c = new PIXI.Container();
    var w = viewport.width;
    var h = viewport.height;

    var hull = new PIXI.Graphics();
    // 主船舷弧线
    hull.beginFill(0x0d1a18, 0.78);
    hull.moveTo(0, h);
    hull.lineTo(0, h * 0.92);
    hull.bezierCurveTo(w * 0.18, h * 0.78, w * 0.4, h * 0.7, w * 0.5, h * 0.7);
    hull.bezierCurveTo(w * 0.6, h * 0.7, w * 0.82, h * 0.78, w, h * 0.92);
    hull.lineTo(w, h);
    hull.closePath();
    hull.endFill();
    c.addChild(hull);

    // 金线高光
    var rim = new PIXI.Graphics();
    rim.lineStyle(1.6, 0xc8a45d, 0.55);
    rim.moveTo(0, h * 0.92);
    rim.bezierCurveTo(w * 0.18, h * 0.78, w * 0.4, h * 0.7, w * 0.5, h * 0.7);
    rim.bezierCurveTo(w * 0.6, h * 0.7, w * 0.82, h * 0.78, w, h * 0.92);
    c.addChild(rim);

    c.position.set(0, 0);
    return c;
  };

  // ─────────────────────────────────────────────
  // 暴露 + 关闭音频钩子
  // ─────────────────────────────────────────────

  /** 由 base-scene.onExit 调用，关闭/解除场景的音频引用。 */
  NS.MVPScene.prototype.closeDrumAudio = function () {
    var state = this && this.state && this.state.drum;
    if (state && state.audioContext) {
      // NS.audioCtx 跨幕共享时不强行 close，避免影响后续场景
      state.audioContext = null;
    }
  };

  NS.DrumEffects = DrumEffects;
}(window));
