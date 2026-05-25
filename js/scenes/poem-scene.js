// 第五幕拼诗：点选三字匹配诗句并展示结果。
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};
  var CONFIG = NS.CONFIG.poem;

  // 三字组合到诗句的查找表（key 为字典序）
  var POEM_DB = {
    "江舟鼓": "鼓声催发棹，舟影入江流。",
    "江艾风": "江风拂艾叶，五月满汀洲。",
    "江艾舟": "江风拂艾，五月入舟。",
    "江月风": "江月照清波，晚风入楚歌。",
    "艾风青": "青艾随风远，清气满江天。",
    "艾月青": "月照青艾色，端午念故人。",
    "舟鼓风": "鼓动风生浪，龙舟竞渡时。",
    "舟鼓钟": "钟鼓催行舟，楚江声未休。",
    "风月钟": "风送钟声远，月映楚江寒。",
    "月青钟": "青铜月下鸣，钟声入水清。",
    "江艾钟": "艾香随钟远，楚江忆屈平。",
    "江风钟": "江风送钟韵，楚声到五更。",
    "艾舟鼓": "艾束舟头挂，鼓催江上行。",
    "江舟风": "江风送归棹，水远暮云轻。",
    "鼓风钟": "鼓歇钟声起，风定水波平。",
    "江青钟": "青铜鸣楚韵，江水送年声。",
    "艾舟风": "风送艾香远，舟行入暮烟。",
    "艾鼓钟": "鼓振艾旗展，钟鸣楚水边。",
    "舟月钟": "月下钟声起，孤舟过楚天。",
    "江艾鼓": "艾旗迎鼓点，江上竞端阳。"
  };

  // 未命中组合时按首字兜底
  var FALLBACK_POEMS = {
    "江": "楚江五月清，水远天涯近。",
    "艾": "一束清艾意，守护岁岁安。",
    "舟": "扁舟随水去，楚天白云间。",
    "鼓": "鼓声三两通，江上竞渡人。",
    "风": "风起楚江畔，芳草忆离骚。",
    "月": "月照端阳夜，清辉满故园。",
    "青": "青粽叶裹情，一缕系乡愁。",
    "钟": "钟声越千年，礼乐在人间。"
  };

  // 按选字组合匹配诗句，失败则逐级降级
  function matchPoem(selected) {
    var sorted = selected.slice().sort().join("");
    // 精确匹配
    if (POEM_DB[sorted]) return POEM_DB[sorted];
    // 包含2字匹配
    var keys = Object.keys(POEM_DB);
    for (var i = 0; i < keys.length; i++) {
      var count = 0;
      for (var j = 0; j < selected.length; j++) {
        if (keys[i].indexOf(selected[j]) >= 0) count++;
      }
      if (count >= 2) return POEM_DB[keys[i]];
    }
    // 兜底：第一个选字
    return FALLBACK_POEMS[selected[0]] || "楚江五月清，水远天涯近。";
  }

  NS.MVPScene.prototype.buildPoem = function (viewport) {
    var scene = this;
    var words = CONFIG.words;
    var group = new PIXI.Container();
    this.content.addChild(group);

    this.state.poem = {
      selected: [],
      labels: [],
      group: group,
      startTime: performance.now(),
      animating: true
    };

    // 圆形散布字粒
    var cx = viewport.width * CONFIG.gridCenterX;
    var cy = viewport.height * CONFIG.gridCenterY;
    var radius = Math.min(viewport.width, viewport.height) * CONFIG.gridRadius;

    words.forEach(function (word, index) {
      var angle = (index / words.length) * Math.PI * 2 - Math.PI / 2;
      var baseX = cx + Math.cos(angle) * radius;
      var baseY = cy + Math.sin(angle) * radius;

      var label = scene.createText(word, CONFIG.fontSize, 0xe8e1d2, 0.82);
      label.anchor.set(0.5);
      label.position.set(baseX, baseY);
      label.eventMode = "static";
      label.cursor = "pointer";
      label.hitArea = new PIXI.Circle(0, 0, 28);

      // 存储基础位置用于浮动
      label._baseX = baseX;
      label._baseY = baseY;
      label._floatOffset = index * 0.8;
      label._word = word;

      label.on("pointertap", function () {
        scene.selectPoemWord(label);
      });

      group.addChild(label);
      scene.state.poem.labels.push(label);
    });

    // 结果文本（纵向）
    this.state.poem.result = this.createText("", CONFIG.resultFontSize, 0xe8e1d2, 0);
    this.state.poem.result.anchor.set(0.5);
    this.state.poem.result.style.letterSpacing = 4;
    this.state.poem.result.position.set(viewport.width * 0.5, viewport.height * 0.72);
    group.addChild(this.state.poem.result);

    // 启动浮动动画
    this.state.poem.ticker = this.app.pixiApp.ticker.add(this.updatePoemFloat, this);
    this.cleanups.push(function () {
      if (scene.state.poem && scene.state.poem.ticker) {
        scene.app.pixiApp.ticker.remove(scene.updatePoemFloat, scene);
      }
    });
  };

  NS.MVPScene.prototype.updatePoemFloat = function () {
    var state = this.state.poem;
    if (!state || !state.animating) return;

    var now = performance.now();
    var elapsed = now - state.startTime;

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
    if (this.completed || label.selected || state.selected.length >= CONFIG.targetWords) return;

    label.selected = true;
    state.selected.push(label._word);

    // 选中反馈：变金色、放大、上浮
    global.gsap.to(label, {
      y: label._baseY - 20,
      duration: CONFIG.selectDuration,
      ease: "power2.out"
    });
    global.gsap.to(label.scale, {
      x: CONFIG.selectedScale,
      y: CONFIG.selectedScale,
      duration: CONFIG.selectDuration,
      ease: "back.out(1.6)"
    });
    label.style.fill = CONFIG.selectedColor;
    label.alpha = 1;

    // 涟漪效果
    this.drawRing(label.x, label.y, 50, 0xc8a45d);

    this.setHint("已取 " + state.selected.length + " / " + CONFIG.targetWords);

    if (state.selected.length >= CONFIG.targetWords) {
      this.completePoemSelection();
    }
  };

  NS.MVPScene.prototype.completePoemSelection = function () {
    var scene = this;
    var state = this.state.poem;

    // 停止浮动
    state.animating = false;

    // 未选中的字淡出
    state.labels.forEach(function (label) {
      if (!label.selected) {
        global.gsap.to(label, { alpha: 0.15, duration: 0.4 });
      }
    });

    // 匹配诗句
    var poem = matchPoem(state.selected);
    state.result.text = poem;

    // 诗句浮现
    global.gsap.to(state.result, {
      alpha: 0.88,
      y: state.result.y - 16,
      duration: CONFIG.resultFadeDuration,
      delay: 0.4,
      ease: "power2.out",
      onComplete: function () {
        scene.finish(true);
      }
    });
  };
}(window));
