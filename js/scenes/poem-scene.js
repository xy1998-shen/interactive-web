// 第五幕问诗：每轮点选三字成诗，可多次再问并以诗字声波过渡到和鸣。
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};
  var CONFIG = NS.CONFIG.poem;

  // 三字组合到诗句的查找表（key 为字典序）
  var POEM_DB = {
    "江舟艾": "江风拂艾，五月入舟。",
    "江舟风": "舟影穿雾，楚水生光。",
    "艾钟风": "艾香近岸，钟波向远。",
    "月江青": "月落江心，字起成诗。",
    "舟青鼓": "青叶藏愿，鼓声过江。",
    "月艾风": "风过艾叶，江月生凉。",
    "月钟青": "钟影未至，诗已入水。",
    "江风鼓": "鼓声入水，江风留痕。",
    "月江风": "江月照清波，晚风入楚歌。",
    "艾青风": "青艾随风远，清气满江天。",
    "舟风鼓": "鼓动风生浪，龙舟过楚江。",
    "江艾钟": "艾香随钟远，楚江起回声。",
    "江钟风": "江风送钟韵，楚声到水边。",
    "舟艾鼓": "艾束舟头挂，鼓催江上行。",
    "钟风鼓": "鼓歇钟声起，风定水波平。"
  };

  // 未命中组合时按首字兜底
  var FALLBACK_POEMS = {
    "江": "楚江水渐静，字影向人来。",
    "艾": "一束清艾意，入水也生香。",
    "舟": "舟过水痕远，余声问短诗。",
    "鼓": "鼓声沉入水，字粒慢浮青。",
    "风": "风过楚江畔，轻字起微澜。",
    "月": "月落江心处，清辉照未央。",
    "青": "青波藏旧愿，一字一回声。",
    "钟": "钟影尚未至，诗声已入水。"
  };

  // 预排序 key 列表，保证 2 字降级匹配在所有引擎上顺序一致
  var POEM_DB_KEYS = Object.keys(POEM_DB).sort();
  var POEM_FONT_STACK = "STKaiti, Kaiti SC, KaiTi, Songti SC, STSong, Noto Serif CJK SC, serif";

  function matchPoem(selected) {
    if (!selected || !selected.length) {
      return "";
    }

    var sorted = selected.slice().sort().join("");
    if (POEM_DB[sorted]) return POEM_DB[sorted];

    for (var i = 0; i < POEM_DB_KEYS.length; i += 1) {
      var count = 0;
      for (var j = 0; j < selected.length; j += 1) {
        if (POEM_DB_KEYS[i].indexOf(selected[j]) >= 0) count += 1;
      }
      if (count >= 2) return POEM_DB[POEM_DB_KEYS[i]];
    }

    return FALLBACK_POEMS[selected[0]] || "字从水起，风过楚江。";
  }

  function setInteractive(label, enabled) {
    if (!label) return;
    label.eventMode = enabled ? "static" : "none";
    label.cursor = enabled ? "pointer" : "default";
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatPoemForAxis(poem) {
    if (!poem) return "";
    return poem.replace("，", "，\n").replace("。", "。");
  }

  function formatSeedForAxis(words) {
    return (words || []).join("\n");
  }

  function stylePoemText(label, strokeColor, strokeThickness, shadowAlpha) {
    if (!label || !label.style) return label;
    label.style.fontFamily = POEM_FONT_STACK;
    label.style.stroke = strokeColor == null ? 0x16343a : strokeColor;
    label.style.strokeThickness = strokeThickness == null ? 3 : strokeThickness;
    label.style.dropShadow = true;
    label.style.dropShadowColor = "#f4ecd8";
    label.style.dropShadowBlur = 8;
    label.style.dropShadowAlpha = shadowAlpha == null ? 0.34 : shadowAlpha;
    label.style.dropShadowDistance = 0;
    return label;
  }

  function drawInkAxisPaper(paper, width, height) {
    var left = -width / 2;
    var top = -height / 2;
    paper.clear();
    paper.beginFill(0xf1ead6, 0.16);
    paper.drawRoundedRect(left + 8, top + 10, width - 16, height - 20, 4);
    paper.endFill();

    paper.beginFill(0xe8e1d2, 0.1);
    paper.drawEllipse(left + width * 0.42, top + height * 0.42, width * 0.36, height * 0.45);
    paper.drawEllipse(left + width * 0.62, top + height * 0.57, width * 0.3, height * 0.36);
    paper.endFill();

    paper.lineStyle(9, 0xf4ecd8, 0.13);
    paper.moveTo(left + 26, top + 24);
    paper.bezierCurveTo(left + width * 0.25, top + 12, left + width * 0.64, top + 30, left + width - 30, top + 18);
    paper.moveTo(left + 34, top + height - 22);
    paper.bezierCurveTo(left + width * 0.3, top + height - 8, left + width * 0.62, top + height - 34, left + width - 38, top + height - 18);

    paper.lineStyle(1.2, 0xc8a45d, 0.3);
    paper.moveTo(left + 38, top + 28);
    paper.bezierCurveTo(left + width * 0.28, top + 24, left + width * 0.58, top + 34, left + width - 42, top + 26);
    paper.moveTo(left + 38, top + height - 30);
    paper.bezierCurveTo(left + width * 0.33, top + height - 22, left + width * 0.64, top + height - 34, left + width - 42, top + height - 26);

    paper.lineStyle(4, 0xc8a45d, 0.34);
    paper.moveTo(left + 18, top + 18);
    paper.bezierCurveTo(left + 14, top + height * 0.34, left + 20, top + height * 0.68, left + 16, top + height - 18);
    paper.moveTo(left + width - 18, top + 18);
    paper.bezierCurveTo(left + width - 13, top + height * 0.34, left + width - 22, top + height * 0.68, left + width - 16, top + height - 18);

    paper.lineStyle(1, 0x16343a, 0.08);
    paper.moveTo(left + 44, top + height * 0.5);
    paper.bezierCurveTo(left + width * 0.32, top + height * 0.43, left + width * 0.68, top + height * 0.58, left + width - 46, top + height * 0.48);
  }

  NS.MVPScene.prototype.buildPoem = function (viewport) {
    var scene = this;
    var words = CONFIG.words || [];
    var group = new PIXI.Container();
    this.content.addChild(group);

    this.state.poem = {
      selected: [],
      selectedLabels: [],
      labels: [],
      group: group,
      startTime: performance.now(),
      animating: true,
      roundComplete: false,
      transitioning: false,
      lastKnowledgeAt: 0,
      currentPoem: ""
    };

    if (!words.length) {
      this.setHint("字从水起，风过楚江。");
      return;
    }

    this.createPoemAtmosphere(viewport, group);
    this.createPoemEntryText(viewport, group);
    this.createPoemWords(viewport, group, words);
    this.createPoemResultText(viewport, group);
    this.createPoemKeyword(viewport, group);
    this.createPoemRetry(viewport, group);

    this.setHint(CONFIG.hintText);
    this.state.poem.floatActive = true;
    this.app.pixiApp.ticker.add(this.updatePoemFloat, this);
    this.cleanups.push(function () {
      if (scene.state.poem && scene.state.poem.floatActive) {
        scene.state.poem.floatActive = false;
        scene.app.pixiApp.ticker.remove(scene.updatePoemFloat, scene);
      }
    });
  };

  NS.MVPScene.prototype.createPoemAtmosphere = function (viewport, group) {
    this.createPoemWakeTrace(viewport, group);
    this.createPoemBellPreview(viewport, group);
  };

  NS.MVPScene.prototype.createPoemWakeTrace = function (viewport, group) {
    var wake = new PIXI.Graphics();
    var centerX = viewport.width * 0.5;
    var y = viewport.height * CONFIG.wakeStartY;
    var leftX = viewport.width * 0.26;
    var rightX = viewport.width * 0.74;

    wake.lineStyle(CONFIG.wakeLineWidth, CONFIG.wakeLineColor, CONFIG.wakeLineAlpha);
    wake.moveTo(leftX, y + 26);
    wake.bezierCurveTo(centerX - viewport.width * 0.18, y - 30, centerX + viewport.width * 0.12, y + 36, rightX, y - 10);
    wake.lineStyle(1.3, CONFIG.wakeLineColor, CONFIG.wakeLineAlpha * 0.72);
    wake.moveTo(leftX + viewport.width * 0.08, y + 52);
    wake.bezierCurveTo(centerX - viewport.width * 0.1, y + 4, centerX + viewport.width * 0.18, y + 58, rightX - viewport.width * 0.06, y + 28);
    wake.alpha = 0;
    group.addChild(wake);
    this.state.poem.wakeTrace = wake;

    global.gsap.to(wake, { alpha: 1, duration: 0.9, ease: "sine.out" });
    global.gsap.fromTo(wake.scale, { x: 0.86, y: 0.94 }, {
      x: 1,
      y: 1,
      duration: 1.15,
      ease: "sine.out"
    });
  };

  NS.MVPScene.prototype.createPoemBellPreview = function (viewport, group) {
    var bell = new PIXI.Sprite(this.app.assets.get("bell"));
    bell.anchor.set(0.5);
    var targetWidth = viewport.width * CONFIG.bellPreviewWidthRatio;
    bell.scale.set(targetWidth / bell.texture.width);
    bell.position.set(viewport.width * CONFIG.bellPreviewX, viewport.height * CONFIG.bellPreviewY);
    bell.alpha = 0;
    group.addChild(bell);
    this.state.poem.bellPreview = bell;
  };

  NS.MVPScene.prototype.createPoemEntryText = function (viewport, group) {
    var entry = stylePoemText(this.createText(CONFIG.entryText, CONFIG.entryTextFontSize, 0xe8e1d2, 0), 0x16343a, 2, 0.26);
    entry.anchor.set(0.5);
    entry.position.set(viewport.width * 0.5, viewport.height * CONFIG.entryTextY);
    group.addChild(entry);
    this.state.poem.entry = entry;
    global.gsap.to(entry, { alpha: 0.72, duration: 0.8, ease: "sine.out" });
    global.gsap.to(entry, { alpha: 0, duration: 0.8, delay: 2.4, ease: "sine.in" });
  };

  NS.MVPScene.prototype.createPoemWords = function (viewport, group, words) {
    var scene = this;
    var cx = viewport.width * CONFIG.gridCenterX;
    var cy = viewport.height * CONFIG.gridCenterY;
    var radius = Math.min(viewport.width, viewport.height) * CONFIG.gridRadius;
    var wordSlots = CONFIG.wordSlots || [];

    words.forEach(function (word, index) {
      var angle = (index / words.length) * Math.PI * 2 - Math.PI / 2;
      var slot = wordSlots.filter(function (item) { return item.word === word; })[0];
      var baseX = slot ? viewport.width * slot.x : cx + Math.cos(angle) * radius;
      var baseY = slot ? viewport.height * slot.y : cy + Math.sin(angle) * radius;
      var label = stylePoemText(scene.createText(word, CONFIG.fontSize, 0xf1ead6, 0), 0x16343a, 4, 0.4);

      label.anchor.set(0.5);
      var wakeIndex = (CONFIG.wakeWords || []).indexOf(word);
      var startX = baseX;
      var startY = baseY + 14;
      var delay = 0.72 + index * 0.05;
      if (wakeIndex >= 0) {
        startX = viewport.width * (CONFIG.wakeStartX + wakeIndex * CONFIG.wakeGapX);
        startY = viewport.height * CONFIG.wakeStartY + (wakeIndex % 2) * 22 + CONFIG.wakeFloatY;
        delay = 0.3 + wakeIndex * 0.08;
      }

      label.position.set(startX, startY);
      label.eventMode = "static";
      label.cursor = "pointer";
      label.hitArea = new PIXI.Circle(0, 0, Math.max(32, CONFIG.fontSize * 0.9));
      label._baseX = baseX;
      label._baseY = baseY;
      label._baseAlpha = 0.82;
      label._baseScaleX = label.scale.x;
      label._baseScaleY = label.scale.y;
      label._floatOffset = index * 0.8;
      label._word = word;
      label.selected = false;

      label.on("pointertap", function () {
        scene.selectPoemWord(label);
      });

      group.addChild(label);
      scene.state.poem.labels.push(label);
      global.gsap.to(label, {
        alpha: label._baseAlpha,
        x: baseX,
        y: baseY,
        duration: 0.7,
        delay: delay,
        ease: "sine.out"
      });
    });
  };

  NS.MVPScene.prototype.createPoemResultText = function (viewport, group) {
    var result = new PIXI.Container();
    result.alpha = 0;
    result._baseY = viewport.height * CONFIG.resultY;
    group.addChild(result);
    this.state.poem.result = result;

    var complete = stylePoemText(this.createText(CONFIG.completeText, 18, 0xc8a45d, 0), 0x16343a, 2, 0.24);
    complete.anchor.set(0.5);
    complete.position.set(viewport.width * CONFIG.resultX, viewport.height * (CONFIG.resultY - 0.075));
    group.addChild(complete);
    this.state.poem.completeText = complete;
  };

  NS.MVPScene.prototype.createPoemKeyword = function (viewport, group) {
    var scene = this;
    var keyword = stylePoemText(this.createText(CONFIG.keywordText, CONFIG.keywordFontSize, 0x16343a, 0), 0xf4ecd8, 3, 0.32);
    keyword.anchor.set(0.5);
    keyword.position.set(viewport.width * CONFIG.keywordX, viewport.height * CONFIG.keywordY);
    keyword.hitArea = new PIXI.Rectangle(-120, -20, 240, 40);
    keyword.on("pointertap", function () {
      scene.revealPoemKnowledge();
    });
    keyword.on("pointerover", function () {
      scene.revealPoemKnowledge();
    });
    setInteractive(keyword, false);
    group.addChild(keyword);
    this.state.poem.keyword = keyword;
  };

  NS.MVPScene.prototype.createPoemRetry = function (viewport, group) {
    var scene = this;
    var retry = stylePoemText(this.createText(CONFIG.retryText, CONFIG.retryFontSize, 0xf1ead6, 0), 0x16343a, 2, 0.24);
    retry.anchor.set(0.5);
    retry.position.set(viewport.width * CONFIG.retryX, viewport.height * CONFIG.retryY);
    retry.hitArea = new PIXI.Rectangle(-70, -22, 140, 44);
    retry.on("pointertap", function () {
      scene.resetPoemRound();
    });
    setInteractive(retry, false);
    group.addChild(retry);
    this.state.poem.retry = retry;
  };

  NS.MVPScene.prototype.updatePoemFloat = function () {
    var state = this.state.poem;
    if (!state || !state.animating) return;

    var elapsed = performance.now() - state.startTime;
    state.labels.forEach(function (label) {
      if (label.selected) return;
      var ox = Math.sin(elapsed * CONFIG.floatSpeedX + label._floatOffset) * CONFIG.floatAmplitudeX;
      var oy = Math.cos(elapsed * CONFIG.floatSpeedY + label._floatOffset * 1.3) * CONFIG.floatAmplitudeY;
      label.x = label._baseX + ox;
      label.y = label._baseY + oy;
    });
  };

  NS.MVPScene.prototype.selectPoemWord = function (label) {
    var state = this.state.poem;
    if (!state || state.transitioning || state.roundComplete || !label) return;

    if (label.selected) {
      this.deselectPoemWord(label);
      return;
    }
    if (state.selected.length >= CONFIG.targetWords) return;

    label.selected = true;
    state.selected.push(label._word);
    state.selectedLabels.push(label);

    this.activatePoemLabel(label);
    this.drawRing(label.x, label.y, 50, 0xc8a45d);
    this.spawnPoemInkRipple(label.x, label.y, label._word === "艾" ? 0.84 : 0.72);

    if (state.selected.length >= CONFIG.targetWords) {
      this.completePoemRound();
    } else {
      this.setHint(CONFIG.hintText);
    }
  };

  NS.MVPScene.prototype.activatePoemLabel = function (label) {
    global.gsap.killTweensOf(label);
    global.gsap.killTweensOf(label.scale);
    global.gsap.to(label, {
      x: label._baseX,
      y: label._baseY - 20,
      alpha: 1,
      duration: CONFIG.selectDuration,
      ease: "power2.out"
    });
    global.gsap.to(label.scale, {
      x: CONFIG.selectedScale,
      y: CONFIG.selectedScale,
      duration: CONFIG.selectDuration,
      ease: "sine.out"
    });
    label.style.fill = CONFIG.selectedColor;
  };

  NS.MVPScene.prototype.deselectPoemWord = function (label) {
    var state = this.state.poem;
    if (!state || state.roundComplete || !label || !label.selected) return;

    label.selected = false;
    state.selected = state.selected.filter(function (word) { return word !== label._word; });
    state.selectedLabels = state.selectedLabels.filter(function (item) { return item !== label; });
    this.resetPoemLabel(label, CONFIG.cancelDropDuration);
  };

  NS.MVPScene.prototype.resetPoemLabel = function (label, duration) {
    if (!label) return;
    global.gsap.killTweensOf(label);
    global.gsap.killTweensOf(label.scale);
    label.style.fill = 0xf1ead6;
    label.selected = false;
    global.gsap.to(label, {
      x: label._baseX,
      y: label._baseY,
      alpha: label._baseAlpha,
      duration: duration,
      ease: "sine.out"
    });
    global.gsap.to(label.scale, {
      x: label._baseScaleX,
      y: label._baseScaleY,
      duration: duration,
      ease: "sine.out"
    });
  };

  NS.MVPScene.prototype.completePoemRound = function () {
    var scene = this;
    var state = this.state.poem;
    if (!state || state.roundComplete) return;

    state.roundComplete = true;
    state.currentPoem = matchPoem(state.selected);
    this.setHint("");

    state.labels.forEach(function (label) {
      setInteractive(label, false);
      global.gsap.killTweensOf(label);
      global.gsap.killTweensOf(label.scale);
      global.gsap.to(label, { alpha: 0, y: label.y - 12, duration: 0.34, ease: "sine.in" });
    });

    this.showPoemResult(state.currentPoem, function () {
      var viewport = NS.utils.getViewport(scene.app);
      scene.spawnPoemInkRipple(viewport.width * CONFIG.resultX, viewport.height * CONFIG.resultY, 1);
      scene.showPoemRoundControls();
      if (!scene.completed) {
        scene.finish(true);
      }
    });
  };

  NS.MVPScene.prototype.showPoemResult = function (poem, onComplete) {
    var state = this.state.poem;
    if (!state || !state.result) return;

    global.gsap.killTweensOf(state.result);
    this.clearPoemResult();
    state.result.y = 0;
    this.drawPoemAxisResult(poem || "");
    state.result.alpha = 0;

    if (state.entry) {
      global.gsap.killTweensOf(state.entry);
      global.gsap.to(state.entry, { alpha: 0, duration: 0.18, ease: "sine.out" });
    }
    if (state.completeText) {
      global.gsap.killTweensOf(state.completeText);
      global.gsap.to(state.completeText, { alpha: 0, duration: 0.18, ease: "sine.out" });
    }

    global.gsap.to(state.result, {
      alpha: 1,
      duration: CONFIG.resultFadeDuration,
      delay: 0.08,
      ease: "power2.out",
      onComplete: onComplete
    });
  };

  NS.MVPScene.prototype.clearPoemResult = function () {
    var state = this.state.poem;
    if (!state || !state.result) return;

    state.result.removeChildren().forEach(function (child) {
      global.gsap.killTweensOf(child);
      if (child.scale) {
        global.gsap.killTweensOf(child.scale);
      }
      if (!child.destroyed) {
        child.destroy({ children: true });
      }
    });
    state.poemChars = [];
    state.poemAxis = null;
  };

  NS.MVPScene.prototype.drawPoemAxisResult = function (poem) {
    var state = this.state.poem;
    if (!state || !state.result || !poem) return;

    var viewport = NS.utils.getViewport(this.app);
    var axis = new PIXI.Container();
    var centerX = viewport.width * CONFIG.resultX;
    var centerY = viewport.height * CONFIG.resultY;
    var width = clamp(viewport.width * CONFIG.poemAxisWidthRatio, CONFIG.poemAxisMinWidth, CONFIG.poemAxisMaxWidth);
    var height = CONFIG.poemAxisHeight;
    var paper = new PIXI.Graphics();
    var seed = stylePoemText(this.createText(formatSeedForAxis(state.selected), CONFIG.poemAxisSeedFontSize, 0xc8a45d, 0), 0xf1ead6, 2, 0.22);
    var text = stylePoemText(this.createText(formatPoemForAxis(poem), CONFIG.poemAxisTextFontSize, 0x16343a, 0), 0xf1ead6, 2, 0.24);

    axis.position.set(centerX, centerY);
    drawInkAxisPaper(paper, width, height);
    paper.pivot.set(0, 0);
    paper.scale.x = 0.04;

    seed.anchor.set(0.5);
    seed.style.lineHeight = Math.round(CONFIG.poemAxisSeedFontSize * 1.55);
    seed.style.align = "center";
    seed.style.fontFamily = POEM_FONT_STACK;
    seed.style.fontSize = CONFIG.poemAxisSeedFontSize + 2;
    seed.style.fill = 0xc8a45d;
    seed.style.strokeThickness = 1.2;
    seed.style.dropShadowBlur = 5;
    seed.style.dropShadowAlpha = 0.18;
    seed.position.set(-width / 2 + 52, 0);
    text.anchor.set(0.5);
    text.style.align = "center";
    text.style.lineHeight = CONFIG.poemAxisLineHeight;
    text.style.fontFamily = POEM_FONT_STACK;
    text.style.fontSize = CONFIG.poemAxisTextFontSize + 4;
    text.style.fontWeight = "500";
    text.style.fill = 0x16343a;
    text.style.stroke = 0xe8e1d2;
    text.style.strokeThickness = 0.8;
    text.style.dropShadowBlur = 6;
    text.style.dropShadowAlpha = 0.16;
    text.position.set(32, 0);

    axis.alpha = 0;
    axis.addChild(paper);
    axis.addChild(seed);
    axis.addChild(text);
    state.result.addChild(axis);
    state.poemAxis = axis;
    state.poemChars = [seed, text];

    global.gsap.to(axis, { alpha: 1, duration: 0.18, ease: "sine.out" });
    global.gsap.to(paper.scale, { x: 1, duration: 0.72, ease: "power2.out" });
    global.gsap.to(seed, { alpha: 0.9, duration: 0.36, delay: 0.48, ease: "sine.out" });
    global.gsap.to(text, { alpha: 0.94, duration: 0.5, delay: 0.64, ease: "sine.out" });
    global.gsap.fromTo(axis.scale, { x: 0.98, y: 0.96 }, { x: 1, y: 1, duration: 0.78, ease: "sine.out" });
  };

  NS.MVPScene.prototype.showPoemRoundControls = function () {
    var state = this.state.poem;
    if (!state) return;

    if (state.keyword) {
      setInteractive(state.keyword, true);
      global.gsap.killTweensOf(state.keyword);
      global.gsap.to(state.keyword, { alpha: 0.9, duration: 0.38, ease: "sine.out" });
    }
    if (state.retry) {
      setInteractive(state.retry, true);
      global.gsap.killTweensOf(state.retry);
      global.gsap.to(state.retry, { alpha: 0.76, duration: 0.38, ease: "sine.out" });
    }
  };

  NS.MVPScene.prototype.spawnPoemInkRipple = function (x, y, scaleFactor) {
    var state = this.state.poem;
    var texture;
    if (!state || !state.group) return;
    try {
      texture = this.app.assets.get("poemInkRipple");
    } catch (error) {
      return;
    }

    var viewport = NS.utils.getViewport(this.app);
    var ripple = new PIXI.Sprite(texture);
    var targetWidth = viewport.width * CONFIG.inkRippleWidthRatio * (scaleFactor || 1);

    ripple.anchor.set(0.5);
    ripple.position.set(x, y + 10);
    ripple.scale.set(targetWidth / ripple.texture.width);
    ripple.alpha = 0;
    state.group.addChildAt(ripple, 0);

    global.gsap.to(ripple, {
      alpha: CONFIG.inkRippleAlpha,
      duration: 0.18,
      ease: "sine.out"
    });
    global.gsap.to(ripple.scale, {
      x: ripple.scale.x * 1.08,
      y: ripple.scale.y * 1.08,
      duration: CONFIG.inkRippleDuration,
      ease: "sine.out"
    });
    global.gsap.to(ripple, {
      alpha: 0,
      duration: 0.42,
      delay: CONFIG.inkRippleDuration * 0.58,
      ease: "sine.in",
      onComplete: function () {
        if (!ripple.destroyed) ripple.destroy();
      }
    });
  };

  NS.MVPScene.prototype.resetPoemRound = function () {
    var scene = this;
    var state = this.state.poem;
    if (!state || state.transitioning) return;

    state.roundComplete = false;
    state.selected = [];
    state.selectedLabels = [];
    state.animating = true;
    this.setHint(CONFIG.hintText);

    if (this.knowledgeText) {
      global.gsap.killTweensOf(this.knowledgeText);
      this.knowledgeText.alpha = 0;
    }
    if (state.completeText) {
      global.gsap.killTweensOf(state.completeText);
      global.gsap.to(state.completeText, { alpha: 0, duration: 0.25 });
    }
    if (state.keyword) {
      setInteractive(state.keyword, false);
      global.gsap.killTweensOf(state.keyword);
      global.gsap.to(state.keyword, { alpha: 0, duration: 0.25 });
    }
    if (state.retry) {
      setInteractive(state.retry, false);
      global.gsap.killTweensOf(state.retry);
      global.gsap.to(state.retry, { alpha: 0, duration: 0.25 });
    }
    if (state.result) {
      global.gsap.killTweensOf(state.result);
      global.gsap.to(state.result, {
        alpha: CONFIG.echoAlpha,
        y: -8,
        duration: CONFIG.resetDuration,
        ease: "sine.out",
        onComplete: function () {
          if (state.result) {
            scene.clearPoemResult();
            state.result.alpha = 0;
            state.result.y = 0;
          }
        }
      });
    }

    state.labels.forEach(function (label) {
      scene.resetPoemLabel(label, CONFIG.resetDuration);
      setInteractive(label, true);
    });
  };

  NS.MVPScene.prototype.revealPoemKnowledge = function () {
    var state = this.state.poem;
    if (!state || !state.keyword || !this.knowledgeText) return;
    var now = performance.now();
    if (now - state.lastKnowledgeAt < CONFIG.knowledgeCooldownMS) {
      return;
    }
    state.lastKnowledgeAt = now;

    this.drawRing(state.keyword.x, state.keyword.y, 74, 0xc8a45d);
    this.knowledgeText.text = CONFIG.knowledgeText;
    global.gsap.killTweensOf(this.knowledgeText);
    this.knowledgeText.alpha = 0;
    global.gsap.to(this.knowledgeText, { alpha: 0.95, duration: 0.4, ease: "sine.out" });
    global.gsap.to(this.knowledgeText, { alpha: 0, duration: 0.5, delay: 4.2, ease: "sine.in" });
  };

  NS.MVPScene.prototype.playPoemTransition = function () {
    var scene = this;
    var state = this.state.poem;
    if (!state || state.transitioning) return;
    state.transitioning = true;
    this.app.dom.clearAction();
    this.setHint(CONFIG.transitionText);

    if (state.retry) setInteractive(state.retry, false);
    if (state.keyword) setInteractive(state.keyword, false);
    state.labels.forEach(function (label) { setInteractive(label, false); });

    this.spawnPoemSoundRings();
    if (state.result) {
      global.gsap.killTweensOf(state.result);
      global.gsap.to(state.result, { alpha: 0, y: state.result.y - 18, duration: 0.8, ease: "sine.in" });
    }
    if (state.completeText) {
      global.gsap.to(state.completeText, { alpha: 0, duration: 0.45 });
    }
    if (state.keyword) {
      global.gsap.to(state.keyword, { alpha: 0, duration: 0.45 });
    }
    if (state.retry) {
      global.gsap.to(state.retry, { alpha: 0, duration: 0.45 });
    }
    if (state.bellPreview) {
      global.gsap.killTweensOf(state.bellPreview);
      global.gsap.killTweensOf(state.bellPreview.scale);
      global.gsap.to(state.bellPreview, {
        alpha: CONFIG.bellPreviewAlpha,
        duration: 0.72,
        delay: 0.18,
        ease: "sine.out"
      });
      global.gsap.to(state.bellPreview.scale, {
        x: state.bellPreview.scale.x * 1.08,
        y: state.bellPreview.scale.y * 1.08,
        duration: CONFIG.transitionDuration,
        ease: "sine.out"
      });
    }

    state.labels.forEach(function (label, index) {
      global.gsap.killTweensOf(label);
      global.gsap.to(label, {
        alpha: 0,
        y: label.y - 24,
        duration: 0.72,
        delay: index * 0.04,
        ease: "sine.in"
      });
    });

    global.gsap.delayedCall(CONFIG.transitionDuration, function () {
      scene.manager.goTo(scene.index + 1);
    });
  };

  NS.MVPScene.prototype.spawnPoemSoundRings = function () {
    var state = this.state.poem;
    var viewport = NS.utils.getViewport(this.app);
    var x = viewport.width * 0.5;
    var y = viewport.height * CONFIG.resultY;
    var count = CONFIG.transitionRingCount || 1;

    for (var i = 0; i < count; i += 1) {
      (function (scene, delay) {
        var ring = new PIXI.Graphics();
        ring.lineStyle(2, CONFIG.transitionRingColor, 0.52);
        ring.drawCircle(0, 0, 18);
        ring.position.set(x, y);
        scene.content.addChild(ring);
        global.gsap.to(ring.scale, {
          x: CONFIG.transitionRingRadius / 18,
          y: CONFIG.transitionRingRadius / 18,
          duration: CONFIG.transitionDuration,
          delay: delay,
          ease: "sine.out"
        });
        global.gsap.to(ring, {
          alpha: 0,
          duration: CONFIG.transitionDuration,
          delay: delay,
          ease: "sine.in",
          onComplete: function () {
            if (!ring.destroyed) ring.destroy();
          }
        });
      }(this, i * 0.18));
    }

    if (state && state.group) {
      this.drawRing(x, y, CONFIG.transitionRingRadius * 0.5, CONFIG.transitionRingColor);
    }
  };
}(window));
