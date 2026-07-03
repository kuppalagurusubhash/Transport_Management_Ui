export const manifest = {
  screens: {
    scr_7fwiqa: { name: "Overview", route: "/", position: { "x": 160, "y": 220 } },
    scr_s8yvc0: { name: "Orders", route: "/orders", position: { "x": 1560, "y": 10120 } },
    scr_i1j0y4: { name: "Buyer Portal", route: "/buyer", position: { "x": 160, "y": 10120 } },
    scr_y2yp80: { name: "Trips", route: "/trips", position: { "x": 160, "y": 2200 } },
    scr_pqvgr3: { name: "Trip Detail", route: "/trips/t1", position: { "x": 1560, "y": 2200 } },
    scr_prqriy: { name: "Fleet", route: "/fleet", position: { "x": 160, "y": 4180 } },
    scr_deb86d: { name: "Lorry Detail", route: "/fleet/l1", position: { "x": 1560, "y": 4180 } },
    scr_zy6o3t: { name: "Drivers", route: "/drivers", position: { "x": 160, "y": 6160 } },
    scr_kloju1: { name: "Loading Parties", route: "/loading-parties", position: { "x": 1560, "y": 6160 } },
    scr_mliaq4: { name: "Unloading Parties", route: "/unloading-parties", position: { "x": 2960, "y": 6160 } },
    scr_wqixn3: { name: "Buyer Detail", route: "/unloading-parties/up1", position: { "x": 4360, "y": 6160 } },
    scr_hys68f: { name: "District Rates", route: "/district-rates", position: { "x": 1560, "y": 8140 } },
    scr_9g1cak: { name: "Stone Rates", route: "/rates", position: { "x": 160, "y": 8140 } }
  },
  sections: {
    sec_psaidj: { name: "Dashboard", x: 0, y: 0, width: 1520, height: 1180 },
    sec_9zpejm: { name: "Trips Management", x: 0, y: 1980, width: 2920, height: 1180 },
    sec_tnmamx: { name: "Fleet Management", x: 0, y: 3960, width: 2920, height: 1180 },
    sec_pr8jba: { name: "People & Parties", x: 0, y: 5940, width: 5720, height: 1180 },
    sec_lmhqiv: { name: "Configuration", x: 0, y: 7920, width: 2920, height: 1180 },
    sec_6godlq: { name: "Buyer & Orders", x: 0, y: 9900, width: 2920, height: 1180 }
  },
  layers: [
  { kind: "section", id: "sec_psaidj", children: [
    { kind: "screen", id: "scr_7fwiqa" }]
  },
  { kind: "section", id: "sec_9zpejm", children: [
    { kind: "screen", id: "scr_y2yp80" },
    { kind: "screen", id: "scr_pqvgr3" }]
  },
  { kind: "section", id: "sec_tnmamx", children: [
    { kind: "screen", id: "scr_prqriy" },
    { kind: "screen", id: "scr_deb86d" }]
  },
  { kind: "section", id: "sec_pr8jba", children: [
    { kind: "screen", id: "scr_zy6o3t" },
    { kind: "screen", id: "scr_kloju1" },
    { kind: "screen", id: "scr_mliaq4" },
    { kind: "screen", id: "scr_wqixn3" }]
  },
  { kind: "section", id: "sec_lmhqiv", children: [
    { kind: "screen", id: "scr_9g1cak" },
    { kind: "screen", id: "scr_hys68f" }]
  },
  { kind: "section", id: "sec_6godlq", children: [
    { kind: "screen", id: "scr_i1j0y4" },
    { kind: "screen", id: "scr_s8yvc0" }]
  }]

};