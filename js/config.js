// 楚江互动全局数值配置，按场景分块供各幕读取。
(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};

  NS.CONFIG = {
    // Pixi 渲染帧率与分辨率上限
    renderer: {
      maxResolution: 2,
      maxDeltaMS: 100,
      fallbackDeltaMS: 16
    },
    // 第一幕入江：雾散、船行与叙事进度
    intro: {
      autoDurationMS: 8000, // 动画时长
      storyStartProgress: 0.16,
      storyCompleteProgress: 0.94,
      heroVisibleProgress: 0.3,
      completeDistance: 800,
      revealSweepSpeed: 0.0012,
      maxFogCuts: 180,
      maxWindPoints: 40,
      dragRadiusBase: 34,
      dragRadiusWave: 5,
      dragStepRatio: 0.6,
      clickRadius: 42,
      windRadiusBase: 18,
      windRadiusWave: 4,
      windMinDistance: 10,
      fogCutLifeDecay: 0.00002,
      windLifeDecay: 0.0012,
      completionHintMS: 1800
    },
    // 未实现分幕的占位样式
    emptyScene: {
      overlayColor: 0xecf5f0,
      overlayAlpha: 0.34,
      titleColor: 0x16343a,
      titleAlpha: 0.72,
      captionAlpha: 0.52,
      titleFontScale: 0.064,
      captionFontSize: 18,
      captionOffsetY: 48
    },
    // 第二幕悬艾：拖拽目标与轨迹粒子
    mugwort: {
      targetX: 0.81,
      targetY: 0.39,
      targetRadiusRatio: 0.075,
      minTargetRadius: 88,
      targetIdleAlpha: 0.16,
      targetNearAlpha: 0.5,
      dragStartX: 0.56,
      dragStartY: 0.72,
      dragWidthRatio: 0.08,
      hangerX: 0.735,
      hangerY: 0.705,
      hangerHeightRatio: 0.32,
      bundleHeightRatio: 0.19,
      maxTrailParticles: 80,
      trailMinIntervalMS: 24,
      trailMinDistance: 9
    },
    // 第三幕裹青：粽叶合拢与束线动画
    wrap: {
      leafWidthRatio: 0.2,
      leftLeafX: 0.36,
      rightLeafX: 0.64,
      leafY: 0.48,
      centerX: 0.5,
      centerY: 0.52,
      targetRadius: 36,
      targetBreathAlpha: [0.3, 0.7],
      targetBreathDuration: 1.2,
      rotationAngle: 0.42,
      foldDuration: 0.5,
      threadY: 0.68,
      threadDragWidth: 0.6,
      threadColor: 0xc4a15d,
      threadAlpha: 0.76,
      threadLineWidth: 4,
      wrapDuration: 0.6,
      particleCount: 24,
      particleColors: [0xf1e8d2, 0xd8ded1, 0x9eaea3],
      particleGatherDuration: 0.8,
      snapThreshold: 0.85,
      zongziWidthRatio: 0.18,
      zongziFadeInDuration: 0.5,
      zongziThreadDelay: 0.2,
      zongziThreadFadeInDuration: 0.45,
      leafFinalAlpha: 0.25,
      completionRotation: 0.15,
      completionRotationDuration: 2,
      particlePhaseACount: 10,
      particlePhaseAAlpha: [0.3, 0.4],
      particlePhaseAFloatRange: 6,
      glyphPool: ["愿", "安", "艾", "江", "青"],
      glyphCount: 3,
      glyphFontSize: 16,
      glyphColor: 0xc8a45d,
      glyphAlpha: 0.6,
      knowledgeDotRadius: 6,
      knowledgeDotColor: 0xc8a45d,
      knowledgeDotPulseCount: 2,
      knowledgeDotDuration: 1,
      transitionRingColor: 0xa94f3f,
      transitionRingCount: 2,
      transitionRingMaxRadius: 120,
      transitionRingDuration: 1.8,
      rightTipInactiveAlpha: 0.3
    },
    // 第四幕击鼓：连击窗口与龙舟位移
    drum: {
      totalBeats: 8,
      ringColor: 0xa94f3f,
      ringDuration: 0.6,
      ringMaxRadius: 160,
      ringLineWidth: 2.5,
      comboWindowMS: 400,
      comboRingScale: 1.4,
      comboBoatScale: 1.5,
      boatStartX: 0.18,
      boatTravelX: 0.64,
      boatY: 0.42,
      boatWidthRatio: 0.2,
      drumX: 0.5,
      drumY: 0.74,
      drumWidthRatio: 0.22,
      boatStepEase: "power2.out",
      boatStepDuration: 0.28
    },
    // 第五幕拼诗：字粒布局与选中样式
    poem: {
      words: ["江", "艾", "舟", "鼓", "风", "月", "青", "钟"],
      targetWords: 3,
      floatAmplitudeX: 8,
      floatAmplitudeY: 12,
      floatSpeedX: 0.0018,
      floatSpeedY: 0.0012,
      gridCenterX: 0.5,
      gridCenterY: 0.44,
      gridRadius: 0.18,
      selectedColor: 0xc4a15d,
      selectedScale: 1.22,
      selectDuration: 0.3,
      resultFadeDuration: 0.6,
      fontSize: 36,
      resultFontSize: 24
    },
    // 第六幕编钟：声波与闪回素材
    bell: {
      bellX: 0.5,
      bellY: 0.46,
      bellWidthRatio: 0.16,
      totalTaps: 3,
      ringColor: 0xc8a45d,
      ringDuration: 1.5,
      ringMaxRadius: 260,
      ringLineWidth: 2,
      ringAlpha: 0.6,
      flashbackAlpha: 0.14,
      flashbackDuration: 2.0,
      flashbackAssets: ["mugwort", "leafLeft", "boat", "bamboo"],
      convergeDuration: 1.2,
      tapScale: 1.04
    },
    // 终幕印记：节点分布与文案时长
    finale: {
      sealX: 0.5,
      sealY: 0.4,
      sealWidthRatio: 0.22,
      sealAlpha: 0.82,
      nodeRadius: 34,
      nodeDistance: 0.2,
      litColor: 0xc8a45d,
      litAlpha: 0.92,
      nodeTextDuration: 6,
      nodeTextFade: 0.5,
      nodes: [
        { text: "艾", angle: -90, caption: "识一味清艾，愿夏日安康。" },
        { text: "粽", angle: 0, caption: "裹一叶青愿，把思念包入日常。" },
        { text: "舟", angle: 90, caption: "听一声江鼓，众桨同心向前。" },
        { text: "钟", angle: 180, caption: "记一段楚风，让礼乐回到江面。" }
      ]
    }
  };
}(window));
