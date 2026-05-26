// 各互动分幕的公共基类：舞台搭建、文案与完成流转。
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};
  var utils = NS.utils;

  // 各幕提示语、完成语与知识卡片文案
  var SCENE_COPY = {
    mugwort: {
      hint: "艾香入户",
      done: "已悬艾",
      knowledge: "悬艾从草木清气与盛夏避疫的愿望里来，也在端午的追思里，成为家家户户守护平安的记号。"
    },
    wrap: {
      hint: "轻触画面，开始裹粽",
      done: "已裹青",
      knowledge: "粽子承载纪念与寄情，也是端午最具日常感的符号。"
    },
    drum: {
      hint: "随鼓而行",
      done: "鼓声已渡",
      knowledge: "龙舟竞渡以鼓为令，众桨同频向前。它从江上追思与乡人合力的传说中生长出来，后来成为端午最有节奏感的节庆场面。"
    },
    poem: {
      hint: "点选三枚字粒",
      done: "诗已成",
      knowledge: "屈原、楚江与端午相连，诗意让节俗有了更深的回声。"
    },
    bell: {
      hint: "轻触编钟，听水面回响",
      done: "钟已鸣",
      knowledge: "编钟代表楚地礼乐，声波在水面扩散，连接古今。"
    },
    finale: {
      hint: "点亮四枚端午印记",
      done: "印记已合",
      knowledge: "艾、粽、舟、钟，汇成这趟楚江端午的四个记忆点。"
    }
  };

  // 分幕实例：持有 Pixi 容器与各幕 state
  function MVPScene(app, manager, meta, index) {
    this.app = app;
    this.manager = manager;
    this.meta = meta;
    this.index = index;
    this.container = null;
    this.background = null;
    this.overlay = null;
    this.content = null;
    this.knowledgeText = null;
    this.completed = false;
    this.cleanups = [];
    this.state = {};
  }

  MVPScene.prototype.onEnter = function () {
    var viewport = utils.getViewport(this.app);
    this.container = new PIXI.Container();
    this.background = new PIXI.Sprite(this.pickBackground());
    utils.fitCover(this.background, this.background.texture, viewport.width, viewport.height);
    this.container.addChild(this.background);

    this.overlay = new PIXI.Graphics();
    this.drawOverlay(viewport);
    this.container.addChild(this.overlay);

    this.content = new PIXI.Container();
    this.container.addChild(this.content);
    this.createCommonText(viewport);
    this.buildScene(viewport);
    this.app.dom.heroCopy.classList.remove("is-muted");
    this.app.dom.heroCopy.classList.toggle("is-suppressed", this.meta.id === "mugwort");
    if (this.meta.id !== "mugwort") {
      this.app.dom.showHint(SCENE_COPY[this.meta.id].hint);
    }
    this.app.pixiApp.stage.addChild(this.container);

    if (this.manager.completed[this.index]) {
      this.finish(false);
    }
  };

  MVPScene.prototype.pickBackground = function () {
    if (this.meta.id === "mugwort") {
      return this.app.assets.get("mugwortVillage");
    }
    if (this.meta.id === "poem") {
      return this.app.assets.get("bamboo");
    }
    return this.app.assets.get(this.meta.assets[0]);
  };

  MVPScene.prototype.drawOverlay = function (viewport) {
    this.overlay.clear();
    this.overlay.beginFill(0xeaf4ef, 0.22);
    this.overlay.drawRect(0, 0, viewport.width, viewport.height);
    this.overlay.endFill();
    this.overlay.beginFill(0x16343a, 0.06);
    this.overlay.drawRect(0, viewport.height * 0.72, viewport.width, viewport.height * 0.28);
    this.overlay.endFill();
  };

  MVPScene.prototype.createCommonText = function (viewport) {
    this.knowledgeText = this.createText("", 22, 0x16343a, 0);
    this.knowledgeText.anchor.set(0.5);
    this.knowledgeText.style.wordWrap = true;
    this.knowledgeText.style.wordWrapWidth = Math.min(720, viewport.width * 0.62);
    this.knowledgeText.style.lineHeight = 38;
    this.knowledgeText.position.set(viewport.width / 2, viewport.height - 168);
    if (this.meta.id === "wrap") {
      this.knowledgeText.style.fontSize = 18;
      this.knowledgeText.style.lineHeight = 30;
      this.knowledgeText.style.wordWrapWidth = Math.min(560, viewport.width * 0.48);
      this.knowledgeText.position.set(viewport.width * 0.5, viewport.height - 118);
    }
    this.content.addChild(this.knowledgeText);
  };

  MVPScene.prototype.createText = function (text, fontSize, fill, alpha) {
    var label = new PIXI.Text(text, {
      fontFamily: "Songti SC, STSong, FangSong, serif",
      fontSize: fontSize,
      fill: fill,
      align: "center",
      lineHeight: Math.round(fontSize * 1.65)
    });
    label.alpha = alpha == null ? 1 : alpha;
    return label;
  };

  MVPScene.prototype.createSprite = function (key, widthRatio, xRatio, yRatio, viewport) {
    var sprite = new PIXI.Sprite(this.app.assets.get(key));
    sprite.anchor.set(0.5);
    var targetWidth = viewport.width * widthRatio;
    sprite.scale.set(targetWidth / sprite.texture.width);
    sprite.position.set(viewport.width * xRatio, viewport.height * yRatio);
    this.content.addChild(sprite);
    return sprite;
  };

  MVPScene.prototype.makeCircle = function (x, y, radius, color, alpha) {
    var g = new PIXI.Graphics();
    g.lineStyle(1, color, Math.min(1, alpha + 0.2));
    g.beginFill(color, alpha);
    g.drawCircle(0, 0, radius);
    g.endFill();
    g.position.set(x, y);
    this.content.addChild(g);
    return g;
  };

  // 按 meta.id 分发到对应分幕构建函数
  MVPScene.prototype.buildScene = function (viewport) {
    if (this.meta.id === "mugwort") {
      this.buildMugwort(viewport);
    } else if (this.meta.id === "wrap") {
      this.buildWrap(viewport);
    } else if (this.meta.id === "drum") {
      this.buildDrum(viewport);
    } else if (this.meta.id === "poem") {
      this.buildPoem(viewport);
    } else if (this.meta.id === "bell") {
      this.buildBell(viewport);
    } else {
      this.buildFinale(viewport);
    }
  };

  MVPScene.prototype.drawRing = function (x, y, radius, color) {
    var ring = new PIXI.Graphics();
    ring.lineStyle(2, color, 0.7);
    ring.drawCircle(0, 0, 16);
    ring.position.set(x, y);
    this.content.addChild(ring);
    global.gsap.to(ring, {
      alpha: 0,
      duration: 0.72,
      onComplete: function () {
        if (!ring.destroyed) {
          ring.destroy();
        }
      }
    });
    global.gsap.to(ring.scale, { x: radius / 16, y: radius / 16, duration: 0.72, ease: "power2.out" });
  };

  MVPScene.prototype.killTweens = function (displayObject) {
    if (!displayObject) {
      return;
    }
    global.gsap.killTweensOf(displayObject);
    if (displayObject.position) {
      global.gsap.killTweensOf(displayObject.position);
    }
    if (displayObject.scale) {
      global.gsap.killTweensOf(displayObject.scale);
    }
    if (displayObject.children) {
      displayObject.children.forEach(this.killTweens.bind(this));
    }
  };

  MVPScene.prototype.setHint = function (text) {
    this.app.dom.showHint(text);
  };

  // 标记完成并展示知识文案与下一幕入口
  MVPScene.prototype.finish = function (animate) {
    var scene = this;
    if (this.completed && animate) {
      return;
    }
    this.completed = true;
    this.manager.completeCurrent();
    this.app.dom.showCompletion(SCENE_COPY[this.meta.id].done);
    if (this.meta.id === "wrap") {
      this.knowledgeText.text = "";
      this.knowledgeText.alpha = 0;
      this.app.dom.showAction("入下一幕 →", function () {
        scene.manager.goTo(scene.index + 1);
      });
      return;
    }
    this.knowledgeText.text = SCENE_COPY[this.meta.id].knowledge;
    if (this.meta.id === "mugwort") {
      this.knowledgeText.alpha = 0;
      this.app.dom.showAction("入下一幕 →", function () {
        scene.manager.goTo(scene.index + 1);
      });
      return;
    }
    if (this.meta.id === "drum") {
      this.knowledgeText.alpha = 0;
      this.app.dom.showAction("入下一幕 →", function () {
        scene.manager.goTo(scene.index + 1);
      });
      if (this.showDrumKnowledgeDot) {
        this.showDrumKnowledgeDot(animate);
      }
      return;
    }
    this.knowledgeText.alpha = animate === false ? 0.86 : 0;
    if (animate !== false) {
      global.gsap.to(this.knowledgeText, { alpha: 0.86, duration: 0.45 });
    }
    if (this.meta.id === "finale") {
      this.app.dom.showAction("重游此程", function () {
        scene.manager.completed = scene.manager.completed.map(function () { return false; });
        scene.manager.goTo(0);
      });
    } else {
      this.app.dom.showAction("入下一幕 →", function () {
        scene.manager.goTo(scene.index + 1);
      });
    }
  };

  MVPScene.prototype.onUpdate = function () {
    if (!this.container) {
      return;
    }
    var viewport = utils.getViewport(this.app);
    utils.fitCover(this.background, this.background.texture, viewport.width, viewport.height);
    this.drawOverlay(viewport);
    if (this.meta.id === "mugwort" && this.updateMugwortLayout) {
      this.updateMugwortLayout(viewport);
    }
  };

  MVPScene.prototype.onExit = function () {
    this.cleanups.forEach(function (cleanup) { cleanup(); });
    this.cleanups = [];
    this.killTweens(this.container);
    this.app.dom.clearAction();
    this.app.dom.heroCopy.classList.remove("is-suppressed");
    if (this.container) {
      this.app.pixiApp.stage.removeChild(this.container);
      this.container.destroy({ children: true });
      this.container = null;
    }
  };

  NS.MVPScene = MVPScene;
}(window));
