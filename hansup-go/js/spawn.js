// 몬스터 출현 계산
// 같은 시간, 같은 장소에서는 친구 모두에게 똑같은 몬스터가 나타나도록
// 서버 없이 "시간 + 위치 칸"을 씨앗(seed)으로 쓰는 난수로 계산합니다.

import { CONFIG } from './config.js';
import { SPECIES, RARITY } from './monsters.js';

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function distanceM(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function isNight(date = new Date()) {
  const h = date.getHours();
  return h >= CONFIG.nightStart || h < CONFIG.nightEnd;
}

export function currentSlot(now = Date.now()) {
  return Math.floor(now / (CONFIG.spawnSlotMinutes * 60000));
}

export function slotEndsAt(slot) {
  return (slot + 1) * CONFIG.spawnSlotMinutes * 60000;
}

function schoolStop() {
  return CONFIG.stops.find(s => s.special);
}

/** 이 지점이 속한 특별 구역 종류 ('water' | 'park' | null) */
export function zoneAt(pos) {
  const z = (CONFIG.zones || []).find(z => distanceM(pos, z) <= z.radius);
  return z ? z.type : null;
}

/** 상황(밤/낮, 학교 주변, 연못/공원)에 맞는 출현 후보와 가중치 */
export function candidates({ night, nearSchool, zone = null }) {
  const list = [];
  for (const sp of SPECIES) {
    const h = sp.habitat;
    let w = RARITY[sp.rarity].weight;
    if (h.includes('legend')) continue;
    if (h.includes('night') && !night) continue;
    if (h.includes('day') && night) continue;
    if (h.includes('school')) {
      if (!nearSchool) continue;
      w *= 3;
    }
    if (h.includes('water')) {
      if (zone !== 'water') continue;
      w *= 6;
    } else if (zone === 'water') {
      w *= 0.5;
    }
    if (h.includes('park')) w *= zone === 'park' ? 3 : 0.5;
    if (w > 0) list.push([sp, w]);
  }
  return list;
}

export function pickWeighted(list, r) {
  const total = list.reduce((sum, [, w]) => sum + w, 0);
  let x = r * total;
  for (const [item, w] of list) {
    x -= w;
    if (x < 0) return item;
  }
  return list[list.length - 1][0];
}

/** 특정 칸(cell)의 이번 시간대 몬스터 (없으면 null) */
export function spawnForCell(cx, cy, slot, date) {
  const rnd = mulberry32(hashString(`hansup:${cx}:${cy}:${slot}`));
  // 연못·공원 칸에는 더 자주 나온다
  const center = { lat: (cy + 0.5) * CONFIG.cellLat, lng: (cx + 0.5) * CONFIG.cellLng };
  const chance = zoneAt(center) ? Math.max(CONFIG.spawnChance, 0.5) : CONFIG.spawnChance;
  if (rnd() > chance) return null;
  const lat = (cy + 0.1 + rnd() * 0.8) * CONFIG.cellLat;
  const lng = (cx + 0.1 + rnd() * 0.8) * CONFIG.cellLng;
  const school = schoolStop();
  const nearSchool = school ? distanceM({ lat, lng }, school) < CONFIG.schoolZone : false;
  const zone = zoneAt({ lat, lng });
  const sp = pickWeighted(candidates({ night: isNight(date), nearSchool, zone }), rnd());
  const [minSize, maxSize] = sp.size;
  return {
    id: `${slot}:${cx}:${cy}`,
    speciesId: sp.id,
    lat,
    lng,
    sizeCm: Math.round((minSize + rnd() * (maxSize - minSize)) * 10) / 10,
    expiresAt: slotEndsAt(slot),
  };
}

/** 플레이어 주변 몬스터 목록 */
export function spawnsAround(pos, radius = CONFIG.visibleRadius, now = Date.now()) {
  const slot = currentSlot(now);
  const date = new Date(now);
  const dLat = radius / 111320;
  const dLng = radius / (111320 * Math.cos((pos.lat * Math.PI) / 180));
  const x0 = Math.floor((pos.lng - dLng) / CONFIG.cellLng);
  const x1 = Math.floor((pos.lng + dLng) / CONFIG.cellLng);
  const y0 = Math.floor((pos.lat - dLat) / CONFIG.cellLat);
  const y1 = Math.floor((pos.lat + dLat) / CONFIG.cellLat);
  const out = [];
  for (let cx = x0; cx <= x1; cx++) {
    for (let cy = y0; cy <= y1; cy++) {
      const s = spawnForCell(cx, cy, slot, date);
      // 거점 표시를 가리지 않도록 거점 바로 옆에는 몬스터를 두지 않음
      if (s && distanceM(pos, s) <= radius && !CONFIG.stops.some(st => distanceM(st, s) < 40)) out.push(s);
    }
  }
  return out;
}

/** 남곡초 특별 거점에서 만나는 몬스터 (전설 몬스터 확률 포함) */
export function specialEncounter(playerId, dayKey) {
  const rnd = mulberry32(hashString(`special:${playerId}:${dayKey}:${Date.now()}`));
  const roll = rnd();
  let speciesId;
  if (roll < 0.06) speciesId = 'hansupwang';
  else if (roll < 0.45) speciesId = 'jongsorinyang';
  else speciesId = 'chaekbeolmung';
  const sp = SPECIES.find(s => s.id === speciesId);
  const school = schoolStop();
  return {
    id: `special:${dayKey}:${Math.floor(rnd() * 1e9)}`,
    speciesId,
    lat: school.lat,
    lng: school.lng,
    sizeCm: Math.round((sp.size[0] + rnd() * (sp.size[1] - sp.size[0])) * 10) / 10,
    expiresAt: Date.now() + 10 * 60000,
    special: true,
  };
}
