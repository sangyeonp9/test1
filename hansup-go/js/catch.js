// 몬스터 잡기 화면 (카메라 AR + 볼 던지기)

import { RARITY, speciesById, monsterSVG } from './monsters.js';
import { store } from './store.js';

const $ = (id) => document.getElementById(id);
const AR_KEY = 'hansupgo.ar';

let cur = null;      // 현재 만난 몬스터
let stream = null;   // 카메라 스트림
let busy = false;    // 볼이 날아가는 중
let ringStart = 0;
let ringRaf = 0;
let doneCb = null;

function arPreferred() {
  try { return localStorage.getItem(AR_KEY) !== 'off'; } catch { return true; }
}
function setArPreferred(on) {
  try { localStorage.setItem(AR_KEY, on ? 'on' : 'off'); } catch { /* 무시 */ }
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) return false;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } }, audio: false,
    });
    const v = $('cam');
    v.srcObject = stream;
    await v.play().catch(() => {});
    $('encounter').classList.add('ar-on');
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

function updateBalls() {
  $('enc-balls').textContent = store.state.balls;
}

// ---------- 링 (작을 때 맞히면 잡기 쉬움) ----------
const RING_MS = 1700;
function ringScale(t = performance.now()) {
  const p = ((t - ringStart) % RING_MS) / RING_MS;
  return 1 - 0.65 * p;
}
function animateRing() {
  const ring = $('enc-ring');
  ring.style.transform = `translate(-50%, -50%) scale(${ringScale()})`;
  ringRaf = requestAnimationFrame(animateRing);
}

// ---------- 시작 / 종료 ----------
export async function startEncounter(spawn, onDone) {
  cur = spawn;
  doneCb = onDone;
  busy = false;
  const sp = speciesById[spawn.speciesId];
  const r = RARITY[sp.rarity];
  $('enc-name').textContent = sp.name;
  $('enc-meta').textContent = `${r.label} · ${sp.type} · ${spawn.sizeCm}cm`;
  $('enc-meta').style.setProperty('--rarity', r.color);
  $('enc-monster').innerHTML = monsterSVG(sp, { size: 220 });
  $('enc-monster').className = 'enc-monster appear';
  $('enc-ring').style.borderColor = r.color;
  $('enc-ring').hidden = false;
  resetBall();
  updateBalls();
  setMsg(store.state.caught[sp.id] ? '볼을 위로 밀어 던지세요!' : '처음 보는 몬스터예요! 볼을 위로 밀어 던지세요!');
  $('encounter').hidden = false;
  document.body.classList.add('in-encounter');
  ringStart = performance.now();
  cancelAnimationFrame(ringRaf);
  animateRing();
  if (arPreferred()) await startCamera();
  updateArButton();
}

function endEncounter(result) {
  cancelAnimationFrame(ringRaf);
  stopCamera();
  $('encounter').hidden = true;
  document.body.classList.remove('in-encounter');
  const cb = doneCb;
  const spawn = cur;
  cur = null;
  doneCb = null;
  cb?.(result, spawn);
}

// ---------- 볼 던지기 ----------
const ball = () => $('enc-ball');
let drag = null;

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

function stageRect() { return $('enc-stage').getBoundingClientRect(); }

function onDown(e) {
  if (busy || !cur) return;
  if (store.state.balls <= 0) {
    setMsg('볼이 없어요. 거점에 가서 볼을 받아 오세요.', 'bad');
    return;
  }
  e.preventDefault();
  ball().setPointerCapture?.(e.pointerId);
  drag = { samples: [{ x: e.clientX, y: e.clientY, t: performance.now() }] };
}

function onMove(e) {
  if (!drag) return;
  const st = stageRect();
  const b = ball();
  b.style.transition = 'none';
  b.style.bottom = '';
  b.style.left = `${e.clientX - st.left}px`;
  b.style.top = `${e.clientY - st.top}px`;
  b.style.transform = 'translate(-50%, -50%)';
  drag.samples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
  if (drag.samples.length > 8) drag.samples.shift();
}

