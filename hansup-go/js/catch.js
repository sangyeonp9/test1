// 잡기 화면
// 종류마다 잡는 방법이 다릅니다.
//   몬스터 → 숲볼 던지기 (위로 밀어 던지기, 링이 작을 때 맞히면 보너스)
//   곤충   → 잠자리채 (돌아다니는 곤충을 톡 눌러 채집, 휘두르기 횟수 제한)
//   동물   → 간식 주기 (움직이는 막대가 초록 칸에 있을 때 누르기, 하트 3개면 친구)
//   물고기 → 낚시 (버튼을 꾹 눌러 초록 칸 안에 물고기를 붙잡아 두기)

import { CONFIG } from './config.js';
import { RARITY, KINDS, speciesById, monsterSVG, josa } from './monsters.js';
import { store } from './store.js';
import { createStage } from './stage3d.js';

const $ = (id) => document.getElementById(id);
const AR_KEY = 'hansupgo.ar';
const SPEED = { common: 1, uncommon: 1.3, rare: 1.7, legendary: 2 };

let cur = null;      // 지금 만난 상대
let sp = null;       // 그 종 데이터
let mode = '';       // ball | net | snack | fish
let stream = null;   // 카메라 스트림
let busy = false;    // 연출 중에는 입력을 막음
let raf = 0;
let doneCb = null;
let finished = false; // 결과가 한 번만 기록되도록
let s3 = null;        // 3D 무대 (못 쓰면 null → 2D 그림으로 진행)
let s3Tried = false;
let s3on = false;

async function getStage() {
  if (!s3Tried) {
    s3Tried = true;
    try { s3 = await createStage($('enc-3d')); } catch (e) { console.warn(e); s3 = null; }
  }
  return s3;
}

// 캐릭터 연출 상태 (3D 또는 2D 그림)
function monState(name) {
  if (s3on) { s3.play(name === 'flying' ? 'idle' : name); return; }
  const mon = $('enc-monster');
  mon.className = 'enc-monster';
  void mon.offsetWidth;
  mon.className = `enc-monster ${name}`;
}

// 캐릭터 가운데의 화면 위치 (잡기 화면 기준 px)와 맞히기 반지름
function monCenter() {
  if (s3on) return s3.screenPos();
  const st = stage();
  const m = $('enc-monster').getBoundingClientRect();
  return { x: m.left - st.left + m.width / 2, y: m.top - st.top + m.height / 2, r: m.width * 0.38 };
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
function stage() { return $('enc-stage').getBoundingClientRect(); }

function arPreferred() {
  try { return localStorage.getItem(AR_KEY) !== 'off'; } catch { return true; }
}
function setArPreferred(on) {
  try { localStorage.setItem(AR_KEY, on ? 'on' : 'off'); } catch { /* 무시 */ }
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia || s3?.inXR) return false;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    const v = $('cam');
    v.srcObject = stream;
    await v.play().catch(() => {});
    $('encounter').classList.add('ar-on');
    if (s3on) s3.enableGyro();
    return true;
  } catch {
    stopCamera();
    return false;
  }
}

function stopCamera() {
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null;
  $('cam').srcObject = null;
  $('encounter').classList.remove('ar-on');
  s3?.disableGyro();
}

function updateArButton() {
  $('enc-ar').textContent = stream ? 'AR 끄기' : 'AR 켜기';
  $('enc-ar').setAttribute('aria-pressed', stream ? 'true' : 'false');
}

function setMsg(text, kind = '') {
  const m = $('enc-msg');
  m.textContent = text;
  m.className = 'enc-msg ' + kind;
}

function setCount(html) {
  $('enc-count').innerHTML = html;
  $('enc-count').hidden = !html;
}

