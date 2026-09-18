(function(Game){
  const ANCHORS = {
    hipShortWeapon: {
      layer: "front",
      mount: "hip-sheath",
      titlePrefix: "腰佩",
      panel: {
        male: { x:"66%", y:"58%", w:"45px", h:"138px", r:"-24deg" },
        female: { x:"66%", y:"59%", w:"43px", h:"132px", r:"-24deg" }
      },
      preview: {
        male: { x:"66%", y:"58%", w:"45px", h:"138px", r:"-24deg" },
        female: { x:"66%", y:"59%", w:"43px", h:"132px", r:"-24deg" }
      }
    },
    backExposedWeapon: {
      layer: "behind",
      mount: "back",
      titlePrefix: "背负",
      panel: {
        male: { x:"69%", y:"53%", w:"52px", h:"156px", r:"-13deg" },
        female: { x:"69%", y:"54%", w:"50px", h:"150px", r:"-13deg" }
      },
      preview: {
        male: { x:"69%", y:"53%", w:"52px", h:"156px", r:"-13deg" },
        female: { x:"69%", y:"54%", w:"50px", h:"150px", r:"-13deg" }
      }
    },
    floorLeanWeapon: {
      layer: "wall",
      mount: "floor-lean",
      titlePrefix: "落地斜靠",
      panel: {
        male: { x:"82%", y:"64%", b:"6%", w:"78px", h:"176px", r:"-24deg" },
        female: { x:"82%", y:"65%", b:"6%", w:"74px", h:"168px", r:"-24deg" }
      },
      preview: {
        male: { x:"82%", y:"64%", b:"6%", w:"78px", h:"176px", r:"-24deg" },
        female: { x:"82%", y:"65%", b:"6%", w:"74px", h:"168px", r:"-24deg" }
      }
    },
    floorHeavyWeapon: {
      layer: "wall",
      mount: "floor-lean-heavy",
      titlePrefix: "落地斜靠",
      panel: {
        male: { x:"84%", y:"61%", b:"5%", w:"92px", h:"224px", r:"-21deg" },
        female: { x:"84%", y:"62%", b:"5%", w:"88px", h:"214px", r:"-21deg" }
      },
      preview: {
        male: { x:"84%", y:"61%", b:"5%", w:"92px", h:"224px", r:"-21deg" },
        female: { x:"84%", y:"62%", b:"5%", w:"88px", h:"214px", r:"-21deg" }
      }
    },
    wallArtifact: {
      layer: "wall",
      mount: "artifact-niche",
      titlePrefix: "壁龛",
      panel: {
        male: { x:"20%", y:"52%", w:"34px", h:"82px", r:"0deg" },
        female: { x:"21%", y:"53%", w:"32px", h:"78px", r:"0deg" }
      },
      preview: {
        male: { x:"20%", y:"52%", w:"34px", h:"82px", r:"0deg" },
        female: { x:"21%", y:"53%", w:"32px", h:"78px", r:"0deg" }
      }
    },
    sideArtifact: {
      layer: "float",
      mount: "artifact-orbit",
      titlePrefix: "",
      panel: {
        male: { x:"20%", y:"48%", w:"22px", h:"55px", r:"-5deg" },
        female: { x:"21%", y:"49%", w:"21px", h:"53px", r:"-5deg" }
      },
      preview: {
        male: { x:"20%", y:"48%", w:"22px", h:"55px", r:"-5deg" },
        female: { x:"21%", y:"49%", w:"21px", h:"53px", r:"-5deg" }
      }
    }
  };

  const APPEARANCE = {
    wood_sword: {
      slot: "weapon",
      anchor: "floorLeanWeapon",
      art: "../素材/装备/wood_sword_layer.png",
      title: "横架碎灵木剑",
      showcase: {
        art: "../素材/装备/wood_sword_showcase_horizontal.png",
        default: { x:"50%", y:"53.5%", w:"79%", h:"21.5%", r:"0deg", sx:"50%", sy:"103%", sw:"77%", sh:"10%", sr:"0deg", so:".44" }
      }
    },
    qingfeng_sword: {
      slot: "weapon",
      anchor: "floorLeanWeapon",
      art: "../素材/装备/qingfeng_sword_layer.png",
      title: "横架青锋剑",
      showcase: {
        art: "../素材/装备/qingfeng_sword_showcase_horizontal.png",
        default: { x:"50%", y:"53.5%", w:"105%", h:"28%", r:"0deg", sx:"50%", sy:"103%", sw:"92%", sh:"11%", sr:"0deg", so:".46" }
      },
      panelOffset: {
        male: { w:"78px", h:"188px" },
        female: { w:"74px", h:"180px" }
      }
    },
    hanyue_shortblade: {
      slot: "weapon",
      layer: "front",
      mount: "waist",
      art: "../素材/装备/hanyue_shortblade_layer.png",
      title: "桌上悬浮寒月",
      showcase: {
        default: { x:"50%", y:"52%", w:"95%", h:"38%", r:"0deg", sx:"50%", sy:"100%", sw:"74%", sh:"12%", sr:"0deg", so:".48" }
      },
      panel: {
        male: { x:"60%", y:"62%", w:"70px", h:"38px", r:"-16deg" },
        female: { x:"60%", y:"63%", w:"66px", h:"36px", r:"-16deg" }
      },
      preview: {
        male: { x:"60%", y:"62%", w:"70px", h:"38px", r:"-16deg" },
        female: { x:"60%", y:"63%", w:"66px", h:"36px", r:"-16deg" }
      }
    },
    iron_heavy_sword: {
      slot: "weapon",
      anchor: "floorHeavyWeapon",
      art: "../素材/装备/iron_heavy_sword_layer.png",
      title: "桌上悬浮玄铁重剑",
      showcase: {
        default: { x:"50%", y:"48.5%", w:"78%", h:"48%", r:"-90deg", sx:"50%", sy:"79%", sw:"76%", sh:"12%", sr:"0deg", so:".58" }
      }
    },
    fruit_wordblade: {
      slot: "weapon",
      layer: "float",
      mount: "sword-orbit",
      art: "../素材/装备/fruit_wordblade_layer.png",
      title: "桌上高悬异果言锋",
      showcase: {
        default: { x:"50%", y:"49%", w:"78%", h:"48%", r:"-90deg", sx:"50%", sy:"88%", sw:"76%", sh:"11%", sr:"0deg", so:".5" }
      },
      panel: {
        male: { x:"83%", y:"43%", w:"48px", h:"118px", r:"8deg" },
        female: { x:"82%", y:"44%", w:"46px", h:"112px", r:"8deg" }
      },
      preview: {
        male: { x:"83%", y:"43%", w:"48px", h:"118px", r:"8deg" },
        female: { x:"82%", y:"44%", w:"46px", h:"112px", r:"8deg" }
      }
    },
    mojian_flying_sword: {
      slot: "weapon",
      layer: "float",
      mount: "sword-orbit",
      art: "../素材/装备/mojian_flying_sword_layer.png",
      title: "桌上高悬墨纹飞剑",
      showcase: {
        default: { x:"50%", y:"49%", w:"78%", h:"50%", r:"-90deg", sx:"50%", sy:"88%", sw:"76%", sh:"11%", sr:"0deg", so:".52" }
      },
      panel: {
        male: { x:"84%", y:"45%", w:"50px", h:"130px", r:"8deg" },
        female: { x:"83%", y:"46%", w:"48px", h:"124px", r:"8deg" }
      },
      preview: {
        male: { x:"84%", y:"45%", w:"50px", h:"130px", r:"8deg" },
        female: { x:"83%", y:"46%", w:"48px", h:"124px", r:"8deg" }
      }
    },
    lieshi_axe: {
      slot: "weapon",
      anchor: "floorHeavyWeapon",
      art: "../素材/装备/lieshi_axe_layer.png",
      title: "桌上悬浮裂石重斧",
      showcase: {
        default: { x:"50%", y:"47.5%", w:"78%", h:"48%", r:"-88deg", sx:"50%", sy:"78%", sw:"76%", sh:"12%", sr:"0deg", so:".58" }
      }
    },
    yg_guixu: {
      slot: "weapon",
      layer: "float",
      mount: "sword-orbit",
      art: "../素材/装备/yg_guixu_layer.png",
      title: "桌上高悬归墟照渊",
      showcase: {
        default: { x:"50%", y:"48.5%", w:"82%", h:"52%", r:"-90deg", sx:"50%", sy:"90%", sw:"80%", sh:"11%", sr:"0deg", so:".56" }
      },
      panel: {
        male: { x:"84%", y:"43%", w:"54px", h:"142px", r:"8deg" },
        female: { x:"83%", y:"44%", w:"52px", h:"136px", r:"8deg" }
      },
      preview: {
        male: { x:"84%", y:"43%", w:"54px", h:"142px", r:"8deg" },
        female: { x:"83%", y:"44%", w:"52px", h:"136px", r:"8deg" }
      }
    },
    yg_fengao: {
      slot: "weapon",
      layer: "float",
      mount: "sword-orbit",
      art: "../素材/装备/yg_fengao_layer.png",
      title: "桌上高悬焚膏沸澜",
      showcase: {
        default: { x:"50%", y:"48.5%", w:"82%", h:"52%", r:"-90deg", sx:"50%", sy:"90%", sw:"80%", sh:"11%", sr:"0deg", so:".56" }
      },
      panel: {
        male: { x:"83%", y:"46%", w:"56px", h:"146px", r:"9deg" },
        female: { x:"82%", y:"47%", w:"54px", h:"140px", r:"9deg" }
      },
      preview: {
        male: { x:"83%", y:"46%", w:"56px", h:"146px", r:"9deg" },
        female: { x:"82%", y:"47%", w:"54px", h:"140px", r:"9deg" }
      }
    },
    yg_shihun: {
      slot: "weapon",
      anchor: "floorHeavyWeapon",
      art: "../素材/装备/yg_shihun_layer.png",
      title: "桌上悬浮噬魂玄铁",
      showcase: {
        default: { x:"50%", y:"48%", w:"80%", h:"50%", r:"-90deg", sx:"50%", sy:"79%", sw:"78%", sh:"12%", sr:"0deg", so:".6" }
      }
    },
    iron_talisman: {
      slot: "artifact",
      anchor: "wallArtifact",
      art: "../素材/装备/iron_talisman_layer.png",
      title: "壁龛悬挂寒铁护符",
      showcase: {
        default: { x:"22%", y:"43%", w:"42%", h:"34%", iw:"30%", ih:"70%" }
      }
    },
    ningyan_jade_talisman: {
      slot: "artifact",
      anchor: "wallArtifact",
      art: "../素材/装备/ningyan_jade_talisman_layer.png",
      title: "壁龛悬挂凝言玉符",
      showcase: {
        default: { x:"22%", y:"43%", w:"42%", h:"34%", iw:"30%", ih:"70%" }
      }
    },
    xuanling_bell: {
      slot: "artifact",
      anchor: "wallArtifact",
      art: "../素材/装备/xuanling_bell_layer.png",
      title: "壁龛悬挂玄灵铃",
      showcase: {
        default: { x:"22%", y:"43%", w:"42%", h:"34%", iw:"32%", ih:"70%" }
      }
    },
    liuyun_talisman: {
      slot: "artifact",
      anchor: "wallArtifact",
      art: "../素材/装备/liuyun_talisman_layer.png",
      title: "壁龛悬挂流云护符",
      showcase: {
        default: { x:"22%", y:"43%", w:"44%", h:"34%", iw:"34%", ih:"70%" }
      }
    },
    stargaze_astrolabe: {
      slot: "artifact",
      anchor: "wallArtifact",
      art: "../素材/装备/stargaze_astrolabe_layer.png",
      title: "壁龛悬挂观星罗盘",
      showcase: {
        default: { x:"22%", y:"43%", w:"46%", h:"36%", iw:"44%", ih:"76%" }
      }
    }
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function cssUrl(path) {
    return "url('" + String(path || "").replace(/'/g, "%27") + "')";
  }

  function mergePoint(base, override) {
    return Object.assign({}, base || {}, override || {});
  }

  function mergePoseGroup(base, override) {
    const out = Object.assign({}, base || {});
    ["male", "female", "default"].forEach((gender) => {
      if (base && base[gender]) out[gender] = mergePoint(base[gender]);
      if (override && override[gender]) out[gender] = mergePoint(out[gender], override[gender]);
    });
    return out;
  }

  function resolveSpec(rawSpec) {
    if (!rawSpec) return null;
    if (!rawSpec.anchor) return rawSpec;
    const anchor = ANCHORS[rawSpec.anchor];
    if (!anchor) return rawSpec;
    return Object.assign({}, anchor, rawSpec, {
      layer: rawSpec.layer || anchor.layer,
      mount: rawSpec.mount || anchor.mount,
      title: rawSpec.title || ((anchor.titlePrefix || "") + (rawSpec.name || "")),
      panel: mergePoseGroup(anchor.panel, rawSpec.panelOffset || rawSpec.panel),
      preview: mergePoseGroup(anchor.preview || anchor.panel, rawSpec.previewOffset || rawSpec.preview || rawSpec.panelOffset)
    });
  }

  function positionOf(spec, gender, mode) {
    const group = (mode === "preview" && spec.preview) ? spec.preview : (spec.panel || spec.rig || {});
    return group[gender] || group.male || group.default || { x:"50%", y:"50%", w:"80px", h:"80px", r:"0deg" };
  }

  function layerStyle(spec, gender, mode) {
    const p = positionOf(spec, gender, mode);
    return [
      "--gear-left:" + p.x,
      "--gear-top:" + p.y,
      "--gear-bottom:" + (p.b || "auto"),
      "--gear-width:" + p.w,
      "--gear-height:" + p.h,
      "--gear-rotate:" + (p.r || "0deg"),
      "--gear-art:" + cssUrl(spec.art)
    ].join(";");
  }

  function fallbackLayerHtml(slot, item) {
    if (!item) return "";
    const fallback = slot === "weapon" ? "武" : (slot === "artifact" ? "宝" : "衣");
    const style = Game.marketIconStyle ? Game.marketIconStyle(item.id) : "";
    return '<span class="avatar-gear-layer gear-fallback avatar-gear-' + slot + ' equipped"' +
      ' aria-label="' + esc(item.name) + '"' +
      (style ? ' style="' + style + '"' : '') + '><b>' + fallback + '</b></span>';
  }

  function layerHtml(slot, item, gender, mode, wantedLayer) {
    if (!item) return "";
    slot = Game.canonicalGearSlot ? Game.canonicalGearSlot(slot) : (slot === "talisman" ? "artifact" : slot);
    const spec = resolveSpec(APPEARANCE[item.id]);
    const specSlot = spec && (Game.canonicalGearSlot ? Game.canonicalGearSlot(spec.slot) : (spec.slot === "talisman" ? "artifact" : spec.slot));
    if (!spec && slot === "outfit") return "";
    if (!spec || specSlot !== slot) return wantedLayer === "float" ? "" : fallbackLayerHtml(slot, item);
    if (spec.layer !== wantedLayer) return "";
    return '<span class="avatar-gear-layer gear-true avatar-gear-' + slot +
      ' gear-layer-' + spec.layer + ' gear-mount-' + spec.mount + ' equipped"' +
      ' data-gear-id="' + esc(item.id) + '"' +
      ' aria-label="' + esc(spec.title || item.name) + '"' +
      ' style="' + layerStyle(spec, gender, mode) + '">' +
      '<img class="avatar-gear-img" src="' + esc(spec.art) + '" alt="">' +
      '</span>';
  }

  const PRELOAD_CACHE = Object.create(null);

  function assetUrls(items) {
    const urls = [];
    const add = (item) => {
      const spec = item && resolveSpec(APPEARANCE[item.id]);
      if (spec && spec.art && urls.indexOf(spec.art) < 0) urls.push(spec.art);
    };
    if (items) {
      add(items.outfit);
      add(items.artifact || items.talisman);
      add(items.weapon);
    }
    return urls;
  }

  function preload(items) {
    const urls = assetUrls(items);
    if (typeof Image === "undefined") return urls;
    urls.forEach((url) => {
      if (PRELOAD_CACHE[url]) return;
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      if (img.decode) img.decode().catch(() => {});
      PRELOAD_CACHE[url] = img;
    });
    return urls;
  }

  function layersHtml(items, gender, mode, wantedLayer) {
    const weapon = items && items.weapon;
    const artifact = items && (items.artifact || items.talisman);
    const outfit = items && items.outfit;
    return [
      layerHtml("outfit", outfit, gender || "male", mode || "panel", wantedLayer),
      layerHtml("artifact", artifact, gender || "male", mode || "panel", wantedLayer),
      layerHtml("weapon", weapon, gender || "male", mode || "panel", wantedLayer),
    ].filter(Boolean).join("");
  }

  Game.gearAppearance = {
    ANCHORS,
    APPEARANCE,
    resolveSpec,
    assetUrls,
    preload,
    layerHtml,
    layersHtml
  };
})(window.Game = window.Game || {});
