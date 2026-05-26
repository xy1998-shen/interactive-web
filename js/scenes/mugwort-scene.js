// 第二幕悬艾：轻触画面自动飞艾至窗前并完成叙事滚动。
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};
  var CONFIG = NS.CONFIG.mugwort;

  // 本幕旁白分段，按时间轴逐条显现
  var MUGWORT_STORY = [
    "五月草木正盛，江风带着水气拂进村巷，老人把新采的艾草背回家门。",
    "《荆楚岁时记》记端午“采艾以为人，悬门户上，以禳毒气”。古人相信仲夏疫气渐盛，艾叶辛香可辟秽安宅。",
    "于是清晨采艾、束艾、悬艾，成了家家户户的节令动作：门前添一束绿意，窗边留一缕清芬，也留住对家人的护念。",
    "后来端午又与屈原的故事相连。艾香、粽叶与竞渡，一同把忠贞、忧思和祝愿，年年送回五月江畔。"
  ];

  function getMugwortTarget(viewport) {
    return {
      x: viewport.width * CONFIG.targetX,
      y: viewport.height * CONFIG.targetY,
      radius: Math.max(CONFIG.minTargetRadius, viewport.width * CONFIG.targetRadiusRatio)
    };
  }

  function drawTargetMarker(graphics, target, viewport, alpha) {
    graphics.clear();
    graphics.lineStyle(1.4, 0x8ea86a, 0.54);
    graphics.drawCircle(target.x, target.y, 5);
    graphics.moveTo(target.x - viewport.width * 0.032, target.y - viewport.height * 0.042);
    graphics.lineTo(target.x - viewport.width * 0.018, target.y - viewport.height * 0.042);
    graphics.moveTo(target.x - viewport.width * 0.032, target.y - viewport.height * 0.042);
    graphics.lineTo(target.x - viewport.width * 0.032, target.y - viewport.height * 0.024);
    graphics.moveTo(target.x + viewport.width * 0.04, target.y + viewport.height * 0.052);
    graphics.lineTo(target.x + viewport.width * 0.024, target.y + viewport.height * 0.052);
    graphics.moveTo(target.x + viewport.width * 0.04, target.y + viewport.height * 0.052);
    graphics.lineTo(target.x + viewport.width * 0.04, target.y + viewport.height * 0.032);
    graphics.alpha = alpha;
  }

  function drawWindowScent(graphics, target, viewport) {
    graphics.clear();
    graphics.lineStyle(1.2, 0xd9a65a, 0.34);
    graphics.moveTo(target.x - viewport.width * 0.006, target.y - viewport.height * 0.018);
    graphics.bezierCurveTo(target.x + viewport.width * 0.018, target.y - viewport.height * 0.01, target.x + viewport.width * 0.024, target.y + viewport.height * 0.032, target.x + viewport.width * 0.002, target.y + viewport.height * 0.048);
    graphics.moveTo(target.x + viewport.width * 0.026, target.y - viewport.height * 0.006);
    graphics.bezierCurveTo(target.x + viewport.width * 0.046, target.y + viewport.height * 0.006, target.x + viewport.width * 0.044, target.y + viewport.height * 0.04, target.x + viewport.width * 0.022, target.y + viewport.height * 0.058);
  }

  // 挂载悬艾交互并驱动故事行显隐
  NS.MVPScene.prototype.buildMugwort = function (viewport) {
    var scene = this;
    var village = this.createMugwortInteraction(viewport);

    this.state.mugwortScene = village;
    this.app.dom.setStoryLines(MUGWORT_STORY, "入下一幕");
    this.app.dom.hideStoryScroll();
    this.app.dom.hideStoryNext();
    this.setHint("轻触画面，送艾入户");

    if (this.manager.completed[this.index]) {
      this.showMugwortFinalState(village, viewport);
    }
  };

  NS.MVPScene.prototype.createMugwortInteraction = function (viewport) {
    var scene = this;
    var group = new PIXI.Container();
    this.content.addChild(group);

    var target = getMugwortTarget(viewport);
    var trailBudget = { lastX: 0, lastY: 0, lastAt: 0 };

    var targetGlow = new PIXI.Graphics();
    drawTargetMarker(targetGlow, target, viewport, CONFIG.targetIdleAlpha);
    group.addChild(targetGlow);

    var windowGlow = new PIXI.Graphics();
    drawWindowScent(windowGlow, target, viewport);
    windowGlow.alpha = 0;
    group.addChild(windowGlow);

    var transitionLine = new PIXI.Graphics();
    transitionLine.alpha = 0;
    group.addChild(transitionLine);

    var hanger = new PIXI.Sprite(this.app.assets.get("mugwortHanger"));
    hanger.anchor.set(0.5, 1);
    hanger.alpha = CONFIG.hangerIdleAlpha;
    group.addChild(hanger);

    var hangingBundle = new PIXI.Sprite(this.app.assets.get("mugwortHangingBundle"));
    hangingBundle.anchor.set(0.5, 0.06);
    hangingBundle.alpha = 0;
    group.addChild(hangingBundle);

    var mugwortSprite = new PIXI.Sprite(this.app.assets.get("mugwort"));
    mugwortSprite.anchor.set(0.5);
    mugwortSprite.rotation = -0.22;
    mugwortSprite.eventMode = "none";
    group.addChild(mugwortSprite);

    var trailLayer = new PIXI.Container();
    group.addChildAt(trailLayer, group.getChildIndex(mugwortSprite));

    var state = {
      target: target,
      start: new PIXI.Point(),
      playing: false,
      completed: false,
      trailPool: [],
      activeTrails: [],
      layoutWidth: 0,
      layoutHeight: 0
    };

    function takeTrailDot() {
      var dot = state.trailPool.pop();
      if (!dot) {
        dot = new PIXI.Graphics();
      }
      dot.clear();
      dot.scale.set(1);
      dot.alpha = 1;
      return dot;
    }

    function releaseTrailDot(dot) {
      if (dot.parent) {
        dot.parent.removeChild(dot);
      }
      if (state.trailPool.length < CONFIG.maxTrailParticles) {
        state.trailPool.push(dot);
      } else {
        dot.destroy();
      }
    }

    function drawTrail(x, y) {
      var now = performance.now();
      var dx = x - trailBudget.lastX;
      var dy = y - trailBudget.lastY;
      if (now - trailBudget.lastAt < CONFIG.trailMinIntervalMS && Math.sqrt(dx * dx + dy * dy) < CONFIG.trailMinDistance) {
        return;
      }
      trailBudget.lastX = x;
      trailBudget.lastY = y;
      trailBudget.lastAt = now;

      if (state.activeTrails.length >= CONFIG.maxTrailParticles) {
        releaseTrailDot(state.activeTrails.shift());
      }
      var dot = takeTrailDot();
      dot.beginFill(0x8ea86a, 0.34);
      dot.drawCircle(0, 0, 4 + Math.random() * 3);
      dot.endFill();
      dot.position.set(x, y);
      state.activeTrails.push(dot);
      trailLayer.addChild(dot);
      global.gsap.to(dot, {
        alpha: 0,
        duration: 0.72,
        onComplete: function () {
          var index = state.activeTrails.indexOf(dot);
          if (index >= 0) {
            state.activeTrails.splice(index, 1);
          }
          releaseTrailDot(dot);
        }
      });
      global.gsap.to(dot.scale, { x: 1.7, y: 1.7, duration: 0.72, ease: "sine.out" });
    }

    function drawTransitionLine() {
      transitionLine.clear();
      transitionLine.lineStyle(3, 0x8ea86a, 0.5);
      transitionLine.moveTo(state.start.x, state.start.y);
      transitionLine.bezierCurveTo(target.x - viewport.width * 0.18, target.y + viewport.height * 0.2, target.x - viewport.width * 0.08, target.y + viewport.height * 0.08, target.x + viewport.width * 0.01, target.y);
      transitionLine.alpha = 0;
    }

    function completeHang() {
      if (state.completed) {
        return;
      }
      state.playing = false;
      state.completed = true;
      if (village.pulse) {
        village.pulse.kill();
      }
      scene.setHint("艾气入户，清风守门");
      drawTransitionLine();

      var timeline = global.gsap.timeline({
        onComplete: function () {
          scene.finish(true);
        }
      });
      timeline.to(mugwortSprite, { x: state.target.x, y: state.target.y, rotation: -0.04, alpha: 0, duration: 0.36, ease: "power2.out" }, 0);
      timeline.to(hanger, { alpha: CONFIG.hangerActionAlpha, duration: 0.32, ease: "sine.out" }, 0);
      timeline.to(hanger, { alpha: CONFIG.hangerFinalAlpha, duration: 0.68, ease: "sine.inOut" }, 0.5);
      timeline.fromTo(hangingBundle, { alpha: 0, y: hangingBundle.y - 10, rotation: -0.08 }, { alpha: 0.9, y: hangingBundle.y, rotation: -0.02, duration: 0.62, ease: "power2.out" }, 0.24);
      timeline.to(windowGlow, { alpha: 0.22, duration: 0.6, ease: "sine.out" }, 0.5);
      timeline.to(targetGlow, { alpha: 0, duration: 0.34, ease: "sine.out" }, 0.64);
      timeline.fromTo(transitionLine, { alpha: 0 }, { alpha: 0.46, duration: 0.42, ease: "sine.out" }, 0.7);
      timeline.to(transitionLine, { alpha: 0, duration: 0.55, ease: "sine.inOut" }, 1.2);
      timeline.to(hangingBundle.scale, { x: hangingBundle.scale.x * 1.05, y: hangingBundle.scale.y * 1.05, duration: 0.5, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.82);
      scene.cleanups.push(function () { timeline.kill(); });
    }

    // 全屏点击触发层
    var tapArea = new PIXI.Graphics();
    tapArea.beginFill(0x000000, 0.001);
    tapArea.drawRect(0, 0, viewport.width, viewport.height);
    tapArea.endFill();
    tapArea.eventMode = "static";
    tapArea.cursor = "pointer";
    this.content.addChild(tapArea);

    tapArea.on("pointertap", function () {
      if (scene.completed || state.completed || state.playing) {
        return;
      }
      state.playing = true;
      tapArea.eventMode = "none";
      scene.setHint("");

      // 展开诗轴
      scene.app.dom.showStoryScroll();
      MUGWORT_STORY.forEach(function (_line, index) {
        var call = global.gsap.delayedCall(0.4 + index * 1.0, function () {
          if (scene.app.dom.storyLines[index]) {
            scene.app.dom.storyLines[index].classList.add("is-visible");
          }
        });
        scene.cleanups.push(function () { call.kill(); });
      });

      // 诗轴展开后，艾草自动飞向悬艾目标
      var flyDelay = CONFIG.flyDelay;
      var flyCall = global.gsap.delayedCall(flyDelay, function () {
        var hangerFade = global.gsap.to(hanger, {
          alpha: CONFIG.hangerActionAlpha,
          duration: CONFIG.hangerFadeInDuration,
          ease: "sine.out"
        });
        var flyTl = global.gsap.to(mugwortSprite, {
          x: state.target.x,
          y: state.target.y,
          rotation: -0.04,
          duration: CONFIG.flyDuration,
          ease: "power2.inOut",
          onUpdate: function () {
            if (CONFIG.showTrail) {
              drawTrail(mugwortSprite.x, mugwortSprite.y);
            }
            targetGlow.alpha = CONFIG.targetNearAlpha;
          },
          onComplete: function () {
            completeHang();
          }
        });
        scene.cleanups.push(function () { hangerFade.kill(); });
        scene.cleanups.push(function () { flyTl.kill(); });
      });
      scene.cleanups.push(function () { flyCall.kill(); });
    });

    var pulse = global.gsap.to(targetGlow, { alpha: 0.34, duration: 0.9, yoyo: true, repeat: -1, ease: "sine.inOut" });
    var village = {
      group: group,
      targetGlow: targetGlow,
      windowGlow: windowGlow,
      transitionLine: transitionLine,
      hanger: hanger,
      hangingBundle: hangingBundle,
      mugwortSprite: mugwortSprite,
      trailLayer: trailLayer,
      tapArea: tapArea,
      target: target,
      state: state,
      pulse: pulse
    };

    this.layoutMugwortInteraction(village, viewport);
    this.cleanups.push(function () { pulse.kill(); });
    return village;
  };

  NS.MVPScene.prototype.layoutMugwortInteraction = function (village, viewport) {
    var sizeChanged = village.state.layoutWidth !== viewport.width || village.state.layoutHeight !== viewport.height;
    var target = getMugwortTarget(viewport);
    village.target = target;
    village.state.target = target;
    village.group.hitArea = new PIXI.Rectangle(0, 0, viewport.width, viewport.height);
    if (sizeChanged) {
      village.state.layoutWidth = viewport.width;
      village.state.layoutHeight = viewport.height;
    }

    drawTargetMarker(village.targetGlow, target, viewport, village.state.completed ? 0 : CONFIG.targetIdleAlpha);
    drawWindowScent(village.windowGlow, target, viewport);

    var hangerHeight = viewport.height * CONFIG.hangerHeightRatio;
    village.hanger.scale.set(hangerHeight / village.hanger.texture.height);
    village.hanger.position.set(viewport.width * CONFIG.hangerX, viewport.height * CONFIG.hangerY);

    var bundleHeight = viewport.height * CONFIG.bundleHeightRatio;
    village.hangingBundle.scale.set(bundleHeight / village.hangingBundle.texture.height);
    village.hangingBundle.position.set(
      target.x + viewport.width * CONFIG.bundleOffsetX,
      target.y + viewport.height * CONFIG.bundleOffsetY
    );

    var mugwortWidth = viewport.width * CONFIG.dragWidthRatio;
    village.mugwortSprite.scale.set(mugwortWidth / village.mugwortSprite.texture.width);
    if (!village.state.completed && !this.completed) {
      village.mugwortSprite.position.set(viewport.width * CONFIG.dragStartX, viewport.height * CONFIG.dragStartY);
    }
    if (!village.state.completed && !village.state.playing) {
      village.state.start.set(viewport.width * CONFIG.dragStartX, viewport.height * CONFIG.dragStartY);
    }

    if (village.tapArea) {
      village.tapArea.clear();
      village.tapArea.beginFill(0x000000, 0.001);
      village.tapArea.drawRect(0, 0, viewport.width, viewport.height);
      village.tapArea.endFill();
    }
  };

  NS.MVPScene.prototype.showMugwortFinalState = function (village, viewport) {
    var lines = this.app.dom.storyLines;
    lines.forEach(function (line) {
      if (!line.hidden) {
        line.classList.add("is-visible");
      }
    });
    village.state.completed = true;
    village.state.playing = false;
    if (village.pulse) {
      village.pulse.kill();
    }
    if (village.tapArea) {
      village.tapArea.eventMode = "none";
    }
    this.layoutMugwortInteraction(village, viewport);
    village.targetGlow.alpha = 0;
    village.windowGlow.alpha = 0.22;
    village.transitionLine.alpha = 0;
    village.hanger.alpha = CONFIG.hangerFinalAlpha;
    village.hangingBundle.alpha = 0.94;
    village.hangingBundle.rotation = -0.02;
    village.mugwortSprite.visible = false;
  };

  NS.MVPScene.prototype.updateMugwortLayout = function (viewport) {
    var village = this.state.mugwortScene;
    if (!village) {
      return;
    }
    if (village.state.layoutWidth === viewport.width && village.state.layoutHeight === viewport.height) {
      return;
    }
    this.layoutMugwortInteraction(village, viewport);
    if (this.completed || village.state.completed) {
      this.showMugwortFinalState(village, viewport);
    }
  };
}(window));
