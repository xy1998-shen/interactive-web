(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};

  function AssetLoader(manifest) {
    this.manifest = manifest;
    this.textures = {};
    this.images = {};
    this.promises = {};
  }

  AssetLoader.prototype.loadManifest = function (keys) {
    var loader = this;
    return Promise.all(keys.map(function (key) {
      return loader.load(key);
    }));
  };

  AssetLoader.prototype.preload = function (keys) {
    this.loadManifest(keys).catch(function (error) {
      console.warn("预加载失败:", error);
    });
  };

  AssetLoader.prototype.load = function (key) {
    var loader = this;
    var src = this.manifest[key];
    if (this.textures[key]) {
      return Promise.resolve(this.textures[key]);
    }
    if (this.promises[key]) {
      return this.promises[key];
    }
    if (!src) {
      return Promise.reject(new Error("未知资源：" + key));
    }
    // 直接用 Image 创建纹理，确保本地 file:// 和静态服务两种方式都能稳定加载。
    this.promises[key] = new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        loader.images[key] = img;
        loader.textures[key] = PIXI.Texture.from(img);
        resolve(loader.textures[key]);
      };
      img.onerror = function () {
        console.warn("资源加载失败，使用降级绘制:", key, src);
        loader.images[key] = loader.createFallbackCanvas(key);
        loader.textures[key] = PIXI.Texture.from(loader.images[key]);
        resolve(loader.textures[key]);
      };
      img.src = src;
    });
    return this.promises[key];
  };

  AssetLoader.prototype.createFallbackCanvas = function (key) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    canvas.width = 960;
    canvas.height = 540;
    if (key === "drumsticks") {
      this.drawFallbackDrumsticks(ctx, canvas.width, canvas.height);
      return canvas;
    }
    this.drawFallbackBase(ctx, canvas.width, canvas.height, key);
    if (key === "mugwortVillage") {
      this.drawFallbackMugwortVillage(ctx, canvas.width, canvas.height);
    } else if (key === "mugwort") {
      this.drawFallbackMugwort(ctx, canvas.width, canvas.height);
    } else if (key === "mugwortHanger") {
      this.drawFallbackMugwortHanger(ctx, canvas.width, canvas.height);
    } else if (key === "mugwortHangingBundle") {
      this.drawFallbackMugwortHangingBundle(ctx, canvas.width, canvas.height);
    } else if (key === "nearBoat") {
      this.drawFallbackNearBoat(ctx, canvas.width, canvas.height);
    } else if (key === "leafLeft" || key === "leafRight") {
      this.drawFallbackLeaf(ctx, canvas.width, canvas.height, key === "leafRight");
    } else if (key === "drumBoatBow") {
      this.drawFallbackDrumBoatBow(ctx, canvas.width, canvas.height);
    } else if (key === "drum") {
      this.drawFallbackDrum(ctx, canvas.width, canvas.height);
    } else if (key === "boat") {
      this.drawFallbackBoat(ctx, canvas.width, canvas.height);
    } else if (key === "bell") {
      this.drawFallbackBell(ctx, canvas.width, canvas.height);
    } else if (key === "seal") {
      this.drawFallbackSeal(ctx, canvas.width, canvas.height);
    } else if (key === "ripple") {
      this.drawFallbackRipple(ctx, canvas.width, canvas.height);
    }
    return canvas;
  };

  AssetLoader.prototype.drawFallbackDrumsticks = function (ctx, width, height) {
    function drawStick(x, y, angle) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.lineCap = "round";
      ctx.lineWidth = 16;
      ctx.strokeStyle = "rgba(90, 70, 50, 0.86)";
      ctx.beginPath();
      ctx.moveTo(0, 150);
      ctx.lineTo(0, -88);
      ctx.stroke();
      ctx.fillStyle = "rgba(200, 164, 93, 0.9)";
      ctx.beginPath();
      ctx.arc(0, -112, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(29, 51, 44, 0.25)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    ctx.clearRect(0, 0, width, height);
    drawStick(width * 0.32, height * 0.56, -0.62);
    drawStick(width * 0.68, height * 0.56, 0.62);
  };

  AssetLoader.prototype.drawFallbackBase = function (ctx, width, height, key) {
    var bg = ctx.createLinearGradient(0, 0, width, height);
    if (key === "mugwortVillage") {
      bg.addColorStop(0, "#d7e8e4");
      bg.addColorStop(0.52, "#edf4e8");
      bg.addColorStop(1, "#eadba8");
    } else if (key === "shore") {
      bg.addColorStop(0, "#d8ebe2");
      bg.addColorStop(0.58, "#edf5ef");
      bg.addColorStop(1, "#a9c5b2");
    } else if (key === "drumRaceBg") {
      bg.addColorStop(0, "#e8e1d2");
      bg.addColorStop(0.45, "#d8ded1");
      bg.addColorStop(1, "#9eaea3");
    } else if (key === "poemWater" || key === "bamboo" || key === "poemFigureBg" || key === "poemWaterPoet") {
      bg.addColorStop(0, "#dfeee9");
      bg.addColorStop(0.55, "#c8dfdb");
      bg.addColorStop(1, "#edf5ef");
    } else {
      bg.addColorStop(0, "#edf7f3");
      bg.addColorStop(0.5, "#d7ebe4");
      bg.addColorStop(1, "#bfd9d4");
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(22, 52, 58, 0.09)";
    for (var i = 0; i < 9; i += 1) {
      ctx.beginPath();
      ctx.moveTo(0, height * (0.22 + i * 0.075));
      ctx.bezierCurveTo(width * 0.28, height * (0.18 + i * 0.07), width * 0.62, height * (0.3 + i * 0.05), width, height * (0.22 + i * 0.075));
      ctx.stroke();
    }
  };

  AssetLoader.prototype.drawFallbackMugwortVillage = function (ctx, width, height) {
    ctx.fillStyle = "rgba(115, 164, 168, 0.24)";
    ctx.beginPath();
    ctx.moveTo(0, height * 0.42);
    ctx.bezierCurveTo(width * 0.24, height * 0.52, width * 0.36, height * 0.84, 0, height);
    ctx.lineTo(0, height * 0.42);
    ctx.fill();

    ctx.fillStyle = "rgba(185, 167, 108, 0.2)";
    ctx.beginPath();
    ctx.moveTo(width * 0.42, height);
    ctx.bezierCurveTo(width * 0.56, height * 0.76, width * 0.76, height * 0.68, width, height * 0.74);
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    function house(x, y, scale) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = "rgba(225, 218, 188, 0.82)";
      ctx.fillRect(-44, -2, 88, 58);
      ctx.fillStyle = "rgba(91, 112, 98, 0.76)";
      ctx.beginPath();
      ctx.moveTo(-58, -2);
      ctx.lineTo(0, -42);
      ctx.lineTo(58, -2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(22, 52, 58, 0.2)";
      ctx.fillRect(-14, 18, 28, 38);
      ctx.restore();
    }
    house(width * 0.72, height * 0.48, 1.35);
    house(width * 0.84, height * 0.54, 0.9);
    house(width * 0.6, height * 0.56, 0.82);

    ctx.strokeStyle = "rgba(69, 96, 79, 0.48)";
    ctx.lineWidth = 4;
    for (var i = 0; i < 7; i += 1) {
      var x = width * (0.54 + i * 0.055);
      var y = height * (0.76 - (i % 2) * 0.04);
      ctx.beginPath();
      ctx.arc(x, y - 18, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y - 10);
      ctx.lineTo(x, y + 18);
      ctx.moveTo(x, y + 2);
      ctx.lineTo(x + 18, y - 10);
      ctx.stroke();
    }
  };

  AssetLoader.prototype.drawFallbackMugwort = function (ctx, width, height) {
    ctx.strokeStyle = "#5f7f62";
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(width * 0.5, height * 0.82);
    ctx.lineTo(width * 0.5, height * 0.24);
    ctx.stroke();
    ctx.fillStyle = "#78976d";
    for (var i = 0; i < 8; i += 1) {
      var side = i % 2 === 0 ? -1 : 1;
      ctx.beginPath();
      ctx.ellipse(width * (0.5 + side * 0.08), height * (0.3 + i * 0.055), 48, 18, side * -0.65, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  AssetLoader.prototype.drawFallbackMugwortHanger = function (ctx, width, height) {
    var x = width * 0.5;
    var y = height * 0.72;
    var s = Math.min(width, height) / 540;
    ctx.strokeStyle = "rgba(36, 72, 74, 0.72)";
    ctx.lineWidth = 4 * s;
    ctx.beginPath();
    ctx.arc(x, y - 160 * s, 12 * s, 0, Math.PI * 2);
    ctx.moveTo(x - 4 * s, y - 148 * s);
    ctx.lineTo(x - 18 * s, y - 42 * s);
    ctx.moveTo(x - 18 * s, y - 42 * s);
    ctx.lineTo(x - 44 * s, y + 34 * s);
    ctx.moveTo(x - 18 * s, y - 42 * s);
    ctx.lineTo(x + 18 * s, y + 30 * s);
    ctx.moveTo(x - 6 * s, y - 118 * s);
    ctx.lineTo(x + 74 * s, y - 180 * s);
    ctx.stroke();
    ctx.fillStyle = "rgba(111, 136, 116, 0.2)";
    ctx.beginPath();
    ctx.ellipse(x - 12 * s, y - 78 * s, 30 * s, 82 * s, 0.1, 0, Math.PI * 2);
    ctx.fill();
  };

  AssetLoader.prototype.drawFallbackMugwortHangingBundle = function (ctx, width, height) {
    var x = width * 0.5;
    var top = height * 0.18;
    var s = Math.min(width, height) / 540;
    ctx.strokeStyle = "#5f7f62";
    ctx.lineWidth = 5 * s;
    for (var i = 0; i < 12; i += 1) {
      var dx = (i - 5.5) * 8 * s;
      ctx.beginPath();
      ctx.moveTo(x + dx * 0.25, top);
      ctx.lineTo(x + dx, top + (170 + (i % 4) * 22) * s);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(238, 246, 240, 0.78)";
    ctx.lineWidth = 4 * s;
    ctx.beginPath();
    ctx.ellipse(x, top + 20 * s, 50 * s, 13 * s, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(126, 157, 111, 0.72)";
    for (var j = 0; j < 18; j += 1) {
      var side = j % 2 === 0 ? -1 : 1;
      ctx.beginPath();
      ctx.ellipse(x + side * (18 + j) * s, top + (58 + j * 9) * s, 20 * s, 7 * s, side * -0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  AssetLoader.prototype.drawFallbackLeaf = function (ctx, width, height, flip) {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(flip ? -1 : 1, 1);
    ctx.fillStyle = "#7d9869";
    ctx.beginPath();
    ctx.ellipse(0, 0, width * 0.22, height * 0.42, -0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(237, 245, 239, 0.72)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-width * 0.16, height * 0.28);
    ctx.lineTo(width * 0.14, -height * 0.3);
    ctx.stroke();
    ctx.restore();
  };

  AssetLoader.prototype.drawFallbackDrum = function (ctx, width, height) {
    ctx.fillStyle = "#9c4f3f";
    ctx.beginPath();
    ctx.ellipse(width / 2, height / 2, width * 0.22, height * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#c4a15d";
    ctx.lineWidth = 16;
    ctx.stroke();
  };

  AssetLoader.prototype.drawFallbackBoat = function (ctx, width, height) {
    ctx.fillStyle = "#8d5f3d";
    ctx.beginPath();
    ctx.moveTo(width * 0.18, height * 0.58);
    ctx.quadraticCurveTo(width * 0.5, height * 0.75, width * 0.82, height * 0.58);
    ctx.lineTo(width * 0.7, height * 0.48);
    ctx.lineTo(width * 0.3, height * 0.48);
    ctx.closePath();
    ctx.fill();
  };

  AssetLoader.prototype.drawFallbackNearBoat = function (ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(36,64,66,0.74)";
    ctx.beginPath();
    ctx.moveTo(width * 0.1, height * 0.58);
    ctx.quadraticCurveTo(width * 0.5, height * 0.75, width * 0.9, height * 0.55);
    ctx.quadraticCurveTo(width * 0.76, height * 0.81, width * 0.22, height * 0.76);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(237,245,239,0.28)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(width * 0.16, height * 0.57);
    ctx.quadraticCurveTo(width * 0.5, height * 0.67, width * 0.84, height * 0.55);
    ctx.stroke();
    ctx.strokeStyle = "rgba(51,73,70,0.72)";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(width * 0.5, height * 0.56);
    ctx.lineTo(width * 0.51, height * 0.22);
    ctx.stroke();
    ctx.fillStyle = "rgba(237,245,239,0.34)";
    ctx.beginPath();
    ctx.moveTo(width * 0.52, height * 0.25);
    ctx.quadraticCurveTo(width * 0.66, height * 0.35, width * 0.73, height * 0.58);
    ctx.quadraticCurveTo(width * 0.61, height * 0.52, width * 0.5, height * 0.36);
    ctx.closePath();
    ctx.fill();
  };

  AssetLoader.prototype.drawFallbackBell = function (ctx, width, height) {
    ctx.fillStyle = "#b09355";
    ctx.beginPath();
    ctx.moveTo(width * 0.38, height * 0.24);
    ctx.lineTo(width * 0.62, height * 0.24);
    ctx.lineTo(width * 0.7, height * 0.72);
    ctx.lineTo(width * 0.3, height * 0.72);
    ctx.closePath();
    ctx.fill();
  };

  AssetLoader.prototype.drawFallbackSeal = function (ctx, width, height) {
    ctx.strokeStyle = "#b04438";
    ctx.lineWidth = 18;
    ctx.strokeRect(width * 0.34, height * 0.24, width * 0.32, height * 0.5);
    ctx.fillStyle = "#b04438";
    ctx.font = "96px serif";
    ctx.textAlign = "center";
    ctx.fillText("端午", width / 2, height * 0.56);
  };

  AssetLoader.prototype.drawFallbackRipple = function (ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(111, 165, 162, 0.34)";
    for (var i = 0; i < 16; i += 1) {
      ctx.beginPath();
      ctx.arc((i % 4) * width / 4 + 80, Math.floor(i / 4) * height / 4 + 62, 34 + (i % 3) * 16, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  AssetLoader.prototype.drawFallbackDrumBoatBow = function (ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(29, 51, 44, 0.42)";
    ctx.strokeStyle = "rgba(200, 164, 93, 0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width * 0.18, height);
    ctx.lineTo(width * 0.43, height * 0.46);
    ctx.lineTo(width * 0.5, height * 0.24);
    ctx.lineTo(width * 0.57, height * 0.46);
    ctx.lineTo(width * 0.82, height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(164, 61, 50, 0.82)";
    ctx.strokeStyle = "rgba(200, 164, 93, 0.64)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.72, width * 0.2, height * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };

  AssetLoader.prototype.get = function (key) {
    var texture = this.textures[key];
    if (!texture) {
      throw new Error("资源尚未加载：" + key);
    }
    return texture;
  };

  AssetLoader.prototype.getImage = function (key) {
    return this.images[key];
  };

  NS.AssetLoader = AssetLoader;
}(window));