function onUp(e) {
  if (!drag) return;
  const samples = drag.samples;
  drag = null;
  const last = { x: e.clientX, y: e.clientY, t: performance.now() };
  const first = samples.find(s => last.t - s.t <= 120) || samples[0];
  const dt = Math.max(16, last.t - first.t);
  const vx = (last.x - first.x) / dt;
  const vy = (last.y - first.y) / dt;
  if (vy > -0.35) {
    // 위로 충분히 밀지 않음 → 볼을 제자리로
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
  updateBalls();
  const st = stageRect();
  const sx = x - st.left;
  const sy = y - st.top;
  const flight = 280; // ms 만큼 날아간 지점에 떨어진다고 계산
  const tx = Math.min(st.width - 20, Math.max(20, sx + vx * flight));
  const ty = Math.max(20, sy + vy * flight);
  const mon = $('enc-monster').getBoundingClientRect();
  const mx = mon.left - st.left + mon.width / 2;
  const my = mon.top - st.top + mon.height / 2;
  const mr = mon.width * 0.38;
  const hit = Math.hypot(tx - mx, ty - my) < mr;
  const scaleAtHit = ringScale(performance.now() + 450);

  const b = ball();
  const startT = performance.now();
  const dur = 450;
  const endX = hit ? mx : tx;
  const endY = hit ? my : ty;
  function step(now) {
    const p = Math.min(1, (now - startT) / dur);
    const ease = 1 - (1 - p) ** 2;
    const cx = sx + (endX - sx) * ease;
    const arc = -Math.sin(p * Math.PI) * 70;
    const cy = sy + (endY - sy) * ease + arc;
    const sc = 1 - 0.45 * p;
    b.style.left = `${cx}px`;
    b.style.top = `${cy}px`;
    b.style.transform = `translate(-50%, -50%) scale(${sc}) rotate(${p * 720}deg)`;
    if (p < 1) requestAnimationFrame(step);
    else if (hit) onHit(scaleAtHit);
    else onMiss();
  }
  requestAnimationFrame(step);
}

function onMiss() {
  setMsg('빗나갔어요! 다시 던져 보세요.');
  setTimeout(() => { resetBall(); busy = false; }, 500);
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function onHit(ring) {
  const sp = speciesById[cur.speciesId];
  const r = RARITY[sp.rarity];
  let bonus = 1;
  let label = '맞았다!';
  if (ring < 0.55) { bonus = 1.7; label = '최고예요!'; }
  else if (ring < 0.75) { bonus = 1.35; label = '좋아요!'; }
  const chance = Math.min(0.97, r.catchRate * bonus);
  const success = Math.random() < chance;
  const shakes = success ? 3 : Math.floor(Math.random() * 3);

  setMsg(label, 'good');
  $('enc-ring').hidden = true;
  $('enc-monster').className = 'enc-monster sucked';
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
    const { gained, isNew } = store.recordCatch(cur);
    setMsg(`${sp.name}을(를) 잡았다! +${gained} XP${isNew ? ' · 새로운 몬스터!' : ''}`, 'good');
    await wait(1600);
    endEncounter({ caught: true, gained, isNew });
    return;
  }

  // 탈출
  b.hidden = true;
  $('enc-monster').className = 'enc-monster appear';
  if (Math.random() < r.flee) {
    setMsg(`${sp.name}이(가) 도망쳤어요...`, 'bad');
    store.markFled(cur);
    await wait(1400);
    endEncounter({ caught: false, fled: true });
    return;
  }
  setMsg('앗, 볼에서 빠져나왔어요! 다시 던져 보세요.', 'bad');
  $('enc-ring').hidden = false;
  ringStart = performance.now();
  await wait(400);
  resetBall();
  busy = false;
}

export function initEncounterUI() {
  const b = ball();
  b.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', () => { if (drag) { drag = null; resetBall(); } });
  $('enc-run').addEventListener('click', () => { if (!busy) endEncounter({ caught: false }); });
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
