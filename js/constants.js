(function (global) {
  "use strict";

  var NS = global.ChuJiang = global.ChuJiang || {};

  // 场景顺序同时驱动进度节点、资源加载和场景切换。
  NS.SCENES = [
    { id: "intro", index: "01", name: "入江", assets: ["introBg", "fog", "ripple", "nearBoat", "introJourneyTitle"] },
    { id: "mugwort", index: "02", name: "寻艾", copy: "江左水气未散，村右艾香入户。", assets: ["mugwortVillage", "mugwort", "mugwortHanger", "mugwortHangingBundle"] },
    { id: "wrap", index: "03", name: "裹青", copy: "轻点桌上青叶，把糯米与诗句收成粽形。", assets: ["wrapTable", "leafLeft", "leafRight", "zongzi"] },
    { id: "drum", index: "04", name: "听鼓", copy: "远鼓入江，舟影渐明。", assets: ["drumRaceBg", "drumBoatBow", "drumsticks", "drum"] },
    { id: "poem", index: "05", name: "问诗", copy: "轻触三字，让楚江一再生诗。", assets: ["poemWaterPoet", "poemFigureBg", "poemWater", "poemInkRipple", "bell"] },
    { id: "bell", index: "06", name: "和鸣", copy: "轻触编钟，让礼乐声波入水。", assets: ["poemWater", "bell", "duanwuPattern", "bamboo"] },
    { id: "finale", index: "07", name: "端午印记", copy: "点亮艾、粽、舟、钟，收束端午印记。", assets: ["introBg", "seal"] }
  ];

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
    leafLeft: "assets/sprites/sprite-leaf-left.webp",
    leafRight: "assets/sprites/sprite-leaf-right.webp",
    wrapTable: "assets/backgrounds/bg-wrap-table.webp",
    zongzi: "assets/sprites/sprite-zongzi.webp",
    zongziThread: "assets/sprites/sprite-zongzi-thread.webp",
    drumRaceBg: "assets/backgrounds/bg-drum-race.webp",
    poemWaterPoet: "assets/backgrounds/bg-poem-water-poet.webp",
    poemFigureBg: "assets/backgrounds/bg-poem-question-figure.png",
    poemWater: "assets/backgrounds/bg-poem-water.webp",
    poemInkRipple: "assets/sprites/sprite-poem-ink-ripple.png",
    bamboo: "assets/backgrounds/bg-bamboo.webp",
    duanwuPattern: "assets/textures/tex-pattern-duanwu.webp",
    drumBoatBow: "assets/sprites/sprite-drum-boat-bow.webp",
    drumsticks: "assets/sprites/sprite-drumsticks.webp",
    drum: "assets/sprites/sprite-drum.webp",
    boat: "assets/sprites/sprite-boat.webp",
    bell: "assets/sprites/sprite-bell.webp",
    seal: "assets/sprites/sprite-seal.webp"
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
