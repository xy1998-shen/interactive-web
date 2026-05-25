// 第二幕悬艾：拖拽艾草至窗前并完成叙事滚动。
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

  function distanceToTarget(sprite, target) {
    var dx = sprite.x - target.x;
    var dy = sprite.y - target.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function drawMugwortElders(container, viewport) {
    container.removeChildren().forEach(function (child) {
      child.destroy();
    });
    var points = [
      [0.54, 0.49, 0.42],
      [0.61, 0.56, 0.5],
      [0.68, 0.52, 0.44]
    ];
    points.forEach(function (point) {
      var person = new PIXI.Graphics();
      var x = viewport.width * point[0];
      var y = viewport.height * point[1];
      var s = point[2] * Math.min(viewport.width, viewport.height) / 720;
      person.lineStyle(2.4 * s, 0x385d55, 0.34);
      person.drawCircle(x, y - 28 * s, 6 * s);
      person.moveTo(x, y - 22 * s);
      person.lineTo(x - 4 * s, y + 10 * s);
      person.moveTo(x - 4 * s, y + 10 * s);
      person.lineTo(x - 14 * s, y + 30 * s);
      person.moveTo(x - 4 * s, y + 10 * s);
      person.lineTo(x + 10 * s, y + 28 * s);
      person.lineStyle(3 * s, 0x6f956b, 0.4);
      person.moveTo(x + 5 * s, y - 12 * s);
      person.lineTo(x + 25 * s, y - 38 * s);
      person.moveTo(x + 11 * s, y - 16 * s);
      person.lineTo(x + 30 * s, y - 22 * s);
      container.addChild(person);
    });
  }

  // 挂载悬艾交互并驱动故事行显隐
  NS.MVPScene.prototype.buildMugwort = function (viewport) {
    var scene = this;
    var village = this.createMugwortInteraction(viewport);

    this.state.mugwortScene = village;
    this.app.dom.setStoryLines(MUGWORT_STORY, "入下一幕");
    this.app.dom.showStoryScroll();
    this.app.dom.hideStoryNext();
    this.setHint("轻触艾草，将它送到窗前");

    MUGWORT_STORY.forEach(function (_line, index) {
      var delay = 0.45 + index * 1.05;
      var call = global.gsap.delayedCall(delay, function () {
        if (scene.app.dom.storyLines[index]) {
          scene.app.dom.storyLines[index].classList.add("is-visible");
        }
      });
      scene.cleanups.push(function () { call.kill(); });
    });

    if (this.manager.completed[this.index]) {
      this.showMugwortFinalState(village, viewport);
    }
  };

  NS.MVPScene.prototype.createMugwortInteraction = function (viewport) {
    var scene = this;
    var stage = this.app.pixiApp.stage;
    var group = new PIXI.Container();
    this.content.addChild(group);

    var target = getMugwortTarget(viewport);
    var trailBudget = { lastX: 0, lastY: 0, lastAt: 0 };

    var elders = this.createMugwortElders(viewport);
    group.addChild(elders);

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
    hanger.alpha = 0;
    group.addChild(hanger);

    var hangingBundle = new PIXI.Sprite(this.app.assets.get("mugwortHangingBundle"));
    hangingBundle.anchor.set(0.5, 0.06);
    hangingBundle.alpha = 0;
    group.addChild(hangingBundle);

    var dragMugwort = new PIXI.Sprite(this.app.assets.get("mugwort"));
    dragMugwort.anchor.set(0.5);
    dragMugwort.rotation = -0.22;
    dragMugwort.eventMode = "static";
    dragMugwort.cursor = "grab";
    group.addChild(dragMugwort);

    var trailLayer = new PIXI.Container();
    group.addChildAt(trailLayer, group.getChildIndex(dragMugwort));

    var state = {
      target: target,
      start: new PIXI.Point(),
      dragging: false,
      completed: false,
      dragOffset: new PIXI.Point(),
      trailPool: [],
      activeTrails: [],
      layoutWidth: 0,
      layoutHeight: 0,
      stageWasInteractive: stage.eventMode,
      stageHitArea: stage.hitArea
    };

    function toLocalPoint(event) {
      var point = event.global || (event.data && event.data.global);
      return scene.content.toLocal(point);
    }

    function toLocalClientPoint(event) {
      var rect = scene.app.canvas.getBoundingClientRect();
      var x = (event.clientX - rect.left) * (viewport.width / rect.width);
      var y = (event.clientY - rect.top) * (viewport.height / rect.height);
      return scene.content.toLocal(new PIXI.Point(x, y));
    }

    function setStageDragListening(enabled) {
      if (enabled) {
        stage.eventMode = "static";
        stage.hitArea = new PIXI.Rectangle(0, 0, viewport.width, viewport.height);
        stage.on("pointermove", handleStageMove);
        stage.on("pointerup", handleStageUp);
        stage.on("pointerupoutside", handleStageUp);
        global.addEventListener("pointermove", handleWindowMove);
        global.addEventListener("pointerup", handleWindowUp);
        return;
      }
      stage.off("pointermove", handleStageMove);
      stage.off("pointerup", handleStageUp);
      stage.off("pointerupoutside", handleStageUp);
      global.removeEventListener("pointermove", handleWindowMove);
      global.removeEventListener("pointerup", handleWindowUp);
    }

    function updateTargetFeedback() {
      var distance = distanceToTarget(dragMugwort, state.target);
      targetGlow.alpha = distance < state.target.radius * 1.35 ? CONFIG.targetNearAlpha : CONFIG.targetIdleAlpha;
      return distance < state.target.radius;
    }

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
      transitionLine.bezierCurveTo(scene.state.mugwortScene.target.x - viewport.width * 0.18, scene.state.mugwortScene.target.y + viewport.height * 0.2, scene.state.mugwortScene.target.x - viewport.width * 0.08, scene.state.mugwortScene.target.y + viewport.height * 0.08, scene.state.mugwortScene.target.x + viewport.width * 0.01, scene.state.mugwortScene.target.y);
      transitionLine.alpha = 0;
    }

    function moveDragTo(point) {
      if (state.completed) {
        return;
      }
      dragMugwort.position.set(point.x + state.dragOffset.x, point.y + state.dragOffset.y);
      drawTrail(dragMugwort.x, dragMugwort.y);
      if (updateTargetFeedback()) {
        completeDrag();
      }
    }

    function completeDrag() {
      if (state.completed) {
        return;
      }
      state.completed = true;
      state.dragging = false;
      setStageDragListening(false);
      if (village.pulse) {
        village.pulse.kill();
      }
      dragMugwort.eventMode = "none";
      dragMugwort.cursor = "default";
      scene.setHint("艾气入户，清风守门");
      drawTransitionLine();

      var timeline = global.gsap.timeline({
        onComplete: function () {
          scene.finish(true);
        }
      });
      timeline.to(dragMugwort, { x: state.target.x, y: state.target.y, rotation: -0.04, alpha: 0, duration: 0.36, ease: "power2.out" }, 0);
      timeline.fromTo(hanger, { alpha: 0, y: hanger.y + 20 }, { alpha: 0.88, y: hanger.y, duration: 0.62, ease: "power2.out" }, 0.1);
      timeline.fromTo(hangingBundle, { alpha: 0, y: hangingBundle.y - 18, rotation: -0.12 }, { alpha: 0.94, y: hangingBundle.y, rotation: 0.02, duration: 0.74, ease: "power2.out" }, 0.36);
      timeline.to(windowGlow, { alpha: 0.22, duration: 0.6, ease: "sine.out" }, 0.5);
      timeline.to(targetGlow, { alpha: 0, duration: 0.34, ease: "sine.out" }, 0.64);
      timeline.fromTo(transitionLine, { alpha: 0 }, { alpha: 0.46, duration: 0.42, ease: "sine.out" }, 0.7);
      timeline.to(transitionLine, { alpha: 0, duration: 0.55, ease: "sine.inOut" }, 1.2);
      timeline.to(hangingBundle.scale, { x: hangingBundle.scale.x * 1.05, y: hangingBundle.scale.y * 1.05, duration: 0.5, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.82);
      scene.cleanups.push(function () { timeline.kill(); });
    }

    function finishDrag() {
      if (!state.dragging || state.completed) {
        return;
      }
      state.dragging = false;
      setStageDragListening(false);
      dragMugwort.cursor = "grab";
      if (updateTargetFeedback()) {
        completeDrag();
      } else {
        scene.setHint("靠近窗前或门楣即可悬艾");
        global.gsap.to(dragMugwort, { x: state.start.x, y: state.start.y, rotation: -0.22, duration: 0.42, ease: "power2.out" });
        global.gsap.to(targetGlow, { alpha: CONFIG.targetIdleAlpha, duration: 0.24 });
      }
    }

    function handleStageMove(event) {
      if (state.dragging && !state.completed) {
        moveDragTo(toLocalPoint(event));
      }
    }

    function handleStageUp() {
      finishDrag();
    }

    function handleWindowMove(event) {
      if (state.dragging && !state.completed) {
        if (event.target === scene.app.canvas) {
          return;
        }
        moveDragTo(toLocalClientPoint(event));
      }
    }

    function handleWindowUp() {
      finishDrag();
    }

    dragMugwort.on("pointertap", function () {
      if (scene.completed || state.completed) {
        return;
      }
      dragMugwort.eventMode = "none";
      dragMugwort.cursor = "default";
      scene.setHint("艾气入户，清风守门");

      // 轻触后自动飞向悬艾目标
      var flyTl = global.gsap.to(dragMugwort, {
        x: state.target.x,
        y: state.target.y,
        rotation: -0.04,
        duration: 0.8,
        ease: "power2.inOut",
        onUpdate: function () {
          drawTrail(dragMugwort.x, dragMugwort.y);
          updateTargetFeedback();
        },
        onComplete: function () {
          completeDrag();
        }
      });
      scene.cleanups.push(function () { flyTl.kill(); });
    });

    var pulse = global.gsap.to(targetGlow, { alpha: 0.34, duration: 0.9, yoyo: true, repeat: -1, ease: "sine.inOut" });
    var village = {
      group: group,
      elders: elders,
      targetGlow: targetGlow,
      windowGlow: windowGlow,
      transitionLine: transitionLine,
      hanger: hanger,
      hangingBundle: hangingBundle,
      dragMugwort: dragMugwort,
      trailLayer: trailLayer,
      target: target,
      state: state,
      pulse: pulse
    };

    this.layoutMugwortInteraction(village, viewport);
    this.cleanups.push(function () { pulse.kill(); });
    this.cleanups.push(function () {
      setStageDragListening(false);
      stage.eventMode = state.stageWasInteractive;
      stage.hitArea = state.stageHitArea;
    });
    return village;
  };

  NS.MVPScene.prototype.createMugwortElders = function (viewport) {
    var elders = new PIXI.Container();
    drawMugwortElders(elders, viewport);
    elders.alpha = 0.42;
    return elders;
  };

  NS.MVPScene.prototype.layoutMugwortInteraction = function (village, viewport) {
    var sizeChanged = village.state.layoutWidth !== viewport.width || village.state.layoutHeight !== viewport.height;
    var target = getMugwortTarget(viewport);
    village.target = target;
    village.state.target = target;
    village.group.hitArea = new PIXI.Rectangle(0, 0, viewport.width, viewport.height);
    if (sizeChanged) {
      drawMugwortElders(village.elders, viewport);
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
    village.hangingBundle.position.set(target.x + viewport.width * 0.01, target.y - viewport.height * 0.026);

    var dragWidth = viewport.width * CONFIG.dragWidthRatio;
    village.dragMugwort.scale.set(dragWidth / village.dragMugwort.texture.width);
    village.dragMugwort.hitArea = new PIXI.Circle(0, 0, Math.max(village.dragMugwort.width, village.dragMugwort.height) * 0.52);
    if (!village.state.dragging && !village.state.completed && !this.completed) {
      village.dragMugwort.position.set(viewport.width * CONFIG.dragStartX, viewport.height * CONFIG.dragStartY);
    }
    if (!village.state.completed) {
      village.state.start.set(viewport.width * CONFIG.dragStartX, viewport.height * CONFIG.dragStartY);
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
    if (village.pulse) {
      village.pulse.kill();
    }
    this.layoutMugwortInteraction(village, viewport);
    village.elders.alpha = 0.42;
    village.targetGlow.alpha = 0;
    village.windowGlow.alpha = 0.22;
    village.transitionLine.alpha = 0;
    village.hanger.alpha = 0.88;
    village.hangingBundle.alpha = 0.94;
    village.hangingBundle.rotation = 0.02;
    village.dragMugwort.visible = false;
  };

  NS.MVPScene.prototype.updateMugwortLayout = function (viewport) {
    var village = this.state.mugwortScene;
    if (!village || village.state.dragging) {
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
