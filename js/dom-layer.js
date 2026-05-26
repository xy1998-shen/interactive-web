(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};
  var SCENES = NS.SCENES;
  var INTRO_COPY = {
    eyebrow: "楚江寻艾",
    title: "拨开江雾",
    subtitle: "顺水入江，在雾青江光里寻端午旧物。"
  };

  function DOMLayer() {
    this.chapterIndex = document.getElementById("chapter-index");
    this.chapterName = document.getElementById("chapter-name");
    this.heroCopy = document.getElementById("hero-copy");
    this.eyebrow = this.heroCopy.querySelector(".eyebrow");
    this.title = this.heroCopy.querySelector("h1");
    this.subtitle = this.heroCopy.querySelector(".subtitle");
    this.hint = document.getElementById("hint");
    this.introCta = document.getElementById("intro-cta");
    this.progress = document.getElementById("river-progress");
    this.storyScroll = document.getElementById("story-scroll");
    this.storyLines = this.storyScroll ? Array.prototype.slice.call(this.storyScroll.querySelectorAll(".story-line")) : [];
    this.storyNext = document.getElementById("story-next");
    this.nodes = Array.prototype.slice.call(document.querySelectorAll(".progress-node"));
    this.actionHandler = null;
  }

  DOMLayer.prototype.setScene = function (sceneIndex, completedScenes) {
    var scene = SCENES[sceneIndex];
    var progressRatio = this.nodes.length <= 1 ? 0 : sceneIndex / (this.nodes.length - 1);
    this.chapterIndex.textContent = scene.index;
    this.chapterName.textContent = scene.name;
    this.setSceneCopy(scene);
    this.progress.style.setProperty("--journey-progress", progressRatio.toFixed(3));
    // 进度节点只表达当前场景和已完成状态，不承载业务判断。
    this.nodes.forEach(function (node, index) {
      node.classList.toggle("is-current", index === sceneIndex);
      node.classList.toggle("is-complete", completedScenes[index]);
    });
  };

  DOMLayer.prototype.setSceneCopy = function (scene) {
    if (scene.id === "intro") {
      this.eyebrow.textContent = INTRO_COPY.eyebrow;
      this.title.textContent = INTRO_COPY.title;
      this.subtitle.textContent = INTRO_COPY.subtitle;
      return;
    }
    this.eyebrow.textContent = scene.index + " / 楚江寻艾";
    this.title.textContent = scene.name;
    this.subtitle.textContent = scene.copy || "循江而行，完成本幕端午记忆。";
  };

  DOMLayer.prototype.setIntroProgress = function (progress) {
    var config = NS.CONFIG.intro;
    var visible = progress >= config.heroVisibleProgress;
    // 入江文案随拨雾进度渐显，减少初始画面对主体的遮挡。
    this.heroCopy.classList.toggle("is-muted", !visible);
    this.hint.style.setProperty("--intro-progress", progress.toFixed(3));
    this.hint.classList.remove("is-complete");
    this.hint.classList.remove("is-hidden");
    if (progress >= 0.82) {
      this.hint.textContent = "江路将现";
    } else if (progress > 0.04) {
      this.hint.textContent = "江雾渐开";
    } else {
      this.hint.textContent = "按住拖动，拨开江雾";
    }
    if (progress < 1) {
      this.hideIntroCta();
    }
  };

  DOMLayer.prototype.setIntroWaiting = function () {
    this.heroCopy.classList.add("is-muted");
    this.hint.style.setProperty("--intro-progress", "0");
    this.showHint("按住拖动，拨开江雾");
    this.hideIntroCta();
    this.hideStoryScroll();
  };

  DOMLayer.prototype.showStoryScroll = function () {
    if (!this.storyScroll) {
      return;
    }
    this.storyScroll.classList.remove("is-hidden");
  };

  DOMLayer.prototype.setStoryLines = function (lines, nextLabel) {
    var paper;
    var button;
    if (!this.storyScroll) {
      return;
    }
    paper = this.storyScroll.querySelector(".scroll-paper");
    button = this.storyNext;
    while (this.storyLines.length < lines.length && paper) {
      var line = document.createElement("p");
      line.className = "story-line";
      paper.insertBefore(line, button || null);
      this.storyLines.push(line);
    }
    this.storyLines.forEach(function (line, index) {
      line.textContent = lines[index] || "";
      line.classList.remove("is-visible");
      line.hidden = index >= lines.length;
    });
    if (button && nextLabel) {
      button.textContent = nextLabel;
    }
  };

  DOMLayer.prototype.hideStoryScroll = function () {
    if (!this.storyScroll) {
      return;
    }
    this.storyScroll.classList.add("is-hidden");
    this.storyLines.forEach(function (line) {
      line.classList.remove("is-visible");
    });
    this.hideStoryNext();
  };

  DOMLayer.prototype.setStoryProgress = function (progress) {
    var introConfig = SCENES && SCENES[0] && window.ChuJiang.CONFIG ? window.ChuJiang.CONFIG.intro : null;
    var visibleLines = this.storyLines.filter(function (line) {
      return !line.hidden;
    });
    var start = introConfig && introConfig.storyStartProgress != null ? introConfig.storyStartProgress : 0.1;
    var end = introConfig && introConfig.storyCompleteProgress != null ? introConfig.storyCompleteProgress : 0.46;
    var span = Math.max(0.01, end - start);
    if (!this.storyScroll) {
      return;
    }
    if (progress > Math.max(0.02, start - 0.08)) {
      this.showStoryScroll();
    } else {
      this.storyScroll.classList.toggle("is-hidden", progress <= 0.02);
    }
    this.storyLines.forEach(function (line) {
      if (line.hidden) {
        line.classList.remove("is-visible");
        return;
      }
      var visibleIndex = visibleLines.indexOf(line);
      var ratio = visibleLines.length <= 1 ? 1 : visibleIndex / (visibleLines.length - 1);
      var showAt = start + span * ratio;
      line.classList.toggle("is-visible", progress >= showAt);
    });
  };

  DOMLayer.prototype.showStoryNext = function (handler) {
    var label = this.storyNext && this.storyNext.textContent ? this.storyNext.textContent : "入下一幕 →";
    this.hideStoryNext();
    this.showAction(label, handler);
  };

  DOMLayer.prototype.hideStoryNext = function () {
    if (!this.storyNext) {
      return;
    }
    this.storyNext.classList.add("is-hidden");
  };

  DOMLayer.prototype.setIntroComplete = function () {
    this.heroCopy.classList.remove("is-muted");
    this.hint.style.setProperty("--intro-progress", "1");
    this.hideHint();
    this.showIntroCta("随舟寻艾 →");
  };

  DOMLayer.prototype.showIntroCta = function (label, handler) {
    this.actionHandler = handler || null;
    this.introCta.textContent = label || "随舟寻艾 →";
    this.introCta.classList.add("is-action");
    this.introCta.classList.remove("is-hidden");
  };

  DOMLayer.prototype.hideIntroCta = function () {
    this.introCta.classList.add("is-hidden");
  };

  DOMLayer.prototype.showAction = function (label, handler) {
    this.actionHandler = handler || null;
    this.introCta.textContent = label;
    this.introCta.setAttribute("aria-label", label.replace(/\s*→\s*$/, ""));
    this.introCta.classList.add("is-action");
    this.introCta.classList.remove("is-hidden");
  };

  DOMLayer.prototype.clearAction = function () {
    this.actionHandler = null;
    this.introCta.classList.remove("is-action");
    this.hideIntroCta();
    this.hideStoryScroll();
  };

  DOMLayer.prototype.showHint = function (text) {
    if (!text) {
      this.hideHint();
      return;
    }
    this.hint.textContent = text;
    this.hint.classList.remove("is-complete");
    this.hint.classList.remove("is-hidden");
  };

  DOMLayer.prototype.showCompletion = function (text) {
    if (!text) {
      this.hideHint();
      return;
    }
    this.hint.textContent = text;
    this.hint.classList.add("is-complete");
    this.hint.classList.remove("is-hidden");
  };

  DOMLayer.prototype.hideHint = function () {
    this.hint.classList.add("is-hidden");
  };

  NS.DOMLayer = DOMLayer;
}(window));
