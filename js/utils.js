(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};

  function getViewport(app) {
    return {
      width: app.pixiApp.renderer.width / app.pixiApp.renderer.resolution,
      height: app.pixiApp.renderer.height / app.pixiApp.renderer.resolution
    };
  }

  function fitCover(displayObject, texture, width, height) {
    var sourceWidth = texture.orig ? texture.orig.width : texture.width;
    var sourceHeight = texture.orig ? texture.orig.height : texture.height;
    var scale = Math.max(width / sourceWidth, height / sourceHeight);
    displayObject.width = sourceWidth * scale;
    displayObject.height = sourceHeight * scale;
    displayObject.x = (width - displayObject.width) / 2;
    displayObject.y = (height - displayObject.height) / 2;
  }

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
