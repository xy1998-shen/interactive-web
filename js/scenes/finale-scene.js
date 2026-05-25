// 终幕：沿圆环点亮四枚端午印记并展示结语。
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};
  var CONFIG = NS.CONFIG.finale;

  NS.MVPScene.prototype.buildFinale = function (viewport) {
    var scene = this;
    var group = new PIXI.Container();
    this.content.addChild(group);

    var cx = viewport.width * CONFIG.sealX;
    var cy = viewport.height * CONFIG.sealY;
    var nodeDistance = Math.min(viewport.width, viewport.height) * CONFIG.nodeDistance;

    // 印记
    var seal = this.createSprite("seal", CONFIG.sealWidthRatio, CONFIG.sealX, CONFIG.sealY, viewport);
    this.content.removeChild(seal);
    group.addChild(seal);
    seal.alpha = CONFIG.sealAlpha;

    // 圆环路径（装饰）
    var frame = new PIXI.Graphics();
    frame.lineStyle(1.2, 0xc8a45d, 0.2);
    frame.drawCircle(0, 0, nodeDistance);
    frame.position.set(cx, cy);
    group.addChild(frame);

    // 文案显示区域
    var captionText = this.createText("", 20, 0xe8e1d2, 0);
    captionText.anchor.set(0.5);
    captionText.style.wordWrap = true;
    captionText.style.wordWrapWidth = Math.min(400, viewport.width * 0.5);
    captionText.style.lineHeight = 34;
    captionText.position.set(cx, cy + nodeDistance + 60);
    group.addChild(captionText);

    this.state.finale = {
      group: group,
      lit: 0,
      captionText: captionText,
      captionTimer: null,
      nodes: []
    };

    // 四个注释节点沿圆环分布
    CONFIG.nodes.forEach(function (nodeDef, i) {
      var rad = (nodeDef.angle * Math.PI) / 180;
      var nx = cx + Math.cos(rad) * nodeDistance;
      var ny = cy + Math.sin(rad) * nodeDistance;

      // 节点圆圈
      var circle = new PIXI.Graphics();
      circle.lineStyle(1.5, 0xe8e1d2, 0.3);
      circle.beginFill(0x16343a, 0.12);
      circle.drawCircle(0, 0, CONFIG.nodeRadius);
      circle.endFill();
      circle.position.set(nx, ny);
      circle.eventMode = "static";
      circle.cursor = "pointer";
      circle.hitArea = new PIXI.Circle(0, 0, CONFIG.nodeRadius + 12);
      group.addChild(circle);

      // 节点文字
      var label = scene.createText(nodeDef.text, 26, 0xe8e1d2, 0.72);
      label.anchor.set(0.5);
      label.position.set(nx, ny);
      group.addChild(label);

      var nodeState = { circle: circle, label: label, lit: false, def: nodeDef };
      scene.state.finale.nodes.push(nodeState);

      circle.on("pointertap", function () {
        if (nodeState.lit || scene.completed) return;
        scene.lightFinaleNode(nodeState, viewport);
      });
    });

    // 呼吸脉冲提示
    var pulse = global.gsap.to(frame, {
      alpha: 0.4,
      duration: 1.5,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
    this.cleanups.push(function () { pulse.kill(); });
  };

  // 点亮单枚印记并展示对应结语
  NS.MVPScene.prototype.lightFinaleNode = function (nodeState, viewport) {
    var scene = this;
    var state = this.state.finale;

    nodeState.lit = true;
    state.lit++;

    // 点亮动画
    nodeState.circle.clear();
    nodeState.circle.lineStyle(2, CONFIG.litColor, 0.8);
    nodeState.circle.beginFill(CONFIG.litColor, 0.15);
    nodeState.circle.drawCircle(0, 0, CONFIG.nodeRadius);
    nodeState.circle.endFill();

    nodeState.label.style.fill = CONFIG.litColor;
    nodeState.label.alpha = CONFIG.litAlpha;

    global.gsap.fromTo(nodeState.circle.scale,
      { x: 1.2, y: 1.2 },
      { x: 1, y: 1, duration: 0.3, ease: "back.out(2)" }
    );

    // 涟漪
    this.drawRing(nodeState.circle.x, nodeState.circle.y, 60, CONFIG.litColor);

    // 显示专属文案
    this.showFinaleCaption(nodeState.def.caption);

    this.setHint("端午印记 " + state.lit + " / " + CONFIG.nodes.length);

    if (state.lit >= CONFIG.nodes.length) {
      // 等文案显示完后完成
      global.gsap.delayedCall(CONFIG.nodeTextDuration * 0.6, function () {
        scene.finish(true);
      });
    }
  };

  NS.MVPScene.prototype.showFinaleCaption = function (text) {
    var state = this.state.finale;
    var captionText = state.captionText;

    // 清除之前的定时器
    if (state.captionTimer) {
      state.captionTimer.kill();
    }

    captionText.text = text;

    // 淡入
    global.gsap.killTweensOf(captionText);
    global.gsap.fromTo(captionText,
      { alpha: 0, y: captionText.y + 10 },
      { alpha: 0.88, y: captionText.y, duration: CONFIG.nodeTextFade, ease: "power2.out" }
    );

    // 定时淡出
    state.captionTimer = global.gsap.delayedCall(CONFIG.nodeTextDuration, function () {
      global.gsap.to(captionText, {
        alpha: 0,
        duration: CONFIG.nodeTextFade,
        ease: "sine.out"
      });
    });
  };
}(window));
