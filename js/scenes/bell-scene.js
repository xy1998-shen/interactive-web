// 第六幕和鸣：按顺序点亮诗声、风物、礼乐三处回声。
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};
  var CONFIG = NS.CONFIG.bell;
  var FONTS = NS.FONT_STACKS;
  var BELL_CALLIGRAPHY_FONT = FONTS.calligraphy;
  var BELL_TEXT_FONT = FONTS.wenkai;

  // 构建和鸣主舞台：编钟、声路、回声节点和信息面板。
  NS.MVPScene.prototype.buildBell = function (viewport) {
    var group = new PIXI.Container();
    this.content.addChild(group);

    var ringLayer = new PIXI.Container();
    group.addChild(ringLayer);

    var flashbackLayer = new PIXI.Container();
    flashbackLayer.alpha = 0;
    group.addChild(flashbackLayer);

    var stageTextureLayer = new PIXI.Container();
    group.addChild(stageTextureLayer);

    var soundPathLayer = new PIXI.Container();
    group.addChild(soundPathLayer);

    var effectLayer = new PIXI.Container();
    group.addChild(effectLayer);

    var bell = this.createSprite("bell", CONFIG.bellWidthRatio, CONFIG.bellX, CONFIG.bellY, viewport);
    this.content.removeChild(bell);
    group.addChild(bell);

    this.state.bell = {
      taps: 0,
      group: group,
      bell: bell,
      ringLayer: ringLayer,
      stageTextureLayer: stageTextureLayer,
      stagePattern: null,
      soundPathLayer: soundPathLayer,
      soundPathIdle: null,
      soundPathActive: null,
      effectLayer: effectLayer,
      flashbackLayer: flashbackLayer,
      flashbackShown: false,
      animating: false,
      autoStarted: false,
      exiting: false,
      audioContext: null,
      knowledgeDot: null,
      resonanceNodes: [],
      infoText: null
    };

    bell.alpha = 0.68;
    bell.eventMode = "none";
    bell.cursor = "default";

    this.createBellStageTexture(viewport, stageTextureLayer);
    this.createBellInfoPanel(viewport, effectLayer);
    this.createBellResonanceNodes(viewport, effectLayer);
    this.createBellSoundPath(viewport, soundPathLayer);
    this.updateBellNodeInteractivity();
    if (this.manager.completed[this.index]) {
      group.alpha = 1;
      return;
    }
    this.playBellEntryTransition(viewport, group);
  };

  // 入场过渡：从水面和帘幕过渡到编钟声路。
  NS.MVPScene.prototype.playBellEntryTransition = function (viewport, group) {
    var scene = this;
    var entryLayer = new PIXI.Container();
    this.content.addChild(entryLayer);
    group.alpha = 0;

    var waterFade = new PIXI.Graphics();
    waterFade.beginFill(0x16343a, 0.18);
    waterFade.drawRect(0, viewport.height * 0.62, viewport.width, viewport.height * 0.38);
    waterFade.endFill();
    entryLayer.addChild(waterFade);

    var curtain = new PIXI.Graphics();
    curtain.beginFill(0xe8e1d2, 0.34);
    curtain.drawRect(0, -viewport.height * 0.24, viewport.width, viewport.height * 0.32);
    curtain.endFill();
    entryLayer.addChild(curtain);

    var dots = [];
    for (var i = 0; i < 9; i += 1) {
      var dot = new PIXI.Graphics();
      dot.beginFill(CONFIG.ringColor, 0.52);
      dot.drawCircle(0, 0, 2.2 + (i % 3));
      dot.endFill();
      dot.position.set(viewport.width * (0.42 + i * 0.018), viewport.height * (0.78 - (i % 4) * 0.035));
      entryLayer.addChild(dot);
      dots.push(dot);
    }

    this.setHint(CONFIG.entryText);
    global.gsap.to(group, { alpha: 1, duration: 0.58, delay: 0.62, ease: "sine.out" });
    global.gsap.to(waterFade, {
      alpha: 0,
      y: viewport.height * 0.08,
      duration: CONFIG.entryDuration,
      ease: "sine.inOut"
    });
    global.gsap.to(curtain, {
      y: viewport.height * 0.18,
      alpha: 0,
      duration: CONFIG.entryDuration,
      ease: "power2.out"
    });
    dots.forEach(function (dot, index) {
      var target = CONFIG.resonanceNodes[index % CONFIG.resonanceNodes.length];
      global.gsap.to(dot.position, {
        x: viewport.width * target.x,
        y: viewport.height * target.y,
        duration: CONFIG.entryDuration * 0.82,
        delay: index * 0.035,
        ease: "power2.out"
      });
      global.gsap.to(dot, {
        alpha: 0,
        duration: 0.36,
        delay: CONFIG.entryDuration * 0.58 + index * 0.025,
        ease: "sine.in"
      });
    });
    this.scheduleCall(CONFIG.entryDuration, function () {
      scene.setHint(CONFIG.introHint);
      if (!entryLayer.destroyed) {
        entryLayer.destroy({ children: true });
      }
      scene.startBellAutoSequence();
    });
  };

  // 绘制礼乐台纹理，弱化纯背景的空白感。
  NS.MVPScene.prototype.createBellStageTexture = function (viewport, layer) {
    var texture = this.app.assets.get("duanwuPattern");
    if (!texture) return;

    var pattern = new PIXI.Sprite(texture);
    pattern.anchor.set(0.5);
    pattern.alpha = CONFIG.stagePatternAlpha;
    var blendModes = PIXI.BLEND_MODES || {};
    pattern.blendMode = blendModes.MULTIPLY != null ? blendModes.MULTIPLY : blendModes.NORMAL;
    var targetWidth = viewport.width * CONFIG.stagePatternWidthRatio;
    pattern.scale.set(targetWidth / pattern.texture.width);
    pattern.position.set(viewport.width * CONFIG.stagePatternX, viewport.height * CONFIG.stagePatternY);
    layer.addChild(pattern);
    this.state.bell.stagePattern = pattern;
  };

  // 创建三处回声之间的声路图层。
  NS.MVPScene.prototype.createBellSoundPath = function (viewport, layer) {
    var state = this.state.bell;
    if (!state) return;

    state.soundPathIdle = new PIXI.Graphics();
    state.soundPathActive = new PIXI.Graphics();
    layer.addChild(state.soundPathIdle);
    layer.addChild(state.soundPathActive);
    this.redrawBellSoundPath(viewport, 0);
  };

  // 计算三处回声节点在当前视口中的坐标。
  NS.MVPScene.prototype.getBellPathPoints = function (viewport) {
    var nodes = CONFIG.resonanceNodes || [];
    var points = [
      { x: viewport.width * 0.34, y: viewport.height * 0.55 }
    ];
    nodes.forEach(function (node) {
      points.push({ x: viewport.width * node.x, y: viewport.height * node.y });
    });
    points.push({ x: viewport.width * CONFIG.bellX, y: viewport.height * CONFIG.bellY });
    return points;
  };

  NS.MVPScene.prototype.drawBellPathSegment = function (graphics, from, to, index) {
    var lift = index % 2 === 0 ? -0.08 : 0.07;
    var dx = to.x - from.x;
    var cp1 = {
      x: from.x + dx * 0.38,
      y: from.y + lift * Math.abs(dx)
    };
    var cp2 = {
      x: from.x + dx * 0.66,
      y: to.y - lift * Math.abs(dx) * 0.7
    };
    graphics.moveTo(from.x, from.y);
    graphics.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, to.x, to.y);
  };

  // 重绘声路点亮进度。
  NS.MVPScene.prototype.redrawBellSoundPath = function (viewport, activeCount) {
    var state = this.state.bell;
    if (!state || !state.soundPathIdle || !state.soundPathActive) return;

    var points = this.getBellPathPoints(viewport);
    state.soundPathIdle.clear();
    state.soundPathActive.clear();

    state.soundPathIdle.lineStyle(CONFIG.soundPathWidth, CONFIG.soundPathColor, CONFIG.soundPathAlpha);
    for (var i = 0; i < points.length - 1; i += 1) {
      this.drawBellPathSegment(state.soundPathIdle, points[i], points[i + 1], i);
    }

    if (activeCount <= 0) return;

    state.soundPathActive.lineStyle(CONFIG.soundPathGlowWidth, CONFIG.soundPathColor, CONFIG.soundPathActiveAlpha * 0.14);
    for (var glowIndex = 0; glowIndex < activeCount && glowIndex < points.length - 1; glowIndex += 1) {
      this.drawBellPathSegment(state.soundPathActive, points[glowIndex], points[glowIndex + 1], glowIndex);
    }

    state.soundPathActive.lineStyle(CONFIG.soundPathWidth, CONFIG.soundPathColor, CONFIG.soundPathActiveAlpha);
    for (var lineIndex = 0; lineIndex < activeCount && lineIndex < points.length - 1; lineIndex += 1) {
      this.drawBellPathSegment(state.soundPathActive, points[lineIndex], points[lineIndex + 1], lineIndex);
    }
  };

  // 创建右侧说明面板。
  NS.MVPScene.prototype.createBellInfoPanel = function (viewport, layer) {
    var panel = new PIXI.Container();
    panel.alpha = 0;
    panel.position.set(viewport.width * 0.72, viewport.height * 0.22);
    layer.addChild(panel);

    var title = this.createText(CONFIG.infoTitle, 24, 0x16343a, 0.88);
    title.anchor.set(0, 0);
    title.style.fontFamily = BELL_TEXT_FONT;
    panel.addChild(title);

    (CONFIG.infoLines || []).forEach(function (line, i) {
      var text = new PIXI.Text(line, {
        fontFamily: BELL_TEXT_FONT,
        fontSize: 15,
        fill: 0x16343a,
        alpha: 0.72,
        lineHeight: 24,
        wordWrap: true,
        wordWrapWidth: Math.min(340, viewport.width * 0.22)
      });
      text.position.set(0, 42 + i * 36);
      panel.addChild(text);
    });

    this.state.bell.infoText = panel;
  };

  // 创建三处回声节点及其提示文案。
  NS.MVPScene.prototype.createBellResonanceNodes = function (viewport, layer) {
    var scene = this;
    var state = this.state.bell;
    var nodes = CONFIG.resonanceNodes || [];

    nodes.forEach(function (node, index) {
      var group = new PIXI.Container();
      group.position.set(viewport.width * node.x, viewport.height * node.y);
      group.eventMode = "none";
      group.cursor = "default";
      group.hitArea = new PIXI.Circle(0, 0, 36);
      group.alpha = 0.42;
      layer.addChild(group);

      var ring = new PIXI.Graphics();
      ring.lineStyle(1.4, CONFIG.ringColor, 0.52);
      ring.drawCircle(0, 0, 18);
      group.addChild(ring);

      var dot = new PIXI.Graphics();
      dot.beginFill(CONFIG.ringColor, 0.62);
      dot.drawCircle(0, 0, 5);
      dot.endFill();
      group.addChild(dot);

      var label = scene.createText(node.label, 17, 0x16343a, 0.82);
      label.anchor.set(0.5, 0);
      label.style.fontFamily = BELL_CALLIGRAPHY_FONT;
      label.style.stroke = 0xf4ecd8;
      label.style.strokeThickness = 2;
      label.position.set(0, 24);
      group.addChild(label);

      var caption = scene.createText(node.caption, 13, 0x4f3b16, 0);
      caption.anchor.set(0.5, 0);
      caption.style.fontFamily = BELL_TEXT_FONT;
      caption.style.stroke = 0xf4ecd8;
      caption.style.strokeThickness = 2;
      caption.position.set(0, 48);
      group.addChild(caption);

      var pulse = global.gsap.to(ring.scale, {
        x: 1.28,
        y: 1.28,
        duration: 1.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: index * 0.18
      });
      scene.cleanups.push(function () { pulse.kill(); });

      state.resonanceNodes.push({
        group: group,
        ring: ring,
        dot: dot,
        label: label,
        caption: caption,
        activated: false,
        pulse: pulse
      });
    });
  };

  NS.MVPScene.prototype.updateBellNodeInteractivity = function () {
    var state = this.state.bell;
    if (!state) return;
    state.resonanceNodes.forEach(function (nodeState, index) {
      var isCurrent = index === state.taps && !nodeState.activated && !state.animating;
      nodeState.group.eventMode = "none";
      nodeState.group.cursor = "default";
      global.gsap.to(nodeState.group, {
        alpha: nodeState.activated ? 0.5 : isCurrent ? 0.95 : 0.34,
        duration: 0.22,
        ease: "sine.out"
      });
      if (nodeState.caption) {
        global.gsap.to(nodeState.caption, {
          alpha: isCurrent || nodeState.activated ? CONFIG.currentNodeCaptionAlpha : 0,
          duration: 0.22,
          ease: "sine.out"
        });
      }
    });
  };

  // 自动依次触发三处回声。
  NS.MVPScene.prototype.startBellAutoSequence = function () {
    var scene = this;
    var state = this.state.bell;
    if (!state || state.autoStarted || this.completed || this.manager.completed[this.index]) return;
    state.autoStarted = true;

    for (var i = 0; i < CONFIG.totalTaps; i += 1) {
      (function (index) {
        scene.scheduleCall(CONFIG.autoStartDelay + index * CONFIG.autoStepDelay, function () {
          scene.tapBell(NS.utils.getViewport(scene.app), index);
        });
      }(i));
    }
  };

  // 触发单个回声节点，播放声、光和文本反馈。
  NS.MVPScene.prototype.tapBell = function (viewport, nodeIndex) {
    var state = this.state.bell;
    if (!state) return;
    var nodeState = state.resonanceNodes[nodeIndex];

    if (state.animating) return;
    if (!nodeState || nodeState.activated) return;
    if (nodeIndex !== state.taps) return;
    state.animating = true;
    this.updateBellNodeInteractivity();
    nodeState.activated = true;
    state.taps++;

    var nx = nodeState.group.x;
    var ny = nodeState.group.y;

    this.playBellChime(state.taps);

    global.gsap.to(state.bell.scale, {
      x: state.bell.scale.x * CONFIG.tapScale,
      y: state.bell.scale.y * CONFIG.tapScale,
      duration: 0.14,
      yoyo: true,
      repeat: 1,
      ease: "sine.inOut"
    });

    var ringCount = state.taps;
    this.markBellNodeActive(nodeState);
    this.redrawBellSoundPath(viewport, state.taps);
    this.spawnBellRing(nx, ny, CONFIG.ringMaxRadius * (0.55 + ringCount * 0.14), state.ringLayer);
    this.spawnBellGoldTrace(nx, ny, state.effectLayer, viewport, state.taps);

    if (state.taps === 1) {
      this.showBellPoemEcho(nx, ny, viewport, state.effectLayer);
    }

    if (state.taps === 2 && !state.flashbackShown) {
      state.flashbackShown = true;
      this.showBellFlashback(viewport, state.flashbackLayer);
    }

    if (state.taps >= CONFIG.totalTaps) {
      this.completeBell(viewport);
    } else {
      this.setHint(CONFIG.tapHints[state.taps - 1] || "钟声入水");
      var scene = this;
      this.scheduleCall(CONFIG.tapLockDuration, function () {
        state.animating = false;
        scene.updateBellNodeInteractivity();
      });
    }
  };

  NS.MVPScene.prototype.markBellNodeActive = function (nodeState) {
    nodeState.group.eventMode = "none";
    nodeState.group.cursor = "default";
    global.gsap.killTweensOf(nodeState.ring.scale);
    if (nodeState.pulse) {
      nodeState.pulse.kill();
    }
    global.gsap.to(nodeState.ring, { alpha: 0.28, duration: 0.24 });
    global.gsap.to(nodeState.dot.scale, { x: 1.45, y: 1.45, duration: 0.24, yoyo: true, repeat: 1, ease: "sine.inOut" });
    global.gsap.to(nodeState.label, { alpha: CONFIG.activeNodeAlpha, duration: 0.24 });
    if (nodeState.caption) {
      global.gsap.to(nodeState.caption, { alpha: CONFIG.currentNodeCaptionAlpha, duration: 0.24 });
    }
  };

  NS.MVPScene.prototype.showBellPoemEcho = function (x, y, viewport, layer) {
    var scene = this;
    var chars = CONFIG.poemEchoChars || [];
    var radius = Math.min(viewport.width, viewport.height) * 0.22;

    chars.forEach(function (char, i) {
      var angle = -0.85 + i * 0.24;
      var label = scene.createText(char, CONFIG.poemEchoFontSize, 0xe8e1d2, 0);
      label.anchor.set(0.5);
      label.style.fontFamily = BELL_CALLIGRAPHY_FONT;
      label.style.stroke = 0x1d332c;
      label.style.strokeThickness = 2;
      label.style.dropShadow = true;
      label.style.dropShadowColor = "#c8a45d";
      label.style.dropShadowAlpha = 0.26;
      label.style.dropShadowBlur = 8;
      label.style.dropShadowDistance = 0;
      label.position.set(x, y);
      layer.addChild(label);

      global.gsap.to(label, {
        alpha: CONFIG.poemEchoAlpha,
        duration: 0.24,
        delay: i * 0.035,
        ease: "sine.out"
      });
      global.gsap.to(label.position, {
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius * 0.46,
        duration: CONFIG.poemEchoSpreadDuration,
        delay: i * 0.035,
        ease: "power2.out"
      });
      global.gsap.to(label, {
        alpha: 0,
        duration: CONFIG.poemEchoFadeDuration,
        delay: CONFIG.poemEchoSpreadDuration + CONFIG.poemEchoHoldDuration + i * 0.035,
        ease: "sine.in",
        onComplete: function () {
          if (!label.destroyed) label.destroy();
        }
      });
    });
  };

  NS.MVPScene.prototype.spawnBellGoldTrace = function (x, y, container, viewport, tapIndex) {
    var texture = this.app.assets.get("bellGoldTrace");
    if (!texture) return;

    var trace = new PIXI.Sprite(texture);
    trace.anchor.set(0.5);
    trace.alpha = 0;
    trace.blendMode = PIXI.BLEND_MODES.SCREEN != null ? PIXI.BLEND_MODES.SCREEN : PIXI.BLEND_MODES.ADD;

    var targetWidth = viewport.width * CONFIG.goldTraceWidthRatio;
    var baseScale = targetWidth / trace.texture.width;
    trace.scale.set(baseScale * 0.78);
    trace.rotation = -0.18 + (tapIndex - 1) * 0.13;
    trace.position.set(
      x + viewport.width * CONFIG.goldTraceOffsetX,
      y + viewport.height * CONFIG.goldTraceOffsetY
    );
    container.addChild(trace);

    global.gsap.to(trace, {
      alpha: CONFIG.goldTraceAlpha,
      duration: 0.16,
      ease: "sine.out"
    });
    global.gsap.to(trace.scale, {
      x: baseScale * 1.18,
      y: baseScale * 1.18,
      duration: CONFIG.goldTraceDuration,
      ease: "power2.out"
    });
    global.gsap.to(trace, {
      alpha: 0,
      rotation: trace.rotation + 0.08,
      duration: CONFIG.goldTraceDuration,
      delay: 0.18,
      ease: "sine.inOut",
      onComplete: function () {
        if (!trace.destroyed) trace.destroy();
      }
    });
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
    var positions = [
      { x: 0.35, y: 0.35 },
      { x: 0.76, y: 0.36 },
      { x: 0.68, y: 0.68 },
      { x: 0.38, y: 0.7 }
    ];

    CONFIG.flashbackAssets.forEach(function (key, i) {
      var tex = scene.app.assets.get(key);
      if (!tex) return;
      var sprite = new PIXI.Sprite(tex);
      sprite.anchor.set(0.5);
      sprite.alpha = 0;
      var targetWidth = viewport.width * 0.085;
      sprite.scale.set(targetWidth / sprite.texture.width);
      sprite.position.set(viewport.width * positions[i].x, viewport.height * positions[i].y);
      layer.addChild(sprite);

      global.gsap.to(sprite, {
        alpha: CONFIG.flashbackAlpha,
        duration: CONFIG.flashbackDuration * 0.4,
        delay: i * 0.3,
        ease: "sine.out"
      });
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

  // 三处回声完成后进入和鸣完成态。
  NS.MVPScene.prototype.completeBell = function (viewport) {
    var state = this.state.bell;
    var cx = viewport.width * CONFIG.bellX;
    var cy = viewport.height * CONFIG.bellY;
    var ritualNode = state.resonanceNodes[CONFIG.totalTaps - 1];
    if (ritualNode) {
      cx = ritualNode.group.x;
      cy = ritualNode.group.y;
    }

    state.bell.eventMode = "none";
    state.animating = false;
    this.updateBellNodeInteractivity();
    this.setHint(CONFIG.completeHint);

    this.redrawBellSoundPath(viewport, CONFIG.totalTaps + 1);
    this.spawnBellRing(cx, cy, CONFIG.ringMaxRadius * 1.5, state.ringLayer);
    this.showBellInfoPanel(true);
    this.finish(true);
  };

  // 重入已完成场景时恢复静态完成态。
  NS.MVPScene.prototype.prepareBellCompletedState = function (animate) {
    var state = this.state.bell;
    if (!state) return;
    state.taps = CONFIG.totalTaps;
    state.animating = false;
    state.resonanceNodes.forEach(function (nodeState) {
      nodeState.activated = true;
      nodeState.group.eventMode = "none";
      nodeState.group.cursor = "default";
      if (nodeState.pulse) {
        nodeState.pulse.kill();
      }
      nodeState.group.alpha = 0.5;
      nodeState.ring.alpha = 0.28;
      nodeState.label.alpha = CONFIG.activeNodeAlpha;
      if (nodeState.caption) {
        nodeState.caption.alpha = CONFIG.currentNodeCaptionAlpha;
      }
    });
    if (state.group) {
      state.group.alpha = 1;
    }
    this.redrawBellSoundPath(NS.utils.getViewport(this.app), CONFIG.totalTaps + 1);
    this.showBellInfoPanel(animate !== false);
  };

  NS.MVPScene.prototype.showBellInfoPanel = function (animate) {
    var state = this.state.bell;
    if (!state || !state.infoText) return;
    global.gsap.killTweensOf(state.infoText);
    if (animate === false) {
      state.infoText.alpha = 0.78;
      return;
    }
    global.gsap.to(state.infoText, { alpha: 0.78, duration: 0.48, ease: "sine.out" });
  };

  // 视口变化时重排节点、声路和面板。
  NS.MVPScene.prototype.updateBellLayout = function (viewport) {
    var state = this.state.bell;
    if (!state) return;

    if (state.stagePattern) {
      var patternWidth = viewport.width * CONFIG.stagePatternWidthRatio;
      state.stagePattern.scale.set(patternWidth / state.stagePattern.texture.width);
      state.stagePattern.position.set(viewport.width * CONFIG.stagePatternX, viewport.height * CONFIG.stagePatternY);
    }

    if (state.bell) {
      var bellWidth = viewport.width * CONFIG.bellWidthRatio;
      state.bell.scale.set(bellWidth / state.bell.texture.width);
      state.bell.position.set(viewport.width * CONFIG.bellX, viewport.height * CONFIG.bellY);
    }

    if (state.infoText) {
      state.infoText.position.set(viewport.width * 0.72, viewport.height * 0.22);
      state.infoText.children.forEach(function (child) {
        if (child.style && child.style.wordWrap) {
          child.style.wordWrapWidth = Math.min(340, viewport.width * 0.22);
        }
      });
    }

    state.resonanceNodes.forEach(function (nodeState, index) {
      var node = CONFIG.resonanceNodes[index];
      if (!node) return;
      nodeState.group.position.set(viewport.width * node.x, viewport.height * node.y);
    });

    if (state.knowledgeDot) {
      state.knowledgeDot.position.set(viewport.width * CONFIG.knowledgeDotX, viewport.height * CONFIG.knowledgeDotY);
    }

    this.redrawBellSoundPath(viewport, this.completed ? CONFIG.totalTaps + 1 : state.taps);
  };

  // 离场过渡：将礼乐回声收束到尾声印记。
  NS.MVPScene.prototype.playBellExitTransition = function () {
    var scene = this;
    var state = this.state.bell;
    var viewport = NS.utils.getViewport(this.app);
    if (!state || state.exiting) return;
    state.exiting = true;
    this.app.dom.clearAction();
    this.setHint(CONFIG.completeHint);

    var cx = viewport.width * CONFIG.bellX;
    var cy = viewport.height * CONFIG.bellY;
    var ritualNode = state.resonanceNodes[CONFIG.totalTaps - 1];
    if (ritualNode) {
      cx = ritualNode.group.x;
      cy = ritualNode.group.y;
    }

    this.spawnBellRing(cx, cy, CONFIG.ringMaxRadius * 1.5, state.ringLayer);
    this.redrawBellSoundPath(viewport, CONFIG.totalTaps + 1);
    this.showBellSealPrelude(cx, cy, viewport, state.effectLayer);

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

    global.gsap.to(state.flashbackLayer, {
      alpha: 0,
      duration: 0.8,
      delay: CONFIG.convergeDuration * 0.5
    });
    if (state.infoText) {
      global.gsap.to(state.infoText, { alpha: 0, duration: 0.46, ease: "sine.in" });
    }
    if (this.knowledgeText) {
      global.gsap.to(this.knowledgeText, { alpha: 0, duration: 0.32, ease: "sine.in" });
    }
    if (state.knowledgeDot) {
      global.gsap.to(state.knowledgeDot, { alpha: 0, duration: 0.32, ease: "sine.in" });
      state.knowledgeDot.eventMode = "none";
    }

    this.scheduleCall(CONFIG.convergeDuration + 0.8, function () {
      scene.manager.goTo(scene.index + 1);
    });
  };

  NS.MVPScene.prototype.showBellSealPrelude = function (x, y, viewport, layer) {
    var scene = this;
    var chars = CONFIG.sealPreludeChars || [];
    var radius = Math.min(viewport.width, viewport.height) * 0.08;

    chars.forEach(function (char, i) {
      var angle = -Math.PI / 2 + i * (Math.PI * 2 / Math.max(1, chars.length));
      var label = scene.createText(char, 20, 0xc8a45d, 0);
      label.anchor.set(0.5);
      label.style.fontFamily = BELL_CALLIGRAPHY_FONT;
      label.style.stroke = 0x1d332c;
      label.style.strokeThickness = 2;
      label.position.set(
        x + Math.cos(angle) * radius * 2.4,
        y + Math.sin(angle) * radius * 1.5
      );
      layer.addChild(label);

      global.gsap.to(label, {
        alpha: 0.78,
        duration: 0.32,
        delay: 0.28 + i * 0.08,
        ease: "sine.out"
      });
      global.gsap.to(label.position, {
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        duration: CONFIG.convergeDuration,
        delay: 0.45,
        ease: "power2.inOut"
      });
      global.gsap.to(label, {
        alpha: 0,
        duration: 0.48,
        delay: CONFIG.convergeDuration + 0.6,
        ease: "sine.in",
        onComplete: function () {
          if (!label.destroyed) label.destroy();
        }
      });
    });
  };
  // ═══════════════════════════════════════════════
  // 编钟合成音
  // ═══════════════════════════════════════════════

  /**
   * Web Audio 合成编钟音，三次触钟递进：
   * 第一声：单谐波 440Hz（偏轻）
   * 第二声：双谐波 440+880Hz
   * 第三声：三谐波 440+880+1320Hz，衰减延长至 2.4s
   */
  // 合成编钟短音。
  NS.MVPScene.prototype.playBellChime = function (tapIndex) {
    var state = this.state.bell;
    var AudioContextClass = global.AudioContext || global.webkitAudioContext;
    if (!AudioContextClass) return;
    if (this.app && this.app.audio) {
      this.app.audio.duck(tapIndex >= 3 ? 0.38 : 0.52, 360, tapIndex >= 3 ? 2600 : 1500);
    }
    if (!state.audioContext) {
      state.audioContext = new AudioContextClass();
    }
    var context = state.audioContext;
    if (context.state === "suspended" && context.resume) {
      context.resume();
    }

    var now = context.currentTime;
    var base = CONFIG.chimeBaseFreq;
    var harmonics = tapIndex >= 3 ? [base, base * 2, base * 3]
                  : tapIndex >= 2 ? [base, base * 2]
                  : [base];
    var duration = tapIndex >= 3 ? CONFIG.chimeFinalDuration : CONFIG.chimeDuration;
    var peakGain = CONFIG.chimePeakGain / harmonics.length;

    harmonics.forEach(function (freq, index) {
      var osc = context.createOscillator();
      var gain = context.createGain();
      osc.type = index === 0 ? "triangle" : index === 1 ? "sine" : "square";
      osc.frequency.setValueAtTime(freq, now);
      if (osc.detune) {
        osc.detune.setValueAtTime(index * 6 - 4, now);
      }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(index === 2 ? peakGain * 0.45 : peakGain, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    });
  };

  // ═══════════════════════════════════════════════
  // 轻知识光点
  // ═══════════════════════════════════════════════

  /**
   * 完成态在声波边缘显示呼吸光点，用户点击后展开轻知识文案。
   * 遵循交互串联的"随物解锁"模型。
   */
  NS.MVPScene.prototype.showBellKnowledgeDot = function (animate) {
    var scene = this;
    var state = this.state.bell;
    var viewport = NS.utils.getViewport(this.app);

    if (!state || state.knowledgeDot) return;

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
      scene.revealBellKnowledge();
    });
  };

  /** 点击光点后展开轻知识文案，数秒后淡出；光点保留可再次查看。 */
  NS.MVPScene.prototype.revealBellKnowledge = function () {
    var state = this.state.bell;
    if (state && state.knowledgeDot) {
      global.gsap.to(state.knowledgeDot, { alpha: 0.48, duration: 0.24 });
    }
    if (this.knowledgeText) {
      global.gsap.killTweensOf(this.knowledgeText);
      this.knowledgeText.alpha = 0;
      global.gsap.to(this.knowledgeText, { alpha: 0.86, duration: 0.45 });
      global.gsap.to(this.knowledgeText, {
        alpha: 0,
        duration: 0.45,
        delay: CONFIG.knowledgeVisibleDuration,
        ease: "sine.in"
      });
    }
  };

  // 关闭和鸣场景独立音频上下文。
  NS.MVPScene.prototype.closeBellAudio = function () {
    var state = this.state.bell;
    if (!state || !state.audioContext || !state.audioContext.close) return;
    state.audioContext.close();
    state.audioContext = null;
  };

}(window));
