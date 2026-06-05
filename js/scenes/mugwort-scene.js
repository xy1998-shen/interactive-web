// 第二幕寻艾：4 面板顺序播放，配套 PixiJS 简洁动效。
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};
  var utils = NS.utils;

  // 4 个面板的静态配置；动态元素由 buildXxx 在 buildFn 内创建。
  var PANEL_DEFS = [
    {
      bgKey: "mugwortPanel1Hang",
      title: "悬艾",
      description: "端午悬艾，驱邪祈福。艾草菖蒲悬于门楣，是千年不变的守护。",
      kind: "hang"
    },
    {
      bgKey: "mugwortPanel2Boil",
      title: "煮汤",
      description: "艾叶煮汤沐浴，祛湿散寒。古人以此洁净身心，迎接仲夏。",
      kind: "boil"
    },
    {
      bgKey: "mugwortPanel3Cake",
      title: "制糕",
      description: "艾汁和米，揉作青团。春末夏初的时令味道，是餐桌上的团圆。",
      kind: "cake"
    },
    {
      bgKey: "mugwortPanel4Sachet",
      title: "佩香",
      description: "五彩丝缚臂，香囊佩身。长辈的祝福，系在孩子腕间。",
      kind: "sachet"
    }
  ];

  var STEAM_POOL_SIZE = 16;
  var STEAM_SPAWN_INTERVAL = 0.18; // 秒
  var PANEL_AUTOPLAY_INTERVAL_MS = 8000;
  var KNOWLEDGE_TITLE = "端午寻艾 · 悬艾守户";
  var KNOWLEDGE_CONTENT = [
    "<p><strong>为何端午悬艾？</strong></p>",
    "<p>农历五月草木正盛，艾叶气味清苦。古人把它悬在门窗旁，借草木清气寄托避疫、祈安与迎夏的愿望。</p>",
    "<br>",
    "<p><strong>艾草如何走进日常？</strong></p>",
    "<p>• 悬门：艾草与菖蒲挂在门楣，寓意守护家宅</p>",
    "<p>• 煮汤：艾叶入水沐浴，取洁净身心之意</p>",
    "<p>• 入食：艾汁和米成糕，把草木清香带上餐桌</p>",
    "<p>• 佩香：香囊与五彩丝相伴，把长辈祝愿系在身边</p>",
    "<br>",
    "<p><strong>与端午记忆</strong></p>",
    "<p>悬艾不只来自屈原追思，也来自盛夏生活经验；后来它与粽叶、竞渡一起，成为五月端午的共同记号。</p>"
  ].join("");

  // ----- 各面板动态元素构建 -----

  // 悬艾：使用生成的艾草束素材，保留门头轻摆与清香回弹。
  function buildHang(layer, viewport) {
    var scene = this;
    var group = new PIXI.Container();
    group.position.set(viewport.width * 0.18, viewport.height * 0.30);
    layer.addChild(group);

    var rope = new PIXI.Graphics();
    rope.lineStyle(1.6, 0x6b5333, 0.55);
    rope.moveTo(0, -viewport.height * 0.16);
    rope.lineTo(0, 0);
    group.addChild(rope);

    var texture = scene.app.assets.get("mugwortHangingBundle");
    var bundle = new PIXI.Sprite(texture);
    bundle.anchor.set(0.5, 0.06);
    bundle.height = viewport.height * 0.15;
    bundle.scale.x = bundle.scale.y * 0.78;
    bundle.alpha = 0.88;
    bundle.position.set(0, viewport.height * 0.005);
    group.addChild(bundle);

    var scent = new PIXI.Graphics();
    scent.lineStyle(1.1, 0x89a96b, 0.26);
    for (var i = 0; i < 4; i++) {
      var y = viewport.height * (0.025 + i * 0.034);
      scent.moveTo(10 + i * 2, y);
      scent.bezierCurveTo(30, y + 12, 14, y + 26, 40, y + 42);
    }
    scent.alpha = 0.42;
    group.addChildAt(scent, 1);

    group.rotation = -0.087; // -5°
    var swing = global.gsap.to(group, {
      rotation: 0.065,
      duration: 2.9,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
    var bob = global.gsap.to(bundle, {
      y: viewport.height * 0.022,
      duration: 2.2,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
    var breathe = global.gsap.to(bundle.scale, {
      x: bundle.scale.x * 1.035,
      y: bundle.scale.y * 1.02,
      duration: 1.8,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
    var scentTween = global.gsap.to(scent, {
      alpha: 0.16,
      x: 8,
      duration: 2.4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
    scene.cleanups.push(function () {
      swing.kill();
      bob.kill();
      breathe.kill();
      scentTween.kill();
    });

    return { kind: "hang", group: group, bundle: bundle };
  }

  // 煮汤：粒子池，从灶台口缓慢上升、扩散、淡出。
  function buildBoil(layer, viewport) {
    var scene = this;
    var origin = { x: viewport.width * 0.43, y: viewport.height * 0.47 };
    var wisp = new PIXI.Sprite(scene.app.assets.get("mugwortSteamWisp"));
    wisp.anchor.set(0.5, 0.86);
    wisp.height = viewport.height * 0.38;
    wisp.scale.x = wisp.scale.y * 0.58;
    wisp.position.set(viewport.width * 0.43, viewport.height * 0.50);
    wisp.alpha = 0.48;
    layer.addChild(wisp);

    var wispRise = global.gsap.to(wisp, {
      y: viewport.height * 0.465,
      alpha: 0.34,
      duration: 3.4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
    var wispBreathe = global.gsap.to(wisp.scale, {
      x: wisp.scale.x * 1.08,
      y: wisp.scale.y * 1.06,
      duration: 2.8,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
    scene.cleanups.push(function () {
      wispRise.kill();
      wispBreathe.kill();
    });

    var pool = [];
    for (var i = 0; i < STEAM_POOL_SIZE; i++) {
      var sprite = new PIXI.Graphics();
      sprite.beginFill(0xf6efd9, 0.24);
      sprite.drawCircle(0, 0, 5);
      sprite.endFill();
      sprite.alpha = 0;
      sprite.visible = false;
      layer.addChild(sprite);
      pool.push({
        sprite: sprite,
        active: false,
        life: 0,
        maxLife: 0,
        x: 0, y: 0,
        vx: 0, vy: 0
      });
    }
    return {
      kind: "boil",
      wisp: wisp,
      pool: pool,
      origin: origin,
      spawnTimer: 0
    };
  }

  function spawnSteamParticle(panelData) {
    var pool = panelData.pool;
    var origin = panelData.origin;
    for (var i = 0; i < pool.length; i++) {
      var p = pool[i];
      if (p.active) {
        continue;
      }
      p.active = true;
      p.life = 0;
      p.maxLife = 2.4 + Math.random() * 1.4;
      p.x = origin.x + (Math.random() - 0.5) * 80;
      p.y = origin.y + (Math.random() - 0.5) * 8;
      p.vx = (Math.random() - 0.5) * 18;
      p.vy = -38 - Math.random() * 22;
      p.sprite.position.set(p.x, p.y);
      p.sprite.alpha = 0.3;
      p.sprite.scale.set(0.55 + Math.random() * 0.4);
      p.sprite.visible = true;
      return;
    }
  }

  function updateBoil(panelData, dt) {
    panelData.spawnTimer += dt;
    while (panelData.spawnTimer >= STEAM_SPAWN_INTERVAL) {
      panelData.spawnTimer -= STEAM_SPAWN_INTERVAL;
      spawnSteamParticle(panelData);
    }
    var pool = panelData.pool;
    for (var i = 0; i < pool.length; i++) {
      var p = pool[i];
      if (!p.active) {
        continue;
      }
      p.life += dt;
      var t = p.life / p.maxLife;
      if (t >= 1) {
        p.active = false;
        p.sprite.visible = false;
        p.sprite.alpha = 0;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx += (Math.random() - 0.5) * 12 * dt;
      p.sprite.position.set(p.x, p.y);
      p.sprite.alpha = 0.3 * (1 - t);
      var s = 0.55 + 1.6 * t;
      p.sprite.scale.set(s);
    }
  }

  function clearSteamPool(panelData) {
    if (!panelData || !panelData.pool) {
      return;
    }
    for (var i = 0; i < panelData.pool.length; i++) {
      var p = panelData.pool[i];
      p.active = false;
      if (p.sprite) {
        p.sprite.visible = false;
        p.sprite.alpha = 0;
      }
    }
  }

  // 制糕：生成素材贴近青团与桌面，呈现艾汁入粉的轻微呼吸。
  function buildCake(layer, viewport) {
    var scene = this;
    var dust = new PIXI.Container();
    dust.position.set(viewport.width * 0.46, viewport.height * 0.58);
    dust.alpha = 0.55;
    layer.addChild(dust);

    var flourMist = new PIXI.Sprite(scene.app.assets.get("qingtuanFlourMist"));
    flourMist.anchor.set(0.5);
    flourMist.width = viewport.width * 0.24;
    flourMist.scale.y = flourMist.scale.x * 0.68;
    flourMist.position.set(viewport.width * 0.45, viewport.height * 0.49);
    flourMist.alpha = 0.34;
    if (PIXI.BLEND_MODES && PIXI.BLEND_MODES.SCREEN != null) {
      flourMist.blendMode = PIXI.BLEND_MODES.SCREEN;
    }
    dust.addChild(flourMist);

    var dots = [];
    var dotColors = [0xf7efd9, 0xe7dfc7, 0x8ea86a];
    for (var i = 0; i < 18; i++) {
      var dot = new PIXI.Graphics();
      dot.beginFill(dotColors[i % dotColors.length], i % 3 === 2 ? 0.28 : 0.38);
      dot.drawCircle(0, 0, 1.4 + Math.random() * 2.2);
      dot.endFill();
      dot.position.set((Math.random() - 0.5) * viewport.width * 0.22, (Math.random() - 0.5) * viewport.height * 0.10);
      dust.addChild(dot);
      dots.push(dot);
    }

    var alphaTween = global.gsap.to(dust, {
      alpha: 0.26,
      duration: 2.1,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
    var driftTween = global.gsap.to(dust, {
      y: dust.y - viewport.height * 0.015,
      duration: 2.7,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
    var mistTween = global.gsap.to(flourMist.scale, {
      x: flourMist.scale.x * 1.05,
      y: flourMist.scale.y * 1.04,
      duration: 2.4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
    scene.cleanups.push(function () {
      alphaTween.kill();
      driftTween.kill();
      mistTween.kill();
    });

    return { kind: "cake", dust: dust, flourMist: flourMist, dots: dots };
  }

  // 佩香：生成香囊清气低透明叠加，保持五色丝轻而短。
  function buildSachet(layer, viewport) {
    var scene = this;
    var charmGlow = new PIXI.Container();
    charmGlow.position.set(viewport.width * 0.565, viewport.height * 0.505);
    layer.addChild(charmGlow);

    var scentWisp = new PIXI.Sprite(scene.app.assets.get("sachetScentWisp"));
    scentWisp.anchor.set(0.5, 0.55);
    scentWisp.height = viewport.height * 0.24;
    scentWisp.scale.x = scentWisp.scale.y * 0.62;
    scentWisp.alpha = 0.52;
    scentWisp.position.set(0, -viewport.height * 0.025);
    if (PIXI.BLEND_MODES && PIXI.BLEND_MODES.SCREEN != null) {
      scentWisp.blendMode = PIXI.BLEND_MODES.SCREEN;
    }
    charmGlow.addChild(scentWisp);

    var scentFloat = global.gsap.to(scentWisp, {
      y: -viewport.height * 0.045,
      rotation: 0.035,
      alpha: 0.36,
      duration: 3.0,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
    var scentBreathe = global.gsap.to(scentWisp.scale, {
      x: scentWisp.scale.x * 1.06,
      y: scentWisp.scale.y * 1.05,
      duration: 2.6,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
    scene.cleanups.push(function () {
      scentFloat.kill();
      scentBreathe.kill();
    });

    var sparks = [];
    for (var i = 0; i < 10; i++) {
      var spark = new PIXI.Graphics();
      spark.beginFill(i % 2 ? 0xc8a45d : 0xf1e8d2, 0.48);
      spark.drawCircle(0, 0, 1.8 + Math.random() * 2.4);
      spark.endFill();
      spark.position.set((Math.random() - 0.5) * viewport.width * 0.045, (Math.random() - 0.5) * viewport.height * 0.08);
      spark.alpha = 0.22 + Math.random() * 0.28;
      charmGlow.addChild(spark);
      sparks.push(spark);

      var pulse = global.gsap.to(spark, {
        alpha: 0.08,
        y: spark.y - viewport.height * (0.012 + Math.random() * 0.012),
        duration: 1.8 + Math.random() * 0.8,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        delay: i * 0.1
      });
      (function (tween) {
        scene.cleanups.push(function () { tween.kill(); });
      }(pulse));
    }
    return { kind: "sachet", charmGlow: charmGlow, scentWisp: scentWisp, sparks: sparks };
  }

  var BUILDERS = {
    hang: buildHang,
    boil: buildBoil,
    cake: buildCake,
    sachet: buildSachet
  };

  // ----- MVPScene 上的寻艾分幕实现 -----

  // SCENE_BUILDERS 在 base-scene 中按 meta.id 派发到此方法。
  NS.MVPScene.prototype.buildMugwort = function (viewport) {
    var scene = this;
    this.app.dom.hideHint();
    var rt = {
      panels: {},                 // 各面板的运行态（粒子池等）
      visited: { 0: true },       // 入场默认已看到第一个面板
      visitedCount: 1,
      finishScheduled: false,
      lastFrameTime: performance.now() / 1000,
      layoutWidth: viewport.width,
      layoutHeight: viewport.height
    };
    this.state.mugwortRuntime = rt;

    var configs = PANEL_DEFS.map(function (def) {
      return {
        bgKey: def.bgKey,
        title: def.title,
        description: def.description,
        buildFn: function (contentLayer, vp, idx) {
          var builder = BUILDERS[def.kind];
          if (!builder) {
            return;
          }
          // 这里 this 已是 MVPScene（base-scene 内 call(scene, ...)）
          var bag = builder.call(this, contentLayer, vp);
          if (bag) {
            rt.panels[idx] = bag;
          }
        }
      };
    });

    this.initPanels(configs);

    // 已完成场景重入：直接停留在最后面板，由 base.onEnter 触发 finish(false)。
    if (this.manager.completed[this.index]) {
      // 跳到最后一个面板的静态状态
      if (this.panels && this.panels.length > 1) {
        var lastIdx = this.panels.length - 1;
        for (var i = 0; i < this.panels.length; i++) {
          var panel = this.panels[i];
          if (!panel) { continue; }
          panel.alpha = i === lastIdx ? 1 : 0;
          panel.visible = i === lastIdx;
          panel.position.x = 0;
        }
        this.currentPanelIndex = lastIdx;
        rt.visited = { 0: true, 1: true, 2: true, 3: true };
        rt.visitedCount = 4;
        rt.finishScheduled = true;
        if (this.app && this.app.dom) {
          var lastDef = PANEL_DEFS[lastIdx];
          if (this.app.dom.showPanelCaption && lastDef) {
            this.app.dom.showPanelCaption(lastDef.title, lastDef.description);
          }
          if (this.app.dom.updatePanelIndicator) {
            this.app.dom.updatePanelIndicator(lastIdx);
          }
        }
        this.showMugwortKnowledgeCard();
      }
      return;
    }

    // 放慢自动播放，让每个子幕有完整阅读时间。
    this.startAutoPlay(PANEL_AUTOPLAY_INTERVAL_MS);
  };

  // base-scene.onUpdate 在 meta.id === "mugwort" 时调用此 hook。
  NS.MVPScene.prototype.updateMugwortLayout = function (viewport) {
    var rt = this.state.mugwortRuntime;
    if (!rt) {
      return;
    }
    var scene = this;

    // 检测当前面板访问情况，4 面板全看到后延迟 2 秒触发 finish。
    var idx = this.currentPanelIndex || 0;
    if (!rt.visited[idx]) {
      rt.visited[idx] = true;
      rt.visitedCount += 1;
      if (rt.visitedCount >= 4 && !rt.finishScheduled) {
        rt.finishScheduled = true;
        this.scheduleCall(2.0, function () {
          scene.stopAutoPlay();
          if (!scene.completed) {
            scene.showMugwortKnowledgeCard();
            scene.finish(true);
          }
        });
      }
    }

    // 视口尺寸变化时重新 fitCover 各面板背景。
    if (rt.layoutWidth !== viewport.width || rt.layoutHeight !== viewport.height) {
      rt.layoutWidth = viewport.width;
      rt.layoutHeight = viewport.height;
      if (this.panels) {
        this.panels.forEach(function (panel) {
          if (panel && panel.background && panel.background.texture) {
            utils.fitCover(panel.background, panel.background.texture, viewport.width, viewport.height);
          }
        });
      }
    }

    // dt 通过 performance.now 估算；onUpdate 不接收 dt 参数。
    var now = performance.now() / 1000;
    var dt = now - rt.lastFrameTime;
    if (dt < 0 || dt > 0.1) {
      dt = 1 / 60; // 切后台或首帧异常时回退稳定步长
    }
    rt.lastFrameTime = now;

    // 仅当前可见面板的粒子需要推进；其它面板的粒子重置回收。
    for (var key in rt.panels) {
      if (!Object.prototype.hasOwnProperty.call(rt.panels, key)) {
        continue;
      }
      var panelData = rt.panels[key];
      if (!panelData || panelData.kind !== "boil") {
        continue;
      }
      if (Number(key) === idx && !this.panelSwitching) {
        updateBoil(panelData, dt);
      } else {
        clearSteamPool(panelData);
      }
    }
  };

  NS.MVPScene.prototype.showMugwortKnowledgeCard = function () {
    if (this.app && this.app.dom && this.app.dom.showKnowledgeCard) {
      this.app.dom.showKnowledgeCard(KNOWLEDGE_TITLE, KNOWLEDGE_CONTENT);
    }
  };

  // ----- MugwortScene 类（与 NS.MVPScene 协同的轻量入口）-----
  // 当前 SceneManager 默认实例化 MVPScene，本类作为 task 模板的对外约定保留，
  // 也便于将来的 SceneManager 切换到分幕类时直接接入。
  function MugwortScene(app, manager, meta, index) {
    NS.MVPScene.call(this, app, manager, meta, index);
  }
  MugwortScene.prototype = Object.create(NS.MVPScene.prototype);
  MugwortScene.prototype.constructor = MugwortScene;

  MugwortScene.prototype.onEnter = function () {
    NS.MVPScene.prototype.onEnter.call(this);
  };

  MugwortScene.prototype.onUpdate = function (dt) {
    NS.MVPScene.prototype.onUpdate.call(this, dt);
  };

  MugwortScene.prototype.onExit = function () {
    NS.MVPScene.prototype.onExit.call(this);
  };

  NS.MugwortScene = MugwortScene;
}(window));
