// DOM 浮层控制：标题、提示、进度、故事卷轴与知识卡。
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};
  var SCENES = NS.SCENES;
  var INTRO_COPY = {
    eyebrow: "楚江寻艾",
    title: "拨开江雾",
    subtitle: "顺水入江，在雾青江光里寻端午旧物。"
  };

  // 缓存所有 DOM 节点，提供场景可调用的显示接口。
  function DOMLayer() {
    this.chapterIndex = document.getElementById("chapter-index");
    this.chapterName = document.getElementById("chapter-name");
    this.chapterMark = this.chapterIndex ? this.chapterIndex.parentElement : null;
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
    this.titleArtProbe = null;
    this.eyebrowArtProbe = null;
    this.actionHandler = null;
    this.panelCaption = null;
    this.panelCaptionTitle = null;
    this.panelCaptionDesc = null;
    this.panelIndicator = null;
    this.panelIndicatorDots = [];
    this.knowledgeCard = null;
    this.knowledgeCardTitle = null;
    this.knowledgeCardContent = null;
    this.knowledgeCardToggle = null;
  }

  // 切换章节文案和底部进度状态。
  DOMLayer.prototype.setScene = function (sceneIndex, completedScenes) {
    var scene = SCENES[sceneIndex];
    var progressRatio = this.nodes.length <= 1 ? 0 : sceneIndex / (this.nodes.length - 1);
    this.chapterIndex.textContent = scene.index;
    this.chapterName.textContent = scene.name;
    if (this.chapterMark) {
      this.chapterMark.classList.toggle("is-suppressed", scene.id === "finale");
    }
    this.hint.classList.toggle("is-bell", scene.id === "bell");
    this.setSceneCopy(scene);
    this.progress.style.setProperty("--journey-progress", progressRatio.toFixed(3));
    // 进度节点只表达当前场景和已完成状态，不承载业务判断。
    this.nodes.forEach(function (node, index) {
      node.classList.toggle("is-current", index === sceneIndex);
      node.classList.toggle("is-complete", completedScenes[index]);
    });
  };

  // 根据场景元信息刷新主标题、副标题和标题图。
  DOMLayer.prototype.setSceneCopy = function (scene) {
    if (scene.id === "intro") {
      this.eyebrow.textContent = INTRO_COPY.eyebrow;
      this.title.textContent = INTRO_COPY.title;
      this.subtitle.textContent = INTRO_COPY.subtitle;
      this.subtitle.hidden = false;
      this.setEyebrowArt(NS.TITLE_ASSETS && NS.TITLE_ASSETS.main);
      this.setTitleArt(NS.TITLE_ASSETS && NS.TITLE_ASSETS.introAction);
      return;
    }
    this.eyebrow.textContent = scene.index + " / 楚江寻艾";
    this.title.textContent = scene.name;
    this.subtitle.textContent = scene.copy || "";
    this.subtitle.hidden = scene.copy === "";
    this.setEyebrowArt(null);
    this.setTitleArt(NS.TITLE_ASSETS && NS.TITLE_ASSETS[scene.id]);
  };

  // 为眉题设置透明标题图；失败时回退文本。
  DOMLayer.prototype.setEyebrowArt = function (src) {
    var cssSrc;
    if (!src) {
      this.heroCopy.classList.remove("has-eyebrow-art");
      this.heroCopy.classList.remove("is-eyebrow-art-missing");
      this.heroCopy.style.removeProperty("--eyebrow-art");
      return;
    }
    cssSrc = new URL(src, document.baseURI).href;
    this.heroCopy.classList.add("has-eyebrow-art");
    this.heroCopy.classList.remove("is-eyebrow-art-missing");
    this.heroCopy.style.setProperty("--eyebrow-art", "url(\"" + cssSrc + "\")");
    this.eyebrowArtProbe = new Image();
    this.eyebrowArtProbe.onload = function () {
      this.heroCopy.classList.remove("is-eyebrow-art-missing");
    }.bind(this);
    this.eyebrowArtProbe.onerror = function () {
      this.heroCopy.classList.add("is-eyebrow-art-missing");
    }.bind(this);
    this.eyebrowArtProbe.src = src;
  };

  // 为主标题设置透明标题图；失败时回退文本。
  DOMLayer.prototype.setTitleArt = function (src) {
    var cssSrc;
    if (!src) {
      this.heroCopy.classList.remove("has-title-art");
      this.heroCopy.classList.remove("is-title-art-missing");
      this.heroCopy.style.removeProperty("--title-art");
      return;
    }
    cssSrc = new URL(src, document.baseURI).href;
    this.heroCopy.classList.add("has-title-art");
    this.heroCopy.classList.remove("is-title-art-missing");
    this.heroCopy.style.setProperty("--title-art", "url(\"" + cssSrc + "\")");
    this.titleArtProbe = new Image();
    this.titleArtProbe.onload = function () {
      this.heroCopy.classList.remove("is-title-art-missing");
    }.bind(this);
    this.titleArtProbe.onerror = function () {
      this.heroCopy.classList.add("is-title-art-missing");
    }.bind(this);
    this.titleArtProbe.src = src;
  };

  // 根据第一幕进度调整首屏文字和提示。
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
      this.hint.textContent = "轻触画面，拨开江雾";
    }
    if (progress < 1) {
      this.hideIntroCta();
    }
  };

  DOMLayer.prototype.setIntroWaiting = function () {
    this.heroCopy.classList.add("is-muted");
    this.hint.style.setProperty("--intro-progress", "0");
    this.showHint("轻触画面，拨开江雾");
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
    var plainLabel = (label || "随舟寻艾 →").replace(/\s*→\s*$/, "");
    this.actionHandler = handler || null;
    this.introCta.textContent = label || "随舟寻艾 →";
    if (plainLabel === "随舟寻艾") {
      this.title.textContent = plainLabel;
      this.setTitleArt(NS.TITLE_ASSETS && NS.TITLE_ASSETS.introCompleteAction);
    }
    this.introCta.classList.add("is-action");
    this.introCta.classList.remove("is-hidden");
  };

  DOMLayer.prototype.hideIntroCta = function () {
    this.actionHandler = null;
    this.introCta.setAttribute("aria-label", "场景动作");
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
    this.hideHint();
    this.hideStoryScroll();
  };

  DOMLayer.prototype.resetSceneControls = function () {
    this.actionHandler = null;
    this.introCta.classList.remove("is-action");
    this.introCta.classList.add("is-hidden");
    this.introCta.textContent = "";
    this.introCta.setAttribute("aria-label", "场景动作");
    this.hideHint();
    this.hideStoryScroll();
    this.hidePanelCaption();
    this.destroyPanelIndicator();
    this.destroyKnowledgeCard();
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

  // ============================================================
  // 面板配套 DOM：文案、圆点指示器、文化知识卡
  // ============================================================
  DOMLayer.prototype.ensurePanelLayerHost = function () {
    var host = document.querySelector(".dom-layer");
    return host || document.body;
  };

  DOMLayer.prototype.showPanelCaption = function (title, description) {
    var host = this.ensurePanelLayerHost();
    if (!this.panelCaption) {
      this.panelCaption = document.createElement("div");
      this.panelCaption.className = "panel-caption is-hidden";
      this.panelCaptionTitle = document.createElement("div");
      this.panelCaptionTitle.className = "caption-title";
      this.panelCaptionDesc = document.createElement("p");
      this.panelCaptionDesc.className = "caption-desc";
      this.panelCaption.appendChild(this.panelCaptionTitle);
      this.panelCaption.appendChild(this.panelCaptionDesc);
      host.appendChild(this.panelCaption);
    }
    var node = this.panelCaption;
    var titleNode = this.panelCaptionTitle;
    var descNode = this.panelCaptionDesc;
    // 交叉深入：先深出再更新文字、再淑入。
    node.classList.remove("is-hidden");
    node.classList.add("is-fading");
    var update = function () {
      titleNode.textContent = title || "";
      descNode.textContent = description || "";
      node.classList.remove("is-fading");
    };
    if (this._panelCaptionTimer) {
      clearTimeout(this._panelCaptionTimer);
    }
    this._panelCaptionTimer = setTimeout(update, 220);
  };

  DOMLayer.prototype.hidePanelCaption = function () {
    if (!this.panelCaption) {
      return;
    }
    if (this._panelCaptionTimer) {
      clearTimeout(this._panelCaptionTimer);
      this._panelCaptionTimer = null;
    }
    this.panelCaption.classList.add("is-hidden");
  };

  DOMLayer.prototype.createPanelIndicator = function (count, onClickFn) {
    var host = this.ensurePanelLayerHost();
    this.destroyPanelIndicator();
    var bar = document.createElement("div");
    bar.className = "panel-indicator";
    var dots = [];
    for (var i = 0; i < count; i++) {
      (function (idx) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "dot";
        dot.setAttribute("aria-label", "面板 " + (idx + 1));
        dot.addEventListener("click", function () {
          if (typeof onClickFn === "function") {
            onClickFn(idx);
          }
        });
        bar.appendChild(dot);
        dots.push(dot);
      }(i));
    }
    host.appendChild(bar);
    this.panelIndicator = bar;
    this.panelIndicatorDots = dots;
  };

  DOMLayer.prototype.updatePanelIndicator = function (activeIndex) {
    if (!this.panelIndicatorDots || !this.panelIndicatorDots.length) {
      return;
    }
    this.panelIndicatorDots.forEach(function (dot, idx) {
      dot.classList.toggle("active", idx === activeIndex);
    });
  };

  DOMLayer.prototype.destroyPanelIndicator = function () {
    if (this.panelIndicator && this.panelIndicator.parentNode) {
      this.panelIndicator.parentNode.removeChild(this.panelIndicator);
    }
    this.panelIndicator = null;
    this.panelIndicatorDots = [];
  };

  DOMLayer.prototype.showKnowledgeCard = function (title, content) {
    var host = this.ensurePanelLayerHost();
    if (!this.knowledgeCard) {
      this.knowledgeCard = document.createElement("div");
      this.knowledgeCard.className = "knowledge-card is-hidden";
      this.knowledgeCardToggle = document.createElement("button");
      this.knowledgeCardToggle.type = "button";
      this.knowledgeCardToggle.className = "card-toggle";
      this.knowledgeCardTitle = document.createElement("span");
      this.knowledgeCardTitle.className = "card-title";
      var arrow = document.createElement("span");
      arrow.className = "card-arrow";
      arrow.textContent = "";
      this.knowledgeCardToggle.appendChild(this.knowledgeCardTitle);
      this.knowledgeCardToggle.appendChild(arrow);
      this.knowledgeCardContent = document.createElement("div");
      this.knowledgeCardContent.className = "card-content";
      this.knowledgeCard.appendChild(this.knowledgeCardToggle);
      this.knowledgeCard.appendChild(this.knowledgeCardContent);
      host.appendChild(this.knowledgeCard);
    }
    this.knowledgeCardTitle.textContent = title || "文化知识";
    // 内容字段允许 HTML（来自场景内部受信源），用于呈现 <p>/<strong>/<br> 等结构
    this.knowledgeCardContent.innerHTML = content || "";
    this.knowledgeCard.classList.add("expanded");
    this.knowledgeCardToggle.setAttribute("aria-expanded", "true");
    this.knowledgeCard.classList.remove("is-hidden");
  };

  DOMLayer.prototype.hideKnowledgeCard = function () {
    if (!this.knowledgeCard) {
      return;
    }
    this.knowledgeCard.classList.add("is-hidden");
    this.knowledgeCard.classList.remove("expanded");
  };

  DOMLayer.prototype.toggleKnowledgeCard = function () {
    if (!this.knowledgeCard) {
      return;
    }
    this.knowledgeCard.classList.add("expanded");
    if (this.knowledgeCardToggle) {
      this.knowledgeCardToggle.setAttribute("aria-expanded", "true");
    }
  };

  DOMLayer.prototype.destroyKnowledgeCard = function () {
    if (this.knowledgeCard && this.knowledgeCard.parentNode) {
      this.knowledgeCard.parentNode.removeChild(this.knowledgeCard);
    }
    this.knowledgeCard = null;
    this.knowledgeCardTitle = null;
    this.knowledgeCardContent = null;
    this.knowledgeCardToggle = null;
  };

  NS.DOMLayer = DOMLayer;
}(window));
