// 分幕占位场景，仅展示背景与标题说明。
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};
  var utils = NS.utils;
  var config = NS.CONFIG.emptyScene;
  var FONTS = NS.FONT_STACKS;

  function EmptyScene(app, manager, meta) {
    this.app = app;
    this.manager = manager;
    this.meta = meta;
    this.container = null;
    this.background = null;
    this.overlay = null;
    this.title = null;
    this.caption = null;
    this.lastWidth = 0;
    this.lastHeight = 0;
  }

  EmptyScene.prototype.onEnter = function () {
    var viewport = utils.getViewport(this.app);
    var texture = this.app.assets.get(this.meta.assets[0]);
    this.container = new PIXI.Container();
    this.background = new PIXI.Sprite(texture);
    utils.fitCover(this.background, texture, viewport.width, viewport.height);
    this.container.addChild(this.background);

    this.overlay = new PIXI.Graphics();
    this.drawOverlay(viewport.width, viewport.height);
    this.container.addChild(this.overlay);

    this.title = this.createText(this.meta.name, Math.round(viewport.height * config.titleFontScale), config.titleAlpha);
    this.title.position.set(viewport.width / 2, viewport.height / 2);
    this.container.addChild(this.title);

    this.caption = this.createText("场景骨架已接入，后续补充本幕交互", config.captionFontSize, config.captionAlpha);
    this.caption.position.set(viewport.width / 2, viewport.height / 2 + config.captionOffsetY);
    this.container.addChild(this.caption);

    // 空场景用于占位后续分幕，保持主流程可完整切换。
    this.app.dom.heroCopy.classList.add("is-muted");
    this.app.dom.hideHint();
    this.app.pixiApp.stage.addChild(this.container);
  };

  EmptyScene.prototype.createText = function (text, fontSize, alpha) {
    var label = new PIXI.Text(text, {
      fontFamily: FONTS.text,
      fontSize: fontSize,
      fill: config.titleColor,
      align: "center"
    });
    label.alpha = alpha;
    label.anchor.set(0.5);
    return label;
  };

  EmptyScene.prototype.drawOverlay = function (width, height) {
    this.overlay.clear();
    this.overlay.beginFill(config.overlayColor, config.overlayAlpha);
    this.overlay.drawRect(0, 0, width, height);
    this.overlay.endFill();
  };

  EmptyScene.prototype.onUpdate = function () {
    if (!this.container) {
      return;
    }
    var viewport = utils.getViewport(this.app);
    // 只在视口变化时重排，避免每帧重复计算静态占位内容。
    if (this.lastWidth === viewport.width && this.lastHeight === viewport.height) {
      return;
    }
    this.lastWidth = viewport.width;
    this.lastHeight = viewport.height;
    utils.fitCover(this.background, this.background.texture, viewport.width, viewport.height);
    this.drawOverlay(viewport.width, viewport.height);
    this.title.style.fontSize = Math.round(viewport.height * config.titleFontScale);
    this.title.position.set(viewport.width / 2, viewport.height / 2);
    this.caption.position.set(viewport.width / 2, viewport.height / 2 + config.captionOffsetY);
  };

  EmptyScene.prototype.onExit = function () {
    if (!this.container) {
      return;
    }
    this.app.pixiApp.stage.removeChild(this.container);
    this.container.destroy({ children: true });
    this.container = null;
  };

  NS.EmptyScene = EmptyScene;
}(window));
