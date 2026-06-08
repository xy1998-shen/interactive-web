// 终幕：六段回望分镜 + ending 长卷汇总。
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};
  var FONTS = NS.FONT_STACKS;

  // 自动轮播节拍
  var PANEL_INTERVAL = 3.2;        // 普通面板停留秒数
  var LAST_PANEL_DWELL = 2.2;      // 最后一张汇总面板停留多久后开始收束
  var FAREWELL_TITLE = "一路风物，归成此印";
  var FAREWELL_TEXT = "愿年年此日，粽香犹在，家人安好。";
  var RESTART_DELAY = 3;           // 寄语显示后等待多久浮出"重游此程"
  var GESTURE_COOLDOWN = 0.75;     // 手势切换最短间隔，避免连续抖动

  // 构建尾声：六段回望面板、手势切换与最终收束入口。
  NS.MVPScene.prototype.buildFinale = function (viewport) {
    var scene = this;

    // 终幕走自有 UI：屏蔽默认提示与 knowledgeText
    if (this.knowledgeText) {
      this.knowledgeText.alpha = 0;
      this.knowledgeText.visible = false;
    }
    this.app.dom.hideHint();
    this.app.dom.heroCopy.classList.add("is-suppressed");

    var panelConfigs = [
      {
        bgKey: "finalePanel0Mugwort",
        title: "入江寻艾",
        description: "晨雾、轻舟和门前清艾先开场，带用户重新回到楚江。"
      },
      {
        bgKey: "finalePanel1Memorial",
        title: "江畔遥祭",
        description: "江畔香火和水雾低低铺开，把端午的追思留在岸边。"
      },
      {
        bgKey: "finalePanel2Race",
        title: "鼓声推舟",
        description: "百桨争流退成一条水线，端午的热闹在这里慢下来。"
      },
      {
        bgKey: "finalePanel3Feast",
        title: "粽香成席",
        description: "粽香和团坐收成一束暖光，落在最日常的团圆里。"
      },
      {
        bgKey: "finalePanel4Night",
        title: "钟波入夜",
        description: "诗声与礼乐余韵沉入夜色，等待最后一枚端午印记合上。"
      },
      {
        bgKey: "finalePanel5Summary",
        title: "四象归印",
        description: "艾、粽、舟、钟在同一张长卷里合成端午印记。"
      }
    ];

    this.state.finale = {
      endingStarted: false,
      manualMode: false,
      gestureBound: false,
      gestureAccum: 0,
      gesturePointerDown: false,
      lastPointerX: 0,
      lastGestureAt: 0,
      pendingPanelIndex: null,
      stepCall: null,
      endingLayer: null
    };

    this.initPanels(panelConfigs);

    // 用自定义点击逻辑替换默认指示器：手动跳转时禁用自动序列
    if (this.app.dom.createPanelIndicator) {
      this.app.dom.createPanelIndicator(panelConfigs.length, function (idx) {
        scene._handleFinaleDotClick(idx);
      });
      this.app.dom.updatePanelIndicator(0);
    }

    this._bindFinaleGestures();
    this.scheduleCall(0.05, function () {
      scene.app.dom.hideHint();
    });

    // 启动自动序列
    this._scheduleFinaleAutoStep(0);
  };

  // ============================================================
  // 面板自动序列调度
  // ============================================================
  // 安排下一张回望面板或进入最终 ending。
  NS.MVPScene.prototype._scheduleFinaleAutoStep = function (currentIndex) {
    var scene = this;
    var state = this.state.finale;
    if (!state || state.endingStarted) return;

    if (state.stepCall) {
      state.stepCall.kill();
      state.stepCall = null;
    }

    var lastIndex = (this.panelConfigs ? this.panelConfigs.length : 4) - 1;

    if (currentIndex >= lastIndex) {
      // 在最后一个面板停留 LAST_PANEL_DWELL 秒后进入收束
      state.stepCall = this.scheduleCall(LAST_PANEL_DWELL, function () {
        scene._startEndingSequence();
      });
      return;
    }

    if (state.manualMode) {
      // 手动模式下不再继续自动跳转（除非已到最后面板）
      return;
    }

    state.stepCall = this.scheduleCall(PANEL_INTERVAL, function () {
      var next = currentIndex + 1;
      scene.switchToPanel(next);
      scene._scheduleFinaleAutoStep(next);
    });
  };

  // 处理面板指示器点击，进入手动浏览模式。
  NS.MVPScene.prototype._handleFinaleDotClick = function (idx) {
    var state = this.state.finale;
    if (!state || state.endingStarted) return;

    state.manualMode = true;
    this._goToFinalePanel(idx);
  };

  // 切换到指定尾声面板，并同步说明文案。
  NS.MVPScene.prototype._goToFinalePanel = function (idx) {
    var scene = this;
    var state = this.state.finale;
    if (!state || state.endingStarted || !this.panelConfigs || !this.panelConfigs.length) return;

    var lastIndex = this.panelConfigs.length - 1;
    var target = Math.max(0, Math.min(lastIndex, idx));

    if (this.panelSwitching) {
      state.pendingPanelIndex = target;
      if (!state.pendingPanelCall) {
        state.pendingPanelCall = this.scheduleCall(0.5, function () {
          var pending = state.pendingPanelIndex;
          state.pendingPanelIndex = null;
          state.pendingPanelCall = null;
          if (pending != null) {
            scene._goToFinalePanel(pending);
          }
        });
      }
      return;
    }

    if (state.stepCall) {
      state.stepCall.kill();
      state.stepCall = null;
    }
    this.switchToPanel(target);

    // 即便手动跳转，落到最后一个面板也要进入收束。
    if (target >= lastIndex) {
      state.stepCall = this.scheduleCall(LAST_PANEL_DWELL, function () {
        scene._startEndingSequence();
      });
    }
  };

  // 绑定尾声滑动、滚轮和拖拽手势。
  NS.MVPScene.prototype._bindFinaleGestures = function () {
    var scene = this;
    var state = this.state.finale;
    var canvas = this.app && this.app.canvas;
    if (!state || state.gestureBound || !canvas) return;
    state.gestureBound = true;

    function canMove() {
      return state && !state.endingStarted && scene.panelConfigs && scene.panelConfigs.length;
    }

    function requestMove(direction) {
      if (!canMove()) return;
      var now = (global.performance && global.performance.now ? global.performance.now() : Date.now()) / 1000;
      if (now - state.lastGestureAt < GESTURE_COOLDOWN) return;
      var current = scene.currentPanelIndex || 0;
      var target = current + direction;
      if (target < 0 || target >= scene.panelConfigs.length) return;
      state.lastGestureAt = now;
      state.manualMode = true;
      state.gestureAccum = 0;
      scene._goToFinalePanel(target);
    }

    function onPointerDown(event) {
      if (!canMove()) return;
      state.gesturePointerDown = true;
      state.lastPointerX = event.clientX || 0;
      state.gestureAccum = 0;
      var viewport = NS.utils.getViewport(scene.app);
      state.gestureThreshold = Math.max(96, viewport.width * 0.09);
    }

    function onPointerMove(event) {
      if (!canMove() || !state.gesturePointerDown) return;
      var nextX = event.clientX || 0;
      var dx = nextX - state.lastPointerX;
      state.lastPointerX = nextX;
      state.gestureAccum += dx;
      var threshold = state.gestureThreshold || 120;
      if (Math.abs(state.gestureAccum) >= threshold) {
        requestMove(state.gestureAccum < 0 ? 1 : -1);
      }
    }

    function onPointerUp() {
      state.gesturePointerDown = false;
      state.gestureAccum = 0;
    }

    function onWheel(event) {
      if (!canMove()) return;
      var delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (Math.abs(delta) < 22) return;
      requestMove(delta > 0 ? 1 : -1);
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: true });

    this.cleanups.push(function () {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
    });
  };

  // ============================================================
  // 收束序列：暗遮罩 → 印章 → 寄语 → "重游此程"
  // ============================================================
  // 开始最终长卷收束、印记合成和重游 CTA。
  NS.MVPScene.prototype._startEndingSequence = function () {
    var scene = this;
    var state = this.state.finale;
    if (!state || state.endingStarted) return;
    state.endingStarted = true;

    var viewport = NS.utils.getViewport(this.app);

    // 收束序列中禁用面板切换：解除指示器交互
    if (this.app.dom.panelIndicator) {
      this.app.dom.panelIndicator.classList.add("is-disabled");
      this.app.dom.panelIndicator.style.pointerEvents = "none";
      this.app.dom.panelIndicator.style.opacity = "0.4";
    }
    if (this.app.dom.panelIndicatorDots && this.app.dom.panelIndicatorDots.length) {
      this.app.dom.panelIndicatorDots.forEach(function (dot) {
        dot.disabled = true;
      });
    }
    this.app.dom.hidePanelCaption();

    var endingLayer = new PIXI.Container();
    if (this.content) {
      this.content.addChild(endingLayer);
    }
    state.endingLayer = endingLayer;

    // 1) 切回更克制的汇总长卷作为最终 ending 背景
    var endingTexture = this.app.assets.get("finalePanel5Summary") || this.app.assets.get("finaleEndingBg");
    if (endingTexture) {
      var summaryBg = new PIXI.Sprite(endingTexture);
      NS.utils.fitCover(summaryBg, endingTexture, viewport.width, viewport.height);
      summaryBg.alpha = 0;
      endingLayer.addChild(summaryBg);
      var bgTween = global.gsap.to(summaryBg, {
        alpha: 1,
        duration: 1.1,
        ease: "sine.inOut"
      });
      this.cleanups.push(function () { bgTween.kill(); });
    }

    // 2) 半透明黑色遮罩 0 → 0.42
    var mask = new PIXI.Graphics();
    mask.beginFill(0x05080a, 1);
    mask.drawRect(0, 0, viewport.width, viewport.height);
    mask.endFill();
    mask.alpha = 0;
    endingLayer.addChild(mask);
    var maskTween = global.gsap.to(mask, {
      alpha: 0.42,
      duration: 1.5,
      ease: "sine.out"
    });
    this.cleanups.push(function () { maskTween.kill(); });

    // 3) 中央印章：缩放 0.3→1，旋转 -10°→0°，alpha 0→1
    var sealTexture = scene.app.assets.get("seal");
    if (!sealTexture) {
      return;
    }
    var seal = new PIXI.Sprite(sealTexture);
    seal.anchor.set(0.5);
    var sealScale = (viewport.width * 0.16) / sealTexture.width;
    seal.scale.set(sealScale * 0.3);
    seal.rotation = -0.18;
    seal.alpha = 0;
    seal.position.set(viewport.width * 0.5, viewport.height * 0.44);
    endingLayer.addChild(seal);

    var sealAlphaTween = global.gsap.to(seal, {
      alpha: 1,
      duration: 1.0,
      delay: 0.55,
      ease: "sine.out"
    });
    var sealScaleTween = global.gsap.to(seal.scale, {
      x: sealScale,
      y: sealScale,
      duration: 1.2,
      delay: 0.55,
      ease: "back.out(1.4)"
    });
    var sealRotTween = global.gsap.to(seal, {
      rotation: 0,
      duration: 1.2,
      delay: 0.55,
      ease: "sine.out"
    });
    this.cleanups.push(function () {
      sealAlphaTween.kill();
      sealScaleTween.kill();
      sealRotTween.kill();
    });

    // 印章呼吸光环
    var halo = new PIXI.Graphics();
    halo.beginFill(0xc8a45d, 0.18);
    halo.drawCircle(0, 0, viewport.width * 0.13);
    halo.endFill();
    halo.position.set(viewport.width * 0.5, viewport.height * 0.44);
    halo.alpha = 0;
    endingLayer.addChildAt(halo, 1);
    var haloIn = global.gsap.to(halo, {
      alpha: 0.4,
      duration: 1.2,
      delay: 1.0,
      ease: "sine.out"
    });
    var haloPulse = global.gsap.to(halo.scale, {
      x: 1.18, y: 1.18,
      duration: 2.4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      delay: 1.6
    });
    this.cleanups.push(function () {
      haloIn.kill();
      haloPulse.kill();
    });

    // 4) 收束题签与寄语（书法字体）
    var farewellTitle = new PIXI.Text(FAREWELL_TITLE, {
      fontFamily: FONTS.calligraphy,
      fontSize: Math.round(viewport.width * 0.02) + 14,
      fill: 0xf4ecd8,
      align: "center",
      letterSpacing: 4,
      lineHeight: Math.round(viewport.width * 0.028) + 18,
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowBlur: 12,
      dropShadowAlpha: 0.7,
      dropShadowDistance: 0
    });
    farewellTitle.anchor.set(0.5);
    farewellTitle.alpha = 0;
    var titleTargetY = viewport.height * 0.62;
    farewellTitle.position.set(viewport.width * 0.5, titleTargetY + 18);
    endingLayer.addChild(farewellTitle);

    var farewell = new PIXI.Text(FAREWELL_TEXT, {
      fontFamily: FONTS.text,
      fontSize: Math.round(viewport.width * 0.01) + 13,
      fill: 0xe8e1d2,
      align: "center",
      letterSpacing: 1,
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowBlur: 10,
      dropShadowAlpha: 0.58,
      dropShadowDistance: 0
    });
    farewell.anchor.set(0.5);
    farewell.alpha = 0;
    var farewellTargetY = viewport.height * 0.7;
    farewell.position.set(viewport.width * 0.5, farewellTargetY + 16);
    endingLayer.addChild(farewell);

    var farewellTitleAlpha = global.gsap.to(farewellTitle, {
      alpha: 0.98,
      duration: 1.0,
      delay: 1.45,
      ease: "sine.out"
    });
    var farewellTitleY = global.gsap.to(farewellTitle.position, {
      y: titleTargetY,
      duration: 1.0,
      delay: 1.45,
      ease: "sine.out"
    });
    var farewellAlpha = global.gsap.to(farewell, {
      alpha: 0.88,
      duration: 1.0,
      delay: 1.78,
      ease: "sine.out"
    });
    var farewellY = global.gsap.to(farewell.position, {
      y: farewellTargetY,
      duration: 1.0,
      delay: 1.78,
      ease: "sine.out"
    });
    this.cleanups.push(function () {
      farewellTitleAlpha.kill();
      farewellTitleY.kill();
      farewellAlpha.kill();
      farewellY.kill();
    });

    // 5) 一段细金线作为印章下分割
    var rule = new PIXI.Graphics();
    var ruleW = viewport.width * 0.12;
    rule.lineStyle(1, 0xc8a45d, 0.6);
    rule.moveTo(-ruleW / 2, 0);
    rule.lineTo(ruleW / 2, 0);
    rule.position.set(viewport.width * 0.5, viewport.height * 0.555);
    rule.alpha = 0;
    endingLayer.addChild(rule);
    var ruleTween = global.gsap.to(rule, {
      alpha: 0.78,
      duration: 0.8,
      delay: 1.4,
      ease: "sine.out"
    });
    this.cleanups.push(function () { ruleTween.kill(); });

    // 6) 寄语显示后再过 RESTART_DELAY 秒浮出"重游此程"
    var ctaDelay = 1.78 + 1.0 + RESTART_DELAY;
    this.scheduleCall(ctaDelay, function () {
      scene.app.dom.showAction("重游此程", function () {
        scene._restartJourney();
      });
    });
  };

  // ============================================================
  // 重置全部场景状态并回到入江幕
  // ============================================================
  // 重置全部完成状态并回到第一幕。
  NS.MVPScene.prototype._restartJourney = function () {
    var scene = this;
    var manager = this.manager;
    if (!manager) return;
    this.app.dom.clearAction();

    manager.completed = manager.completed.map(function () { return false; });

    if (this.container) {
      global.gsap.to(this.container, {
        alpha: 0,
        duration: 0.7,
        ease: "sine.inOut",
        onComplete: function () {
          manager.goTo(0);
        }
      });
    } else {
      manager.goTo(0);
    }
  };

  // ============================================================
  // 兼容钩子：若管理器在已完成态下重入，直接进入收束
  // ============================================================
  // 显示尾声完成提示。
  NS.MVPScene.prototype.showFinaleCompletion = function () {
    if (this.state && this.state.finale && this.state.finale.endingStarted) return;
    this._startEndingSequence();
  };

  // ============================================================
  // 视口变化：重设面板背景拉伸（base-scene.onUpdate 会调用）
  // ============================================================
  // 视口变化时重排所有尾声面板背景。
  NS.MVPScene.prototype.updateFinaleLayout = function (viewport) {
    if (!this.panels) return;
    this.panels.forEach(function (panel) {
      if (panel.background && panel.background.texture) {
        NS.utils.fitCover(panel.background, panel.background.texture, viewport.width, viewport.height);
      }
    });
  };

}(window));
