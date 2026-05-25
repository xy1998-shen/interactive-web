// 第三幕裹青：点击后自动合叶、束线与粽形显现。
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};
  var CONFIG = NS.CONFIG.wrap;

  NS.MVPScene.prototype.buildWrap = function (viewport) {
    var scene = this;
    var group = new PIXI.Container();
    this.content.addChild(group);

    var centerX = viewport.width * CONFIG.centerX;
    var centerY = viewport.height * CONFIG.centerY;

    // 目标呼吸光点
    var targetDot = new PIXI.Graphics();
    targetDot.beginFill(0xc8a45d, 0.5);
    targetDot.drawCircle(0, 0, CONFIG.targetRadius * 0.4);
    targetDot.endFill();
    targetDot.lineStyle(1.5, 0xc8a45d, 0.3);
    targetDot.drawCircle(0, 0, CONFIG.targetRadius);
    targetDot.position.set(centerX, centerY);
    group.addChild(targetDot);

    var breathPulse = global.gsap.to(targetDot, {
      alpha: CONFIG.targetBreathAlpha[1],
      duration: CONFIG.targetBreathDuration,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
    targetDot.alpha = CONFIG.targetBreathAlpha[0];

    // 粽叶
    var left = this.createSprite("leafLeft", CONFIG.leafWidthRatio, CONFIG.leftLeafX, CONFIG.leafY, viewport);
    left.eventMode = "none";
    var right = this.createSprite("leafRight", CONFIG.leafWidthRatio, CONFIG.rightLeafX, CONFIG.leafY, viewport);
    right.eventMode = "none";

    var zongzi = this.createSprite("zongzi", CONFIG.zongziWidthRatio, CONFIG.centerX, CONFIG.centerY, viewport);
    zongzi.alpha = 0;
    zongzi.eventMode = "none";
    var zongziThread = this.createSprite("zongziThread", CONFIG.zongziWidthRatio, CONFIG.centerX, CONFIG.centerY, viewport);
    zongziThread.alpha = 0;
    zongziThread.eventMode = "none";

    // 米粒粒子容器
    var particles = new PIXI.Container();
    group.addChild(particles);

    // 点击触发层
    var tapArea = new PIXI.Graphics();
    tapArea.beginFill(0x000000, 0.001);
    tapArea.drawRect(0, 0, viewport.width, viewport.height);
    tapArea.endFill();
    tapArea.eventMode = "static";
    tapArea.cursor = "pointer";
    this.content.addChild(tapArea);

    // 状态
    this.state.wrap = {
      step: 0,
      group: group,
      left: left,
      right: right,
      zongzi: zongzi,
      zongziThread: zongziThread,
      targetDot: targetDot,
      particles: particles,
      phaseAParticles: [],
      centerX: centerX,
      centerY: centerY,
      breathPulse: breathPulse,
      tapArea: tapArea,
      playing: false
    };

    this.spawnWrapPhaseAParticles();

    // 单次点击触发全自动播放
    tapArea.on("pointertap", function () {
      if (scene.completed || scene.state.wrap.playing) return;
      scene.autoPlayWrap(viewport);
    });

    this.cleanups.push(function () { breathPulse.kill(); });
  };

  // 时间轴串联左叶、右叶合拢与自动束线
  NS.MVPScene.prototype.autoPlayWrap = function (viewport) {
    var scene = this;
    var state = this.state.wrap;
    state.playing = true;
    state.tapArea.eventMode = "none";

    this.setHint("");

    var tl = global.gsap.timeline();

    // Step 1: 左叶合拢
    tl.to(state.left, {
      x: state.centerX - 10,
      rotation: CONFIG.rotationAngle,
      duration: CONFIG.foldDuration,
      ease: "power2.out"
    }, 0);
    tl.add(function () {
      state.step = 1;
      scene.gatherWrapPhaseAParticles(0.45);
    }, CONFIG.foldDuration * 0.8);

    // Step 2: 右叶合拢
    var step2Start = CONFIG.foldDuration + 0.3;
    tl.to(state.right, {
      x: state.centerX + 10,
      rotation: -CONFIG.rotationAngle,
      duration: CONFIG.foldDuration,
      ease: "power2.out"
    }, step2Start);
    tl.add(function () {
      state.step = 2;
      scene.gatherWrapPhaseAParticles(0.25);
    }, step2Start + CONFIG.foldDuration * 0.8);

    // Step 3: 束线动画
    var step3Start = step2Start + CONFIG.foldDuration + 0.3;
    tl.add(function () {
      scene.autoPlayWrapThread(viewport, tl, step3Start);
    }, step3Start);

    this.cleanups.push(function () { tl.kill(); });
  };

  NS.MVPScene.prototype.autoPlayWrapThread = function (viewport, parentTl, startTime) {
    var scene = this;
    var state = this.state.wrap;

    // 绘制缠线
    var threadY = viewport.height * CONFIG.threadY;
    var threadLeft = viewport.width * (0.5 - CONFIG.threadDragWidth / 2);
    var threadRight = viewport.width * (0.5 + CONFIG.threadDragWidth / 2);

    var thread = new PIXI.Graphics();
    thread.lineStyle(CONFIG.threadLineWidth, CONFIG.threadColor, 0.3);
    thread.moveTo(threadLeft, threadY);
    thread.lineTo(threadRight, threadY);
    thread.alpha = 0;
    state.group.addChild(thread);

    // 光标指示（纯视觉）
    var cursor = new PIXI.Graphics();
    cursor.beginFill(0xe8e1d2, 0.72);
    cursor.drawCircle(0, 0, 12);
    cursor.endFill();
    cursor.lineStyle(1.2, CONFIG.threadColor, 0.6);
    cursor.drawCircle(0, 0, 16);
    cursor.position.set(threadLeft, threadY);
    state.group.addChild(cursor);

    var animObj = { progress: 0 };

    // 线出现
    parentTl.to(thread, { alpha: CONFIG.threadAlpha, duration: 0.3 }, startTime);

    // 光标自动滑到右侧
    parentTl.to(animObj, {
      progress: 1,
      duration: 1.0,
      ease: "power2.inOut",
      onUpdate: function () {
        var clampedX = threadLeft + (threadRight - threadLeft) * animObj.progress;
        cursor.x = clampedX;
        // 动态绘制已缠线段
        thread.clear();
        thread.lineStyle(CONFIG.threadLineWidth, CONFIG.threadColor, 0.3);
        thread.moveTo(threadLeft, threadY);
        thread.lineTo(threadRight, threadY);
        thread.lineStyle(CONFIG.threadLineWidth + 1, CONFIG.threadColor, CONFIG.threadAlpha);
        thread.moveTo(threadLeft, threadY);
        thread.lineTo(clampedX, threadY);
      }
    }, startTime + 0.3);

    // 束线完成 → 触发完成态
    parentTl.add(function () {
      global.gsap.to(cursor, { alpha: 0, duration: 0.3 });
      scene.completeWrapSequence(viewport);
    }, startTime + 1.4);
  };

  NS.MVPScene.prototype.completeWrapSequence = function (viewport) {
    var scene = this;
    var state = this.state.wrap;
    state.step = 3;
    state.breathPulse.kill();
    state.targetDot.alpha = 0;

    // 粽形收束：两叶靠拢并降透明度
    global.gsap.to(state.left, { x: state.centerX - 4, alpha: CONFIG.leafFinalAlpha, rotation: CONFIG.rotationAngle + 0.06, duration: CONFIG.wrapDuration, ease: "power2.inOut" });
    global.gsap.to(state.right, { x: state.centerX + 4, alpha: CONFIG.leafFinalAlpha, rotation: -(CONFIG.rotationAngle + 0.06), duration: CONFIG.wrapDuration, ease: "power2.inOut" });

    // 粽形 sprite 淡入
    global.gsap.to(state.zongzi, {
      alpha: 0.9,
      duration: CONFIG.zongziFadeInDuration,
      ease: "sine.out"
    });
    global.gsap.to(state.zongziThread, {
      alpha: 0.9,
      duration: CONFIG.zongziThreadFadeInDuration,
      delay: CONFIG.zongziThreadDelay,
      ease: "sine.out"
    });

    // 完成态旋转
    global.gsap.to(state.zongzi, {
      rotation: CONFIG.completionRotation,
      duration: CONFIG.completionRotationDuration,
      ease: "sine.inOut"
    });
    global.gsap.to(state.zongziThread, {
      rotation: CONFIG.completionRotation,
      duration: CONFIG.completionRotationDuration,
      ease: "sine.inOut"
    });

    // 粒子聚合 + 过渡水纹
    this.spawnWrapParticles(viewport);
    this.spawnWrapTransitionRings(viewport);

    // 光点 → finish
    global.gsap.delayedCall(CONFIG.wrapDuration + CONFIG.particleGatherDuration + 0.1, function () {
      scene.showWrapKnowledgeDot(viewport);
    });
  };

  NS.MVPScene.prototype.spawnWrapPhaseAParticles = function () {
    var state = this.state.wrap;
    var cx = state.centerX;
    var cy = state.centerY;
    var alphaRange = CONFIG.particlePhaseAAlpha;

    for (var i = 0; i < CONFIG.particlePhaseACount; i++) {
      var p = new PIXI.Graphics();
      var color = CONFIG.particleColors[i % CONFIG.particleColors.length];
      var size = 2 + Math.random() * 2.5;
      p.beginFill(color, alphaRange[0] + Math.random() * (alphaRange[1] - alphaRange[0]));
      p.drawCircle(0, 0, size);
      p.endFill();
      p.position.set(cx + (Math.random() - 0.5) * 160, cy + (Math.random() - 0.5) * 70);
      state.particles.addChild(p);
      state.phaseAParticles.push(p);
      global.gsap.to(p, {
        y: p.y + CONFIG.particlePhaseAFloatRange * (Math.random() > 0.5 ? 1 : -1),
        duration: 1.2 + Math.random() * 0.7,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });
    }
  };

  NS.MVPScene.prototype.gatherWrapPhaseAParticles = function (spread) {
    var state = this.state.wrap;
    state.phaseAParticles.forEach(function (p, index) {
      global.gsap.to(p, {
        x: state.centerX + (Math.random() - 0.5) * 90 * spread,
        y: state.centerY + (Math.random() - 0.5) * 54 * spread,
        duration: CONFIG.foldDuration,
        delay: index * 0.015,
        ease: "power2.out"
      });
    });
  };

  NS.MVPScene.prototype.spawnWrapParticles = function (viewport) {
    var state = this.state.wrap;
    var cx = state.centerX;
    var cy = state.centerY;
    var glyphs = this.pickWrapGlyphs();

    state.phaseAParticles.forEach(function (p, index) {
      global.gsap.to(p, {
        x: cx + (Math.random() - 0.5) * 28,
        y: cy + (Math.random() - 0.5) * 34,
        alpha: 0,
        duration: CONFIG.particleGatherDuration,
        delay: index * 0.02,
        ease: "power2.in"
      });
    });

    for (var i = 0; i < CONFIG.particleCount; i++) {
      var p = new PIXI.Graphics();
      var color = CONFIG.particleColors[i % CONFIG.particleColors.length];
      var size = 2 + Math.random() * 3;
      p.beginFill(color, 0.6 + Math.random() * 0.3);
      p.drawCircle(0, 0, size);
      p.endFill();
      var angle = Math.random() * Math.PI * 2;
      var dist = 60 + Math.random() * 120;
      p.position.set(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist);
      p.alpha = 0;
      state.particles.addChild(p);

      var delay = i * 0.02;
      global.gsap.to(p, { alpha: 0.8, duration: 0.2, delay: delay });
      global.gsap.to(p, {
        x: cx + (Math.random() - 0.5) * 30,
        y: cy + (Math.random() - 0.5) * 40,
        duration: CONFIG.particleGatherDuration,
        delay: delay + 0.15,
        ease: "power2.in"
      });
      global.gsap.to(p, {
        alpha: 0,
        duration: 0.3,
        delay: delay + CONFIG.particleGatherDuration
      });
    }

    glyphs.forEach(function (glyph, index) {
      var text = new PIXI.Text(glyph, {
        fontFamily: "Songti SC, STSong, FangSong, serif",
        fontSize: CONFIG.glyphFontSize,
        fill: CONFIG.glyphColor,
        align: "center"
      });
      var a = Math.random() * Math.PI * 2;
      var d = 70 + Math.random() * 95;
      text.anchor.set(0.5);
      text.alpha = 0;
      text.position.set(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
      state.particles.addChild(text);
      global.gsap.to(text, { alpha: CONFIG.glyphAlpha, duration: 0.18, delay: index * 0.08 });
      global.gsap.to(text, {
        x: cx + (Math.random() - 0.5) * 22,
        y: cy + (Math.random() - 0.5) * 28,
        duration: CONFIG.particleGatherDuration,
        delay: 0.12 + index * 0.08,
        ease: "power2.in"
      });
      global.gsap.to(text, {
        alpha: 0,
        duration: 0.3,
        delay: 0.12 + index * 0.08 + CONFIG.particleGatherDuration
      });
    });
  };

  NS.MVPScene.prototype.pickWrapGlyphs = function () {
    var pool = CONFIG.glyphPool.slice();
    var chosen = [];
    while (chosen.length < CONFIG.glyphCount && pool.length) {
      var index = Math.floor(Math.random() * pool.length);
      chosen.push(pool.splice(index, 1)[0]);
    }
    return chosen;
  };

  NS.MVPScene.prototype.showWrapKnowledgeDot = function (viewport) {
    var scene = this;
    var state = this.state.wrap;
    var dot = new PIXI.Graphics();
    var x = state.centerX + viewport.width * 0.075;
    var y = state.centerY + viewport.height * 0.085;

    dot.beginFill(CONFIG.knowledgeDotColor, 0.86);
    dot.drawCircle(0, 0, CONFIG.knowledgeDotRadius);
    dot.endFill();
    dot.lineStyle(1.5, CONFIG.knowledgeDotColor, 0.42);
    dot.drawCircle(0, 0, CONFIG.knowledgeDotRadius * 2.2);
    dot.position.set(x, y);
    dot.alpha = 0;
    state.group.addChild(dot);

    global.gsap.to(dot, { alpha: 1, duration: 0.18 });
    global.gsap.to(dot.scale, {
      x: 1.8,
      y: 1.8,
      duration: CONFIG.knowledgeDotDuration / (CONFIG.knowledgeDotPulseCount * 2),
      yoyo: true,
      repeat: CONFIG.knowledgeDotPulseCount * 2 - 1,
      ease: "sine.inOut",
      onComplete: function () {
        global.gsap.to(dot, {
          alpha: 0,
          duration: 0.22,
          onComplete: function () {
            if (!dot.destroyed) {
              dot.destroy();
            }
            scene.finish(true);
          }
        });
      }
    });
  };

  NS.MVPScene.prototype.spawnWrapTransitionRings = function (viewport) {
    var state = this.state.wrap;
    var x = viewport.width * 0.73;
    var y = viewport.height * 0.63;

    for (var i = 0; i < CONFIG.transitionRingCount; i++) {
      var ring = new PIXI.Graphics();
      ring.lineStyle(2, CONFIG.transitionRingColor, 0.22);
      ring.drawCircle(0, 0, 18);
      ring.position.set(x + i * 22, y + i * 10);
      ring.alpha = 0.6;
      state.group.addChild(ring);
      global.gsap.to(ring.scale, {
        x: CONFIG.transitionRingMaxRadius / 18,
        y: CONFIG.transitionRingMaxRadius / 18,
        duration: CONFIG.transitionRingDuration,
        delay: i * 0.28,
        ease: "sine.out"
      });
      global.gsap.to(ring, {
        alpha: 0,
        duration: CONFIG.transitionRingDuration,
        delay: i * 0.28,
        ease: "sine.out"
      });
    }
  };
}(window));
