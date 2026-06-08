// 通用工具：视口读取、图片适配与 canvas 绘制辅助。
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};

  // 读取当前 Pixi 渲染视口尺寸。
  function getViewport(app) {
    return {
      width: app.pixiApp.renderer.width / app.pixiApp.renderer.resolution,
      height: app.pixiApp.renderer.height / app.pixiApp.renderer.resolution
    };
  }

  // 将 Pixi 显示对象按 cover 模式铺满视口。
  function fitCover(displayObject, texture, width, height) {
    var sourceWidth = texture.orig ? texture.orig.width : texture.width;
    var sourceHeight = texture.orig ? texture.orig.height : texture.height;
    var scale = Math.max(width / sourceWidth, height / sourceHeight);
    displayObject.width = sourceWidth * scale;
    displayObject.height = sourceHeight * scale;
    displayObject.x = (width - displayObject.width) / 2;
    displayObject.y = (height - displayObject.height) / 2;
  }

  // 将 HTMLImageElement 按 cover 模式绘制到 canvas。
  function drawImageCover(ctx, image, width, height, alpha) {
    var scale = Math.max(width / image.width, height / image.height);
    var drawWidth = image.width * scale;
    var drawHeight = image.height * scale;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    ctx.restore();
  }

  NS.utils = {
    getViewport: getViewport,
    fitCover: fitCover,
    drawImageCover: drawImageCover
  };
}(window));
