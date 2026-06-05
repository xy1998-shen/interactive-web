(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};

  // 场景顺序同时驱动进度节点、资源加载和场景切换。
  NS.SCENES = [
    { id: "intro", index: "01", name: "入江", assets: ["introBg", "fog", "ripple", "nearBoat", "introJourneyTitle"] },
    { id: "mugwort", index: "02", name: "寻艾", copy: "", assets: ["mugwortVillage", "mugwort", "mugwortHanger", "mugwortHangingBundle", "mugwortSteamWisp", "qingtuanFlourMist", "sachetScentWisp", "mugwortPanel1Hang", "mugwortPanel2Boil", "mugwortPanel3Cake", "mugwortPanel4Sachet"] },
    { id: "wrap", index: "03", name: "裹青", copy: "", assets: ["wrapTable", "leafLeft", "leafRight", "zongzi", "wrapPanel1Prep", "wrapPanel2Wrap", "wrapPanel3Steam", "wrapPanel4Eat"] },
    { id: "drum", index: "04", name: "听鼓", copy: "远鼓入江，舟影渐明。", assets: ["drumBgFirstperson"] },
    { id: "poem", index: "05", name: "问诗", copy: "", assets: ["poemRiversideMarket", "poemWaterPoet", "poemFigureBg", "poemWater", "poemInkRipple", "poemHangingCharm", "poemPaper", "bell"] },
    { id: "bell", index: "06", name: "和鸣", copy: "沿声波点亮三处回声。", assets: ["bellWater", "bell", "bellGoldTrace", "duanwuPattern", "mugwort", "leafLeft", "boat", "bamboo"] },
    { id: "finale", index: "07", name: "端午印记", copy: "掠过江面，让艾、粽、舟、钟归成端午印记。", assets: ["finaleEndingBg", "seal", "finalePanel1Memorial", "finalePanel2Race", "finalePanel3Feast", "finalePanel4Night"] }
  ];

  NS.FONT_STACKS = {
    text: "Songti SC, STSong, FangSong, Noto Serif CJK SC, serif",
    wenkai: "ChuJiangWenKai, Songti SC, STSong, FangSong, Noto Serif CJK SC, serif",
    calligraphy: "ChuJiangCalligraphy, STKaiti, Kaiti SC, KaiTi, Songti SC, STSong, Noto Serif CJK SC, serif",
    poem: "STKaiti, Kaiti SC, KaiTi, Songti SC, STSong, Noto Serif CJK SC, serif"
  };

  // 所有运行时资源集中登记，避免路径散落在场景代码里。
  NS.ASSET_MANIFEST = {
    introBg: "assets/backgrounds/bg-river-mist-light.webp",
    fog: "assets/backgrounds/bg-fog-layer.webp",
    ripple: "assets/textures/tex-water-ripple.webp",
    nearBoat: "assets/sprites/sprite-near-boat.png",
    introJourneyTitle: "assets/titles/title-action-rujiang-xunai.webp",
    shore: "assets/backgrounds/bg-shore.webp",
    mugwortVillage: "assets/backgrounds/bg-mugwort-village.webp",
    mugwort: "assets/sprites/sprite-mugwort.webp",
    mugwortHanger: "assets/sprites/sprite-mugwort-hanger.webp",
    mugwortHangingBundle: "assets/sprites/sprite-mugwort-hanging-bundle.webp",
    mugwortSteamWisp: "assets/sprites/sprite-mugwort-steam-wisp.png",
    qingtuanFlourMist: "assets/sprites/sprite-qingtuan-flour-mist.png",
    sachetScentWisp: "assets/sprites/sprite-sachet-scent-wisp.png",
    leafLeft: "assets/sprites/sprite-leaf-left.webp",
    leafRight: "assets/sprites/sprite-leaf-right.webp",
    wrapTable: "assets/backgrounds/bg-wrap-table.png",
    zongzi: "assets/sprites/sprite-zongzi.webp",
    zongziThread: "assets/sprites/sprite-zongzi-thread.webp",
    poemWaterPoet: "assets/backgrounds/bg-poem-water-poet.png",
    poemFigureBg: "assets/backgrounds/bg-poem-question-figure.png",
    poemWater: "assets/backgrounds/bg-poem-water.webp",
    poemHangingCharm: "assets/sprites/sprite-poem-hanging-charm.png",
    poemPaper: "assets/sprites/sprite-poem-paper.png",
    bellWater: "assets/backgrounds/bg-bell-water.png",
    poemInkRipple: "assets/sprites/sprite-poem-ink-ripple.png",
    bamboo: "assets/backgrounds/bg-bamboo.webp",
    duanwuPattern: "assets/textures/tex-pattern-duanwu.webp",
    boat: "assets/sprites/sprite-boat.webp",
    bell: "assets/sprites/sprite-bell.png",
    bellGoldTrace: "assets/sprites/sprite-bell-gold-trace.png",
    finaleEndingBg: "assets/backgrounds/bg-finale-ending-person.png",
    seal: "assets/sprites/sprite-seal.webp",
    // 寻艾面板
    mugwortPanel1Hang: "assets/backgrounds/mugwort-panel-1-hang.png",
    mugwortPanel2Boil: "assets/backgrounds/mugwort-panel-2-boil.png",
    mugwortPanel3Cake: "assets/backgrounds/mugwort-panel-3-cake.png",
    mugwortPanel4Sachet: "assets/backgrounds/mugwort-panel-4-sachet.png",
    // 裹青面板
    wrapPanel1Prep: "assets/backgrounds/wrap-panel-1-prep.png",
    wrapPanel2Wrap: "assets/backgrounds/wrap-panel-2-wrap.png",
    wrapPanel3Steam: "assets/backgrounds/wrap-panel-3-steam.png",
    wrapPanel4Eat: "assets/backgrounds/wrap-panel-4-eat.png",
    // 听鼓
    drumBgFirstperson: "assets/backgrounds/drum-bg-firstperson.png",
    // 问诗
    poemRiversideMarket: "assets/backgrounds/poem-riverside-market.png",
    // 尾声面板
    finalePanel1Memorial: "assets/backgrounds/finale-panel-1-memorial.png",
    finalePanel2Race: "assets/backgrounds/finale-panel-2-race.png",
    finalePanel3Feast: "assets/backgrounds/finale-panel-3-feast.png",
    finalePanel4Night: "assets/backgrounds/finale-panel-4-night.png"
  };

  NS.TITLE_ASSETS = {
    intro: "assets/titles/title-scene-01-rujiang.webp",
    mugwort: "assets/titles/title-scene-02-xunai.webp",
    wrap: "assets/titles/title-scene-03-guoqing.webp",
    drum: "assets/titles/title-scene-04-tinggu.webp",
    poem: "assets/titles/title-scene-05-wenshi.webp",
    bell: "assets/titles/title-scene-06-heming.webp",
    finale: "assets/titles/title-scene-07-duanwu-yinji.webp",
    main: "assets/titles/title-main-chujiang-xunai.webp",
    introJourney: "assets/titles/title-action-rujiang-xunai.webp",
    introAction: "assets/titles/title-action-bokai-jiangwu.webp",
    introCompleteAction: "assets/titles/title-action-sui-zhou-xunai.webp"
  };
}(window));
