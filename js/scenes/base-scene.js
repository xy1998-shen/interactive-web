// 各互动分幕的公共基类：舞台搭建、文案与完成流转。
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};
  var utils = NS.utils;
  var FONTS = NS.FONT_STACKS;
  var PANEL_TRANSITION_DURATION = 0.48;

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
      hint: "轻触鼓面，推舟前行",
      done: "鼓声已渡",
      knowledge: "龙舟竞渡以鼓为令，众桨同频向前。它从江上追思与乡人合力的传说中生长出来，后来成为端午最有节奏感的节庆场面。"
    },
    poem: {
      hint: "轻触三字，问一行诗",
      done: "",
      knowledge: "屈原诗意与端午记忆相连，是楚江旅程的精神底色。"
    },
    bell: {
      hint: "听三处回声次第和鸣",
      done: "",
      knowledge: "编钟礼乐承载荆楚记忆；在这里，它与江声、诗字和端午风物一起合鸣。"
    },
    finale: {
      hint: "回望一路风物，让四枚印记归心",
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
    this.viewportWidth = 0;
    this.viewportHeight = 0;
  }

  // 进入分幕：创建背景、遮罩、公共文案，再派发到具体 buildXxx。
  MVPScene.prototype.onEnter = function () {
    var viewport = utils.getViewport(this.app);
    this.container = new PIXI.Container();
    this.background = new PIXI.Sprite(this.pickBackground());
    utils.fitCover(this.background, this.background.texture, viewport.width, viewport.height);
    this.container.addChild(this.background);
    this.viewportWidth = viewport.width;
    this.viewportHeight = viewport.height;

    this.overlay = new PIXI.Graphics();
    this.drawOverlay(viewport);
    this.container.addChild(this.overlay);

    this.content = new PIXI.Container();
    this.container.addChild(this.content);
    this.createCommonText(viewport);
    this.buildScene(viewport);
    this.app.dom.heroCopy.classList.remove("is-muted");
    this.app.dom.heroCopy.classList.toggle(
      "is-suppressed",
      this.meta.id === "finale"
    );
    if (this.meta.id !== "mugwort" && this.meta.id !== "poem") {
      this.app.dom.showHint(SCENE_COPY[this.meta.id].hint);
    }
    this.app.pixiApp.stage.addChild(this.container);

    if (this.manager.completed[this.index]) {
      this.finish(false);
    }
  };

  // 根据场景 id 选择主背景资源。
  MVPScene.prototype.pickBackground = function () {
    if (this.meta.id === "mugwort") {
      return this.app.assets.get("mugwortVillage");
    }
    if (this.meta.id === "poem") {
      return this.app.assets.get("poemWaterPoet");
    }
    return this.app.assets.get(this.meta.assets[0]);
  };

  // 绘制各幕共用的轻遮罩，保证文字和前景可读。
  MVPScene.prototype.drawOverlay = function (viewport) {
    this.overlay.clear();
    if (this.meta.id === "bell") {
      this.overlay.beginFill(0xf4ecd8, 0.08);
      this.overlay.drawRect(0, 0, viewport.width, viewport.height);
      this.overlay.endFill();
      this.overlay.beginFill(0xe8e1d2, 0.08);
      this.overlay.drawRect(0, viewport.height * 0.52, viewport.width, viewport.height * 0.48);
      this.overlay.endFill();
      return;
    }
    if (this.meta.id === "finale") {
      this.overlay.beginFill(0xf4ecd8, 0.06);
      this.overlay.drawRect(0, 0, viewport.width, viewport.height);
      this.overlay.endFill();
      this.overlay.beginFill(0x16343a, 0.03);
      this.overlay.drawRect(0, viewport.height * 0.68, viewport.width, viewport.height * 0.32);
      this.overlay.endFill();
      return;
    }
    this.overlay.beginFill(0xeaf4ef, 0.22);
    this.overlay.drawRect(0, 0, viewport.width, viewport.height);
    this.overlay.endFill();
    this.overlay.beginFill(0x16343a, 0.06);
    this.overlay.drawRect(0, viewport.height * 0.72, viewport.width, viewport.height * 0.28);
    this.overlay.endFill();
  };

  // 创建公共标题与知识文本占位。
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
    if (this.meta.id === "poem") {
      var poemConfig = NS.CONFIG.poem;
      this.knowledgeText.style.fontSize = poemConfig.knowledgeFontSize;
      this.knowledgeText.style.lineHeight = poemConfig.knowledgeLineHeight;
      this.knowledgeText.style.wordWrapWidth = Math.min(360, viewport.width * poemConfig.knowledgeWidthRatio);
      this.knowledgeText.style.stroke = 0xf4ecd8;
      this.knowledgeText.style.strokeThickness = 3;
      this.knowledgeText.style.dropShadow = true;
      this.knowledgeText.style.dropShadowColor = "#f4ecd8";
      this.knowledgeText.style.dropShadowBlur = 8;
      this.knowledgeText.style.dropShadowAlpha = 0.28;
      this.knowledgeText.style.dropShadowDistance = 0;
      this.knowledgeText.position.set(viewport.width * poemConfig.knowledgeX, viewport.height * poemConfig.knowledgeY);
    }
    if (this.meta.id === "bell") {
      this.knowledgeText.style.fontFamily = FONTS.text;
      this.knowledgeText.style.fontSize = 18;
      this.knowledgeText.style.lineHeight = 30;
      this.knowledgeText.style.wordWrapWidth = Math.min(420, viewport.width * 0.26);
      this.knowledgeText.style.align = "left";
      this.knowledgeText.style.stroke = 0xf4ecd8;
      this.knowledgeText.style.strokeThickness = 3;
      this.knowledgeText.position.set(viewport.width * 0.74, viewport.height * 0.74);
    }
    this.content.addChild(this.knowledgeText);
  };

  // 创建 Pixi 文本，统一字体、描边和锚点。
  MVPScene.prototype.createText = function (text, fontSize, fill, alpha) {
    var label = new PIXI.Text(text, {
      fontFamily: FONTS.text,
      fontSize: fontSize,
      fill: fill,
      align: "center",
      lineHeight: Math.round(fontSize * 1.65)
    });
    label.alpha = alpha == null ? 1 : alpha;
    return label;
  };

  // 按资源 key 创建并定位精灵。
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

  var SCENE_BUILDERS = {
    mugwort: "buildMugwort",
    wrap: "buildWrap",
    drum: "buildDrum",
    poem: "buildPoem",
    bell: "buildBell",
    finale: "buildFinale"
  };

  // 根据 meta.id 派发到具体分幕构建函数。
  MVPScene.prototype.buildScene = function (viewport) {
    var builderName = SCENE_BUILDERS[this.meta.id] || SCENE_BUILDERS.finale;
    if (this[builderName]) {
      this[builderName](viewport);
    }
  };

  // 画一次完成反馈圆环。
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

  // 安全停止指定对象上的 GSAP 动画。
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

  // 注册延迟任务，并自动纳入 onExit 清理。
  MVPScene.prototype.scheduleCall = function (delay, callback) {
    var scene = this;
    var call = global.gsap.delayedCall(delay, function () {
      if (!scene.container) {
        return;
      }
      callback();
    });
    this.cleanups.push(function () {
      call.kill();
    });
    return call;
  };

  // 显示当前场景提示文案。
  MVPScene.prototype.setHint = function (text) {
    this.app.dom.showHint(text);
  };

  // 场景完成后进入下一幕。
  MVPScene.prototype.goToNextScene = function () {
    var scene = this;
    if (!this.container) {
      this.manager.goTo(this.index + 1);
      return;
    }
    this.app.dom.clearAction();
    global.gsap.to(this.container, {
      alpha: 0,
      duration: 0.3,
      ease: "sine.inOut",
      onComplete: function () {
        scene.manager.goTo(scene.index + 1);
      }
    });
  };

  // 复用全局 AudioContext，供轻量提示音使用。
  MVPScene.prototype.getSharedAudioContext = function () {
    var AudioContextClass = global.AudioContext || global.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }
    if (!this.sharedAudioContext) {
      this.sharedAudioContext = new AudioContextClass();
    }
    if (this.sharedAudioContext.state === "suspended" && this.sharedAudioContext.resume) {
      this.sharedAudioContext.resume();
    }
    return this.sharedAudioContext;
  };

  // 播放一声柔和短音，作为完成或提示反馈。
  MVPScene.prototype.playSoftTone = function (frequency, duration, peakGain) {
    var context = this.getSharedAudioContext();
    if (!context) {
      return;
    }
    var now = context.currentTime;
    var oscillator = context.createOscillator();
    var gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 0.72), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.04);
  };

  MVPScene.prototype.closeSharedAudio = function () {
    if (!this.sharedAudioContext || !this.sharedAudioContext.close) {
      return;
    }
    this.sharedAudioContext.close();
    this.sharedAudioContext = null;
  };

  var FINISH_HANDLERS = {
    mugwort: function (scene) {
      scene.knowledgeText.alpha = 0;
      scene.app.dom.hideHint();
      scene.app.dom.showAction("入下一幕 →", function () {
        scene.goToNextScene();
      });
    },
    wrap: function (scene) {
      scene.knowledgeText.text = "";
      scene.knowledgeText.alpha = 0;
      if (scene.showWrapKnowledgeDot) {
        scene.showWrapKnowledgeDot(utils.getViewport(scene.app));
      }
      scene.app.dom.showAction("入下一幕 →", function () {
        scene.goToNextScene();
      });
    },
    drum: function (scene, animate) {
      scene.knowledgeText.alpha = 0;
      scene.app.dom.showAction("入下一幕 →", function () {
        scene.goToNextScene();
      });
      if (scene.showDrumKnowledgeDot) {
        scene.showDrumKnowledgeDot(animate);
      }
    },
    bell: function (scene, animate) {
      scene.knowledgeText.alpha = 0;
      scene.app.dom.showAction("入下一幕 →", function () {
        if (scene.playBellExitTransition) {
          scene.playBellExitTransition();
        } else {
          scene.manager.goTo(scene.index + 1);
        }
      });
      if (scene.prepareBellCompletedState) {
        scene.prepareBellCompletedState(animate);
      }
      if (scene.showBellKnowledgeDot) {
        scene.showBellKnowledgeDot(animate);
      }
    },
    poem: function (scene) {
      scene.knowledgeText.text = "";
      scene.knowledgeText.alpha = 0;
      scene.app.dom.showAction("入下一幕 →", function () {
        if (scene.playPoemTransition) {
          scene.playPoemTransition();
        } else {
          scene.manager.goTo(scene.index + 1);
        }
      });
    },
    finale: function (scene, animate) {
      if (scene.showFinaleCompletion) {
        scene.showFinaleCompletion(animate);
        return;
      }
      scene.knowledgeText.alpha = animate === false ? 0.86 : 0;
    }
  };

  // 标记当前分幕完成，并执行场景专属完成处理。
  MVPScene.prototype.finish = function (animate) {
    if (this.completed && animate) {
      return;
    }
    this.completed = true;
    this.manager.completeCurrent();
    this.app.dom.showCompletion(SCENE_COPY[this.meta.id].done);
    if (this.meta.id !== "wrap" && this.meta.id !== "poem") {
      this.knowledgeText.text = SCENE_COPY[this.meta.id].knowledge;
    }
    var handler = FINISH_HANDLERS[this.meta.id] || function (scene) {
      scene.knowledgeText.alpha = animate === false ? 0.86 : 0;
      if (animate !== false) {
        global.gsap.to(scene.knowledgeText, { alpha: 0.86, duration: 0.45 });
      }
      scene.app.dom.showAction("入下一幕 →", function () {
        scene.goToNextScene();
      });
    };
    handler(this, animate);
  };

  // 显示一段短暂知识文案，结束后自动淡出。
  MVPScene.prototype.showTimedKnowledgeText = function (text, alpha, duration) {
    if (!this.knowledgeText) {
      return;
    }
    global.gsap.killTweensOf(this.knowledgeText);
    this.knowledgeText.text = text;
    this.knowledgeText.alpha = 0;
    global.gsap.to(this.knowledgeText, { alpha: alpha, duration: 0.45, ease: "sine.out" });
    global.gsap.to(this.knowledgeText, {
      alpha: 0,
      duration: 0.45,
      delay: duration,
      ease: "sine.in"
    });
  };

  // 每帧更新：处理重排和分幕专属 update hook。
  MVPScene.prototype.onUpdate = function () {
    if (!this.container) {
      return;
    }
    var viewport = utils.getViewport(this.app);
    var viewportChanged = viewport.width !== this.viewportWidth || viewport.height !== this.viewportHeight;
    if (viewportChanged) {
      this.viewportWidth = viewport.width;
      this.viewportHeight = viewport.height;
      utils.fitCover(this.background, this.background.texture, viewport.width, viewport.height);
      this.drawOverlay(viewport);
    }
    if (this.meta.id === "mugwort" && this.updateMugwortLayout) {
      this.updateMugwortLayout(viewport);
    }
    if (viewportChanged && this.meta.id === "finale" && this.updateFinaleLayout) {
      this.updateFinaleLayout(viewport);
    }
    if (viewportChanged && this.meta.id === "drum" && this.updateDrumLayout) {
      this.updateDrumLayout(viewport);
    }
    if (viewportChanged && this.meta.id === "bell" && this.updateBellLayout) {
      this.updateBellLayout(viewport);
    }
  };

  // 退出场景：停止动画、清理 DOM、销毁 Pixi 容器。
  MVPScene.prototype.onExit = function () {
    if (this.meta.id === "bell" && this.closeBellAudio) {
      this.closeBellAudio();
    }
    if (this.meta.id === "drum" && this.closeDrumAudio) {
      this.closeDrumAudio();
    }
    this.closeSharedAudio();
    this.cleanups.forEach(function (cleanup) { cleanup(); });
    this.cleanups = [];
    this.destroyPanels();
    this.killTweens(this.container);
    this.app.dom.clearAction();
    this.app.dom.heroCopy.classList.remove("is-suppressed");
    if (this.app.dom.hidePanelCaption) {
      this.app.dom.hidePanelCaption();
    }
    if (this.app.dom.destroyKnowledgeCard) {
      this.app.dom.destroyKnowledgeCard();
    }
    if (this.container) {
      this.app.pixiApp.stage.removeChild(this.container);
      this.container.destroy({ children: true });
      this.container = null;
    }
  };

  // ============================================================
  // PanelSwitcher：面板切换基础设施
  // ------------------------------------------------------------
  // 各幕可调用 initPanels() 创建一组同尺寸面板（每个面板自带背景
  // 与 buildFn 构造的内容），通过 switchToPanel() 实现
  // 当前淡出+左移、下一帧从右滑入的丝滑切换；
  // 支持 startAutoPlay()/stopAutoPlay() 顺序自动播放。
  // ============================================================
  // 初始化面板式场景，并创建面板背景、内容层和指示器。
  MVPScene.prototype.initPanels = function (panelConfigs) {
    var scene = this;
    var viewport = utils.getViewport(this.app);
    if (!this.content) {
      return;
    }
    this.destroyPanels();
    this.panels = [];
    this.panelConfigs = panelConfigs || [];
    this.panelLayer = new PIXI.Container();
    this.content.addChild(this.panelLayer);

    (panelConfigs || []).forEach(function (config, idx) {
      var panel = new PIXI.Container();
      panel.alpha = idx === 0 ? 1 : 0;
      panel.visible = idx === 0;
      panel.position.x = 0;
      if (config && config.bgKey) {
        var texture = scene.app.assets.get(config.bgKey);
        if (texture) {
          var bg = new PIXI.Sprite(texture);
          utils.fitCover(bg, texture, viewport.width, viewport.height);
          panel.addChild(bg);
          panel.background = bg;
        }
      }
      var contentLayer = new PIXI.Container();
      panel.addChild(contentLayer);
      panel.contentLayer = contentLayer;
      panel.config = config || {};
      if (config && typeof config.buildFn === "function") {
        try {
          config.buildFn.call(scene, contentLayer, viewport, idx);
        } catch (err) {
          // 单面板构建失败不应阻断其它面板
          if (global.console && global.console.warn) {
            global.console.warn("[PanelSwitcher] panel buildFn error", err);
          }
        }
      }
      scene.panelLayer.addChild(panel);
      scene.panels.push(panel);
    });

    this.currentPanelIndex = 0;
    this.panelSwitching = false;
    this.autoPlayCall = null;

    // 显示第一个面板对应的 DOM 文案与圆点
    var first = this.panelConfigs[0];
    if (first && this.app && this.app.dom) {
      if (first.title || first.description) {
        this.app.dom.showPanelCaption(first.title || "", first.description || "");
      }
      if (this.panels.length > 1 && this.app.dom.createPanelIndicator) {
        this.app.dom.createPanelIndicator(this.panels.length, function (idx) {
          scene.switchToPanel(idx);
        });
        this.app.dom.updatePanelIndicator(0);
      }
    }
  };

  // 切换当前面板，负责淡入淡出和 DOM 标题同步。
  MVPScene.prototype.switchToPanel = function (index, direction) {
    var scene = this;
    if (!this.panels || !this.panels.length) {
      return;
    }
    if (index < 0 || index >= this.panels.length) {
      return;
    }
    if (index === this.currentPanelIndex || this.panelSwitching) {
      return;
    }
    var dir = direction === "left" ? "left" : (direction === "right" ? "right" : null);
    if (!dir) {
      dir = index > this.currentPanelIndex ? "right" : "left";
    }
    var fromPanel = this.panels[this.currentPanelIndex];
    var toPanel = this.panels[index];
    if (!fromPanel || !toPanel) {
      return;
    }
    var offset = 60;
    var fromExitX = dir === "right" ? -offset : offset;
    var toEnterX = dir === "right" ? offset : -offset;

    this.panelSwitching = true;
    toPanel.visible = true;
    toPanel.alpha = 0;
    toPanel.position.x = toEnterX;

    global.gsap.killTweensOf(fromPanel);
    global.gsap.killTweensOf(fromPanel.position);
    global.gsap.killTweensOf(toPanel);
    global.gsap.killTweensOf(toPanel.position);

    global.gsap.to(fromPanel, {
      alpha: 0,
      duration: PANEL_TRANSITION_DURATION,
      ease: "power2.inOut",
      onComplete: function () {
        if (!fromPanel.destroyed) {
          fromPanel.visible = false;
          fromPanel.position.x = 0;
        }
      }
    });
    global.gsap.to(fromPanel.position, {
      x: fromExitX,
      duration: PANEL_TRANSITION_DURATION,
      ease: "power2.inOut"
    });
    global.gsap.to(toPanel, {
      alpha: 1,
      duration: PANEL_TRANSITION_DURATION,
      ease: "power2.inOut"
    });
    global.gsap.to(toPanel.position, {
      x: 0,
      duration: PANEL_TRANSITION_DURATION,
      ease: "power2.inOut",
      onComplete: function () {
        scene.panelSwitching = false;
      }
    });

    this.currentPanelIndex = index;

    // 同步切换文案与指示器
    var nextConfig = this.panelConfigs[index] || {};
    if (this.app && this.app.dom) {
      if (this.app.dom.showPanelCaption) {
        this.app.dom.showPanelCaption(nextConfig.title || "", nextConfig.description || "");
      }
      if (this.app.dom.updatePanelIndicator) {
        this.app.dom.updatePanelIndicator(index);
      }
    }
  };

  // 启动面板自动轮播。
  MVPScene.prototype.startAutoPlay = function (intervalMS) {
    var scene = this;
    if (!this.panels || this.panels.length < 2) {
      return;
    }
    this.stopAutoPlay();
    var interval = (intervalMS && intervalMS > 0) ? intervalMS / 1000 : 5;
    var tick = function () {
      if (!scene.panels || !scene.panels.length) {
        return;
      }
      var next = scene.currentPanelIndex + 1;
      if (next >= scene.panels.length) {
        scene.stopAutoPlay();
        return;
      }
      scene.switchToPanel(next, "right");
      if (next < scene.panels.length - 1) {
        scene.autoPlayCall = global.gsap.delayedCall(interval, tick);
      } else {
        scene.autoPlayCall = null;
      }
    };
    this.autoPlayCall = global.gsap.delayedCall(interval, tick);
    // 在 onExit 时一并清理
    this.cleanups.push(function () { scene.stopAutoPlay(); });
  };

  // 停止面板自动轮播。
  MVPScene.prototype.stopAutoPlay = function () {
    if (this.autoPlayCall) {
      this.autoPlayCall.kill();
      this.autoPlayCall = null;
    }
  };

  MVPScene.prototype.getCurrentPanelIndex = function () {
    return this.currentPanelIndex || 0;
  };

  MVPScene.prototype.getPanelCount = function () {
    return this.panels ? this.panels.length : 0;
  };

  // 销毁面板和相关 DOM 控件。
  MVPScene.prototype.destroyPanels = function () {
    this.stopAutoPlay();
    if (this.panels && this.panels.length) {
      this.panels.forEach(function (panel) {
        if (panel && !panel.destroyed) {
          global.gsap.killTweensOf(panel);
          if (panel.position) {
            global.gsap.killTweensOf(panel.position);
          }
          if (panel.parent) {
            panel.parent.removeChild(panel);
          }
          panel.destroy({ children: true });
        }
      });
    }
    this.panels = [];
    this.panelConfigs = [];
    if (this.panelLayer && !this.panelLayer.destroyed) {
      if (this.panelLayer.parent) {
        this.panelLayer.parent.removeChild(this.panelLayer);
      }
      this.panelLayer.destroy({ children: true });
    }
    this.panelLayer = null;
    this.currentPanelIndex = 0;
    this.panelSwitching = false;
    if (this.app && this.app.dom) {
      if (this.app.dom.hidePanelCaption) {
        this.app.dom.hidePanelCaption();
      }
      if (this.app.dom.destroyPanelIndicator) {
        this.app.dom.destroyPanelIndicator();
      }
    }
  };

  NS.MVPScene = MVPScene;
}(window));