// 프레임 반복. stopLoop()을 부르면 그 뒤로는 절대 다시 돌지 않는다.
let loopToken = 0;
function stopLoop() {
  loopToken += 1;
  cancelAnimationFrame(raf);
}
function loop(fn) {
  stopLoop();
  const token = loopToken;
  let last = performance.now();
  const tick = (now) => {
    if (token !== loopToken) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    fn(now, dt);
    if (token === loopToken) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

// ---------- 시작 / 끝 ----------

export async function startEncounter(spawn, onDone) {
  cur = spawn;
  sp = speciesById[spawn.speciesId];
  mode = KINDS[sp.kind].method;
  doneCb = onDone;
  busy = false;
  finished = false;
  const r = RARITY[sp.rarity];
  $('enc-name').textContent = sp.name;
  $('enc-meta').textContent = `${r.label} · ${KINDS[sp.kind].label} · ${spawn.sizeCm}cm`;
  $('enc-meta').style.setProperty('--rarity', r.color);
  const enc = $('encounter');
  enc.className = `encounter mode-${mode}`;
  enc.hidden = false;
  document.body.classList.add('in-encounter');
  for (const id of ['enc-ring', 'enc-ball', 'snack-ui', 'fish-ui', 'net-fx', 'enc-xr']) $(id).hidden = true;
  setMsg('');
  setCount('');

  // 3D로 보여 줄 수 있으면 3D, 아니면 2D 그림
  const stage3 = await getStage();
  if (cur !== spawn) return; // 불러오는 사이에 닫힘
  s3on = Boolean(stage3);
  enc.classList.toggle('is3d', s3on);
  const mon = $('enc-monster');
  mon.hidden = s3on;
  $('enc-3d').hidden = !s3on;
  mon.style.left = '';
  mon.style.top = '';
  if (s3on) {
    s3.setCreature(sp, mode);
    mon.innerHTML = '';
  } else {
    mon.innerHTML = monsterSVG(sp, { size: 220 });
    monState('appear');
  }

  const first = !store.state.caught[sp.id];
  if (mode === 'ball') startBall(first);
  if (mode === 'net') startNet(first);
  if (mode === 'snack') startSnack(first);
  if (mode === 'fish') startFish(first);

  $('enc-ar').hidden = mode === 'fish';
  if (mode !== 'fish' && arPreferred()) await startCamera();
  updateArButton();
  if (s3on && mode !== 'fish' && await s3.xrSupported()) $('enc-xr').hidden = false;
}

// 진짜 AR: 바닥을 인식해서 그 위에 캐릭터를 세움 (ARCore 지원 폰)
async function startRealAR() {
  if (!s3on || s3.inXR) return;
  const keep = $('enc-msg').textContent;
  stopCamera();
  const enc = $('encounter');
  try {
    enc.classList.add('xr-on');
    setMsg('휴대폰으로 바닥을 천천히 비춰 주세요. 바닥에 나타나요!');
    await s3.startXR(enc, {
      onPlaced: () => setMsg(keep || '나타났어요!'),
      onEnd: () => { enc.classList.remove('xr-on'); updateArButton(); },
    });
    $('enc-xr').hidden = true;
  } catch (e) {
    console.warn(e);
    enc.classList.remove('xr-on');
    setMsg('이 휴대폰에서는 진짜 AR을 시작할 수 없어요.', 'bad');
  }
}

function endEncounter(result) {
  stopLoop();
  stopCamera();
  if (s3?.inXR) s3.endXR();
  s3?.clear();
  fishHold = false;
  $('encounter').hidden = true;
  document.body.classList.remove('in-encounter');
  const cb = doneCb;
  const spawn = cur;
  cur = null;
  sp = null;
  doneCb = null;
  cb?.(result, spawn);
}

async function succeed(extraMsg = '') {
  if (finished) return;
  finished = true;
  busy = true;
  stopLoop();
  const { gained, isNew } = store.recordCatch(cur);
  const verb = KINDS[sp.kind].done;
  const who = sp.kind === 'animal' ? josa(sp.name, '과', '와') : josa(sp.name, '을', '를');
  setMsg(`${extraMsg}${who} ${verb}! +${gained} XP${isNew ? ' · 새로 등록!' : ''}`, 'good');
  monState('happy');
  await wait(1700);
  endEncounter({ caught: true, gained, isNew });
}

async function flee(text) {
  if (finished) return;
  finished = true;
  busy = true;
  stopLoop();
  setMsg(text, 'bad');
  store.markFled(cur);
  monState('leave');
  await wait(1400);
  endEncounter({ caught: false, fled: true });
}

// ---------- 몬스터: 숲볼 던지기 ----------

let ringStart = 0;
let drag = null;
const RING_MS = 1700;
const ball = () => $('enc-ball');

function ringScale(t = performance.now()) {
  const p = ((t - ringStart) % RING_MS) / RING_MS;
  return 1 - 0.65 * p;
}

function startBall(first) {
  $('enc-ring').hidden = false;
  $('enc-ring').style.borderColor = RARITY[sp.rarity].color;
  resetBall();
  updateBallCount();
  setMsg(first ? '처음 보는 몬스터예요! 숲볼을 위로 밀어 던지세요!' : '숲볼을 위로 밀어 던지세요!');
  ringStart = performance.now();
  loop(() => {
    const ring = $('enc-ring');
    const c = monCenter();
    if (c) {
      ring.style.left = `${c.x}px`;
      ring.style.top = `${c.y}px`;
      ring.style.width = ring.style.height = `${c.r * 2.2}px`;
    }
    ring.style.opacity = c ? '1' : '0';
    ring.style.transform = `translate(-50%, -50%) scale(${ringScale()})`;
  });
}

function updateBallCount() {
  setCount(`<span class="ball-ico" aria-hidden="true"></span> <b>${store.state.balls}</b>`);
}

function resetBall() {
  const b = ball();
  b.style.transition = 'none';
  b.style.transform = 'translate(-50%, 0) scale(1)';
  b.style.left = '50%';
  b.style.top = '';
  b.style.bottom = 'calc(28px + env(safe-area-inset-bottom, 0px))';
  b.classList.remove('wobble', 'caught', 'pop');
  b.hidden = false;
}

function onBallDown(e) {
  if (busy || mode !== 'ball') return;
  if (store.state.balls <= 0) {
    setMsg('숲볼이 없어요. 거점에 가서 받아 오세요.', 'bad');
    return;
  }
  e.preventDefault();
  ball().setPointerCapture?.(e.pointerId);
  drag = { samples: [{ x: e.clientX, y: e.clientY, t: e.timeStamp || performance.now() }] };
}

function onBallMove(e) {
  if (!drag) return;
  const st = stage();
  const b = ball();
  b.style.transition = 'none';
  b.style.bottom = '';
  b.style.left = `${e.clientX - st.left}px`;
  b.style.top = `${e.clientY - st.top}px`;
  b.style.transform = 'translate(-50%, -50%)';
  drag.samples.push({ x: e.clientX, y: e.clientY, t: e.timeStamp || performance.now() });
  if (drag.samples.length > 8) drag.samples.shift();
}

function onBallUp(e) {
  if (!drag) return;
  const samples = drag.samples;
  drag = null;
  const up = { x: e.clientX, y: e.clientY, t: e.timeStamp || performance.now() };
  const tail = samples[samples.length - 1];
  // 손가락을 뗀 위치가 마지막 움직임과 같으면 그 움직임 시각을 기준으로 속도를 잰다.
  // (손가락을 멈췄다가 한참 뒤에 떼면 던지지 않음)
  const still = Math.hypot(up.x - tail.x, up.y - tail.y) < 3;
  const end = still ? tail : up;
  const paused = still && up.t - tail.t > 150;
  const first = [...samples].reverse().find(s => end.t - s.t >= 40) || samples[0];
  const dt = Math.max(16, end.t - first.t);
  const vx = paused ? 0 : (end.x - first.x) / dt;
  const vy = paused ? 0 : (end.y - first.y) / dt;
  const last = end;
  if (vy > -0.35) {
    resetBall();
    if (samples.length > 2) setMsg('조금 더 힘차게 위로 밀어 보세요!');
    return;
  }
  throwBall(last.x, last.y, vx, vy);
}

function throwBall(x, y, vx, vy) {
  busy = true;
  store.state.balls -= 1;
  store.save();
  updateBallCount();
  const st = stage();
  const sx = x - st.left;
  const sy = y - st.top;
  const flight = 280;
  const tx = Math.min(st.width - 20, Math.max(20, sx + vx * flight));
  const ty = Math.max(20, sy + vy * flight);
  const c = monCenter();
  const mx = c ? c.x : -999;
  const my = c ? c.y : -999;
  const hit = Boolean(c) && Math.hypot(tx - mx, ty - my) < c.r;
  const scaleAtHit = ringScale(performance.now() + 450);
  const b = ball();
  const startT = performance.now();
  const dur = 450;
  const endX = hit ? mx : tx;
  const endY = hit ? my : ty;
  function step(now) {
    const p = Math.min(1, (now - startT) / dur);
    const ease = 1 - (1 - p) ** 2;
    b.style.left = `${sx + (endX - sx) * ease}px`;
    b.style.top = `${sy + (endY - sy) * ease - Math.sin(p * Math.PI) * 70}px`;
    b.style.transform = `translate(-50%, -50%) scale(${1 - 0.45 * p}) rotate(${p * 720}deg)`;
    if (p < 1) requestAnimationFrame(step);
    else if (hit) onBallHit(scaleAtHit);
    else {
      setMsg('빗나갔어요! 다시 던져 보세요.');
      setTimeout(() => { resetBall(); busy = false; }, 500);
    }
  }
  requestAnimationFrame(step);
}

async function onBallHit(ring) {
  const r = RARITY[sp.rarity];
  let bonus = 1;
  let label = '맞았다!';
  if (ring < 0.55) { bonus = 1.7; label = '최고예요!'; }
  else if (ring < 0.75) { bonus = 1.35; label = '좋아요!'; }
  const success = Math.random() < Math.min(0.97, r.catchRate * bonus);
  const shakes = success ? 3 : Math.floor(Math.random() * 3);
  setMsg(label, 'good');
  $('enc-ring').hidden = true;
  monState('sucked');
  const b = ball();
  b.classList.add('caught');
  b.style.transition = 'top .35s ease-in';
  await wait(250);
  b.style.top = `${parseFloat(b.style.top) + 150}px`;
  await wait(450);
  for (let i = 0; i < shakes; i++) {
    b.classList.remove('wobble');
    void b.offsetWidth;
    b.classList.add('wobble');
    setMsg('.'.repeat(i + 1) + ' 흔들흔들');
    await wait(750);
  }
  b.classList.remove('wobble');
  if (success) {
    b.classList.add('pop');
    await succeed();
    return;
  }
  b.hidden = true;
  monState('appear');
  if (Math.random() < r.flee) { await flee(`${josa(sp.name, '이', '가')} 도망쳤어요...`); return; }
  setMsg('앗, 숲볼에서 빠져나왔어요! 다시 던져 보세요.', 'bad');
  $('enc-ring').hidden = false;
  ringStart = performance.now();
  await wait(400);
  resetBall();
  busy = false;
}

// ---------- 곤충: 잠자리채 ----------

let swings = 0;
let bug = { x: 0, y: 0, phase: 0, boost: 0 };

function startNet(first) {
  swings = CONFIG.netSwings;
  updateNetCount();
  setMsg(first ? '처음 보는 곤충이에요! 움직이는 곤충을 톡 눌러 잠자리채를 휘두르세요!' : '곤충을 톡 눌러 잠자리채를 휘두르세요!');
  const mon = $('enc-monster');
  monState('flying');
  bug = { x: 0, y: 0, r: 70, phase: Math.random() * 10, boost: 0 };
  const speed = SPEED[sp.rarity];
  loop((now, dt) => {
    const st = stage();
    bug.phase += dt * speed * (1 + bug.boost);
    bug.boost = Math.max(0, bug.boost - dt);
    if (s3on) {
      s3.fly(bug.phase);
      const c = s3.screenPos();
      bug.x = c ? c.x : -999;
      bug.y = c ? c.y : -999;
      bug.r = c ? Math.max(60, c.r) : 0;
      return;
    }
    const t = bug.phase;
    const w = st.width;
    const h = st.height;
    bug.x = w / 2 + (w * 0.32) * Math.sin(t * 1.1) * Math.cos(t * 0.37);
    bug.y = h * 0.38 + (h * 0.18) * Math.sin(t * 1.7 + 1) ;
    mon.style.left = `${bug.x}px`;
    mon.style.top = `${bug.y}px`;
  });
}

function updateNetCount() {
  setCount(`잠자리채 <b>${swings}</b>번 남음`);
}

async function onNetTap(e) {
  if (busy || mode !== 'net') return;
  if (e.target.closest('button')) return;
  const st = stage();
  const x = e.clientX - st.left;
  const y = e.clientY - st.top;
  const fx = $('net-fx');
  fx.hidden = false;
  fx.style.left = `${x}px`;
  fx.style.top = `${y}px`;
  fx.classList.remove('swing');
  void fx.offsetWidth;
  fx.classList.add('swing');
  swings -= 1;
  updateNetCount();
  const hit = Math.hypot(x - bug.x, y - bug.y) < bug.r;
  if (hit && Math.random() < Math.min(0.95, RARITY[sp.rarity].catchRate * 1.25)) {
    stopLoop();
    monState('netted');
    await succeed('잡았다! ');
    return;
  }
  if (hit) {
    setMsg('아깝다! 그물 사이로 빠져나갔어요.', 'bad');
  } else {
    setMsg('헛스윙! 곤충을 잘 보고 눌러 보세요.');
  }
  bug.boost = 1.2;
  if (swings <= 0) await flee(`${josa(sp.name, '이', '가')} 멀리 날아갔어요...`);
}

// ---------- 동물: 간식 주고 친구 되기 ----------

let hearts = 0;
let zone = { c: 0.5, w: 0.3 };
let markerPos = 0;
const ZONE_W = { common: 0.34, uncommon: 0.26, rare: 0.18, legendary: 0.12 };

function startSnack(first) {
  hearts = 0;
  $('snack-ui').hidden = false;
  newZone();
  renderHearts();
  updateSnackCount();
  setMsg(first ? '처음 만난 동물이에요! 막대가 초록 칸에 왔을 때 간식을 주세요.' : '막대가 초록 칸에 왔을 때 간식을 주세요. 하트 3개면 친구!');
  const speed = 1.6 * SPEED[sp.rarity];
  let t = Math.random() * 6;
  loop((now, dt) => {
    t += dt * speed;
    markerPos = (Math.sin(t) + 1) / 2;
    $('snack-marker').style.left = `${markerPos * 100}%`;
  });
}

function newZone() {
  const w = ZONE_W[sp.rarity];
  zone = { w, c: w / 2 + Math.random() * (1 - w) };
  $('snack-zone').style.left = `${(zone.c - w / 2) * 100}%`;
  $('snack-zone').style.width = `${w * 100}%`;
}

function renderHearts() {
  $('snack-hearts').innerHTML = [0, 1, 2].map(i => `<span class="${i < hearts ? 'on' : ''}">♥</span>`).join('');
}

function updateSnackCount() {
  setCount('');
  $('snack-btn').textContent = `간식 주기 (🍪 ${store.state.snacks})`;
}

async function onSnack() {
  if (busy || mode !== 'snack') return;
  if (store.state.snacks <= 0) {
    setMsg('간식이 없어요. 거점에 가서 받아 오세요.', 'bad');
    return;
  }
  store.state.snacks -= 1;
  store.save();
  updateSnackCount();
  if (Math.abs(markerPos - zone.c) <= zone.w / 2) {
    hearts += 1;
    renderHearts();
    monState('hop');
    if (hearts >= 3) {
      await succeed();
      return;
    }
    setMsg(['냠냠! 좋아해요!', '꼬리를 흔들어요!'][hearts - 1] || '좋아해요!', 'good');
    newZone();
    return;
  }
  monState('startle');
  if (Math.random() < RARITY[sp.rarity].flee * 1.5) {
    await flee(`${josa(sp.name, '이', '가')} 깜짝 놀라 가 버렸어요...`);
    return;
  }
  setMsg('깜짝 놀랐어요! 초록 칸을 잘 보고 다시 주세요.', 'bad');
}

// ---------- 물고기: 낚시 ----------

let fishHold = false;
let fishState = null;
const FISH_ZONE = { common: 0.38, uncommon: 0.32, rare: 0.26, legendary: 0.2 };

function startFish(first) {
  $('fish-ui').hidden = false;
  $('fish-dot').innerHTML = monsterSVG(sp, { size: 34 });
  const zh = FISH_ZONE[sp.rarity];
  $('fish-zone').style.height = `${zh * 100}%`;
  fishState = { pos: 0.3, target: 0.6, zoneY: 0.1, vel: 0, progress: 30, zh, retarget: 0 };
  setCount('');
  setMsg(first ? '처음 보는 물고기예요! 버튼을 꾹 누르면 초록 칸이 올라가요.' : '초록 칸 안에 물고기를 잡아 두세요!');
  const speed = SPEED[sp.rarity];
  loop((now, dt) => {
    const f = fishState;
    // 물고기가 위아래로 도망다님
    f.retarget -= dt;
    if (f.retarget <= 0) {
      f.target = Math.random();
      f.retarget = (0.6 + Math.random() * 1.2) / speed;
    }
    f.pos += Math.sign(f.target - f.pos) * Math.min(Math.abs(f.target - f.pos), dt * 0.35 * speed);
    // 버튼을 누르면 칸이 올라가고, 놓으면 내려감
    f.vel += (fishHold ? 1.7 : -1.4) * dt;
    f.vel = Math.max(-0.8, Math.min(0.8, f.vel));
    f.zoneY += f.vel * dt;
    if (f.zoneY < 0) { f.zoneY = 0; f.vel = Math.max(0, f.vel) * -0.3; }
    if (f.zoneY > 1 - f.zh) { f.zoneY = 1 - f.zh; f.vel = Math.min(0, f.vel) * -0.3; }
    const inZone = f.pos >= f.zoneY && f.pos <= f.zoneY + f.zh;
    f.progress += (inZone ? 26 : -11) * dt;
    $('fish-zone').style.bottom = `${f.zoneY * 100}%`;
    $('fish-zone').classList.toggle('in', inZone);
    $('fish-dot').style.bottom = `calc(${f.pos * 100}% - ${f.pos * 34}px)`;
    $('fish-prog').style.height = `${Math.max(0, Math.min(100, f.progress))}%`;
    if (f.progress >= 100) { succeed(); return; }
    if (f.progress <= 0) { flee(`${josa(sp.name, '이', '가')} 낚싯줄을 끊고 도망갔어요...`); }
  });
}

// ---------- 공통 ----------

export function initEncounterUI() {
  const b = ball();
  b.addEventListener('pointerdown', onBallDown);
  window.addEventListener('pointermove', onBallMove);
  window.addEventListener('pointerup', (e) => { onBallUp(e); fishHold = false; });
  window.addEventListener('pointercancel', () => {
    fishHold = false;
    if (drag) { drag = null; resetBall(); }
  });
  $('enc-stage').addEventListener('pointerdown', onNetTap);
  $('snack-btn').addEventListener('click', onSnack);
  const fb = $('fish-btn');
  fb.addEventListener('pointerdown', (e) => { e.preventDefault(); if (!busy) fishHold = true; });
  fb.addEventListener('pointerleave', () => { fishHold = false; });
  fb.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); fishHold = true; } });
  fb.addEventListener('keyup', () => { fishHold = false; });
  fb.addEventListener('contextmenu', (e) => e.preventDefault());
  $('enc-run').addEventListener('click', () => { if (!busy) endEncounter({ caught: false }); });
  $('enc-xr').addEventListener('click', startRealAR);
  $('enc-ar').addEventListener('click', async () => {
    if (stream) { stopCamera(); setArPreferred(false); }
    else {
      const ok = await startCamera();
      setArPreferred(ok);
      if (!ok) setMsg('카메라를 켤 수 없어요. 브라우저의 카메라 권한을 확인해 주세요.', 'bad');
    }
    updateArButton();
  });
}

export function encounterActive() { return Boolean(cur); }

/** 지금 캐릭터가 보이는 화면 위치 (자동 테스트용) */
export function targetPoint() {
  if (!cur) return null;
  const c = monCenter();
  if (!c) return null;
  const st = stage();
  return { x: st.left + c.x, y: st.top + c.y, r: c.r };
}
