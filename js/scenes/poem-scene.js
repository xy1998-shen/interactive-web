// 第五幕问诗：宽幅集市平移入场，定格诗人临水后再启选字成诗。
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};
  var CONFIG = NS.CONFIG.poem;
  var FONTS = NS.FONT_STACKS;

  // 诗句结果复用问诗纸笺，不再在背景上另铺结果面板。
  var POEM_RESULT_X = 0.52;
  var POEM_RESULT_Y = 0.56;
  var POEM_AXIS_WIDTH_RATIO = 0.34;
  var POEM_AXIS_MIN_WIDTH = 380;
  var POEM_AXIS_MAX_WIDTH = 540;

  // 入场平移与定格延迟参数
  var PAN_DURATION = 9;
  var PAN_HOLD_DELAY = 0.5;
  var MARKET_WIDTH_FACTOR = 1.5; // 背景宽度 = viewport.width × 1.5

  // 三字组合到诗句的查找表（key 为字典序）。统一五言二句，保证每个三字组合都有稳定诗意。
  var POEM_DB = {
    "江舟艾": "楚江浮艾影，兰舟入暮烟。",
    "江艾鼓": "艾气临江渚，鼓声入暮云。",
    "江艾风": "江风吹艾叶，清气满汀洲。",
    "月江艾": "江月涵艾影，清辉照楚乡。",
    "兰江艾": "兰艾生江畔，幽芳入楚辞。",
    "江艾钟": "艾香浮楚水，江远递钟声。",
    "江舟鼓": "江阔催舟鼓，波开楚水春。",
    "江舟风": "江风扶短棹，舟影入青烟。",
    "月江舟": "江月随舟去，清波载楚歌。",
    "兰江舟": "兰舟横楚水，江色入幽芳。",
    "江舟钟": "舟泊江云外，钟声过晚潮。",
    "江风鼓": "江风催画鼓，水阔起龙声。",
    "月江鼓": "江月明如练，鼓声动远洲。",
    "兰江鼓": "兰气浮江晚，鼓声醒楚波。",
    "江钟鼓": "江上鼓初歇，钟声入暮波。",
    "月江风": "江月浮清影，微风入楚歌。",
    "兰江风": "兰佩临江晚，风清动水纹。",
    "江钟风": "江风传远钟，暮色满汀烟。",
    "兰月江": "兰影沉江月，清光照楚辞。",
    "月江钟": "江月开寒镜，钟声落水云。",
    "兰江钟": "兰气浮江渚，钟声到楚天。",
    "舟艾鼓": "艾束悬舟首，鼓声过晚江。",
    "舟艾风": "艾叶随舟远，清风满楚波。",
    "月舟艾": "艾影依舟月，清光照客衣。",
    "兰舟艾": "兰艾萦舟侧，幽香入水云。",
    "舟艾钟": "艾香留短棹，钟远过江云。",
    "艾风鼓": "艾叶迎风起，鼓声渡楚津。",
    "月艾鼓": "艾影涵江月，鼓声入暮烟。",
    "兰艾鼓": "兰艾含清露，鼓声动远洲。",
    "艾钟鼓": "艾气浮江晚，鼓歇听疏钟。",
    "月艾风": "风过艾叶冷，江月照清波。",
    "兰艾风": "兰艾含清露，江风送远香。",
    "艾钟风": "艾香随晚风，远钟入水云。",
    "兰月艾": "兰艾承江月，清芬入夜深。",
    "月艾钟": "艾叶涵秋月，钟声到水涯。",
    "兰艾钟": "兰艾浮清气，钟声入楚云。",
    "舟风鼓": "鼓急催兰舟，风开楚水纹。",
    "月舟鼓": "月照兰舟静，鼓声过远汀。",
    "兰舟鼓": "兰舟听鼓远，楚水生微澜。",
    "舟钟鼓": "舟边鼓声歇，云外一钟来。",
    "月舟风": "风定兰舟缓，江月照归程。",
    "兰舟风": "兰舟分晚色，风细入江烟。",
    "舟钟风": "风送兰舟远，钟声落暮江。",
    "兰月舟": "兰舟浮月色，清影入江流。",
    "月舟钟": "月落兰舟外，钟声过水云。",
    "兰舟钟": "兰舟泊烟渚，钟远入楚天。",
    "月风鼓": "月下江风起，鼓声渡远洲。",
    "兰风鼓": "兰风吹画鼓，清响入江云。",
    "钟风鼓": "鼓歇江风定，钟声入暮烟。",
    "兰月鼓": "兰月照江渚，鼓声醒楚云。",
    "月钟鼓": "月白鼓声歇，疏钟入水寒。",
    "兰钟鼓": "兰气随鼓散，钟声到楚天。",
    "兰月风": "兰月生清影，微风到水心。",
    "月钟风": "风定江月白，钟声入远烟。",
    "兰钟风": "兰风过水面，钟响入云深。",
    "兰月钟": "兰影承明月，远钟答楚声。"
  };

  // 未命中组合时按首字兜底
  var FALLBACK_POEMS = {
    "江": "江清浮远影，水阔见归心。",
    "艾": "艾叶含清气，临风入楚乡。",
    "舟": "兰舟分水去，余韵落江天。",
    "鼓": "鼓声催浪起，楚水动春雷。",
    "风": "微风吹柳暗，诗意到江心。",
    "月": "江月生寒影，清辉照客衣。",
    "兰": "兰佩浮清气，幽香近水生。",
    "钟": "远钟穿雾起，余响入江声。"
  };

  // 预排序 key 列表，保证 2 字降级匹配在所有引擎上顺序一致
  var POEM_DB_KEYS = Object.keys(POEM_DB).sort();
  var POEM_FONT_STACK = FONTS.poem;

  // 根据已选字匹配稳定诗句，失败时用首字兜底。
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

    return FALLBACK_POEMS[selected[0]] || "兰艾入水，风过楚江。";
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

  function drawBrushCircle(circle, seed) {
    var rx = 28;
    var ry = 23;
    var wobble = seed || 0;
    circle.clear();
    circle.lineStyle(2.2, 0x16343a, 0.52);
    circle.moveTo(-rx + 2, Math.sin(wobble) * 2);
    circle.bezierCurveTo(-rx * 0.92, -ry * 0.95, -rx * 0.2, -ry * 1.08, 3, -ry * 0.88);
    circle.bezierCurveTo(rx * 0.9, -ry * 0.7, rx * 0.96, -ry * 0.1, rx * 0.78, 3);
    circle.bezierCurveTo(rx * 0.64, ry * 0.9, rx * 0.05, ry * 1.05, -4, ry * 0.86);
    circle.bezierCurveTo(-rx * 0.9, ry * 0.65, -rx * 1.05, ry * 0.15, -rx + 2, Math.sin(wobble) * 2);
    circle.lineStyle(4.8, 0x16343a, 0.1);
    circle.drawEllipse(-1, 1, rx * 0.95, ry * 0.82);
    circle.lineStyle(1.1, 0xc8a45d, 0.36);
    circle.drawEllipse(1, 0, rx * 1.06, ry * 0.92);
  }

  // 构建问诗场景入场长幅和选字层。
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
      animating: false,
      roundComplete: false,
      transitioning: false,
      panActive: true,
      lastKnowledgeAt: 0,
      currentPoem: ""
    };

    if (!words.length) {
      this.setHint(CONFIG.completeText);
      return;
    }

    // 1. 创建宽幅集市背景层（含灯笼与水面微光）并启动平移
    this.createPoemRiversideMarket(viewport);

    // 平移期间清空提示，避免与入场氛围冲突
    this.setHint("");

    var marketLayer = this.state.poem.marketLayer;
    var panDistance = Math.max(0, this.state.poem.marketWidth - viewport.width);

    var startInteractive = function () {
      scene.scheduleCall(PAN_HOLD_DELAY, function () {
        scene.startPoemInteractive(viewport, group, words);
      });
    };

    if (panDistance > 0) {
      global.gsap.to(marketLayer, {
        x: -panDistance,
        duration: PAN_DURATION,
        ease: "none",
        onComplete: function () {
          scene.state.poem.panActive = false;
          startInteractive();
        }
      });
    } else {
      // 极端情况：图片宽高比不足，无需平移，直接定格
      marketLayer.x = 0;
      scene.state.poem.panActive = false;
      startInteractive();
    }

    this.cleanups.push(function () {
      if (scene.state.poem && scene.state.poem.floatActive) {
        scene.state.poem.floatActive = false;
        scene.app.pixiApp.ticker.remove(scene.updatePoemFloat, scene);
      }
    });
  };

  // 平移完成后启动选字交互（保留原有所有构建逻辑）
  // 入场定格后开启选字交互。
  NS.MVPScene.prototype.startPoemInteractive = function (viewport, group, words) {
    if (!this.state.poem || !this.container) return;

    this.state.poem.startTime = performance.now();
    this.state.poem.animating = true;

    this.createPoemAtmosphere(viewport, group);
    this.createPoemEntryText(viewport, group);
    this.createPoemWords(viewport, group, words);
    this.createPoemResultText(viewport, group);
    this.createPoemKeyword(viewport, group);
    this.createPoemRetry(viewport, group);

    this.setHint(CONFIG.hintText);
    this.state.poem.floatActive = true;
    this.app.pixiApp.ticker.add(this.updatePoemFloat, this);
  };

  // ============================================================
  // 河边集市宽幅背景：左集市→中歌舞→右诗人，匀速平移定格右侧
  // ============================================================
  NS.MVPScene.prototype.createPoemRiversideMarket = function (viewport) {
    var marketLayer = new PIXI.Container();
    var texture = this.app.assets.get("poemRiversideMarket");
    var bg = new PIXI.Sprite(texture);

    var aspectRatio = (texture && texture.width && texture.height)
      ? texture.width / texture.height
      : 1.667;

    // 优先按 viewport.width × 1.5 设置目标宽度，按图片宽高比缩放高度
    var targetWidth = viewport.width * MARKET_WIDTH_FACTOR;
    var targetHeight = targetWidth / aspectRatio;

    bg.width = targetWidth;
    bg.height = targetHeight;
    // 垂直居中：若画面较高则保留中段画意（市集到诗人居于水平带）
    bg.position.set(0, (viewport.height - targetHeight) / 2);
    marketLayer.addChild(bg);

    // 隐藏基类铺设的 poemWaterPoet 兜底背景，避免色彩干扰
    if (this.background) {
      this.background.alpha = 0;
    }

    // 初始位置：左边缘对齐 viewport 左边缘
    marketLayer.position.set(0, 0);

    // 插入到 background 之上、overlay 之下，让浅色 overlay 仍能轻润画面
    this.container.addChildAt(marketLayer, 1);

    this.state.poem.marketLayer = marketLayer;
    this.state.poem.marketBg = bg;
    this.state.poem.marketWidth = targetWidth;
    this.state.poem.marketHeight = targetHeight;

    // 在宽幅上铺水墨吊饰与水面微光：随背景平移、定格后继续呼吸
    this.createPoemHangingCharms(marketLayer, targetWidth, targetHeight);
    this.createPoemShimmer(marketLayer, targetWidth, targetHeight);
  };

  // 水墨吊饰微摆：浅纸色诗签、艾叶与细绳，弱化节庆红灯笼的突兀感。
  NS.MVPScene.prototype.createPoemHangingCharms = function (parentLayer, bgWidth, bgHeight) {
    var slots = [
      { x: 0.58, y: 0.18, scale: 0.54, alpha: 0.46 },
      { x: 0.68, y: 0.15, scale: 0.6, alpha: 0.52 },
      { x: 0.78, y: 0.19, scale: 0.66, alpha: 0.54 },
      { x: 0.88, y: 0.17, scale: 0.56, alpha: 0.46 },
      { x: 0.96, y: 0.2, scale: 0.5, alpha: 0.42 }
    ];

    var charms = [];
    var texture = this.app.assets.get("poemHangingCharm");
    var targetHeight = Math.min(bgWidth, bgHeight) * 0.095;

    slots.forEach(function (slot, i) {
      var pivot = new PIXI.Container();
      pivot.position.set(bgWidth * slot.x, bgHeight * slot.y);
      var hangOffset = targetHeight * slot.scale * 0.44;
      pivot.pivot.set(0, -hangOffset);
      pivot.position.y -= hangOffset;

      var charm = new PIXI.Sprite(texture);
      charm.anchor.set(0.5, 0.08);
      charm.height = targetHeight * slot.scale;
      charm.scale.x = charm.scale.y;
      charm.alpha = slot.alpha;
      charm.tint = 0xe7eadc;
      pivot.addChild(charm);
      parentLayer.addChild(pivot);

      var amp = 0.035 + (i % 3) * 0.018;
      pivot.rotation = -amp;
      global.gsap.to(pivot, {
        rotation: amp,
        duration: 3.2 + (i % 4) * 0.45,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        delay: (i % 5) * 0.18
      });

      charms.push(pivot);
    });

    this.state.poem.hangingCharms = charms;
  };

  // 水面微光：底部带状随机闪烁的小白点
  NS.MVPScene.prototype.createPoemShimmer = function (parentLayer, bgWidth, bgHeight) {
    var dots = [];
    var count = 36;
    for (var i = 0; i < count; i += 1) {
      var dot = new PIXI.Graphics();
      var size = 0.9 + Math.random() * 1.7;
      dot.beginFill(0xfdf6e3, 0.95);
      dot.drawCircle(0, 0, size);
      dot.endFill();
      dot.position.set(
        Math.random() * bgWidth,
        bgHeight * (0.74 + Math.random() * 0.22)
      );
      dot.alpha = 0;

      parentLayer.addChild(dot);

      var dur = 0.9 + Math.random() * 1.6;
      global.gsap.to(dot, {
        alpha: 0.55 + Math.random() * 0.35,
        duration: dur,
        delay: Math.random() * 4,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });
      dots.push(dot);
    }
    this.state.poem.shimmerDots = dots;
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

  // 创建可点击字粒。
  NS.MVPScene.prototype.createPoemWords = function (viewport, group, words) {
    var scene = this;
    var wordSlots = CONFIG.wordSlots || [];
    var paperLayer = new PIXI.Container();
    var paperTexture = this.app.assets.get("poemPaper");
    var paper = new PIXI.Sprite(paperTexture);
    var paperWidth = clamp(
      viewport.width * CONFIG.wordPaperWidthRatio,
      CONFIG.wordPaperMinWidth,
      CONFIG.wordPaperMaxWidth
    );
    var paperHeight = CONFIG.wordPaperHeight;
    var paperInnerWidth = paperWidth * 0.78;
    var paperInnerHeight = paperHeight * 0.5;

    paperLayer.position.set(viewport.width * CONFIG.wordPaperX, viewport.height * CONFIG.wordPaperY);
    paper.anchor.set(0.5);
    paper.width = paperWidth;
    paper.scale.y = paper.scale.x;
    paper.alpha = 0;
    paperLayer.addChild(paper);
    group.addChild(paperLayer);
    this.state.poem.wordPaper = paperLayer;
    this.state.poem.wordPaperSprite = paper;

    global.gsap.to(paper, { alpha: 0.72, duration: 0.7, ease: "sine.out" });
    global.gsap.fromTo(paperLayer.scale, { x: 0.985, y: 0.96 }, { x: 1, y: 1, duration: 0.82, ease: "sine.out" });

    words.forEach(function (word, index) {
      var slot = wordSlots.filter(function (item) { return item.word === word; })[0];
      var baseX = slot ? (slot.x - 0.5) * paperInnerWidth : 0;
      var baseY = slot ? (slot.y - 0.5) * paperInnerHeight : 0;
      var wordGroup = new PIXI.Container();
      var circle = new PIXI.Graphics();
      circle.alpha = 0;
      wordGroup.addChild(circle);

      var label = stylePoemText(scene.createText(word, CONFIG.fontSize, 0x16343a, 0), 0xf4ecd8, 2, 0.16);

      label.anchor.set(0.5);
      label.position.set(0, -2);
      wordGroup.addChild(label);

      var wakeIndex = (CONFIG.wakeWords || []).indexOf(word);
      var startX = baseX;
      var startY = baseY + 8;
      var delay = 0.72 + index * 0.05;
      if (wakeIndex >= 0) {
        startX = baseX - 12 + wakeIndex * 4;
        startY = baseY + 18;
        delay = 0.3 + wakeIndex * 0.08;
      }

      wordGroup.position.set(startX, startY);
      wordGroup.eventMode = "static";
      wordGroup.cursor = "pointer";
      wordGroup.hitArea = new PIXI.Circle(0, 0, Math.max(34, CONFIG.fontSize * 1.05));
      label._group = wordGroup;
      label._circle = circle;
      label._baseX = baseX;
      label._baseY = baseY;
      label._baseAlpha = 0.8;
      label._baseScaleX = wordGroup.scale.x;
      label._baseScaleY = wordGroup.scale.y;
      label._floatOffset = index * 0.8;
      label._word = word;
      label.selected = false;

      wordGroup.on("pointertap", function () {
        scene.selectPoemWord(label);
      });
      wordGroup.on("pointerover", function () {
        if (!label.selected && !scene.state.poem.roundComplete) {
          global.gsap.to(label, { alpha: 1, duration: 0.2, ease: "sine.out" });
          global.gsap.to(wordGroup.scale, { x: 1.05, y: 1.05, duration: 0.2, ease: "sine.out" });
        }
      });
      wordGroup.on("pointerout", function () {
        if (!label.selected && !scene.state.poem.roundComplete) {
          global.gsap.to(label, { alpha: label._baseAlpha, duration: 0.26, ease: "sine.out" });
          global.gsap.to(wordGroup.scale, { x: label._baseScaleX, y: label._baseScaleY, duration: 0.26, ease: "sine.out" });
        }
      });

      paperLayer.addChild(wordGroup);
      scene.state.poem.labels.push(label);
      global.gsap.to(label, {
        alpha: label._baseAlpha,
        duration: 0.5,
        delay: delay + 0.12,
        ease: "sine.out"
      });
      global.gsap.to(wordGroup, {
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
    var targetLayer = this.state.poem && this.state.poem.wordPaper ? this.state.poem.wordPaper : group;
    result.alpha = 0;
    result._baseY = targetLayer === group ? viewport.height * POEM_RESULT_Y : 0;
    result._onWordPaper = targetLayer !== group;
    targetLayer.addChild(result);
    this.state.poem.result = result;

    var complete = stylePoemText(this.createText(CONFIG.completeText, 18, 0xc8a45d, 0), 0x16343a, 2, 0.24);
    complete.anchor.set(0.5);
    complete.position.set(viewport.width * POEM_RESULT_X, viewport.height * (POEM_RESULT_Y - 0.075));
    group.addChild(complete);
    this.state.poem.completeText = complete;
  };

  NS.MVPScene.prototype.createPoemKeyword = function (viewport, group) {
    var paper = this.state.poem && this.state.poem.wordPaperSprite;
    var keyword = stylePoemText(this.createText(CONFIG.keywordText, CONFIG.knowledgeFontSize, 0x1b3d42, 0), 0xf4ecd8, 2, 0.24);
    keyword.anchor.set(0.5);
    keyword.style.align = "center";
    keyword.style.wordWrap = true;
    keyword.style.wordWrapWidth = paper
      ? Math.min(paper.width * 0.9, viewport.width * CONFIG.knowledgeWidthRatio)
      : Math.min(520, viewport.width * CONFIG.knowledgeWidthRatio);
    keyword.style.lineHeight = CONFIG.knowledgeLineHeight;
    keyword.position.set(viewport.width * CONFIG.keywordX, viewport.height * CONFIG.keywordY);
    setInteractive(keyword, false);
    group.addChild(keyword);
    this.state.poem.keyword = keyword;
  };

  NS.MVPScene.prototype.createPoemRetry = function (viewport, group) {
    var scene = this;
    var paperLayer = this.state.poem && this.state.poem.wordPaper;
    var paper = this.state.poem && this.state.poem.wordPaperSprite;
    var retry = stylePoemText(this.createText(CONFIG.retryText, CONFIG.retryFontSize, 0x1b3d42, 0), 0xf4ecd8, 2, 0.2);
    retry.anchor.set(0.5);
    if (paperLayer && paper) {
      retry.position.set(paper.width * 0.36, paper.height * 0.28);
      paperLayer.addChild(retry);
    } else {
      retry.position.set(viewport.width * CONFIG.retryX, viewport.height * CONFIG.retryY);
      group.addChild(retry);
    }
    retry.hitArea = new PIXI.Rectangle(-70, -22, 140, 44);
    retry.on("pointertap", function () {
      scene.resetPoemRound();
    });
    setInteractive(retry, false);
    this.state.poem.retry = retry;
  };

  NS.MVPScene.prototype.updatePoemFloat = function () {
    var state = this.state.poem;
    if (!state || !state.animating) return;

    var elapsed = performance.now() - state.startTime;
    state.labels.forEach(function (label) {
      if (label.selected) return;
      var group = label._group || label;
      var ox = Math.sin(elapsed * CONFIG.floatSpeedX + label._floatOffset) * CONFIG.floatAmplitudeX;
      var oy = Math.cos(elapsed * CONFIG.floatSpeedY + label._floatOffset * 1.3) * CONFIG.floatAmplitudeY;
      group.x = label._baseX + ox;
      group.y = label._baseY + oy;
    });
  };

  // 选择一个字粒，并在满三字后完成本轮。
  NS.MVPScene.prototype.selectPoemWord = function (label) {
    var state = this.state.poem;
    if (!state || state.transitioning || state.roundComplete || state.panActive || !label) return;

    if (label.selected) {
      this.deselectPoemWord(label);
      return;
    }
    if (state.selected.length >= CONFIG.targetWords) return;

    label.selected = true;
    state.selected.push(label._word);
    state.selectedLabels.push(label);

    this.activatePoemLabel(label);
    var group = label._group || label;
    var parent = group.parent;
    var rippleX = group.x + (parent ? parent.x : 0);
    var rippleY = group.y + (parent ? parent.y : 0);
    this.spawnPoemInkRipple(rippleX, rippleY, label._word === "艾" ? 0.58 : 0.5);

    if (state.selected.length >= CONFIG.targetWords) {
      this.completePoemRound();
    } else {
      this.setHint(CONFIG.hintText);
    }
  };

  NS.MVPScene.prototype.activatePoemLabel = function (label) {
    var group = label._group || label;
    var circle = label._circle;
    global.gsap.killTweensOf(label);
    global.gsap.killTweensOf(group);
    global.gsap.killTweensOf(group.scale);
    if (circle) {
      drawBrushCircle(circle, label._floatOffset);
      circle.scale.set(0.82);
      global.gsap.to(circle, { alpha: 0.9, duration: CONFIG.selectDuration, ease: "sine.out" });
      global.gsap.to(circle.scale, { x: 1, y: 1, duration: CONFIG.selectDuration, ease: "back.out(1.8)" });
    }
    global.gsap.to(label, {
      alpha: 1,
      duration: CONFIG.selectDuration,
      ease: "power2.out"
    });
    global.gsap.to(group, {
      x: label._baseX,
      y: label._baseY - 4,
      duration: CONFIG.selectDuration,
      ease: "power2.out"
    });
    global.gsap.to(group.scale, {
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
    var group = label._group || label;
    var circle = label._circle;
    global.gsap.killTweensOf(label);
    global.gsap.killTweensOf(group);
    global.gsap.killTweensOf(group.scale);
    label.style.fill = 0x16343a;
    label.selected = false;
    if (circle) {
      global.gsap.to(circle, { alpha: 0, duration: duration, ease: "sine.out" });
    }
    global.gsap.to(label, {
      alpha: label._baseAlpha,
      duration: duration,
      ease: "sine.out"
    });
    global.gsap.to(group, {
      x: label._baseX,
      y: label._baseY,
      duration: duration,
      ease: "sine.out"
    });
    global.gsap.to(group.scale, {
      x: label._baseScaleX,
      y: label._baseScaleY,
      duration: duration,
      ease: "sine.out"
    });
  };

  // 三字选满后匹配诗句并展示结果。
  NS.MVPScene.prototype.completePoemRound = function () {
    var scene = this;
    var state = this.state.poem;
    if (!state || state.roundComplete) return;

    state.roundComplete = true;
    state.currentPoem = matchPoem(state.selected);
    this.setHint("");

    state.labels.forEach(function (label) {
      var group = label._group || label;
      setInteractive(group, false);
      global.gsap.killTweensOf(label);
      global.gsap.killTweensOf(group);
      global.gsap.killTweensOf(group.scale);
      global.gsap.to(label, { alpha: 0, duration: 0.34, ease: "sine.in" });
      if (label._circle) {
        global.gsap.to(label._circle, { alpha: 0, duration: 0.34, ease: "sine.in" });
      }
      global.gsap.to(group, { y: group.y - 12, duration: 0.34, ease: "sine.in" });
    });

    this.showPoemResult(state.currentPoem, function () {
      var viewport = NS.utils.getViewport(scene.app);
      scene.spawnPoemInkRipple(viewport.width * POEM_RESULT_X, viewport.height * POEM_RESULT_Y, 1);
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

  // 绘制问诗纸笺上的成诗结果。
  NS.MVPScene.prototype.drawPoemAxisResult = function (poem) {
    var state = this.state.poem;
    if (!state || !state.result || !poem) return;

    var viewport = NS.utils.getViewport(this.app);
    var onWordPaper = !!state.result._onWordPaper;
    var axis = new PIXI.Container();
    var centerX = onWordPaper ? 0 : viewport.width * POEM_RESULT_X;
    var centerY = onWordPaper ? 0 : viewport.height * POEM_RESULT_Y;
    var width = onWordPaper && state.wordPaperSprite
      ? state.wordPaperSprite.width * 0.72
      : clamp(viewport.width * POEM_AXIS_WIDTH_RATIO, POEM_AXIS_MIN_WIDTH, POEM_AXIS_MAX_WIDTH);
    var height = onWordPaper && state.wordPaperSprite
      ? state.wordPaperSprite.height * 0.48
      : CONFIG.poemAxisHeight;
    var paper = new PIXI.Graphics();
    var seed = stylePoemText(this.createText(formatSeedForAxis(state.selected), CONFIG.poemAxisSeedFontSize, 0xc8a45d, 0), 0xf1ead6, 2, 0.22);
    var text = stylePoemText(this.createText(formatPoemForAxis(poem), CONFIG.poemAxisTextFontSize, 0x16343a, 0), 0xf1ead6, 2, 0.24);

    axis.position.set(centerX, centerY);
    if (!onWordPaper) {
      drawInkAxisPaper(paper, width, height);
      paper.pivot.set(0, 0);
      paper.scale.x = 0.04;
    }

    seed.anchor.set(0.5);
    seed.style.lineHeight = Math.round(CONFIG.poemAxisSeedFontSize * 1.55);
    seed.style.align = "center";
    seed.style.fontFamily = POEM_FONT_STACK;
    seed.style.fontSize = onWordPaper ? CONFIG.poemAxisSeedFontSize + 6 : CONFIG.poemAxisSeedFontSize + 2;
    seed.style.fill = 0x9b7834;
    seed.style.stroke = 0xf4ecd8;
    seed.style.strokeThickness = 2.2;
    seed.style.dropShadowBlur = 7;
    seed.style.dropShadowAlpha = 0.28;
    seed.position.set(onWordPaper ? -width * 0.3 : -width / 2 + 52, onWordPaper ? -2 : 0);
    text.anchor.set(0.5);
    text.style.align = "center";
    text.style.lineHeight = CONFIG.poemAxisLineHeight;
    text.style.fontFamily = POEM_FONT_STACK;
    text.style.fontSize = onWordPaper ? CONFIG.poemAxisTextFontSize + 1 : CONFIG.poemAxisTextFontSize + 4;
    text.style.fontWeight = "500";
    text.style.fill = 0x16343a;
    text.style.stroke = 0xe8e1d2;
    text.style.strokeThickness = 0.8;
    text.style.dropShadowBlur = 6;
    text.style.dropShadowAlpha = 0.16;
    text.position.set(onWordPaper ? width * 0.1 : 32, onWordPaper ? 0 : 0);

    axis.alpha = 0;
    if (!onWordPaper) {
      axis.addChild(paper);
    }
    axis.addChild(seed);
    axis.addChild(text);
    state.result.addChild(axis);
    state.poemAxis = axis;
    state.poemChars = [seed, text];

    global.gsap.to(axis, { alpha: 1, duration: 0.18, ease: "sine.out" });
    if (!onWordPaper) {
      global.gsap.to(paper.scale, { x: 1, duration: 0.72, ease: "power2.out" });
    }
    global.gsap.to(seed, { alpha: 0.9, duration: 0.36, delay: 0.48, ease: "sine.out" });
    global.gsap.to(text, { alpha: 0.94, duration: 0.5, delay: 0.64, ease: "sine.out" });
    global.gsap.fromTo(axis.scale, { x: 0.98, y: 0.96 }, { x: 1, y: 1, duration: 0.78, ease: "sine.out" });
  };

  NS.MVPScene.prototype.showPoemRoundControls = function () {
    var state = this.state.poem;
    if (!state) return;

    if (state.keyword) {
      global.gsap.killTweensOf(state.keyword);
      global.gsap.to(state.keyword, { alpha: 0.82, duration: 0.42, ease: "sine.out" });
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

  // 重置本轮问诗，保留场景上下文。
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
      setInteractive(label._group || label, true);
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

  // 完成问诗后播放过渡并进入下一幕。
  NS.MVPScene.prototype.playPoemTransition = function () {
    var scene = this;
    var state = this.state.poem;
    if (!state || state.transitioning) return;
    state.transitioning = true;
    this.app.dom.clearAction();
    this.setHint(CONFIG.transitionText);

    if (state.retry) setInteractive(state.retry, false);
    if (state.keyword) setInteractive(state.keyword, false);
    state.labels.forEach(function (label) { setInteractive(label._group || label, false); });

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
      var group = label._group || label;
      global.gsap.killTweensOf(label);
      global.gsap.killTweensOf(group);
      global.gsap.to(label, {
        alpha: 0,
        duration: 0.72,
        delay: index * 0.04,
        ease: "sine.in"
      });
      if (label._circle) {
        global.gsap.to(label._circle, {
          alpha: 0,
          duration: 0.5,
          delay: index * 0.04,
          ease: "sine.in"
        });
      }
      global.gsap.to(group, {
        y: group.y - 18,
        duration: 0.72,
        delay: index * 0.04,
        ease: "sine.in"
      });
    });

    this.scheduleCall(CONFIG.transitionDuration, function () {
      scene.manager.goTo(scene.index + 1);
    });
  };

  NS.MVPScene.prototype.spawnPoemSoundRings = function () {
    var state = this.state.poem;
    var viewport = NS.utils.getViewport(this.app);
    var x = viewport.width * 0.5;
    var y = viewport.height * POEM_RESULT_Y;
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
