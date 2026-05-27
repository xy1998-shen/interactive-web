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
    // 第二幕悬艾：全屏触发、艾草飞行与挂艾落点
    mugwort: {
      targetX: 0.835,
      targetY: 0.36,
      targetRadiusRatio: 0.075,
      minTargetRadius: 88,
      targetIdleAlpha: 0.16,
      targetNearAlpha: 0.5,
      dragStartX: 0.55,
      dragStartY: 0.71,
      dragWidthRatio: 0.08,
      hangerX: 0.755,
      hangerY: 0.742,
      hangerHeightRatio: 0.245,
      hangerIdleAlpha: 0,
      hangerActionAlpha: 0.72,
      hangerFinalAlpha: 0.72,
      hangerFadeInDuration: 2.8,
      flyDelay: 0.45,
      flyDuration: 2.4,
      bundleHeightRatio: 0.095,
      bundleOffsetX: 0.006,
      bundleOffsetY: -0.01,
      showTrail: false,
      maxTrailParticles: 80,
      trailMinIntervalMS: 24,
      trailMinDistance: 9
    },
    // 第三幕裹青：粽叶合拢与束线动画
    wrap: {
      leafWidthRatio: 0.17,
      leftLeafX: 0.43,
      rightLeafX: 0.57,
      leafY: 0.64,
      centerX: 0.5,
      centerY: 0.655,
      targetRadius: 36,
      targetBreathAlpha: [0.3, 0.7],
      targetBreathDuration: 1.2,
      rotationAngle: 0.42,
      foldDuration: 0.68,
      threadColor: 0xc4a15d,
      wrapDuration: 0.6,
      particleCount: 24,
      particleColors: [0xf1e8d2, 0xd8ded1, 0x9eaea3],
      particleGatherDuration: 0.8,
      snapThreshold: 0.85,
      zongziWidthRatio: 0.15,
      zongziFadeInDuration: 0.5,
      leafFinalAlpha: 0.1,
      completionRotation: 0.15,
      completionRotationDuration: 2,
      particlePhaseACount: 10,
      particlePhaseAAlpha: [0.3, 0.4],
      particlePhaseAFloatRange: 6,
      glyphPool: ["叶", "裹", "江", "心", "愿", "米", "藏", "五", "月", "香"],
      glyphCount: 6,
      glyphFontSize: 16,
      glyphColor: 0xc8a45d,
      glyphAlpha: 0.6,
      poemLine: "叶裹江心愿\n米藏五月香",
      poemFontSize: 22,
      poemFinalX: 0.42,
      poemFinalY: 0.49,
      entryNote: "艾香入户，青叶铺开。",
      entryNoteX: 0.5,
      entryNoteY: 0.76,
      entryNoteFontSize: 17,
      entryNoteAlpha: 0.58,
      knowledgeNote: "角黍投江，后来成为家常端午的一枚粽。",
      knowledgeNoteX: 0.64,
      knowledgeNoteY: 0.72,
      knowledgeNoteFontSize: 17,
      knowledgeNoteAlpha: 0.72,
      knowledgeNoteLineHeight: 28,
      knowledgeNoteMaxWidth: 360,
      knowledgeDotRadius: 6,
      knowledgeDotColor: 0xc8a45d,
      knowledgeDotPulseCount: 2,
      knowledgeDotDuration: 0.55,
      transitionRingColor: 0xa94f3f,
      transitionRingCount: 2,
      transitionRingMaxRadius: 120,
      transitionRingDuration: 1.8,
      rightTipInactiveAlpha: 0.3
    },
    // 第四幕听鼓：鼓手第一视角、内部节奏阈值与水痕字粒
    drum: {
      // --- 完成条件 ---
      totalBeats: 4,

      // --- 鼓面布局 ---
      drumX: 0.5,
      drumY: 0.82,
      drumWidthRatio: 0.34,
      hitRadiusRatio: 0.16,        // 点击命中圆半径（相对视口宽）
      pressScaleUp: 1.05,          // 鼓面按压瞬间水平放大
      pressScaleDown: 0.94,        // 鼓面按压瞬间垂直压缩
      pressDuration: 0.16,         // 鼓面回弹动画时长（秒）

      // --- 船头素材 ---
      bowSpriteX: 0.5,
      bowSpriteY: 0.72,
      bowSpriteWidthRatio: 0.76,
      bowColor: 0x1d332c,
      bowLineColor: 0xc8a45d,
      bowAlpha: 0.34,

      // --- 鼓槌 ---
      drumstickColor: 0x5a4632,
      drumstickTipColor: 0xc8a45d,
      drumstickAlpha: 0.82,
      drumsticksX: 0.5,
      drumsticksY: 0.73,
      drumsticksWidthRatio: 0.48,

      // --- 朱砂鼓波 ---
      ringColor: 0xa94f3f,
      ringDuration: 0.6,
      ringMaxRadius: 160,
      ringLineWidth: 2.5,
      ringSpawnOffsetY: -20,       // 鼓波生成点相对鼓面中心的 Y 偏移
      innerRingRatio: 0.6,         // 内圈半径 = 外圈 × 此比例

      // --- 节奏判定 ---
      stableMinIntervalMS: 300,    // 稳定节奏最小间隔（毫秒）
      stableMaxIntervalMS: 800,    // 稳定节奏最大间隔（毫秒）
      stableBeatCount: 3,          // 连续多少击在区间内算稳定
      stableRingScale: 1.28,       // 稳定节奏时鼓波半径放大倍率

      // --- 前进视差 ---
      forwardScale: 1.045,         // 背景最大缩放
      forwardY: 18,                // 背景最大 Y 位移
      forwardDuration: 0.34,       // 前进动画过渡时长（秒）

      // --- 水痕 ---
      trailColor: 0xe8e1d2,
      trailAlpha: 0.24,
      trailWidth: 2,

      // --- 桨影 ---
      oarCount: 4,
      oarStrokeColor: 0xe8e1d2,
      oarStrokeAlpha: 0.34,

      // --- 红绸 ---
      redSilkColor: 0xa94f3f,

      // --- 入场文案 ---
      entryTextDuration: 0.8,
      entryTextY: 0.26,
      entryTextFontSize: 24,

      // --- 鼓波字粒 ---
      textColor: 0x16343a,
      textStrokeColor: 0xf1e8d2,
      beatWords: ["起", "急", "渡", "破"],
      beatWordFontSize: 20,
      beatWordStableFontSize: 24,
      beatNotes: {
        2: "鼓为令，众桨同频。",
        3: "竞渡从江上追思，成为五月节庆。"
      },

      // --- 完成态水痕字粒 ---
      wakeWords: ["江", "艾", "舟", "鼓", "风"],
      wakeWordFontSize: 30,

      // --- 轻知识光点 ---
      knowledgeDotRadius: 7,
      knowledgeDotColor: 0xc8a45d,
      knowledgeDotX: 0.68,
      knowledgeDotY: 0.61,

      // --- 音频 ---
      soundDuration: 0.12,
      soundFrequency: 82,
      finishSoundFrequency: 58,

      // --- 旧字段保留兼容 ---
      boatStartX: 0.5,
      boatTravelX: 0,
      boatY: 0.34,
      boatWidthRatio: 0.16,
      boatStepEase: "power2.out",
      boatStepDuration: 0.28
    },
    // 第五幕拼诗：字粒布局与选中样式
    poem: {
      words: ["江", "艾", "舟", "鼓", "风", "月", "青", "钟"],
      targetWords: 3,
      floatAmplitudeX: 8,
      floatAmplitudeY: 8,
      floatSpeedX: 0.0018,
      floatSpeedY: 0.0012,
      gridCenterX: 0.5,
      gridCenterY: 0.44,
      gridRadius: 0.18,
      wordSlots: [
        { word: "江", x: 0.5, y: 0.34 },
        { word: "艾", x: 0.62, y: 0.42 },
        { word: "舟", x: 0.68, y: 0.54 },
        { word: "鼓", x: 0.6, y: 0.68 },
        { word: "风", x: 0.5, y: 0.76 },
        { word: "月", x: 0.38, y: 0.68 },
        { word: "青", x: 0.3, y: 0.54 },
        { word: "钟", x: 0.36, y: 0.42 }
      ],
      selectedColor: 0xc4a15d,
      selectedScale: 1.12,
      selectDuration: 0.3,
      resultFadeDuration: 0.6,
      fontSize: 36,
      entryText: "鼓声入水，字从痕起。",
      entryTextFontSize: 24,
      entryTextY: 0.25,
      hintText: "轻触三字，问一行诗",
      completeText: "字从水起，风过楚江。",
      retryText: "再问一诗",
      keywordText: "屈原 · 端午 · 楚江",
      knowledgeText: "屈原诗意与端午记忆相连，是楚江旅程的精神底色。",
      knowledgeCooldownMS: 700,
      transitionText: "诗声入水，远钟将鸣。",
      resultX: 0.52,
      resultY: 0.52,
      poemAxisWidthRatio: 0.42,
      poemAxisMaxWidth: 620,
      poemAxisMinWidth: 440,
      poemAxisHeight: 132,
      poemAxisFillAlpha: 0.34,
      poemAxisLineAlpha: 0.58,
      poemAxisSeedFontSize: 17,
      poemAxisTextFontSize: 28,
      poemAxisLineHeight: 42,
      poemCharSeedScale: 1.12,
      keywordX: 0.8,
      keywordY: 0.47,
      retryX: 0.23,
      retryY: 0.67,
      knowledgeX: 0.8,
      knowledgeY: 0.57,
      knowledgeWidthRatio: 0.24,
      knowledgeFontSize: 18,
      knowledgeLineHeight: 30,
      cancelDropDuration: 0.26,
      resetDuration: 0.38,
      echoAlpha: 0.16,
      keywordFontSize: 20,
      retryFontSize: 17,
      transitionDuration: 1.35,
      transitionRingCount: 3,
      transitionRingColor: 0xc8a45d,
      transitionRingRadius: 280,
      wakeWords: ["江", "艾", "舟", "鼓", "风"],
      wakeStartX: 0.31,
      wakeStartY: 0.56,
      wakeGapX: 0.08,
      wakeFloatY: 18,
      wakeLineColor: 0xe8e1d2,
      wakeLineAlpha: 0.24,
      wakeLineWidth: 2,
      inkRippleWidthRatio: 0.18,
      inkRippleAlpha: 0.34,
      inkRippleDuration: 0.85,
      bellPreviewX: 0.78,
      bellPreviewY: 0.34,
      bellPreviewWidthRatio: 0.09,
      bellPreviewAlpha: 0.18
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
