// 한숲GO 메인: 지도, 위치 추적, 도감, 가족 탭

import { CONFIG, firebaseEnabled } from './config.js';
import { SPECIES, RARITY, speciesById, monsterSVG } from './monsters.js';
import { spawnsAround, distanceM, specialEncounter, isNight } from './spawn.js';
import { store, remote, levelFromXp, xpForLevel } from './store.js';
import { startEncounter, initEncounterUI, encounterActive } from './catch.js';

const $ = (id) => document.getElementById(id);
const COLORS = ['#3f8fd2', '#e8532b', '#4f9a3a', '#a45ee5', '#e8a317', '#e86f9b'];

let map;
let me = null;               // { lat, lng, acc }
let meMarker = null;
let accCircle = null;
let catchCircle = null;
let gpsWatch = null;
let gpsOk = false;
const spawnMarkers = new Map();
const stopMarkers = new Map();
let followMe = true;

// ---------- 공통 ----------
function toast(text, ms = 2600) {
  const t = $('toast');
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, ms);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmtDist(m) {
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// ---------- 상단 정보 ----------
function renderHud() {
  const s = store.state;
  const lv = levelFromXp(s.xp);
  const base = xpForLevel(lv);
  const next = xpForLevel(lv + 1);
  $('hud-name').textContent = s.name || '트레이너';
  $('hud-avatar').style.background = s.color;
  $('hud-avatar').textContent = (s.name || '?').slice(0, 1);
  $('hud-level').textContent = `Lv.${lv}`;
  $('hud-xpbar').style.width = `${Math.round(((s.xp - base) / (next - base)) * 100)}%`;
  $('hud-balls').textContent = s.balls;
  $('hud-dex').textContent = `${store.speciesCount()}/${SPECIES.length}`;
  $('hud-time').textContent = isNight() ? '밤' : '낮';
  $('hud-time').className = 'chip ' + (isNight() ? 'night' : 'day');
}

// ---------- 지도 ----------
function playerIcon() {
  return L.divIcon({
    className: 'me-icon',
    html: `<div class="me-dot" style="--c:${store.state.color}"><span></span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function spawnIcon(spawn, near) {
  const sp = speciesById[spawn.speciesId];
  return L.divIcon({
    className: 'spawn-icon',
    html: `<div class="spawn ${near ? 'near' : ''} r-${sp.rarity}">${monsterSVG(sp, { size: 52 })}</div>`,
    iconSize: [52, 52],
    iconAnchor: [26, 46],
  });
}

function stopIcon(stop, ready) {
  return L.divIcon({
    className: 'stop-icon',
    html: `<div class="stop ${stop.special ? 'special' : ''} ${ready ? 'ready' : 'used'}">
             <div class="stop-cube">${stop.special ? '★' : ''}</div>
             <div class="stop-label">${esc(stop.name)}</div></div>`,
    iconSize: [120, 64],
    iconAnchor: [60, 30],
  });
}

function initMap() {
  map = L.map('map', {
    zoomControl: false,
    attributionControl: true,
    minZoom: 13,
    maxZoom: 19,
  }).setView([CONFIG.home.lat, CONFIG.home.lng], CONFIG.home.zoom);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> 기여자',
  }).addTo(map);

  map.on('dragstart', () => { followMe = false; $('btn-center').hidden = false; });
  map.on('click', (e) => {
    if (store.state.demo) walkTo(e.latlng.lat, e.latlng.lng);
  });
  map.on('contextmenu', (e) => {
    const txt = `${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`;
    showCoord(txt);
  });

  for (const stop of CONFIG.stops) {
    const m = L.marker([stop.lat, stop.lng], { icon: stopIcon(stop, stopReady(stop)), zIndexOffset: -100 })
      .addTo(map)
      .on('click', () => useStop(stop));
    stopMarkers.set(stop.id, m);
  }
}

function showCoord(txt) {
  $('coord-text').textContent = txt;
  $('coord-sheet').hidden = false;
}

function updateMe(lat, lng, acc = 10) {
  me = { lat, lng, acc };
  if (!meMarker) {
    meMarker = L.marker([lat, lng], { icon: playerIcon(), zIndexOffset: 1000, interactive: false }).addTo(map);
    accCircle = L.circle([lat, lng], { radius: acc, className: 'acc-circle', interactive: false }).addTo(map);
    catchCircle = L.circle([lat, lng], { radius: CONFIG.catchRadius, className: 'catch-circle', interactive: false }).addTo(map);
  } else {
    meMarker.setLatLng([lat, lng]);
    accCircle.setLatLng([lat, lng]).setRadius(Math.min(acc, 200));
    catchCircle.setLatLng([lat, lng]);
  }
  if (followMe) map.panTo([lat, lng], { animate: true });
  refreshWorld();
}

function refreshWorld() {
  if (!me || encounterActive()) return;
  const now = Date.now();
  const list = spawnsAround(me, CONFIG.visibleRadius, now)
    .filter(s => !store.state.caughtSpawns[s.id]);
  const keep = new Set();
  for (const s of list) {
    keep.add(s.id);
    const near = distanceM(me, s) <= CONFIG.catchRadius;
    const existing = spawnMarkers.get(s.id);
    if (existing) {
      if (existing._near !== near) { existing.setIcon(spawnIcon(s, near)); existing._near = near; }
      continue;
    }
    const m = L.marker([s.lat, s.lng], { icon: spawnIcon(s, near) }).addTo(map)
      .on('click', () => tapSpawn(s));
    m._near = near;
    spawnMarkers.set(s.id, m);
  }
  for (const [id, m] of spawnMarkers) {
    if (!keep.has(id)) { map.removeLayer(m); spawnMarkers.delete(id); }
  }
  for (const stop of CONFIG.stops) {
    stopMarkers.get(stop.id).setIcon(stopIcon(stop, stopReady(stop)));
  }
  renderNearby(list);
}

function renderNearby(list) {
  const sorted = list.map(s => ({ s, d: distanceM(me, s) })).sort((a, b) => a.d - b.d).slice(0, 8);
  $('nearby').innerHTML = sorted.length
    ? sorted.map(({ s, d }) => {
      const sp = speciesById[s.speciesId];
      const known = store.state.caught[sp.id];
      return `<button class="near-item ${d <= CONFIG.catchRadius ? 'in' : ''}" data-id="${s.id}" type="button">
        ${monsterSVG(sp, { size: 40, silhouette: !known })}<span>${fmtDist(d)}</span></button>`;
    }).join('')
    : '<p class="near-empty">근처에 몬스터가 없어요. 조금 걸어 보세요!</p>';
  for (const btn of $('nearby').querySelectorAll('.near-item')) {
    btn.addEventListener('click', () => {
      const s = list.find(x => x.id === btn.dataset.id);
      if (s) { map.panTo([s.lat, s.lng]); followMe = false; $('btn-center').hidden = false; tapSpawn(s); }
    });
  }
}

function tapSpawn(spawn) {
  if (!me) return;
  const d = distanceM(me, spawn);
  const sp = speciesById[spawn.speciesId];
  if (d > CONFIG.catchRadius) {
    toast(`${store.state.caught[sp.id] ? sp.name : '???'}까지 ${fmtDist(d)} 남았어요. 더 가까이 가 보세요!`);
    return;
  }
  openEncounter(spawn);
}

function openEncounter(spawn) {
  startEncounter(spawn, (result, sp) => {
    if (result.caught) {
      const s = speciesById[sp.speciesId];
      toast(result.isNew ? `새 몬스터 ${s.name} 도감 등록!` : `${s.name} 획득! +${result.gained} XP`);
      const m = spawnMarkers.get(sp.id);
      if (m) { map.removeLayer(m); spawnMarkers.delete(sp.id); }
    } else if (result.fled) {
      const m = spawnMarkers.get(sp.id);
      if (m) { map.removeLayer(m); spawnMarkers.delete(sp.id); }
    }
    renderHud();
    refreshWorld();
  });
}

// ---------- 거점 ----------
function stopReady(stop) {
  const t = store.state.stopCooldowns[stop.id] || 0;
  return Date.now() - t > CONFIG.stopCooldownMinutes * 60000;
}

function useStop(stop) {
  if (!me) return;
  const d = distanceM(me, stop);
  if (d > CONFIG.stopRadius) {
    toast(`${stop.name}까지 ${fmtDist(d)} 남았어요.`);
    return;
  }
  if (!stopReady(stop)) {
    const left = CONFIG.stopCooldownMinutes * 60000 - (Date.now() - store.state.stopCooldowns[stop.id]);
    toast(`${stop.name}: ${Math.ceil(left / 60000)}분 뒤에 다시 받을 수 있어요.`);
    return;
  }
  const n = stop.special ? CONFIG.specialStopBalls : CONFIG.stopBalls;
  store.state.balls += n;
  store.state.stopCooldowns[stop.id] = Date.now();
  store.state.xp += 50;
  store.save();
  renderHud();
  refreshWorld();
  if (stop.special && store.state.specialDay !== todayKey()) {
    store.state.specialDay = todayKey();
    store.save();
    toast(`★ ${stop.name} 특별 거점! 볼 ${n}개 + 특별한 몬스터가 나타났어요!`, 3500);
    setTimeout(() => openEncounter(specialEncounter(store.state.id, todayKey())), 900);
  } else {
    toast(`${stop.name}에서 볼 ${n}개를 받았어요!`);
  }
}

// ---------- 위치 ----------
function startGps() {
  if (store.state.demo) return;
  if (!('geolocation' in navigator)) {
    gpsFailed('이 브라우저는 위치 기능을 지원하지 않아요.');
    return;
  }
  $('gps-status').textContent = '위치 찾는 중...';
  gpsWatch = navigator.geolocation.watchPosition(
    (p) => {
      gpsOk = true;
      $('gps-status').textContent = '';
      updateMe(p.coords.latitude, p.coords.longitude, p.coords.accuracy);
    },
    (err) => {
      if (!gpsOk) {
        gpsFailed(err.code === 1
          ? '위치 권한이 꺼져 있어요. 브라우저 설정에서 위치를 허용하거나 산책 연습 모드를 켜 주세요.'
          : '위치를 찾지 못했어요. 밖으로 나가거나 산책 연습 모드를 켜 주세요.');
      }
    },
    { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 },
  );
}

function stopGps() {
  if (gpsWatch !== null) navigator.geolocation.clearWatch(gpsWatch);
  gpsWatch = null;
}

function gpsFailed(msg) {
  $('gps-status').textContent = msg;
  $('gps-status').classList.add('warn');
}

// 연습 모드: 지도를 누르면 그 방향으로 걸어감
let walkTimer = null;
function walkTo(lat, lng) {
  clearInterval(walkTimer);
  if (!me) { updateMe(lat, lng); return; }
  const speed = 6; // m/틱 (빠르게 걷기)
  walkTimer = setInterval(() => {
    const d = distanceM(me, { lat, lng });
    if (d <= speed) { clearInterval(walkTimer); updateMe(lat, lng); return; }
    const f = speed / d;
    updateMe(me.lat + (lat - me.lat) * f, me.lng + (lng - me.lng) * f);
  }, 120);
}

function setDemo(on) {
  store.state.demo = on;
  store.save();
  document.body.classList.toggle('demo', on);
  $('set-demo').checked = on;
  if (on) {
    stopGps();
    $('gps-status').textContent = '';
    $('gps-status').classList.remove('warn');
    followMe = true;
    if (!me) updateMe(CONFIG.home.lat, CONFIG.home.lng);
    toast('산책 연습 모드: 지도를 누르면 그쪽으로 걸어가요.');
  } else {
    clearInterval(walkTimer);
    startGps();
  }
}

// ---------- 탭 ----------
function showTab(name) {
  for (const b of document.querySelectorAll('.tab-btn')) {
    b.classList.toggle('active', b.dataset.tab === name);
    b.setAttribute('aria-selected', b.dataset.tab === name ? 'true' : 'false');
  }
  for (const p of document.querySelectorAll('.panel')) p.hidden = p.id !== `panel-${name}`;
  document.body.dataset.tab = name;
  if (name === 'map') setTimeout(() => map.invalidateSize(), 50);
  if (name === 'dex') renderDex();
  if (name === 'family') renderFamily();
  if (name === 'settings') renderSettings();
}

// ---------- 도감 ----------
function dexGrid(caughtMap, onClick) {
  return SPECIES.map(sp => {
    const c = caughtMap[sp.id];
    const count = typeof c === 'number' ? c : c?.count;
    return `<button class="dex-card ${count ? 'got' : ''}" data-id="${sp.id}" type="button" ${onClick ? '' : 'tabindex="-1"'}>
      <span class="dex-no">No.${String(sp.no).padStart(3, '0')}</span>
      ${monsterSVG(sp, { size: 84, silhouette: !count })}
      <span class="dex-name">${count ? sp.name : '???'}</span>
      ${count ? `<span class="dex-count">×${count}</span>` : ''}
      <span class="dex-rar" style="--rarity:${RARITY[sp.rarity].color}">${RARITY[sp.rarity].label}</span>
    </button>`;
  }).join('');
}

function renderDex() {
  const s = store.state;
  $('dex-summary').textContent = `${store.speciesCount()}종 발견 · 총 ${store.totalCaught()}마리`;
  $('dex-progress').style.width = `${(store.speciesCount() / SPECIES.length) * 100}%`;
  $('dex-grid').innerHTML = dexGrid(s.caught, true);
  for (const btn of $('dex-grid').querySelectorAll('.dex-card')) {
    btn.addEventListener('click', () => showSpecies(btn.dataset.id));
  }
}

function habitatText(sp) {
  return {
    any: '한숲시티 어디서나', day: '낮에만 (06~19시)', night: '밤에만 (19~06시)',
    school: '남곡초등학교 주변', legend: '남곡초 특별 거점 (아주 드묾)',
  }[sp.habitat];
}

function showSpecies(id) {
  const sp = speciesById[id];
  const c = store.state.caught[id];
  $('sp-body').innerHTML = c
    ? `${monsterSVG(sp, { size: 160 })}
       <h3>No.${String(sp.no).padStart(3, '0')} ${sp.name}</h3>
       <p class="sp-tags"><span style="--rarity:${RARITY[sp.rarity].color}" class="dex-rar">${RARITY[sp.rarity].label}</span> ${sp.type} 타입</p>
       <p>${sp.desc}</p>
       <dl class="sp-facts"><div><dt>잡은 수</dt><dd>${c.count}마리</dd></div>
       <div><dt>가장 큰 크기</dt><dd>${c.bestSize}cm</dd></div>
       <div><dt>사는 곳</dt><dd>${habitatText(sp)}</dd></div>
       <div><dt>처음 잡은 날</dt><dd>${new Date(c.firstAt).toLocaleDateString('ko-KR')}</dd></div></dl>`
    : `${monsterSVG(sp, { size: 160, silhouette: true })}
       <h3>No.${String(sp.no).padStart(3, '0')} ???</h3>
       <p>아직 만나지 못한 몬스터예요.</p>
       <p class="hint">힌트: ${habitatText(sp)}에서 만날 수 있어요.</p>`;
  $('sp-sheet').hidden = false;
}

// ---------- 가족 ----------
function renderFamily() {
  const s = store.state;
  const box = $('family-body');
  if (!firebaseEnabled()) {
    box.innerHTML = `<div class="notice">
      <h3>가족 공유가 아직 꺼져 있어요</h3>
      <p>가족·친구와 도감을 함께 보려면 무료 Firebase 프로젝트를 한 번만 연결하면 됩니다.
      설정 방법은 <b>hansup-go/README.md</b>에 있어요. 연결 전에는 내 기록만 이 휴대폰에 저장됩니다.</p></div>
      ${familyList([{ uid: 'me', name: s.name || '나', color: s.color, level: levelFromXp(s.xp), species: store.speciesCount(), total: store.totalCaught(),
        caught: Object.fromEntries(Object.entries(s.caught).map(([k, v]) => [k, v.count])) }], 'me')}`;
    bindFamily([{ uid: 'me', name: s.name || '나', caught: Object.fromEntries(Object.entries(s.caught).map(([k, v]) => [k, v.count])) }]);
    return;
  }
  if (!s.group) {
    box.innerHTML = `<div class="notice"><h3>가족 코드를 정해 주세요</h3>
      <p>설정 탭에서 가족 코드를 입력하면 같은 코드를 쓰는 사람끼리 도감과 순위를 함께 볼 수 있어요.</p></div>`;
    return;
  }
  if (remote.error) {
    box.innerHTML = `<div class="notice warn"><p>${esc(remote.error)}</p></div>`;
    return;
  }
  const players = [...remote.players].sort((a, b) => (b.species - a.species) || (b.xp - a.xp));
  const feed = remote.feed.map(f => {
    const sp = speciesById[f.speciesId];
    if (!sp) return '';
    const when = new Date(f.at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return `<li><span class="mini-av" style="background:${esc(f.color || '#888')}">${esc((f.name || '?').slice(0, 1))}</span>
      <span><b>${esc(f.name)}</b>님이 ${sp.name}을(를) 잡았어요${f.isNew ? ' <em>NEW</em>' : ''}</span><time>${when}</time></li>`;
  }).join('');
  box.innerHTML = `<p class="group-code">가족 코드 <b>${esc(s.group)}</b> · ${players.length}명 참여 중</p>
    ${players.length ? familyList(players, remote.uid) : '<p class="muted">아직 기록이 없어요. 몬스터를 잡으면 여기에 나타나요.</p>'}
    <h3 class="sub">최근 소식</h3>
    <ul class="feed">${feed || '<li class="muted">아직 소식이 없어요.</li>'}</ul>`;
  bindFamily(players);
}

function familyList(players, myUid) {
  return `<ol class="rank">${players.map((p, i) => `
    <li><button class="rank-row" data-uid="${esc(p.uid)}" type="button">
      <span class="rank-no">${i + 1}</span>
      <span class="mini-av" style="background:${esc(p.color || '#888')}">${esc((p.name || '?').slice(0, 1))}</span>
      <span class="rank-name">${esc(p.name || '이름 없음')}${p.uid === myUid ? ' <small>(나)</small>' : ''}</span>
      <span class="rank-stat"><b>${p.species || 0}</b>/${SPECIES.length}종 · Lv.${p.level || 1}</span>
    </button></li>`).join('')}</ol>`;
}

function bindFamily(players) {
  for (const btn of $('family-body').querySelectorAll('.rank-row')) {
    btn.addEventListener('click', () => {
      const p = players.find(x => x.uid === btn.dataset.uid);
      if (!p) return;
      $('sp-body').innerHTML = `<h3>${esc(p.name || '이름 없음')}의 도감</h3>
        <p class="muted">${Object.keys(p.caught || {}).length}/${SPECIES.length}종 발견</p>
        <div class="dex-grid small">${dexGrid(p.caught || {}, false)}</div>`;
      $('sp-sheet').hidden = false;
    });
  }
}

// ---------- 설정 ----------
function renderSettings() {
  const s = store.state;
  $('set-name').value = s.name;
  $('set-group').value = s.group;
  $('set-demo').checked = s.demo;
  $('set-share').textContent = firebaseEnabled()
    ? (remote.ready ? '가족 공유 연결됨' : '가족 공유 연결 중...')
    : '가족 공유 꺼짐 (README 참고)';
  renderColors('set-colors');
}

function renderColors(id) {
  $(id).innerHTML = COLORS.map(c =>
    `<button type="button" class="color-dot ${store.state.color === c ? 'on' : ''}" style="background:${c}" data-c="${c}" aria-label="색 ${c}"></button>`).join('');
  for (const b of $(id).querySelectorAll('.color-dot')) {
    b.addEventListener('click', () => {
      store.state.color = b.dataset.c;
      store.save();
      renderColors(id);
      if (meMarker) meMarker.setIcon(playerIcon());
      renderHud();
    });
  }
}

function normalizeGroup(v) {
  return v.trim().toUpperCase().replace(/[^A-Z0-9가-힣-]/g, '').slice(0, 20);
}

function bindSettings() {
  $('settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('set-name').value.trim().slice(0, 12);
    const group = normalizeGroup($('set-group').value);
    if (!name) { toast('닉네임을 입력해 주세요.'); return; }
    const groupChanged = group !== store.state.group;
    store.state.name = name;
    store.state.group = group;
    store.save();
    if (groupChanged) remote.watchGroup(group);
    renderHud();
    renderSettings();
    toast('저장했어요.');
  });
  $('set-demo').addEventListener('change', (e) => setDemo(e.target.checked));
  $('set-reset').addEventListener('click', () => { $('reset-confirm').hidden = false; });
  $('reset-no').addEventListener('click', () => { $('reset-confirm').hidden = true; });
  $('reset-yes').addEventListener('click', () => {
    try { localStorage.removeItem('hansupgo.v1'); } catch { /* 무시 */ }
    location.reload();
  });
}

// ---------- 처음 시작 ----------
function bindOnboarding() {
  document.querySelector('.ob-hero').innerHTML =
    ['dotoriram', 'sumbbong', 'jongsorinyang'].map((id, i) => monsterSVG(id, { size: i === 1 ? 110 : 84 })).join('');
  renderColors('ob-colors');
  $('onboard-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('ob-name').value.trim().slice(0, 12);
    if (!name) { $('ob-name').focus(); return; }
    store.state.name = name;
    store.state.group = normalizeGroup($('ob-group').value);
    store.save();
    $('onboard').hidden = true;
    remote.watchGroup(store.state.group);
    renderHud();
    begin();
  });
  $('ob-demo').addEventListener('click', () => {
    const name = $('ob-name').value.trim().slice(0, 12) || '연습생';
    store.state.name = name;
    store.state.group = normalizeGroup($('ob-group').value);
    store.save();
    $('onboard').hidden = true;
    remote.watchGroup(store.state.group);
    renderHud();
    setDemo(true);
  });
}

function begin() {
  if (store.state.demo) setDemo(true);
  else startGps();
}

// ---------- 시작 ----------
async function main() {
  store.load();
  document.body.classList.toggle('demo', store.state.demo);
  initMap();
  initEncounterUI();
  bindSettings();
  bindOnboarding();
  renderHud();

  for (const b of document.querySelectorAll('.tab-btn')) b.addEventListener('click', () => showTab(b.dataset.tab));
  $('btn-center').addEventListener('click', () => {
    followMe = true;
    $('btn-center').hidden = true;
    if (me) map.setView([me.lat, me.lng], Math.max(map.getZoom(), 17));
  });
  $('btn-home').addEventListener('click', () => {
    followMe = false;
    $('btn-center').hidden = false;
    map.setView([CONFIG.home.lat, CONFIG.home.lng], CONFIG.home.zoom);
  });
  for (const id of ['sp-sheet', 'coord-sheet']) {
    $(id).addEventListener('click', (e) => { if (e.target.id === id || e.target.closest('.sheet-close')) $(id).hidden = true; });
  }
  $('coord-copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('coord-text').textContent); toast('좌표를 복사했어요.'); }
    catch { toast('복사하지 못했어요. 좌표를 길게 눌러 복사해 주세요.'); }
  });

  store.onChange(renderHud);
  remote.onChange(() => { if (document.body.dataset.tab === 'family') renderFamily(); });
  setInterval(() => { renderHud(); refreshWorld(); }, 15000);

  showTab('map');
  if (!store.state.name) {
    $('onboard').hidden = false;
  } else {
    begin();
  }
  if (await remote.init()) {
    remote.watchGroup(store.state.group);
    remote.schedulePush(store.state);
    if (document.body.dataset.tab === 'settings') renderSettings();
  }
}

main();
